-- ============ ADD PROOF FIELDS TO ALL TASK TABLES ============
ALTER TABLE public.social_tasks
  ADD COLUMN IF NOT EXISTS final_publish_url text,
  ADD COLUMN IF NOT EXISTS final_title       text,
  ADD COLUMN IF NOT EXISTS final_caption     text,
  ADD COLUMN IF NOT EXISTS posted_asset      text,
  ADD COLUMN IF NOT EXISTS completed_by      uuid,
  ADD COLUMN IF NOT EXISTS completed_at      timestamptz;

ALTER TABLE public.website_tasks
  ADD COLUMN IF NOT EXISTS final_publish_url text,
  ADD COLUMN IF NOT EXISTS final_title       text,
  ADD COLUMN IF NOT EXISTS final_caption     text,
  ADD COLUMN IF NOT EXISTS posted_asset      text,
  ADD COLUMN IF NOT EXISTS completed_by      uuid,
  ADD COLUMN IF NOT EXISTS completed_at      timestamptz;

ALTER TABLE public.production_tasks
  ADD COLUMN IF NOT EXISTS final_publish_url text,
  ADD COLUMN IF NOT EXISTS final_title       text,
  ADD COLUMN IF NOT EXISTS final_caption     text,
  ADD COLUMN IF NOT EXISTS posted_asset      text,
  ADD COLUMN IF NOT EXISTS completed_by      uuid,
  ADD COLUMN IF NOT EXISTS completed_at      timestamptz;


-- ============ ENFORCE PROOF + AUTO-FILL completed_at ============
CREATE OR REPLACE FUNCTION public.enforce_publish_proof()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  is_publishing boolean := false;
BEGIN
  IF TG_TABLE_NAME = 'social_tasks' THEN
    is_publishing := (NEW.status::text = 'published'
                      AND (TG_OP = 'INSERT' OR OLD.status::text IS DISTINCT FROM NEW.status::text));
  ELSIF TG_TABLE_NAME = 'website_tasks' THEN
    is_publishing := (NEW.status::text = 'published'
                      AND (TG_OP = 'INSERT' OR OLD.status::text IS DISTINCT FROM NEW.status::text));
  ELSIF TG_TABLE_NAME = 'production_tasks' THEN
    is_publishing := (NEW.stage::text = 'published'
                      AND (TG_OP = 'INSERT' OR OLD.stage::text IS DISTINCT FROM NEW.stage::text));
  END IF;

  IF NOT is_publishing THEN
    RETURN NEW;
  END IF;

  -- Validate all 5 proof fields are present
  IF COALESCE(trim(NEW.final_publish_url), '') = '' THEN
    RAISE EXCEPTION 'publish_proof_missing: final_publish_url is required to publish';
  END IF;
  IF COALESCE(trim(NEW.final_title), '') = '' THEN
    RAISE EXCEPTION 'publish_proof_missing: final_title is required to publish';
  END IF;
  IF COALESCE(trim(NEW.final_caption), '') = '' THEN
    RAISE EXCEPTION 'publish_proof_missing: final_caption is required to publish';
  END IF;
  IF COALESCE(trim(NEW.posted_asset), '') = '' THEN
    RAISE EXCEPTION 'publish_proof_missing: posted_asset is required to publish';
  END IF;
  IF NEW.completed_by IS NULL THEN
    -- Default to current user if not provided
    NEW.completed_by := auth.uid();
    IF NEW.completed_by IS NULL THEN
      RAISE EXCEPTION 'publish_proof_missing: completed_by is required to publish';
    END IF;
  END IF;

  -- Auto-fill completed_at
  IF NEW.completed_at IS NULL THEN
    NEW.completed_at := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_publish_proof_social     ON public.social_tasks;
DROP TRIGGER IF EXISTS trg_publish_proof_website    ON public.website_tasks;
DROP TRIGGER IF EXISTS trg_publish_proof_production ON public.production_tasks;

-- These triggers must fire AFTER enforce_publish_permission (BEFORE UPDATE) but
-- still BEFORE the row is written. Postgres fires BEFORE triggers in name order,
-- so the prefix "trg_publish_proof_" sorts after "trg_publish_gate_" — good.
CREATE TRIGGER trg_publish_proof_social
  BEFORE INSERT OR UPDATE ON public.social_tasks
  FOR EACH ROW EXECUTE FUNCTION public.enforce_publish_proof();

CREATE TRIGGER trg_publish_proof_website
  BEFORE INSERT OR UPDATE ON public.website_tasks
  FOR EACH ROW EXECUTE FUNCTION public.enforce_publish_proof();

CREATE TRIGGER trg_publish_proof_production
  BEFORE INSERT OR UPDATE ON public.production_tasks
  FOR EACH ROW EXECUTE FUNCTION public.enforce_publish_proof();