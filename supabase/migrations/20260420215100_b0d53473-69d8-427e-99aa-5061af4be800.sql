-- ============ SOCIAL DASHBOARD ============
CREATE OR REPLACE FUNCTION public.dashboard_social()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.can_access_social(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT jsonb_build_object(
    'pending',   COUNT(*) FILTER (WHERE status::text IN ('pending','assigned','in_progress','ready')),
    'completed', COUNT(*) FILTER (WHERE status::text = 'published'),
    'delayed',   COUNT(*) FILTER (WHERE status::text = 'delayed'),
    'today',     COUNT(*) FILTER (WHERE deadline IS NOT NULL AND deadline >= now() AND deadline < now() + interval '24 hours'),
    'employees', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'user_id',   e.user_id,
        'name',      COALESCE(public.profile_label(e.user_id), 'Unassigned'),
        'pending',   e.pending,
        'completed', e.completed,
        'delayed',   e.delayed,
        'today',     e.today
      ) ORDER BY e.pending DESC)
      FROM (
        SELECT
          assigned_to AS user_id,
          COUNT(*) FILTER (WHERE status::text IN ('pending','assigned','in_progress','ready')) AS pending,
          COUNT(*) FILTER (WHERE status::text = 'published') AS completed,
          COUNT(*) FILTER (WHERE status::text = 'delayed') AS delayed,
          COUNT(*) FILTER (WHERE deadline IS NOT NULL AND deadline >= now() AND deadline < now() + interval '24 hours') AS today
        FROM public.social_tasks
        WHERE assigned_to IS NOT NULL
        GROUP BY assigned_to
      ) e
    ), '[]'::jsonb)
  ) INTO result
  FROM public.social_tasks;

  RETURN result;
END;
$$;

-- ============ WEBSITE DASHBOARD ============
CREATE OR REPLACE FUNCTION public.dashboard_website()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.can_access_website(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT jsonb_build_object(
    'pending',   COUNT(*) FILTER (WHERE status::text IN ('pending','assigned','in_progress','ready','draft','in_review')),
    'completed', COUNT(*) FILTER (WHERE status::text = 'published'),
    'delayed',   COUNT(*) FILTER (WHERE status::text = 'delayed'),
    'today',     COUNT(*) FILTER (WHERE deadline IS NOT NULL AND deadline >= now() AND deadline < now() + interval '24 hours'),
    'employees', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'name',      COALESCE(label, 'Unassigned'),
        'pending',   pending,
        'completed', completed,
        'delayed',   delayed,
        'today',     today
      ) ORDER BY pending DESC)
      FROM (
        SELECT
          COALESCE(writer, editor) AS label,
          COUNT(*) FILTER (WHERE status::text IN ('pending','assigned','in_progress','ready','draft','in_review')) AS pending,
          COUNT(*) FILTER (WHERE status::text = 'published') AS completed,
          COUNT(*) FILTER (WHERE status::text = 'delayed') AS delayed,
          COUNT(*) FILTER (WHERE deadline IS NOT NULL AND deadline >= now() AND deadline < now() + interval '24 hours') AS today
        FROM public.website_tasks
        WHERE COALESCE(writer, editor) IS NOT NULL
        GROUP BY COALESCE(writer, editor)
      ) e
    ), '[]'::jsonb)
  ) INTO result
  FROM public.website_tasks;

  RETURN result;
END;
$$;

-- ============ PRODUCTION DASHBOARD ============
CREATE OR REPLACE FUNCTION public.dashboard_production()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.can_access_production(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT jsonb_build_object(
    'pending',   COUNT(*) FILTER (WHERE stage::text NOT IN ('published','archived','rejected')),
    'completed', COUNT(*) FILTER (WHERE stage::text = 'published'),
    'delayed',   COUNT(*) FILTER (WHERE stage::text = 'delayed'),
    'today',     COUNT(*) FILTER (WHERE deadline IS NOT NULL AND deadline >= now() AND deadline < now() + interval '24 hours'),
    'employees', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'name',      COALESCE(label, 'Unassigned'),
        'pending',   pending,
        'completed', completed,
        'delayed',   delayed,
        'today',     today
      ) ORDER BY pending DESC)
      FROM (
        SELECT
          COALESCE(editor, producer, reporter) AS label,
          COUNT(*) FILTER (WHERE stage::text NOT IN ('published','archived','rejected')) AS pending,
          COUNT(*) FILTER (WHERE stage::text = 'published') AS completed,
          COUNT(*) FILTER (WHERE stage::text = 'delayed') AS delayed,
          COUNT(*) FILTER (WHERE deadline IS NOT NULL AND deadline >= now() AND deadline < now() + interval '24 hours') AS today
        FROM public.production_tasks
        WHERE COALESCE(editor, producer, reporter) IS NOT NULL
        GROUP BY COALESCE(editor, producer, reporter)
      ) e
    ), '[]'::jsonb)
  ) INTO result
  FROM public.production_tasks;

  RETURN result;
END;
$$;

-- ============ ADMIN DASHBOARD (combined) ============
CREATE OR REPLACE FUNCTION public.dashboard_admin()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  social     jsonb;
  website    jsonb;
  production jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  -- Social totals
  SELECT jsonb_build_object(
    'pending',   COUNT(*) FILTER (WHERE status::text IN ('pending','assigned','in_progress','ready')),
    'completed', COUNT(*) FILTER (WHERE status::text = 'published'),
    'delayed',   COUNT(*) FILTER (WHERE status::text = 'delayed'),
    'today',     COUNT(*) FILTER (WHERE deadline IS NOT NULL AND deadline >= now() AND deadline < now() + interval '24 hours')
  ) INTO social FROM public.social_tasks;

  -- Website totals
  SELECT jsonb_build_object(
    'pending',   COUNT(*) FILTER (WHERE status::text IN ('pending','assigned','in_progress','ready','draft','in_review')),
    'completed', COUNT(*) FILTER (WHERE status::text = 'published'),
    'delayed',   COUNT(*) FILTER (WHERE status::text = 'delayed'),
    'today',     COUNT(*) FILTER (WHERE deadline IS NOT NULL AND deadline >= now() AND deadline < now() + interval '24 hours')
  ) INTO website FROM public.website_tasks;

  -- Production totals
  SELECT jsonb_build_object(
    'pending',   COUNT(*) FILTER (WHERE stage::text NOT IN ('published','archived','rejected')),
    'completed', COUNT(*) FILTER (WHERE stage::text = 'published'),
    'delayed',   COUNT(*) FILTER (WHERE stage::text = 'delayed'),
    'today',     COUNT(*) FILTER (WHERE deadline IS NOT NULL AND deadline >= now() AND deadline < now() + interval '24 hours')
  ) INTO production FROM public.production_tasks;

  RETURN jsonb_build_object(
    'totals', jsonb_build_object(
      'pending',   COALESCE((social->>'pending')::int,0)   + COALESCE((website->>'pending')::int,0)   + COALESCE((production->>'pending')::int,0),
      'completed', COALESCE((social->>'completed')::int,0) + COALESCE((website->>'completed')::int,0) + COALESCE((production->>'completed')::int,0),
      'delayed',   COALESCE((social->>'delayed')::int,0)   + COALESCE((website->>'delayed')::int,0)   + COALESCE((production->>'delayed')::int,0),
      'today',     COALESCE((social->>'today')::int,0)     + COALESCE((website->>'today')::int,0)     + COALESCE((production->>'today')::int,0)
    ),
    'by_dept', jsonb_build_object(
      'social',     social,
      'website',    website,
      'production', production
    ),
    'employees', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'user_id', p.id,
        'name',    COALESCE(p.full_name, p.username, 'User'),
        'role',    public.get_user_role(p.id),
        'pending', (
          (SELECT COUNT(*) FROM public.social_tasks  s WHERE s.assigned_to = p.id AND s.status::text IN ('pending','assigned','in_progress','ready'))
        ),
        'completed', (
          (SELECT COUNT(*) FROM public.social_tasks  s WHERE s.assigned_to = p.id AND s.status::text = 'published')
        ),
        'last_active', p.last_active
      ) ORDER BY p.created_at DESC)
      FROM public.profiles p
      WHERE p.status = 'active'
    ), '[]'::jsonb)
  );
END;
$$;