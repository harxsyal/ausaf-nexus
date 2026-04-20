CREATE TYPE public.notification_type AS ENUM (
  'new_task_assigned',
  'deadline_near',
  'overdue_task',
  'task_rejected',
  'task_published'
);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type public.notification_type NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  task_dept public.task_dept,
  task_id uuid,
  read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, read, created_at DESC);
CREATE INDEX idx_notifications_user_created ON public.notifications(user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications" ON public.notifications
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Anyone signed in can insert notifications" ON public.notifications
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users update own notifications" ON public.notifications
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users delete own notifications" ON public.notifications
FOR DELETE TO authenticated USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Mark all read RPC
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.notifications
  SET read = true, read_at = now()
  WHERE user_id = auth.uid() AND read = false;
$$;

-- Resolve a uuid -> profile label (full_name -> username -> 'Someone')
CREATE OR REPLACE FUNCTION public.profile_label(_user uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(p.full_name, p.username, 'Someone')
  FROM public.profiles p WHERE p.id = _user;
$$;

-- ===== Triggers: assignment + published =====

-- SOCIAL
CREATE OR REPLACE FUNCTION public.notify_social_task()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE actor text; BEGIN
  actor := COALESCE(public.profile_label(auth.uid()), 'System');
  IF TG_OP = 'INSERT' THEN
    IF NEW.assigned_to IS NOT NULL AND NEW.assigned_to <> COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid) THEN
      INSERT INTO public.notifications(user_id, type, title, body, link, task_dept, task_id)
      VALUES (NEW.assigned_to, 'new_task_assigned', 'New Task Assigned',
              actor || ' assigned: ' || NEW.title, '/social', 'social', NEW.id);
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.assigned_to IS DISTINCT FROM OLD.assigned_to AND NEW.assigned_to IS NOT NULL THEN
      INSERT INTO public.notifications(user_id, type, title, body, link, task_dept, task_id)
      VALUES (NEW.assigned_to, 'new_task_assigned', 'New Task Assigned',
              actor || ' reassigned: ' || NEW.title, '/social', 'social', NEW.id);
    END IF;
    IF NEW.status = 'published' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.assigned_to IS NOT NULL THEN
      INSERT INTO public.notifications(user_id, type, title, body, link, task_dept, task_id)
      VALUES (NEW.assigned_to, 'task_published', 'Task Published',
              NEW.title || ' is now live', '/social', 'social', NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_notify_social_ins AFTER INSERT ON public.social_tasks
FOR EACH ROW EXECUTE FUNCTION public.notify_social_task();
CREATE TRIGGER trg_notify_social_upd AFTER UPDATE ON public.social_tasks
FOR EACH ROW EXECUTE FUNCTION public.notify_social_task();

-- WEBSITE (writer/editor are text; we resolve by matching profiles.username or full_name)
CREATE OR REPLACE FUNCTION public.resolve_user_by_label(_label text)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id FROM public.profiles
  WHERE _label IS NOT NULL AND _label <> ''
    AND (lower(username) = lower(_label) OR lower(full_name) = lower(_label))
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.notify_website_task()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE actor text; uid uuid; BEGIN
  actor := COALESCE(public.profile_label(auth.uid()), 'System');
  IF TG_OP = 'INSERT' THEN
    uid := public.resolve_user_by_label(NEW.writer);
    IF uid IS NOT NULL AND uid <> COALESCE(auth.uid(),'00000000-0000-0000-0000-000000000000'::uuid) THEN
      INSERT INTO public.notifications(user_id, type, title, body, link, task_dept, task_id)
      VALUES (uid, 'new_task_assigned', 'New Article Assigned', actor || ': ' || NEW.headline, '/website', 'website', NEW.id);
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.writer IS DISTINCT FROM OLD.writer THEN
      uid := public.resolve_user_by_label(NEW.writer);
      IF uid IS NOT NULL THEN
        INSERT INTO public.notifications(user_id, type, title, body, link, task_dept, task_id)
        VALUES (uid, 'new_task_assigned', 'Article Reassigned', actor || ': ' || NEW.headline, '/website', 'website', NEW.id);
      END IF;
    END IF;
    IF NEW.status = 'published' AND OLD.status IS DISTINCT FROM NEW.status THEN
      uid := public.resolve_user_by_label(COALESCE(NEW.writer, NEW.editor));
      IF uid IS NOT NULL THEN
        INSERT INTO public.notifications(user_id, type, title, body, link, task_dept, task_id)
        VALUES (uid, 'task_published', 'Article Published', NEW.headline || ' is now live', '/website', 'website', NEW.id);
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_notify_website_ins AFTER INSERT ON public.website_tasks
FOR EACH ROW EXECUTE FUNCTION public.notify_website_task();
CREATE TRIGGER trg_notify_website_upd AFTER UPDATE ON public.website_tasks
FOR EACH ROW EXECUTE FUNCTION public.notify_website_task();

-- PRODUCTION
CREATE OR REPLACE FUNCTION public.notify_production_task()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE actor text; uid uuid; BEGIN
  actor := COALESCE(public.profile_label(auth.uid()), 'System');
  IF TG_OP = 'INSERT' THEN
    uid := public.resolve_user_by_label(COALESCE(NEW.editor, NEW.producer, NEW.reporter));
    IF uid IS NOT NULL AND uid <> COALESCE(auth.uid(),'00000000-0000-0000-0000-000000000000'::uuid) THEN
      INSERT INTO public.notifications(user_id, type, title, body, link, task_dept, task_id)
      VALUES (uid, 'new_task_assigned', 'New Production Task', actor || ': ' || NEW.title, '/production', 'production', NEW.id);
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.editor IS DISTINCT FROM OLD.editor OR NEW.producer IS DISTINCT FROM OLD.producer OR NEW.reporter IS DISTINCT FROM OLD.reporter THEN
      uid := public.resolve_user_by_label(COALESCE(NEW.editor, NEW.producer, NEW.reporter));
      IF uid IS NOT NULL THEN
        INSERT INTO public.notifications(user_id, type, title, body, link, task_dept, task_id)
        VALUES (uid, 'new_task_assigned', 'Production Reassigned', actor || ': ' || NEW.title, '/production', 'production', NEW.id);
      END IF;
    END IF;
    IF NEW.stage = 'published' AND OLD.stage IS DISTINCT FROM NEW.stage THEN
      uid := public.resolve_user_by_label(COALESCE(NEW.editor, NEW.producer, NEW.reporter));
      IF uid IS NOT NULL THEN
        INSERT INTO public.notifications(user_id, type, title, body, link, task_dept, task_id)
        VALUES (uid, 'task_published', 'Production Published', NEW.title || ' is now live', '/production', 'production', NEW.id);
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_notify_production_ins AFTER INSERT ON public.production_tasks
FOR EACH ROW EXECUTE FUNCTION public.notify_production_task();
CREATE TRIGGER trg_notify_production_upd AFTER UPDATE ON public.production_tasks
FOR EACH ROW EXECUTE FUNCTION public.notify_production_task();