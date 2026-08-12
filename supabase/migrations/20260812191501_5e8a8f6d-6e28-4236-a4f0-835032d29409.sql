CREATE OR REPLACE FUNCTION public.is_privileged_writer()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE((current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role', false)
    OR auth.uid() IS NULL
    OR public.has_role(auth.uid(), 'admin')
$$;

REVOKE ALL ON FUNCTION public.is_privileged_writer() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_privileged_writer() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.guard_kyc_protected_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_privileged_writer() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.id_status := 'not_started';
    NEW.email_verified := false;
    NEW.phone_verified := false;
    RETURN NEW;
  END IF;

  NEW.id_status := OLD.id_status;
  NEW.email_verified := OLD.email_verified;
  NEW.phone_verified := OLD.phone_verified;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS kyc_profiles_guard_protected ON public.kyc_profiles;
CREATE TRIGGER kyc_profiles_guard_protected
BEFORE INSERT OR UPDATE ON public.kyc_profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_kyc_protected_fields();

CREATE OR REPLACE FUNCTION public.guard_profile_protected_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_privileged_writer() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.tier := 'Standard';
    NEW.role := 'Research Member';
    NEW.membership := 'Standard';
    RETURN NEW;
  END IF;

  NEW.tier := OLD.tier;
  NEW.role := OLD.role;
  NEW.membership := OLD.membership;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_guard_protected ON public.profiles;
CREATE TRIGGER profiles_guard_protected
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_profile_protected_fields();

DROP POLICY IF EXISTS "Users manage own kyc" ON public.kyc_profiles;
CREATE POLICY "Users read own kyc" ON public.kyc_profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own kyc" ON public.kyc_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own kyc" ON public.kyc_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own profile" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users create own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);