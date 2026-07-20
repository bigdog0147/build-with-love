CREATE TABLE public.auth_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email_hash TEXT,
  email_masked TEXT,
  ip TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT auth_audit_event_type_check CHECK (event_type IN (
    'reset_request',
    'password_updated',
    'recovery_rejected'
  ))
);

CREATE INDEX auth_audit_log_user_id_idx ON public.auth_audit_log (user_id, created_at DESC);
CREATE INDEX auth_audit_log_email_hash_idx ON public.auth_audit_log (email_hash, created_at DESC);
CREATE INDEX auth_audit_log_created_at_idx ON public.auth_audit_log (created_at DESC);

GRANT SELECT ON public.auth_audit_log TO authenticated;
GRANT ALL ON public.auth_audit_log TO service_role;

ALTER TABLE public.auth_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own audit rows"
  ON public.auth_audit_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);