ALTER TABLE public.notification_dispatch_log
  ADD COLUMN IF NOT EXISTS attempt_trail jsonb NOT NULL DEFAULT '[]'::jsonb;