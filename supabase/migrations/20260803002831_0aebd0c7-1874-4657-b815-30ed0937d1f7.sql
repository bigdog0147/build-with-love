ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS raise_email boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS raise_inapp boolean NOT NULL DEFAULT true;