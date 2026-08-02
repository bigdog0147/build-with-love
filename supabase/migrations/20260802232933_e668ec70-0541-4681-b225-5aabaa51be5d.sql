-- ============================================================ currencies/fx
CREATE TABLE public.currency_settings (
  code text PRIMARY KEY,
  label text NOT NULL,
  symbol text NOT NULL DEFAULT '',
  decimals integer NOT NULL DEFAULT 2,
  kind text NOT NULL DEFAULT 'fiat',
  is_enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.currency_settings TO anon, authenticated;
GRANT ALL ON public.currency_settings TO service_role;
ALTER TABLE public.currency_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enabled currencies are readable" ON public.currency_settings
  FOR SELECT TO anon, authenticated USING (is_enabled);

CREATE TABLE public.fx_rates (
  code text PRIMARY KEY,
  rate_to_usd numeric NOT NULL,
  source text NOT NULL DEFAULT 'ecb',
  is_manual boolean NOT NULL DEFAULT false,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.fx_rates TO anon, authenticated;
GRANT ALL ON public.fx_rates TO service_role;
ALTER TABLE public.fx_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Rates are readable" ON public.fx_rates
  FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.fx_refresh_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  ok boolean NOT NULL,
  currency_count integer NOT NULL DEFAULT 0,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.fx_refresh_runs TO service_role;
ALTER TABLE public.fx_refresh_runs ENABLE ROW LEVEL SECURITY;

-- ===================================================================== risk
CREATE TABLE public.risk_rules (
  key text PRIMARY KEY,
  label text NOT NULL,
  description text NOT NULL DEFAULT '',
  threshold numeric NOT NULL DEFAULT 0,
  weight integer NOT NULL DEFAULT 10,
  is_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.risk_rules TO service_role;
ALTER TABLE public.risk_rules ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.risk_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  kind text NOT NULL,
  subject_type text,
  subject_id text,
  amount numeric,
  currency text,
  score integer NOT NULL DEFAULT 0,
  band text NOT NULL DEFAULT 'allow',
  triggered jsonb NOT NULL DEFAULT '[]'::jsonb,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  decision text NOT NULL DEFAULT 'open',
  decision_note text,
  decided_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  decided_at timestamptz,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.risk_events TO authenticated;
GRANT ALL ON public.risk_events TO service_role;
ALTER TABLE public.risk_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers see their own risk events" ON public.risk_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX risk_events_open_idx ON public.risk_events (decision, created_at DESC);

-- ===================================================================== chat
CREATE TABLE public.chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL DEFAULT 'Support conversation',
  status text NOT NULL DEFAULT 'open',
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  unread_for_admin integer NOT NULL DEFAULT 0,
  unread_for_user integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.chat_threads TO authenticated;
GRANT ALL ON public.chat_threads TO service_role;
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers read their own threads" ON public.chat_threads
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Customers open their own threads" ON public.chat_threads
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Customers update their own threads" ON public.chat_threads
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_role text NOT NULL DEFAULT 'customer',
  author_name text NOT NULL DEFAULT 'Customer',
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers read messages in their threads" ON public.chat_messages
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.chat_threads t WHERE t.id = thread_id AND t.user_id = auth.uid())
  );
CREATE POLICY "Customers write messages in their threads" ON public.chat_messages
  FOR INSERT TO authenticated WITH CHECK (
    author_id = auth.uid() AND author_role = 'customer'
    AND EXISTS (SELECT 1 FROM public.chat_threads t WHERE t.id = thread_id AND t.user_id = auth.uid())
  );
CREATE INDEX chat_messages_thread_idx ON public.chat_messages (thread_id, created_at);
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- ================================================== notification preferences
CREATE TABLE public.notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  deposits_email boolean NOT NULL DEFAULT true,
  deposits_inapp boolean NOT NULL DEFAULT true,
  withdrawals_email boolean NOT NULL DEFAULT true,
  withdrawals_inapp boolean NOT NULL DEFAULT true,
  kyc_email boolean NOT NULL DEFAULT true,
  kyc_inapp boolean NOT NULL DEFAULT true,
  security_email boolean NOT NULL DEFAULT true,
  security_inapp boolean NOT NULL DEFAULT true,
  announcements_email boolean NOT NULL DEFAULT true,
  announcements_inapp boolean NOT NULL DEFAULT true,
  locale text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers manage their own preferences" ON public.notification_preferences
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================== integrations
CREATE TABLE public.webhook_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  url text NOT NULL,
  secret text NOT NULL,
  events text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.webhook_endpoints TO service_role;
ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id uuid NOT NULL REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
  event text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  response_status integer,
  response_body text,
  next_attempt_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.webhook_deliveries TO service_role;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
CREATE INDEX webhook_deliveries_endpoint_idx ON public.webhook_deliveries (endpoint_id, created_at DESC);

CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'API key',
  prefix text NOT NULL,
  key_hash text NOT NULL,
  scopes text[] NOT NULL DEFAULT '{read}',
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.api_keys TO authenticated;
GRANT ALL ON public.api_keys TO service_role;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers see their own API keys" ON public.api_keys
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE UNIQUE INDEX api_keys_prefix_idx ON public.api_keys (prefix);

-- =================================================================== backups
CREATE TABLE public.backup_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL DEFAULT 'manual',
  status text NOT NULL DEFAULT 'completed',
  tables text[] NOT NULL DEFAULT '{}',
  row_counts jsonb NOT NULL DEFAULT '{}'::jsonb,
  total_rows integer NOT NULL DEFAULT 0,
  checksum text,
  error text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.backup_runs TO service_role;
ALTER TABLE public.backup_runs ENABLE ROW LEVEL SECURITY;

-- ============================================================ updated_at fns
CREATE OR REPLACE FUNCTION public.set_phase4_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
REVOKE ALL ON FUNCTION public.set_phase4_updated_at() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER currency_settings_touch BEFORE UPDATE ON public.currency_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_phase4_updated_at();
CREATE TRIGGER fx_rates_touch BEFORE UPDATE ON public.fx_rates
  FOR EACH ROW EXECUTE FUNCTION public.set_phase4_updated_at();
CREATE TRIGGER chat_threads_touch BEFORE UPDATE ON public.chat_threads
  FOR EACH ROW EXECUTE FUNCTION public.set_phase4_updated_at();
CREATE TRIGGER notification_preferences_touch BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_phase4_updated_at();
CREATE TRIGGER webhook_endpoints_touch BEFORE UPDATE ON public.webhook_endpoints
  FOR EACH ROW EXECUTE FUNCTION public.set_phase4_updated_at();

-- ==================================================================== seeds
INSERT INTO public.currency_settings (code, label, symbol, decimals, kind, is_enabled, sort_order) VALUES
  ('USD','US Dollar','$',2,'fiat',true,1),
  ('EUR','Euro','€',2,'fiat',true,2),
  ('GBP','British Pound','£',2,'fiat',true,3),
  ('CHF','Swiss Franc','CHF',2,'fiat',true,4),
  ('JPY','Japanese Yen','¥',0,'fiat',true,5),
  ('AED','UAE Dirham','AED',2,'fiat',true,6),
  ('CNY','Chinese Yuan','¥',2,'fiat',true,7),
  ('SGD','Singapore Dollar','S$',2,'fiat',true,8),
  ('CAD','Canadian Dollar','C$',2,'fiat',true,9),
  ('AUD','Australian Dollar','A$',2,'fiat',true,10);

INSERT INTO public.fx_rates (code, rate_to_usd, source, is_manual) VALUES
  ('USD',1,'seed',false),
  ('EUR',1.08,'seed',false),
  ('GBP',1.27,'seed',false),
  ('CHF',1.12,'seed',false),
  ('JPY',0.0065,'seed',false),
  ('AED',0.2723,'seed',false),
  ('CNY',0.1385,'seed',false),
  ('SGD',0.745,'seed',false),
  ('CAD',0.735,'seed',false),
  ('AUD',0.665,'seed',false);

INSERT INTO public.risk_rules (key, label, description, threshold, weight, is_enabled) VALUES
  ('amount_spike','Amount far above history','Flags when an amount exceeds this multiple of the customer''s recent average.',4,30,true),
  ('large_absolute','Large absolute amount','Flags any single movement above this USD-equivalent value.',100000,25,true),
  ('velocity_24h','High velocity','Flags more than this many money movements in 24 hours.',5,20,true),
  ('new_destination','First-time destination','Flags the first payout to a destination never used before.',0,15,true),
  ('unverified_identity','Identity not verified','Flags money movement attempts before verification completes.',0,35,true),
  ('duplicate_reference','Duplicate reference','Flags a deposit reference already used by this customer.',0,20,true),
  ('country_mismatch','Country / IP mismatch','Flags a request from a country different to the profile country.',0,15,true),
  ('review_threshold','Manual review threshold','Scores at or above this land in the review queue.',40,0,true),
  ('block_threshold','Automatic block threshold','Scores at or above this are blocked outright.',85,0,true);