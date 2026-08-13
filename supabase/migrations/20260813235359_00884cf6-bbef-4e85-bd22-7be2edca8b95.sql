REVOKE EXECUTE ON FUNCTION public.guard_kyc_protected_fields() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_profile_protected_fields() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_privileged_writer() FROM PUBLIC, anon, authenticated;