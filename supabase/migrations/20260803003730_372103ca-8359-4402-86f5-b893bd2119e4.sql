ALTER TABLE public.document_notification_deliveries
  ADD COLUMN IF NOT EXISTS retryable boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_attempt_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS next_attempt_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS last_error text;

CREATE INDEX IF NOT EXISTS document_notification_deliveries_due_idx
  ON public.document_notification_deliveries (next_attempt_at)
  WHERE status = 'retrying';