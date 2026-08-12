ALTER TABLE public.notification_dispatch_log
  ADD COLUMN IF NOT EXISTS payload jsonb,
  ADD COLUMN IF NOT EXISTS resent_from uuid REFERENCES public.notification_dispatch_log(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS resent_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS resent_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS notification_dispatch_log_resent_from_idx
  ON public.notification_dispatch_log (resent_from);