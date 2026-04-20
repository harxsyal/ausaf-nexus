-- Department enum reused across collab tables
CREATE TYPE public.task_dept AS ENUM ('social', 'website', 'production');

-- Helper: can the user access a task in this department?
CREATE OR REPLACE FUNCTION public.can_access_dept(_user uuid, _dept public.task_dept)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE _dept
    WHEN 'social'     THEN public.can_access_social(_user)
    WHEN 'website'    THEN public.can_access_website(_user)
    WHEN 'production' THEN public.can_access_production(_user)
  END;
$$;

-- ============ Comments ============
CREATE TABLE public.task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_dept public.task_dept NOT NULL,
  task_id uuid NOT NULL,
  body text NOT NULL,
  author_id uuid,
  author_label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_task_comments_task ON public.task_comments(task_dept, task_id, created_at DESC);
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments viewable by desk" ON public.task_comments
FOR SELECT USING (public.can_access_dept(auth.uid(), task_dept));

CREATE POLICY "Comments insert by desk" ON public.task_comments
FOR INSERT WITH CHECK (public.can_access_dept(auth.uid(), task_dept));

CREATE POLICY "Comments update by author or admin" ON public.task_comments
FOR UPDATE USING (
  public.has_role(auth.uid(), 'super_admin') OR auth.uid() = author_id
);

CREATE POLICY "Comments delete by author or admin" ON public.task_comments
FOR DELETE USING (
  public.has_role(auth.uid(), 'super_admin') OR auth.uid() = author_id
);

CREATE TRIGGER task_comments_touch
BEFORE UPDATE ON public.task_comments
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ Timeline events (immutable) ============
CREATE TABLE public.task_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_dept public.task_dept NOT NULL,
  task_id uuid NOT NULL,
  event_type text NOT NULL,
  summary text NOT NULL,
  actor_id uuid,
  actor_label text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_task_events_task ON public.task_events(task_dept, task_id, created_at DESC);
ALTER TABLE public.task_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events viewable by desk" ON public.task_events
FOR SELECT USING (public.can_access_dept(auth.uid(), task_dept));

CREATE POLICY "Events insert by desk" ON public.task_events
FOR INSERT WITH CHECK (public.can_access_dept(auth.uid(), task_dept));

-- intentionally no UPDATE / DELETE policies → immutable

-- ============ Publish proof ============
CREATE TABLE public.task_proof (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_dept public.task_dept NOT NULL,
  task_id uuid NOT NULL,
  url text,
  caption text,
  screenshot_path text,
  published_at timestamptz,
  submitted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_task_proof_task ON public.task_proof(task_dept, task_id, created_at DESC);
ALTER TABLE public.task_proof ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Proof viewable by desk" ON public.task_proof
FOR SELECT USING (public.can_access_dept(auth.uid(), task_dept));

CREATE POLICY "Proof insert by desk" ON public.task_proof
FOR INSERT WITH CHECK (public.can_access_dept(auth.uid(), task_dept));

CREATE POLICY "Proof update by submitter or admin" ON public.task_proof
FOR UPDATE USING (
  public.has_role(auth.uid(), 'super_admin') OR auth.uid() = submitted_by
);

CREATE POLICY "Proof delete by submitter or admin" ON public.task_proof
FOR DELETE USING (
  public.has_role(auth.uid(), 'super_admin') OR auth.uid() = submitted_by
);

CREATE TRIGGER task_proof_touch
BEFORE UPDATE ON public.task_proof
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();