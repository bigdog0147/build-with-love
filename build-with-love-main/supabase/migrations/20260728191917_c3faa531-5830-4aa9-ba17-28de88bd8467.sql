
CREATE TYPE public.kyc_status AS ENUM ('not_started','submitted','under_review','verified','rejected');
CREATE TYPE public.kyc_doc_type AS ENUM ('passport','national_id','drivers_license','residence_permit');

CREATE TABLE public.kyc_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_legal_name text,
  date_of_birth date,
  nationality text,
  country_of_residence text,
  residential_address text,
  postal_code text,
  doc_type public.kyc_doc_type,
  doc_front_path text,
  doc_back_path text,
  selfie_path text,
  id_status public.kyc_status NOT NULL DEFAULT 'not_started',
  email_verified boolean NOT NULL DEFAULT false,
  phone_number text,
  phone_verified boolean NOT NULL DEFAULT false,
  tax_country text,
  source_of_funds text,
  expected_usage text,
  two_factor_enabled boolean NOT NULL DEFAULT false,
  recovery_email text,
  current_step int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kyc_profiles TO authenticated;
GRANT ALL ON public.kyc_profiles TO service_role;
ALTER TABLE public.kyc_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own kyc"
  ON public.kyc_profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_kyc_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER kyc_profiles_updated_at
  BEFORE UPDATE ON public.kyc_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_kyc_updated_at();

-- Extend handle_new_user to also create an empty KYC row.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
DECLARE
  meta jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  v_first text := NULLIF(meta->>'first_name', '');
  v_last text := NULLIF(meta->>'last_name', '');
  v_full text := NULLIF(meta->>'full_name', '');
  v_display text;
  v_initials text;
BEGIN
  v_display := COALESCE(
    NULLIF(TRIM(CONCAT_WS(' ', v_first, v_last)), ''),
    v_full,
    split_part(NEW.email, '@', 1),
    'Member'
  );
  v_initials := UPPER(
    COALESCE(
      NULLIF(LEFT(COALESCE(v_first, v_display), 1), '') ||
      NULLIF(LEFT(COALESCE(v_last, ''), 1), ''),
      LEFT(v_display, 2)
    )
  );

  INSERT INTO public.profiles (
    id, display_name, initials, tier,
    first_name, last_name, phone, country, organization, username, interests, role, membership
  ) VALUES (
    NEW.id, v_display, v_initials, 'Standard',
    v_first, v_last,
    NULLIF(meta->>'phone', ''),
    NULLIF(meta->>'country', ''),
    NULLIF(meta->>'organization', ''),
    NULLIF(meta->>'username', ''),
    COALESCE(ARRAY(SELECT jsonb_array_elements_text(meta->'interests')), '{}'::text[]),
    'Research Member', 'Standard'
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.kyc_profiles (user_id, phone_number)
  VALUES (NEW.id, NULLIF(meta->>'phone',''))
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- Backfill for existing users
INSERT INTO public.kyc_profiles (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
