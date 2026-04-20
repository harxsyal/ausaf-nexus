-- ============ JOB ROLES (second axis, layered on top of app_role) ============
CREATE TYPE public.job_role AS ENUM (
  'super_admin',
  'department_head',
  'publisher',
  'editor',
  'designer',
  'writer',
  'reporter',
  'viewer'
);

CREATE TABLE IF NOT EXISTS public.user_job_roles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL,
  job_role    public.job_role NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, job_role)
);

CREATE INDEX idx_user_job_roles_user ON public.user_job_roles(user_id);

ALTER TABLE public.user_job_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own job roles"
  ON public.user_job_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Super admins view all job roles"
  ON public.user_job_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins manage job roles"
  ON public.user_job_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- ============ PERMISSION ENUM ============
CREATE TYPE public.app_permission AS ENUM (
  'create_task',
  'edit_task',
  'assign_task',
  'reassign_task',
  'publish_task',
  'view_all_tasks',
  'manage_users',
  'manage_assets'
);

-- ============ HELPER: has_job_role ============
CREATE OR REPLACE FUNCTION public.has_job_role(_user_id uuid, _role public.job_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_job_roles
    WHERE user_id = _user_id AND job_role = _role
  );
$$;

-- ============ HELPER: has_permission ============
-- Maps job_role + super_admin app_role → granular capabilities.
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _perm public.app_permission)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    -- super_admin app_role bypasses everything
    public.has_role(_user_id, 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.user_job_roles ujr
      WHERE ujr.user_id = _user_id
        AND CASE _perm
          WHEN 'create_task'    THEN ujr.job_role = ANY(ARRAY['super_admin','department_head','publisher','editor','reporter']::public.job_role[])
          WHEN 'edit_task'      THEN ujr.job_role = ANY(ARRAY['super_admin','department_head','publisher','editor','designer','writer','reporter']::public.job_role[])
          WHEN 'assign_task'    THEN ujr.job_role = ANY(ARRAY['super_admin','department_head','publisher','editor']::public.job_role[])
          WHEN 'reassign_task'  THEN ujr.job_role = ANY(ARRAY['super_admin','department_head','publisher','editor']::public.job_role[])
          WHEN 'publish_task'   THEN ujr.job_role = ANY(ARRAY['super_admin','department_head','publisher']::public.job_role[])
          WHEN 'view_all_tasks' THEN ujr.job_role = ANY(ARRAY['super_admin','department_head','publisher','editor','viewer']::public.job_role[])
          WHEN 'manage_users'   THEN ujr.job_role = 'super_admin'
          WHEN 'manage_assets'  THEN ujr.job_role = ANY(ARRAY['super_admin','department_head']::public.job_role[])
        END
    );
$$;

-- ============ HELPER: get top job_role label for a user ============
CREATE OR REPLACE FUNCTION public.get_user_job_roles(_user_id uuid)
RETURNS public.job_role[]
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(array_agg(job_role ORDER BY
    CASE job_role
      WHEN 'super_admin' THEN 1
      WHEN 'department_head' THEN 2
      WHEN 'publisher' THEN 3
      WHEN 'editor' THEN 4
      WHEN 'designer' THEN 5
      WHEN 'writer' THEN 6
      WHEN 'reporter' THEN 7
      WHEN 'viewer' THEN 8
    END), ARRAY[]::public.job_role[])
  FROM public.user_job_roles WHERE user_id = _user_id;
$$;

-- ============ ADMIN RPC: set job roles for a user (replace set) ============
CREATE OR REPLACE FUNCTION public.admin_set_user_job_roles(_user_id uuid, _roles public.job_role[])
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  DELETE FROM public.user_job_roles WHERE user_id = _user_id;

  IF _roles IS NOT NULL AND array_length(_roles, 1) > 0 THEN
    INSERT INTO public.user_job_roles (user_id, job_role)
    SELECT _user_id, unnest(_roles)
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;