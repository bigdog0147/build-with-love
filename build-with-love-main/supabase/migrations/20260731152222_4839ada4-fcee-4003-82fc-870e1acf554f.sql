CREATE TABLE public.admin_accounts (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL DEFAULT 'Administrator',
  is_super_admin boolean NOT NULL DEFAULT false,
  permissions text[] NOT NULL DEFAULT '{}'::text[],
  two_factor_enabled boolean NOT NULL DEFAULT false,
  two_factor_required boolean NOT NULL DEFAULT true,
  email_verified boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  must_change_password boolean NOT NULL DEFAULT true,
  failed_login_attempts integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.admin_accounts TO authenticated;
GRANT ALL ON public.admin_accounts TO service_role;

ALTER TABLE public.admin_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read own admin account"
  ON public.admin_accounts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins read all admin accounts"
  ON public.admin_accounts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update own admin account"
  ON public.admin_accounts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_admin_accounts_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

REVOKE EXECUTE ON FUNCTION public.set_admin_accounts_updated_at() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_admin_accounts_updated_at
BEFORE UPDATE ON public.admin_accounts
FOR EACH ROW EXECUTE FUNCTION public.set_admin_accounts_updated_at();