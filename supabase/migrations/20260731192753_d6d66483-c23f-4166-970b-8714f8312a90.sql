CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'kyc_status',
  title text NOT NULL,
  detail text NOT NULL DEFAULT '',
  tone text NOT NULL DEFAULT 'info',
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notifications_user_created_idx ON public.notifications (user_id, created_at DESC);

GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users mark own notifications read" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.notify_kyc_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title text;
  v_detail text;
  v_tone text := 'info';
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.id_status IS NOT DISTINCT FROM OLD.id_status THEN
    RETURN NEW;
  END IF;
  IF NEW.id_status = 'not_started' THEN
    RETURN NEW;
  END IF;

  CASE NEW.id_status
    WHEN 'submitted' THEN
      v_title := 'Verification submitted';
      v_detail := 'We received your identity documents. Compliance review starts shortly.';
      v_tone := 'info';
    WHEN 'under_review' THEN
      v_title := 'Verification in review';
      v_detail := 'A compliance officer is reviewing your documents. This usually takes 1-2 business days.';
      v_tone := 'warning';
    WHEN 'verified' THEN
      v_title := 'Verification approved';
      v_detail := 'Your identity is verified. All account features are now unlocked.';
      v_tone := 'success';
    WHEN 'rejected' THEN
      v_title := 'Verification needs changes';
      v_detail := 'We could not verify your documents. Please re-upload clearer images and resubmit.';
      v_tone := 'warning';
    ELSE
      RETURN NEW;
  END CASE;

  INSERT INTO public.notifications (user_id, kind, title, detail, tone)
  VALUES (NEW.user_id, 'kyc_status', v_title, v_detail, v_tone);

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_kyc_status_change() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER kyc_status_change_notify
AFTER INSERT OR UPDATE OF id_status ON public.kyc_profiles
FOR EACH ROW EXECUTE FUNCTION public.notify_kyc_status_change();