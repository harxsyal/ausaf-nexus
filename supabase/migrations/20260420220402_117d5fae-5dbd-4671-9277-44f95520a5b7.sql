-- ============= TASK HISTORY TABLE =============
CREATE TABLE public.task_history (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     uuid NOT NULL,
  task_dept   public.task_dept NOT NULL,
  actor_id    uuid,
  actor_label text,
  action      text NOT NULL,            -- 'created' | 'updated' | 'deleted'
  field_name  text,                     -- null for created/deleted, set for per-field updates
  old_value   text,
  new_value   text,
  ip_address  inet,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_history_task ON public.task_history(task_id, created_at DESC);
CREATE INDEX idx_task_history_dept ON public.task_history(task_dept, created_at DESC);
CREATE INDEX idx_task_history_actor ON public.task_history(actor_id, created_at DESC);

ALTER TABLE public.task_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "History viewable by desk"
  ON public.task_history FOR SELECT
  USING (public.can_access_dept(auth.uid(), task_dept));

-- No INSERT/UPDATE/DELETE policies → only SECURITY DEFINER triggers can write.

-- ============= GENERIC LOGGER TRIGGER FUNCTION =============
CREATE OR REPLACE FUNCTION public.log_task_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid       uuid := auth.uid();
  actor     text := COALESCE(public.profile_label(auth.uid()), 'System');
  dept      public.task_dept;
  task_uuid uuid;
  ip_addr   inet;
  fld       text;
  old_v     text;
  new_v     text;
  -- Fields to track per dept
  social_fields text[] := ARRAY[
    'title','task_type','platform','asset_page','assigned_to','deadline','priority','status',
    'caption_draft','publish_title_draft','source','final_publish_url','final_title','final_caption',
    'posted_asset','completed_by','completed_at','description','notes'
  ];
  website_fields text[] := ARRAY[
    'headline','article_type','category','language','writer','editor','site','deadline','status',
    'url','assigned_to','priority','caption_draft','publish_title_draft','source',
    'final_publish_url','final_title','final_caption','posted_asset','completed_by','completed_at',
    'description','notes'
  ];
  production_fields text[] := ARRAY[
    'title','source','reporter','editor','producer','target_platform','deadline','priority','stage',
    'caption_draft','publish_title_draft','final_publish_url','final_title','final_caption',
    'posted_asset','completed_by','completed_at','description','notes','assigned_to'
  ];
  fields_to_check text[];
  rec_old jsonb;
  rec_new jsonb;
BEGIN
  -- Determine dept + task_id from table
  IF TG_TABLE_NAME = 'social_tasks' THEN
    dept := 'social'; fields_to_check := social_fields;
  ELSIF TG_TABLE_NAME = 'website_tasks' THEN
    dept := 'website'; fields_to_check := website_fields;
  ELSIF TG_TABLE_NAME = 'production_tasks' THEN
    dept := 'production'; fields_to_check := production_fields;
  ELSE
    RETURN COALESCE(NEW, OLD);
  END IF;

  task_uuid := COALESCE((NEW).id, (OLD).id);

  -- Try to grab IP from request header (optional, may be NULL)
  BEGIN
    ip_addr := NULLIF(current_setting('request.headers', true)::jsonb->>'x-forwarded-for', '')::inet;
  EXCEPTION WHEN OTHERS THEN
    ip_addr := NULL;
  END;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.task_history(task_id, task_dept, actor_id, actor_label, action, ip_address)
    VALUES (task_uuid, dept, uid, actor, 'created', ip_addr);
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.task_history(task_id, task_dept, actor_id, actor_label, action, ip_address)
    VALUES (task_uuid, dept, uid, actor, 'deleted', ip_addr);
    RETURN OLD;

  ELSIF TG_OP = 'UPDATE' THEN
    rec_old := to_jsonb(OLD);
    rec_new := to_jsonb(NEW);

    FOREACH fld IN ARRAY fields_to_check LOOP
      old_v := rec_old->>fld;
      new_v := rec_new->>fld;
      IF old_v IS DISTINCT FROM new_v THEN
        INSERT INTO public.task_history(
          task_id, task_dept, actor_id, actor_label, action,
          field_name, old_value, new_value, ip_address
        )
        VALUES (task_uuid, dept, uid, actor, 'updated', fld, old_v, new_v, ip_addr);
      END IF;
    END LOOP;
    RETURN NEW;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ============= ATTACH TRIGGERS =============
DROP TRIGGER IF EXISTS trg_social_history    ON public.social_tasks;
DROP TRIGGER IF EXISTS trg_website_history   ON public.website_tasks;
DROP TRIGGER IF EXISTS trg_production_history ON public.production_tasks;

CREATE TRIGGER trg_social_history
  AFTER INSERT OR UPDATE OR DELETE ON public.social_tasks
  FOR EACH ROW EXECUTE FUNCTION public.log_task_history();

CREATE TRIGGER trg_website_history
  AFTER INSERT OR UPDATE OR DELETE ON public.website_tasks
  FOR EACH ROW EXECUTE FUNCTION public.log_task_history();

CREATE TRIGGER trg_production_history
  AFTER INSERT OR UPDATE OR DELETE ON public.production_tasks
  FOR EACH ROW EXECUTE FUNCTION public.log_task_history();