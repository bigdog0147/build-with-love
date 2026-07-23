
-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT 'Client',
  tier text NOT NULL DEFAULT 'Obsidian',
  initials text NOT NULL DEFAULT 'CL',
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own profile" ON public.profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- WALLETS
CREATE TABLE public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL,
  label text NOT NULL,
  balance numeric NOT NULL DEFAULT 0,
  fiat_value numeric,
  delta_pct numeric NOT NULL DEFAULT 0,
  tint text NOT NULL DEFAULT 'gold',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wallets TO authenticated;
GRANT ALL ON public.wallets TO service_role;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own wallets" ON public.wallets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- TRANSACTIONS
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  kind text NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  occurred_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'Cleared',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own transactions" ON public.transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- CARDS
CREATE TABLE public.cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  last4 text NOT NULL,
  tier text NOT NULL,
  gradient text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cards TO authenticated;
GRANT ALL ON public.cards TO service_role;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own cards" ON public.cards FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ALLOCATIONS
CREATE TABLE public.allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL,
  percent numeric NOT NULL,
  color text NOT NULL,
  sort_order int NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.allocations TO authenticated;
GRANT ALL ON public.allocations TO service_role;
ALTER TABLE public.allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own allocations" ON public.allocations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- New-user seed: profile + starter data so the dashboard renders on first login
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_display text;
  v_initials text;
BEGIN
  v_display := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'Client');
  v_initials := upper(substr(regexp_replace(v_display, '[^A-Za-z ]', '', 'g'), 1, 2));
  IF v_initials = '' THEN v_initials := 'CL'; END IF;

  INSERT INTO public.profiles (id, display_name, initials)
  VALUES (NEW.id, v_display, v_initials);

  INSERT INTO public.wallets (user_id, code, label, balance, fiat_value, delta_pct, tint, sort_order) VALUES
    (NEW.id, 'USD', 'US Dollar', 482910.44, NULL, 1.24, 'gold', 0),
    (NEW.id, 'EUR', 'Euro', 216340.10, NULL, 0.42, 'silver', 1),
    (NEW.id, 'BTC', 'Bitcoin', 12.4183, 812430.00, 3.87, 'electric', 2),
    (NEW.id, 'XAU', 'Gold (oz)', 184.2, 452110.00, -0.31, 'gold', 3);

  INSERT INTO public.transactions (user_id, name, kind, amount, currency, occurred_at, status) VALUES
    (NEW.id, 'SpaceX Series K', 'Private equity', -125000, 'USD', now() - interval '2 hours', 'Cleared'),
    (NEW.id, 'Coupon — US Treasury 4.25%', 'Fixed income', 4820.55, 'USD', now() - interval '5 hours', 'Cleared'),
    (NEW.id, 'BTC accumulation', 'Digital asset', -48250, 'USD', now() - interval '1 day', 'Cleared'),
    (NEW.id, 'Wire from Zurich Custody', 'Transfer', 250000, 'CHF', now() - interval '1 day 4 hours', 'Cleared'),
    (NEW.id, 'Amex Centurion — Paris', 'Card', -3184.20, 'EUR', now() - interval '3 days', 'Pending'),
    (NEW.id, 'Dividend — LVMH', 'Equity income', 1920.40, 'EUR', now() - interval '4 days', 'Cleared');

  INSERT INTO public.cards (user_id, name, last4, tier, gradient, sort_order) VALUES
    (NEW.id, 'Obsidian Reserve', '7742', 'Metal · Unlimited', 'linear-gradient(135deg, oklch(0.28 0.02 260), oklch(0.14 0.01 260))', 0),
    (NEW.id, 'Aurum Signature', '0318', 'Gold · Priority', 'var(--gradient-gold)', 1),
    (NEW.id, 'Voltaic Blue', '5591', 'Digital · Instant', 'var(--gradient-electric)', 2);

  INSERT INTO public.allocations (user_id, label, percent, color, sort_order) VALUES
    (NEW.id, 'Equities', 42, 'var(--gold)', 0),
    (NEW.id, 'Fixed income', 21, 'var(--silver)', 1),
    (NEW.id, 'Digital assets', 19, 'var(--electric)', 2),
    (NEW.id, 'Commodities', 12, 'oklch(0.72 0.17 155)', 3),
    (NEW.id, 'Cash', 6, 'oklch(0.55 0.02 260)', 4);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
