-- ============ DEPARTMENTS ============
CREATE TABLE IF NOT EXISTS public.departments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text NOT NULL UNIQUE,
  name        text NOT NULL,
  description text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_departments_updated_at
BEFORE UPDATE ON public.departments
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Departments viewable by signed-in users"
  ON public.departments FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Departments managed by super admin"
  ON public.departments FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

INSERT INTO public.departments (code, name, description) VALUES
  ('social',      'Social Media',  'Facebook, YouTube, Instagram, TikTok, X dispatch desk'),
  ('website',     'Website',       'Editorial team for the news website'),
  ('production',  'Production',    'Video, podcast, and digital production unit'),
  ('admin',       'Administration','Super admin oversight and management')
ON CONFLICT (code) DO NOTHING;


-- ============ WARNINGS LOGS ============
CREATE TYPE public.warning_severity AS ENUM ('info', 'minor', 'major', 'critical');

CREATE TABLE IF NOT EXISTS public.warnings_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL,                      -- recipient (profiles.id)
  issued_by       uuid,                                -- super-admin who issued (profiles.id)
  severity        public.warning_severity NOT NULL DEFAULT 'minor',
  reason          text NOT NULL,
  details         text,
  related_dept    public.task_dept,
  related_task_id uuid,
  acknowledged_at timestamptz,
  resolved_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_warnings_user ON public.warnings_logs(user_id);
CREATE INDEX idx_warnings_created ON public.warnings_logs(created_at DESC);

CREATE TRIGGER trg_warnings_updated_at
BEFORE UPDATE ON public.warnings_logs
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.warnings_logs ENABLE ROW LEVEL SECURITY;

-- Super admin: full control
CREATE POLICY "Warnings full access by super admin"
  ON public.warnings_logs FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Recipient: can view own warnings
CREATE POLICY "Users view own warnings"
  ON public.warnings_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Recipient: can acknowledge (only update acknowledged_at on own row)
CREATE POLICY "Users acknowledge own warnings"
  ON public.warnings_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-notify recipient when a warning is issued
CREATE OR REPLACE FUNCTION public.notify_warning_issued()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE actor text;
BEGIN
  actor := COALESCE(public.profile_label(NEW.issued_by), 'Administration');
  INSERT INTO public.notifications(user_id, type, title, body, link)
  VALUES (
    NEW.user_id,
    'task_rejected',
    'Warning issued: ' || NEW.severity::text,
    actor || ' — ' || NEW.reason,
    '/warnings'
  );
  RETURN NEW;
END $$;

CREATE TRIGGER trg_warning_notify
AFTER INSERT ON public.warnings_logs
FOR EACH ROW EXECUTE FUNCTION public.notify_warning_issued();