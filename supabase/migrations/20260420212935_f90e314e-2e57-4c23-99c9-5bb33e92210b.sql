-- Helper: does this user have access to this asset label?
CREATE OR REPLACE FUNCTION public.user_has_asset(_user uuid, _asset text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(_user, 'super_admin')
    OR _asset IS NULL
    OR _asset = ''
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = _user
        AND _asset = ANY(p.allowed_assets)
    );
$$;

-- ===== social_tasks =====
DROP POLICY IF EXISTS "Social desk can view tasks" ON public.social_tasks;
DROP POLICY IF EXISTS "Social desk can update tasks" ON public.social_tasks;
DROP POLICY IF EXISTS "Social desk can delete tasks" ON public.social_tasks;

CREATE POLICY "Social desk can view tasks"
  ON public.social_tasks FOR SELECT
  USING (
    public.can_access_social(auth.uid())
    AND public.user_has_asset(auth.uid(), asset_page)
  );

CREATE POLICY "Social desk can update tasks"
  ON public.social_tasks FOR UPDATE
  USING (
    public.can_access_social(auth.uid())
    AND public.user_has_asset(auth.uid(), asset_page)
  );

CREATE POLICY "Social desk can delete tasks"
  ON public.social_tasks FOR DELETE
  USING (
    public.can_access_social(auth.uid())
    AND public.user_has_asset(auth.uid(), asset_page)
  );

-- ===== website_tasks (no asset_page column; filter by category as the asset proxy) =====
-- Website tasks don't have an explicit asset; super admin sees all, others see all in their dept.
-- (No change needed here unless we add an asset column; leaving website desk policies as-is.)

-- ===== production_tasks (filter by target_platform as the asset proxy) =====
DROP POLICY IF EXISTS "Production desk can view tasks" ON public.production_tasks;
DROP POLICY IF EXISTS "Production desk can update tasks" ON public.production_tasks;
DROP POLICY IF EXISTS "Production desk can delete tasks" ON public.production_tasks;

CREATE POLICY "Production desk can view tasks"
  ON public.production_tasks FOR SELECT
  USING (
    public.can_access_production(auth.uid())
    AND public.user_has_asset(auth.uid(), target_platform)
  );

CREATE POLICY "Production desk can update tasks"
  ON public.production_tasks FOR UPDATE
  USING (
    public.can_access_production(auth.uid())
    AND public.user_has_asset(auth.uid(), target_platform)
  );

CREATE POLICY "Production desk can delete tasks"
  ON public.production_tasks FOR DELETE
  USING (
    public.can_access_production(auth.uid())
    AND public.user_has_asset(auth.uid(), target_platform)
  );