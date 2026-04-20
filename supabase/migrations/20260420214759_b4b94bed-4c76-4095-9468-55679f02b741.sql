-- ============ 2. VALID TRANSITION MAP + ENFORCEMENT ============
-- Allowed next-states from each state. Same logical map applied to all three desks.
-- Production-specific stages (researching/shooting/voice_over/editing/scheduled) are
-- considered intermediate "in_progress" states for transition purposes.
CREATE OR REPLACE FUNCTION public.is_valid_status_transition(_from text, _to text)
RETURNS boolean
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE
    -- Allow no-op
    WHEN _from = _to THEN true
    -- From terminal "archived" — no exit
    WHEN _from = 'archived' THEN false
    -- From "published" — only archive or rejected (post-publish takedown)
    WHEN _from = 'published' THEN _to IN ('archived','rejected')
    -- From "rejected" — back to pending/assigned for rework, or archive
    WHEN _from = 'rejected' THEN _to IN ('pending','assigned','in_progress','archived')
    -- From "delayed" — resume into in_progress / ready, or archive / reject
    WHEN _from = 'delayed' THEN _to IN ('in_progress','ready','assigned','archived','rejected','delayed')
    -- From "ready" — publish, delay, reject, archive, or back to in_progress for revisions
    WHEN _from = 'ready' THEN _to IN ('published','delayed','rejected','archived','in_progress','scheduled')
    -- From "in_progress" (and detailed production stages) — toward ready/delayed/rejected/archived
    WHEN _from IN ('in_progress','researching','shooting','voice_over','editing','draft','in_review') THEN
      _to IN ('in_progress','researching','shooting','voice_over','editing','ready','delayed','rejected','archived','draft','in_review','assigned')
    -- From "assigned" — start work, delay, reject, archive
    WHEN _from = 'assigned' THEN _to IN ('in_progress','delayed','rejected','archived','researching','shooting','voice_over','editing','draft','in_review')
    -- From "pending" / "idea_received" — assign, start, delay, reject, archive
    WHEN _from IN ('pending','idea_received') THEN _to IN ('assigned','in_progress','delayed','rejected','archived','researching','draft','in_review')
    -- From "scheduled" (production only) — publish or revert to ready/delayed
    WHEN _from = 'scheduled' THEN _to IN ('published','ready','delayed','archived','rejected')
    ELSE true
  END;
$$;

-- ============ 3. SHARED TRIGGER: enforce + audit ============
CREATE OR REPLACE FUNCTION public.enforce_status_transition()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid       uuid := auth.uid();
  old_val   text;
  new_val   text;
  dept      public.task_dept;
  actor     text;
BEGIN
  IF TG_TABLE_NAME = 'social_tasks' THEN
    new_val := NEW.status::text;
    old_val := CASE WHEN TG_OP = 'UPDATE' THEN OLD.status::text ELSE NULL END;
    dept := 'social';
  ELSIF TG_TABLE_NAME = 'website_tasks' THEN
    new_val := NEW.status::text;
    old_val := CASE WHEN TG_OP = 'UPDATE' THEN OLD.status::text ELSE NULL END;
    dept := 'website';
  ELSIF TG_TABLE_NAME = 'production_tasks' THEN
    new_val := NEW.stage::text;
    old_val := CASE WHEN TG_OP = 'UPDATE' THEN OLD.stage::text ELSE NULL END;
    dept := 'production';
  ELSE
    RETURN NEW;
  END IF;

  -- No status change → nothing to do
  IF TG_OP = 'UPDATE' AND old_val IS NOT DISTINCT FROM new_val THEN
    RETURN NEW;
  END IF;

  -- Validate transition (super admins bypass)
  IF TG_OP = 'UPDATE' AND old_val IS NOT NULL
     AND NOT public.has_role(uid, 'super_admin')
     AND NOT public.is_valid_status_transition(old_val, new_val) THEN
    RAISE EXCEPTION 'invalid_transition: % → % is not allowed', old_val, new_val;
  END IF;

  -- Audit log
  actor := COALESCE(public.profile_label(uid), 'System');
  INSERT INTO public.task_events (task_id, task_dept, actor_id, actor_label, event_type, summary)
  VALUES (
    NEW.id, dept, uid, actor,
    CASE WHEN TG_OP = 'INSERT' THEN 'status_set' ELSE 'status_changed' END,
    CASE
      WHEN TG_OP = 'INSERT' THEN actor || ' created task at status "' || new_val || '"'
      ELSE actor || ' moved status: ' || old_val || ' → ' || new_val
    END
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_status_audit_social     ON public.social_tasks;
DROP TRIGGER IF EXISTS trg_status_audit_website    ON public.website_tasks;
DROP TRIGGER IF EXISTS trg_status_audit_production ON public.production_tasks;

CREATE TRIGGER trg_status_audit_social
  BEFORE INSERT OR UPDATE ON public.social_tasks
  FOR EACH ROW EXECUTE FUNCTION public.enforce_status_transition();

CREATE TRIGGER trg_status_audit_website
  BEFORE INSERT OR UPDATE ON public.website_tasks
  FOR EACH ROW EXECUTE FUNCTION public.enforce_status_transition();

CREATE TRIGGER trg_status_audit_production
  BEFORE INSERT OR UPDATE ON public.production_tasks
  FOR EACH ROW EXECUTE FUNCTION public.enforce_status_transition();