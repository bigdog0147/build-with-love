CREATE TABLE public.reset_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_type text NOT NULL CHECK (key_type IN ('email_hash','ip')),
  key_value text NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.reset_rate_limits TO service_role;

ALTER TABLE public.reset_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE INDEX reset_rate_limits_lookup_idx
  ON public.reset_rate_limits (key_type, key_value, attempted_at DESC);