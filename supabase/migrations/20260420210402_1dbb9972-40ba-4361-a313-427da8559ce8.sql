CREATE TYPE public.social_platform AS ENUM ('facebook', 'youtube', 'instagram', 'tiktok', 'x');
CREATE TYPE public.social_task_type AS ENUM ('post', 'poster', 'reel', 'breaking');
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.social_task_status AS ENUM ('pending', 'in_progress', 'ready', 'published', 'delayed');

CREATE TABLE public.social_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  task_type public.social_task_type NOT NULL DEFAULT 'post',
  platform public.social_platform NOT NULL,
  asset_page TEXT,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deadline TIMESTAMPTZ,
  priority public.task_priority NOT NULL DEFAULT 'medium',
  status public.social_task_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.social_tasks ENABLE ROW LEVEL SECURITY;

-- Helper: caller is social_media OR super_admin
CREATE OR REPLACE FUNCTION public.can_access_social(_user UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user, 'social_media') OR public.has_role(_user, 'super_admin');
$$;

CREATE POLICY "Social desk can view tasks" ON public.social_tasks FOR SELECT
  USING (public.can_access_social(auth.uid()));
CREATE POLICY "Social desk can insert tasks" ON public.social_tasks FOR INSERT
  WITH CHECK (public.can_access_social(auth.uid()));
CREATE POLICY "Social desk can update tasks" ON public.social_tasks FOR UPDATE
  USING (public.can_access_social(auth.uid()));
CREATE POLICY "Social desk can delete tasks" ON public.social_tasks FOR DELETE
  USING (public.can_access_social(auth.uid()));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER social_tasks_touch BEFORE UPDATE ON public.social_tasks
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_social_tasks_status ON public.social_tasks(status);
CREATE INDEX idx_social_tasks_platform ON public.social_tasks(platform);
CREATE INDEX idx_social_tasks_deadline ON public.social_tasks(deadline);