-- ============ 1. EXTEND ALL STATUS ENUMS WITH MISSING VALUES ============
-- social_task_status: pending, in_progress, ready, published, delayed
ALTER TYPE public.social_task_status ADD VALUE IF NOT EXISTS 'assigned';
ALTER TYPE public.social_task_status ADD VALUE IF NOT EXISTS 'rejected';
ALTER TYPE public.social_task_status ADD VALUE IF NOT EXISTS 'archived';

-- web_task_status: draft, in_review, ready, published, delayed
ALTER TYPE public.web_task_status ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE public.web_task_status ADD VALUE IF NOT EXISTS 'assigned';
ALTER TYPE public.web_task_status ADD VALUE IF NOT EXISTS 'in_progress';
ALTER TYPE public.web_task_status ADD VALUE IF NOT EXISTS 'rejected';
ALTER TYPE public.web_task_status ADD VALUE IF NOT EXISTS 'archived';

-- production_stage: idea_received, researching, shooting, voice_over, editing, ready, scheduled, published
ALTER TYPE public.production_stage ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE public.production_stage ADD VALUE IF NOT EXISTS 'assigned';
ALTER TYPE public.production_stage ADD VALUE IF NOT EXISTS 'in_progress';
ALTER TYPE public.production_stage ADD VALUE IF NOT EXISTS 'delayed';
ALTER TYPE public.production_stage ADD VALUE IF NOT EXISTS 'rejected';
ALTER TYPE public.production_stage ADD VALUE IF NOT EXISTS 'archived';