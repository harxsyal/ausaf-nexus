-- ============ 1. WEBSITE TASKS — add site column + asset gating ============
ALTER TABLE public.website_tasks
  ADD COLUMN IF NOT EXISTS site text;

CREATE INDEX IF NOT EXISTS idx_website_tasks_site ON public.website_tasks(site);

-- Drop old website RLS policies that ignored asset
DROP POLICY IF EXISTS "Website desk can view tasks"   ON public.website_tasks;
DROP POLICY IF EXISTS "Website desk can update tasks" ON public.website_tasks;
DROP POLICY IF EXISTS "Website desk can delete tasks" ON public.website_tasks;

-- Recreate with asset gating (matches social/production pattern)
CREATE POLICY "Website desk can view tasks"
  ON public.website_tasks FOR SELECT
  USING (public.can_access_website(auth.uid()) AND public.user_has_asset(auth.uid(), site));

CREATE POLICY "Website desk can update tasks"
  ON public.website_tasks FOR UPDATE
  USING (public.can_access_website(auth.uid()) AND public.user_has_asset(auth.uid(), site));

CREATE POLICY "Website desk can delete tasks"
  ON public.website_tasks FOR DELETE
  USING (public.can_access_website(auth.uid()) AND public.user_has_asset(auth.uid(), site));


-- ============ 2. ASSET CATEGORIES / TAGS ============
ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_assets_category ON public.assets(category);
CREATE INDEX IF NOT EXISTS idx_assets_tags     ON public.assets USING GIN(tags);

-- Allow profiles to grant whole categories at once (e.g. "regional")
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS allowed_categories text[] NOT NULL DEFAULT '{}';

-- Helper: does this user have access to the given asset NAME, considering
-- explicit allowed_assets OR any category/tag the user is granted?
CREATE OR REPLACE FUNCTION public.user_has_asset(_user uuid, _asset text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    public.has_role(_user, 'super_admin')
    OR _asset IS NULL
    OR _asset = ''
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = _user AND _asset = ANY(p.allowed_assets)
    )
    OR EXISTS (
      -- Category / tag based grant: user is granted "regional", asset is tagged "regional"
      SELECT 1
      FROM public.assets a
      JOIN public.profiles p ON p.id = _user
      WHERE a.name = _asset
        AND (
          (a.category IS NOT NULL AND a.category = ANY(p.allowed_categories))
          OR a.tags && p.allowed_categories
        )
    );
$$;


-- ============ 3. STRICT PUBLISH GATE (permission + asset) ============
-- Block the transition to "published" unless the user has publish_task permission
-- AND the asset is in their allowed list. Applies to all three desks.
CREATE OR REPLACE FUNCTION public.enforce_publish_permission()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  asset_name text;
  is_publish_transition boolean := false;
BEGIN
  IF uid IS NULL THEN RETURN NEW; END IF;

  -- Super admin bypass
  IF public.has_role(uid, 'super_admin') THEN
    RETURN NEW;
  END IF;

  -- Determine if this UPDATE is a transition into the published state
  IF TG_TABLE_NAME = 'social_tasks' THEN
    is_publish_transition := (NEW.status = 'published'::public.social_task_status
                              AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status));
    asset_name := NEW.asset_page;
  ELSIF TG_TABLE_NAME = 'website_tasks' THEN
    is_publish_transition := (NEW.status = 'published'::public.web_task_status
                              AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status));
    asset_name := NEW.site;
  ELSIF TG_TABLE_NAME = 'production_tasks' THEN
    is_publish_transition := (NEW.stage = 'published'::public.production_stage
                              AND (TG_OP = 'INSERT' OR OLD.stage IS DISTINCT FROM NEW.stage));
    asset_name := NEW.target_platform;
  END IF;

  IF NOT is_publish_transition THEN
    RETURN NEW;
  END IF;

  -- Must have publish_task permission
  IF NOT public.has_permission(uid, 'publish_task') THEN
    RAISE EXCEPTION 'permission_denied: user lacks publish_task permission';
  END IF;

  -- Must have access to the specific asset
  IF NOT public.user_has_asset(uid, asset_name) THEN
    RAISE EXCEPTION 'permission_denied: user not authorized for asset "%"', asset_name;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_publish_gate_social     ON public.social_tasks;
DROP TRIGGER IF EXISTS trg_publish_gate_website    ON public.website_tasks;
DROP TRIGGER IF EXISTS trg_publish_gate_production ON public.production_tasks;

CREATE TRIGGER trg_publish_gate_social
  BEFORE INSERT OR UPDATE ON public.social_tasks
  FOR EACH ROW EXECUTE FUNCTION public.enforce_publish_permission();

CREATE TRIGGER trg_publish_gate_website
  BEFORE INSERT OR UPDATE ON public.website_tasks
  FOR EACH ROW EXECUTE FUNCTION public.enforce_publish_permission();

CREATE TRIGGER trg_publish_gate_production
  BEFORE INSERT OR UPDATE ON public.production_tasks
  FOR EACH ROW EXECUTE FUNCTION public.enforce_publish_permission();