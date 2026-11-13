-- ENUMS
CREATE TYPE public.distribution_kind AS ENUM ('income', 'capital_return');
CREATE TYPE public.raise_round_status AS ENUM ('draft', 'open', 'closed', 'funded');
CREATE TYPE public.raise_interest_status AS ENUM ('submitted', 'invited', 'declined', 'withdrawn');
CREATE TYPE public.raise_commitment_status AS ENUM ('awaiting_funding', 'funded', 'accepted', 'released', 'cancelled');
CREATE TYPE public.document_category AS ENUM ('prospectus', 'factsheet', 'term_sheet', 'report', 'statement', 'agreement');
CREATE TYPE public.document_visibility AS ENUM ('all_investors', 'single_investor', 'product_subscribers');

-- HOLDING VALUATIONS
CREATE TABLE public.holding_valuations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  holding_id uuid NOT NULL REFERENCES public.investment_holdings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.investment_products(id) ON DELETE CASCADE,
  as_of date NOT NULL DEFAULT CURRENT_DATE,
  unit_price numeric NOT NULL DEFAULT 0,
  value numeric NOT NULL DEFAULT 0,
  note text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX holding_valuations_holding_idx ON public.holding_valuations (holding_id, as_of DESC);
CREATE INDEX holding_valuations_user_idx ON public.holding_valuations (user_id, as_of DESC);
GRANT SELECT ON public.holding_valuations TO authenticated;
GRANT ALL ON public.holding_valuations TO service_role;
ALTER TABLE public.holding_valuations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Investors read own valuations" ON public.holding_valuations
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- DISTRIBUTIONS
CREATE TABLE public.distributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  holding_id uuid NOT NULL REFERENCES public.investment_holdings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.investment_products(id) ON DELETE CASCADE,
  kind public.distribution_kind NOT NULL DEFAULT 'income',
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  paid_at date NOT NULL DEFAULT CURRENT_DATE,
  wallet_id uuid REFERENCES public.wallets(id),
  transaction_id uuid REFERENCES public.transactions(id),
  note text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX distributions_user_idx ON public.distributions (user_id, paid_at DESC);
CREATE INDEX distributions_holding_idx ON public.distributions (holding_id, paid_at DESC);
GRANT SELECT ON public.distributions TO authenticated;
GRANT ALL ON public.distributions TO service_role;
ALTER TABLE public.distributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Investors read own distributions" ON public.distributions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- RAISE ROUNDS
CREATE TABLE public.raise_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  product_id uuid REFERENCES public.investment_products(id) ON DELETE SET NULL,
  narrative text NOT NULL DEFAULT '',
  highlights text[] NOT NULL DEFAULT '{}',
  target_amount numeric NOT NULL,
  minimum_ticket numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  opens_at date,
  closes_at date,
  status public.raise_round_status NOT NULL DEFAULT 'draft',
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.raise_rounds TO authenticated;
GRANT ALL ON public.raise_rounds TO service_role;
ALTER TABLE public.raise_rounds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Investors read live rounds" ON public.raise_rounds
  FOR SELECT TO authenticated USING (status <> 'draft');
CREATE POLICY "Admins read all rounds" ON public.raise_rounds
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.set_raise_rounds_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
REVOKE EXECUTE ON FUNCTION public.set_raise_rounds_updated_at() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER raise_rounds_updated_at BEFORE UPDATE ON public.raise_rounds
  FOR EACH ROW EXECUTE FUNCTION public.set_raise_rounds_updated_at();

-- RAISE INTERESTS
CREATE TABLE public.raise_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id uuid NOT NULL REFERENCES public.raise_rounds(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  indicative_amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  note text,
  status public.raise_interest_status NOT NULL DEFAULT 'submitted',
  review_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (round_id, user_id)
);
GRANT SELECT, INSERT, UPDATE ON public.raise_interests TO authenticated;
GRANT ALL ON public.raise_interests TO service_role;
ALTER TABLE public.raise_interests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Investors read own interests" ON public.raise_interests
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Investors create own interests" ON public.raise_interests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Investors withdraw own interests" ON public.raise_interests
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_raise_interests_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
REVOKE EXECUTE ON FUNCTION public.set_raise_interests_updated_at() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER raise_interests_updated_at BEFORE UPDATE ON public.raise_interests
  FOR EACH ROW EXECUTE FUNCTION public.set_raise_interests_updated_at();

-- RAISE COMMITMENTS
CREATE TABLE public.raise_commitments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id uuid NOT NULL REFERENCES public.raise_rounds(id) ON DELETE CASCADE,
  interest_id uuid REFERENCES public.raise_interests(id) ON DELETE SET NULL,
  user_id uuid NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  wallet_id uuid REFERENCES public.wallets(id),
  holding_id uuid REFERENCES public.investment_holdings(id) ON DELETE SET NULL,
  transaction_id uuid REFERENCES public.transactions(id),
  status public.raise_commitment_status NOT NULL DEFAULT 'awaiting_funding',
  review_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX raise_commitments_user_idx ON public.raise_commitments (user_id, created_at DESC);
GRANT SELECT ON public.raise_commitments TO authenticated;
GRANT ALL ON public.raise_commitments TO service_role;
ALTER TABLE public.raise_commitments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Investors read own commitments" ON public.raise_commitments
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_raise_commitments_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
REVOKE EXECUTE ON FUNCTION public.set_raise_commitments_updated_at() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER raise_commitments_updated_at BEFORE UPDATE ON public.raise_commitments
  FOR EACH ROW EXECUTE FUNCTION public.set_raise_commitments_updated_at();

-- DOCUMENT LIBRARY
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category public.document_category NOT NULL DEFAULT 'report',
  visibility public.document_visibility NOT NULL DEFAULT 'all_investors',
  product_id uuid REFERENCES public.investment_products(id) ON DELETE CASCADE,
  user_id uuid,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size integer NOT NULL DEFAULT 0,
  content_type text NOT NULL DEFAULT 'application/pdf',
  is_published boolean NOT NULL DEFAULT true,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX documents_visibility_idx ON public.documents (visibility, is_published);
GRANT SELECT ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Investors read entitled documents" ON public.documents
  FOR SELECT TO authenticated USING (
    is_published AND (
      visibility = 'all_investors'
      OR (visibility = 'single_investor' AND user_id = auth.uid())
      OR (visibility = 'product_subscribers' AND EXISTS (
        SELECT 1 FROM public.investment_holdings h
        WHERE h.product_id = documents.product_id
          AND h.user_id = auth.uid()
          AND h.status IN ('active', 'closed')
      ))
    )
  );
CREATE POLICY "Admins read all documents" ON public.documents
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.set_documents_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
REVOKE EXECUTE ON FUNCTION public.set_documents_updated_at() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER documents_updated_at BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.set_documents_updated_at();