CREATE TYPE public.production_stage AS ENUM (
  'idea_received','researching','shooting','voice_over','editing','ready','scheduled','published'
);

CREATE TABLE public.production_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  source TEXT,
  reporter TEXT,
  editor TEXT,
  producer TEXT,
  deadline TIMESTAMPTZ,
  target_platform TEXT,
  stage public.production_stage NOT NULL DEFAULT 'idea_received',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.production_tasks ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_access_production(_user UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user, 'production') OR public.has_role(_user, 'super_admin');
$$;

CREATE POLICY "Production desk can view tasks" ON public.production_tasks FOR SELECT
  USING (public.can_access_production(auth.uid()));
CREATE POLICY "Production desk can insert tasks" ON public.production_tasks FOR INSERT
  WITH CHECK (public.can_access_production(auth.uid()));
CREATE POLICY "Production desk can update tasks" ON public.production_tasks FOR UPDATE
  USING (public.can_access_production(auth.uid()));
CREATE POLICY "Production desk can delete tasks" ON public.production_tasks FOR DELETE
  USING (public.can_access_production(auth.uid()));

CREATE TRIGGER production_tasks_touch BEFORE UPDATE ON public.production_tasks
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_production_tasks_stage ON public.production_tasks(stage);
CREATE INDEX idx_production_tasks_deadline ON public.production_tasks(deadline);