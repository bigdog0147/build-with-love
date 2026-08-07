CREATE TABLE public.confirmation_downloads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  round_id uuid REFERENCES public.raise_rounds(id) ON DELETE SET NULL,
  round_name text NOT NULL,
  event_key text NOT NULL,
  document_title text NOT NULL,
  reference text,
  source text NOT NULL DEFAULT 'portal',
  document_count integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.confirmation_downloads TO authenticated;
GRANT ALL ON public.confirmation_downloads TO service_role;

ALTER TABLE public.confirmation_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Investors read own confirmation downloads"
  ON public.confirmation_downloads FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Investors record own confirmation downloads"
  ON public.confirmation_downloads FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_confirmation_downloads_user_created
  ON public.confirmation_downloads (user_id, created_at DESC);
CREATE INDEX idx_confirmation_downloads_round
  ON public.confirmation_downloads (round_id);