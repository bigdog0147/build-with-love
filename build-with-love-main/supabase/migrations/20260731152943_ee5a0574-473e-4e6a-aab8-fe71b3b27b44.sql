ALTER TABLE public.auth_audit_log DROP CONSTRAINT IF EXISTS auth_audit_event_type_check;
ALTER TABLE public.auth_audit_log ADD CONSTRAINT auth_audit_event_type_check
  CHECK (event_type = ANY (ARRAY[
    'reset_request','password_updated','recovery_rejected',
    'admin_bootstrap','admin_login_success','admin_login_locked',
    'admin_password_changed','admin_2fa_enabled','admin_2fa_disabled',
    'login_success','login_failed'
  ]));

ALTER TABLE public.reset_rate_limits DROP CONSTRAINT IF EXISTS reset_rate_limits_key_type_check;
ALTER TABLE public.reset_rate_limits ADD CONSTRAINT reset_rate_limits_key_type_check
  CHECK (key_type = ANY (ARRAY['email_hash','ip','login']));