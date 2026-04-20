-- Enable pg_cron for scheduled notifications
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Function: scan all task tables and emit deadline_near (within 30 min) and overdue notifications.
-- De-duplicates by checking if a notification of the same type for the same task was sent in the last 6h.
CREATE OR REPLACE FUNCTION public.scan_task_deadlines()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  uid uuid;
BEGIN
  -- ============= SOCIAL =============
  FOR r IN
    SELECT id, title, deadline, assigned_to, status::text AS st
    FROM public.social_tasks
    WHERE deadline IS NOT NULL
      AND status::text NOT IN ('published','archived','rejected')
      AND assigned_to IS NOT NULL
  LOOP
    -- deadline_near: within next 30 min, not yet past
    IF r.deadline > now() AND r.deadline <= now() + interval '30 minutes' THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.notifications
        WHERE user_id = r.assigned_to AND task_id = r.id AND type = 'deadline_near'
          AND created_at > now() - interval '6 hours'
      ) THEN
        INSERT INTO public.notifications(user_id, type, title, body, link, task_dept, task_id)
        VALUES (r.assigned_to, 'deadline_near',
                'Deadline in 30 min', r.title, '/social', 'social', r.id);
      END IF;
    END IF;
    -- overdue: past deadline
    IF r.deadline < now() THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.notifications
        WHERE user_id = r.assigned_to AND task_id = r.id AND type = 'overdue_task'
          AND created_at > now() - interval '6 hours'
      ) THEN
        INSERT INTO public.notifications(user_id, type, title, body, link, task_dept, task_id)
        VALUES (r.assigned_to, 'overdue_task',
                'Task overdue', r.title, '/social', 'social', r.id);
      END IF;
    END IF;
  END LOOP;

  -- ============= WEBSITE =============
  FOR r IN
    SELECT id, headline AS title, deadline, writer, editor, status::text AS st
    FROM public.website_tasks
    WHERE deadline IS NOT NULL
      AND status::text NOT IN ('published','archived','rejected')
  LOOP
    uid := public.resolve_user_by_label(COALESCE(r.writer, r.editor));
    IF uid IS NULL THEN CONTINUE; END IF;

    IF r.deadline > now() AND r.deadline <= now() + interval '30 minutes' THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.notifications
        WHERE user_id = uid AND task_id = r.id AND type = 'deadline_near'
          AND created_at > now() - interval '6 hours'
      ) THEN
        INSERT INTO public.notifications(user_id, type, title, body, link, task_dept, task_id)
        VALUES (uid, 'deadline_near', 'Deadline in 30 min', r.title, '/website', 'website', r.id);
      END IF;
    END IF;
    IF r.deadline < now() THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.notifications
        WHERE user_id = uid AND task_id = r.id AND type = 'overdue_task'
          AND created_at > now() - interval '6 hours'
      ) THEN
        INSERT INTO public.notifications(user_id, type, title, body, link, task_dept, task_id)
        VALUES (uid, 'overdue_task', 'Article overdue', r.title, '/website', 'website', r.id);
      END IF;
    END IF;
  END LOOP;

  -- ============= PRODUCTION =============
  FOR r IN
    SELECT id, title, deadline, editor, producer, reporter, stage::text AS st
    FROM public.production_tasks
    WHERE deadline IS NOT NULL
      AND stage::text NOT IN ('published','archived','rejected')
  LOOP
    uid := public.resolve_user_by_label(COALESCE(r.editor, r.producer, r.reporter));
    IF uid IS NULL THEN CONTINUE; END IF;

    IF r.deadline > now() AND r.deadline <= now() + interval '30 minutes' THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.notifications
        WHERE user_id = uid AND task_id = r.id AND type = 'deadline_near'
          AND created_at > now() - interval '6 hours'
      ) THEN
        INSERT INTO public.notifications(user_id, type, title, body, link, task_dept, task_id)
        VALUES (uid, 'deadline_near', 'Deadline in 30 min', r.title, '/production', 'production', r.id);
      END IF;
    END IF;
    IF r.deadline < now() THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.notifications
        WHERE user_id = uid AND task_id = r.id AND type = 'overdue_task'
          AND created_at > now() - interval '6 hours'
      ) THEN
        INSERT INTO public.notifications(user_id, type, title, body, link, task_dept, task_id)
        VALUES (uid, 'overdue_task', 'Production overdue', r.title, '/production', 'production', r.id);
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- Unschedule prior version if present, then schedule every 5 minutes
DO $$
BEGIN
  PERFORM cron.unschedule('scan-task-deadlines');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'scan-task-deadlines',
  '*/5 * * * *',
  $$ SELECT public.scan_task_deadlines(); $$
);