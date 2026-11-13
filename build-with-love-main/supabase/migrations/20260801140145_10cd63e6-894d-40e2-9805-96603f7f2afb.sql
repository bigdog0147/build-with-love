CREATE TABLE public.admin_password_resets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  code_hash text NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  invalidated_at timestamptz,
  requested_ip text,
  requested_user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX admin_password_resets_user_idx ON public.admin_password_resets (user_id, created_at DESC);

GRANT ALL ON public.admin_password_resets TO service_role;

ALTER TABLE public.admin_password_resets ENABLE ROW LEVEL SECURITY;
-- Deliberately no policies: reset tokens are only ever read/written by
-- server-only code using the service role. anon/authenticated get nothing.