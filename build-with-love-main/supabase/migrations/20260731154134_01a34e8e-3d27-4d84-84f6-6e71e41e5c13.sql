ALTER TABLE public.admin_accounts
  ADD COLUMN IF NOT EXISTS admin_role text NOT NULL DEFAULT 'administrator',
  ADD COLUMN IF NOT EXISTS trusted_devices text[] NOT NULL DEFAULT '{}'::text[];

ALTER TABLE public.admin_accounts DROP CONSTRAINT IF EXISTS admin_accounts_admin_role_check;
ALTER TABLE public.admin_accounts ADD CONSTRAINT admin_accounts_admin_role_check
  CHECK (admin_role IN ('super_admin','administrator','finance_manager','compliance_officer','support_agent','moderator','viewer'));

UPDATE public.admin_accounts SET admin_role = 'super_admin' WHERE is_super_admin = true;