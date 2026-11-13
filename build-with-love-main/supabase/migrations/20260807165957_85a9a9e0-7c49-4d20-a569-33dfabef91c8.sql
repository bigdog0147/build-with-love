CREATE TABLE public.raise_round_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  round_id uuid NOT NULL REFERENCES public.raise_rounds(id) ON DELETE CASCADE,
  email_enabled boolean NOT NULL DEFAULT true,
  inapp_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, round_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.raise_round_preferences TO authenticated;
GRANT ALL ON public.raise_round_preferences TO service_role;

ALTER TABLE public.raise_round_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Investors manage their own round alert preferences"
ON public.raise_round_preferences FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER raise_round_preferences_updated_at
BEFORE UPDATE ON public.raise_round_preferences
FOR EACH ROW EXECUTE FUNCTION public.set_raise_rounds_updated_at();