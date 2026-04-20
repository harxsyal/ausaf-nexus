-- ============ SOCIAL TASKS ============
ALTER TABLE public.social_tasks
  ADD COLUMN IF NOT EXISTS description         text,
  ADD COLUMN IF NOT EXISTS assigned_by         uuid,
  ADD COLUMN IF NOT EXISTS caption_draft       text,
  ADD COLUMN IF NOT EXISTS publish_title_draft text,
  ADD COLUMN IF NOT EXISTS source              text;

-- ============ WEBSITE TASKS ============
ALTER TABLE public.website_tasks
  ADD COLUMN IF NOT EXISTS description         text,
  ADD COLUMN IF NOT EXISTS assigned_by         uuid,
  ADD COLUMN IF NOT EXISTS assigned_to         uuid,
  ADD COLUMN IF NOT EXISTS caption_draft       text,
  ADD COLUMN IF NOT EXISTS publish_title_draft text,
  ADD COLUMN IF NOT EXISTS source              text,
  ADD COLUMN IF NOT EXISTS priority            public.task_priority NOT NULL DEFAULT 'medium';

-- ============ PRODUCTION TASKS ============
ALTER TABLE public.production_tasks
  ADD COLUMN IF NOT EXISTS description         text,
  ADD COLUMN IF NOT EXISTS assigned_by         uuid,
  ADD COLUMN IF NOT EXISTS assigned_to         uuid,
  ADD COLUMN IF NOT EXISTS caption_draft       text,
  ADD COLUMN IF NOT EXISTS publish_title_draft text,
  ADD COLUMN IF NOT EXISTS priority            public.task_priority NOT NULL DEFAULT 'medium';

CREATE INDEX IF NOT EXISTS idx_social_assigned_to     ON public.social_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_website_assigned_to    ON public.website_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_production_assigned_to ON public.production_tasks(assigned_to);