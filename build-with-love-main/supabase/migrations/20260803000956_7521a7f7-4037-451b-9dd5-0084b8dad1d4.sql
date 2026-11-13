ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS reports_email boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS reports_inapp boolean NOT NULL DEFAULT true;