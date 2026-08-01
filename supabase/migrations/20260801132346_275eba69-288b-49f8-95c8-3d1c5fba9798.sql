CREATE TABLE public.email_template_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name text NOT NULL DEFAULT 'kyc-status',
  status_key text NOT NULL,
  version integer NOT NULL,
  subject text NOT NULL,
  html_body text NOT NULL,
  text_body text NOT NULL,
  note text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (template_name, status_key, version)
);

CREATE INDEX email_template_versions_active_idx
  ON public.email_template_versions (template_name, status_key, is_active);

GRANT SELECT, INSERT, UPDATE ON public.email_template_versions TO authenticated;
GRANT ALL ON public.email_template_versions TO service_role;

ALTER TABLE public.email_template_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read email template versions"
  ON public.email_template_versions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins create email template versions"
  ON public.email_template_versions FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND created_by = auth.uid());

CREATE POLICY "Admins update email template versions"
  ON public.email_template_versions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));