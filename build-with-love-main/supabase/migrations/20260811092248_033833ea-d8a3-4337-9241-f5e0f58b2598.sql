CREATE TABLE public.notification_dispatch_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  category text NOT NULL,
  template text,
  idempotency_key text,
  label text NOT NULL,
  status text NOT NULL,
  attempts integer NOT NULL DEFAULT 1,
  detail text,
  retryable boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.notification_dispatch_log TO authenticated;
GRANT ALL ON public.notification_dispatch_log TO service_role;

ALTER TABLE public.notification_dispatch_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read notification dispatch log"
ON public.notification_dispatch_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX notification_dispatch_log_created_at_idx ON public.notification_dispatch_log (created_at DESC);
CREATE INDEX notification_dispatch_log_idempotency_key_idx ON public.notification_dispatch_log (idempotency_key);