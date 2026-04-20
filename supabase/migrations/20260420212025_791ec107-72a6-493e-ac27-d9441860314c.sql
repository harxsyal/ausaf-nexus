CREATE TYPE public.asset_status AS ENUM ('active', 'inactive');

CREATE TABLE public.assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  brand text,
  platform text,
  status public.asset_status NOT NULL DEFAULT 'active',
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX assets_name_unique ON public.assets (lower(name));
CREATE INDEX idx_assets_brand ON public.assets(brand);
CREATE INDEX idx_assets_platform ON public.assets(platform);

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Assets viewable by any signed-in user" ON public.assets
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Assets insert by super admin" ON public.assets
FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Assets update by super admin" ON public.assets
FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Assets delete by super admin" ON public.assets
FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER assets_touch
BEFORE UPDATE ON public.assets
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ Asset ↔ User join ============
CREATE TABLE public.asset_users (
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (asset_id, user_id)
);
CREATE INDEX idx_asset_users_user ON public.asset_users(user_id);

ALTER TABLE public.asset_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Asset assignments viewable by signed-in users" ON public.asset_users
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Asset assignments managed by super admin" ON public.asset_users
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));