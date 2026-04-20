-- ============ Schema additions on profiles ============
CREATE TYPE public.account_status AS ENUM ('active', 'disabled');

ALTER TABLE public.profiles
  ADD COLUMN status public.account_status NOT NULL DEFAULT 'active',
  ADD COLUMN department text,
  ADD COLUMN allowed_assets text[] NOT NULL DEFAULT '{}',
  ADD COLUMN last_active timestamptz;

-- Allow super admins to view every profile
CREATE POLICY "Super admins view all profiles" ON public.profiles
FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));

-- Allow super admins to update any profile (department, status, allowed_assets, etc.)
CREATE POLICY "Super admins update all profiles" ON public.profiles
FOR UPDATE USING (public.has_role(auth.uid(), 'super_admin'));

-- ============ Admin: list users with email + role ============
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  username text,
  department text,
  status public.account_status,
  allowed_assets text[],
  last_active timestamptz,
  role public.app_role,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    u.email::text,
    p.full_name,
    p.username,
    p.department,
    p.status,
    p.allowed_assets,
    p.last_active,
    public.get_user_role(p.id) AS role,
    p.created_at
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  ORDER BY p.created_at DESC;
END;
$$;

-- ============ Admin: set a user's role ============
CREATE OR REPLACE FUNCTION public.admin_set_user_role(_user_id uuid, _role public.app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  -- Replace any existing role(s) with the new one
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, _role);
END;
$$;

-- ============ Admin: set status (active / disabled) ============
CREATE OR REPLACE FUNCTION public.admin_set_user_status(_user_id uuid, _status public.account_status)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE public.profiles SET status = _status, updated_at = now() WHERE id = _user_id;
END;
$$;

-- ============ Self: heartbeat ============
CREATE OR REPLACE FUNCTION public.touch_last_active()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.profiles SET last_active = now() WHERE id = auth.uid();
$$;