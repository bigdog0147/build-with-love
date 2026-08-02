-- ===== enums =====
CREATE TYPE public.deposit_method AS ENUM ('bank_transfer', 'card', 'crypto', 'wire');
CREATE TYPE public.deposit_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
CREATE TYPE public.product_status AS ENUM ('draft', 'published', 'retired');
CREATE TYPE public.holding_status AS ENUM ('pending', 'active', 'closed', 'rejected');

-- ===== deposit requests =====
CREATE TABLE public.deposit_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id uuid NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  currency text NOT NULL,
  method public.deposit_method NOT NULL DEFAULT 'bank_transfer',
  reference text NOT NULL DEFAULT '',
  proof_path text,
  note text,
  status public.deposit_status NOT NULL DEFAULT 'pending',
  review_note text,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.deposit_requests TO authenticated;
GRANT ALL ON public.deposit_requests TO service_role;
ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers read own deposits" ON public.deposit_requests
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Customers create own deposits" ON public.deposit_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Customers cancel own pending deposits" ON public.deposit_requests
  FOR UPDATE TO authenticated USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins read all deposits" ON public.deposit_requests
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins review deposits" ON public.deposit_requests
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX deposit_requests_user_idx ON public.deposit_requests (user_id, created_at DESC);
CREATE INDEX deposit_requests_status_idx ON public.deposit_requests (status, created_at DESC);
CREATE TRIGGER set_deposit_requests_updated_at BEFORE UPDATE ON public.deposit_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_withdrawal_requests_updated_at();

-- ===== investment products =====
CREATE TABLE public.investment_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Private markets',
  sector text NOT NULL DEFAULT 'Industrial',
  summary text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  cover_url text,
  currency text NOT NULL DEFAULT 'USD',
  minimum numeric NOT NULL DEFAULT 1000 CHECK (minimum >= 0),
  target_yield numeric NOT NULL DEFAULT 0,
  term_months integer NOT NULL DEFAULT 12,
  capacity numeric,
  status public.product_status NOT NULL DEFAULT 'draft',
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.investment_products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.investment_products TO authenticated;
GRANT ALL ON public.investment_products TO service_role;
ALTER TABLE public.investment_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads published products" ON public.investment_products
  FOR SELECT USING (status = 'published');
CREATE POLICY "Admins read all products" ON public.investment_products
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert products" ON public.investment_products
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update products" ON public.investment_products
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete products" ON public.investment_products
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER set_investment_products_updated_at BEFORE UPDATE ON public.investment_products
  FOR EACH ROW EXECUTE FUNCTION public.set_withdrawal_requests_updated_at();

-- ===== investment holdings =====
CREATE TABLE public.investment_holdings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.investment_products(id) ON DELETE RESTRICT,
  wallet_id uuid REFERENCES public.wallets(id) ON DELETE SET NULL,
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
  invested numeric NOT NULL CHECK (invested > 0),
  current_value numeric NOT NULL DEFAULT 0,
  units numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  status public.holding_status NOT NULL DEFAULT 'pending',
  review_note text,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.investment_holdings TO authenticated;
GRANT ALL ON public.investment_holdings TO service_role;
ALTER TABLE public.investment_holdings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers read own holdings" ON public.investment_holdings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Customers create own holdings" ON public.investment_holdings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Admins read all holdings" ON public.investment_holdings
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX investment_holdings_user_idx ON public.investment_holdings (user_id, created_at DESC);
CREATE INDEX investment_holdings_product_idx ON public.investment_holdings (product_id);
CREATE TRIGGER set_investment_holdings_updated_at BEFORE UPDATE ON public.investment_holdings
  FOR EACH ROW EXECUTE FUNCTION public.set_withdrawal_requests_updated_at();

-- ===== report runs (staff only) =====
CREATE TABLE public.report_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_key text NOT NULL,
  title text NOT NULL,
  range_start date NOT NULL,
  range_end date NOT NULL,
  row_count integer NOT NULL DEFAULT 0,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.report_runs TO authenticated;
GRANT ALL ON public.report_runs TO service_role;
ALTER TABLE public.report_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read report runs" ON public.report_runs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ===== notification broadcasts (staff only) =====
CREATE TABLE public.notification_broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  detail text NOT NULL,
  tone text NOT NULL DEFAULT 'info',
  audience text NOT NULL DEFAULT 'all',
  email_sent boolean NOT NULL DEFAULT false,
  recipient_count integer NOT NULL DEFAULT 0,
  sent_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.notification_broadcasts TO authenticated;
GRANT ALL ON public.notification_broadcasts TO service_role;
ALTER TABLE public.notification_broadcasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read broadcasts" ON public.notification_broadcasts
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ===== admin audit log (append-only, staff read) =====
CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  action text NOT NULL,
  target_type text,
  target_id text,
  target_label text,
  before_state jsonb,
  after_state jsonb,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read admin audit log" ON public.admin_audit_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX admin_audit_log_created_idx ON public.admin_audit_log (created_at DESC);
CREATE INDEX admin_audit_log_actor_idx ON public.admin_audit_log (actor_id, created_at DESC);

-- ===== system settings (single row) =====
CREATE TABLE public.system_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  platform_name text NOT NULL DEFAULT 'Gigafactory 3X',
  support_email text NOT NULL DEFAULT 'support@gf3x.space',
  maintenance_mode boolean NOT NULL DEFAULT false,
  maintenance_message text NOT NULL DEFAULT 'The customer portal is temporarily offline for scheduled maintenance.',
  registration_open boolean NOT NULL DEFAULT false,
  deposit_min numeric NOT NULL DEFAULT 100,
  withdrawal_min numeric NOT NULL DEFAULT 10,
  withdrawal_fee_pct numeric NOT NULL DEFAULT 0,
  session_timeout_minutes integer NOT NULL DEFAULT 30,
  default_currency text NOT NULL DEFAULT 'USD',
  default_locale text NOT NULL DEFAULT 'en',
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.system_settings TO anon;
GRANT SELECT ON public.system_settings TO authenticated;
GRANT ALL ON public.system_settings TO service_role;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads system settings" ON public.system_settings
  FOR SELECT USING (true);
CREATE TRIGGER set_system_settings_updated_at BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_withdrawal_requests_updated_at();
INSERT INTO public.system_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

-- ===== deposit proof storage policies =====
CREATE POLICY "Customers upload own deposit proofs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'deposit-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Customers read own deposit proofs" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'deposit-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);