CREATE TYPE public.withdrawal_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
CREATE TYPE public.withdrawal_destination AS ENUM ('bank_account', 'external_wallet');

CREATE TABLE public.withdrawal_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id uuid NOT NULL REFERENCES public.wallets(id) ON DELETE RESTRICT,
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  destination_type public.withdrawal_destination NOT NULL DEFAULT 'bank_account',
  destination_label text NOT NULL,
  destination_details text NOT NULL DEFAULT '',
  note text,
  status public.withdrawal_status NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  review_note text,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX withdrawal_requests_user_idx ON public.withdrawal_requests (user_id, created_at DESC);
CREATE INDEX withdrawal_requests_status_idx ON public.withdrawal_requests (status, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.withdrawal_requests TO authenticated;
GRANT ALL ON public.withdrawal_requests TO service_role;

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own withdrawals"
  ON public.withdrawal_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users create own withdrawals"
  ON public.withdrawal_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Users cancel own pending withdrawals"
  ON public.withdrawal_requests FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status IN ('pending', 'cancelled'));

CREATE POLICY "Admins read all withdrawals"
  ON public.withdrawal_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins review withdrawals"
  ON public.withdrawal_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.set_withdrawal_requests_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

REVOKE EXECUTE ON FUNCTION public.set_withdrawal_requests_updated_at() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_withdrawal_requests_updated_at
BEFORE UPDATE ON public.withdrawal_requests
FOR EACH ROW EXECUTE FUNCTION public.set_withdrawal_requests_updated_at();