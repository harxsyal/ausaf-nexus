CREATE TYPE public.web_article_type AS ENUM ('news', 'original', 'postcard');
CREATE TYPE public.web_language AS ENUM ('urdu', 'english', 'other');
CREATE TYPE public.web_task_status AS ENUM ('draft', 'in_review', 'ready', 'published', 'delayed');

CREATE TABLE public.website_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  headline TEXT NOT NULL,
  article_type public.web_article_type NOT NULL DEFAULT 'news',
  category TEXT,
  language public.web_language NOT NULL DEFAULT 'urdu',
  writer TEXT,
  editor TEXT,
  deadline TIMESTAMPTZ,
  status public.web_task_status NOT NULL DEFAULT 'draft',
  url TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.website_tasks ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_access_website(_user UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user, 'website') OR public.has_role(_user, 'super_admin');
$$;

CREATE POLICY "Website desk can view tasks" ON public.website_tasks FOR SELECT
  USING (public.can_access_website(auth.uid()));
CREATE POLICY "Website desk can insert tasks" ON public.website_tasks FOR INSERT
  WITH CHECK (public.can_access_website(auth.uid()));
CREATE POLICY "Website desk can update tasks" ON public.website_tasks FOR UPDATE
  USING (public.can_access_website(auth.uid()));
CREATE POLICY "Website desk can delete tasks" ON public.website_tasks FOR DELETE
  USING (public.can_access_website(auth.uid()));

CREATE TRIGGER website_tasks_touch BEFORE UPDATE ON public.website_tasks
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_website_tasks_status ON public.website_tasks(status);
CREATE INDEX idx_website_tasks_deadline ON public.website_tasks(deadline);