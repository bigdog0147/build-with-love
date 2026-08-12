ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS raise_event_interest_email boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS raise_event_withdrawn_email boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS raise_event_cancelled_email boolean NOT NULL DEFAULT true;