ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS quiet_hours_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS quiet_hours_start integer NOT NULL DEFAULT 21,
  ADD COLUMN IF NOT EXISTS quiet_hours_end integer NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS time_zone text NOT NULL DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS raise_digest text NOT NULL DEFAULT 'instant',
  ADD COLUMN IF NOT EXISTS digest_hour integer NOT NULL DEFAULT 8;

CREATE TABLE IF NOT EXISTS public.notification_digest_queue (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  title text NOT NULL,
  detail text NOT NULL,
  tone text NOT NULL DEFAULT 'info',
  template text,
  template_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  idempotency_key text UNIQUE,
  reason text NOT NULL DEFAULT 'quiet_hours',
  deliver_after timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'queued',
  attempts integer NOT NULL DEFAULT 0,
  error text,
  sent_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.notification_digest_queue TO authenticated;
GRANT ALL ON public.notification_digest_queue TO service_role;

ALTER TABLE public.notification_digest_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers view their own queued alerts" ON public.notification_digest_queue;
CREATE POLICY "Customers view their own queued alerts"
ON public.notification_digest_queue FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS notification_digest_queue_due_idx
  ON public.notification_digest_queue (status, deliver_after);