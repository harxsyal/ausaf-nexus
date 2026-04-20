CREATE OR REPLACE FUNCTION public.is_valid_status_transition(_from text, _to text)
RETURNS boolean
LANGUAGE sql IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN _from = _to THEN true
    WHEN _from = 'archived' THEN false
    WHEN _from = 'published' THEN _to IN ('archived','rejected')
    WHEN _from = 'rejected' THEN _to IN ('pending','assigned','in_progress','archived')
    WHEN _from = 'delayed' THEN _to IN ('in_progress','ready','assigned','archived','rejected','delayed')
    WHEN _from = 'ready' THEN _to IN ('published','delayed','rejected','archived','in_progress','scheduled')
    WHEN _from IN ('in_progress','researching','shooting','voice_over','editing','draft','in_review') THEN
      _to IN ('in_progress','researching','shooting','voice_over','editing','ready','delayed','rejected','archived','draft','in_review','assigned')
    WHEN _from = 'assigned' THEN _to IN ('in_progress','delayed','rejected','archived','researching','shooting','voice_over','editing','draft','in_review')
    WHEN _from IN ('pending','idea_received') THEN _to IN ('assigned','in_progress','delayed','rejected','archived','researching','draft','in_review')
    WHEN _from = 'scheduled' THEN _to IN ('published','ready','delayed','archived','rejected')
    ELSE true
  END;
$$;