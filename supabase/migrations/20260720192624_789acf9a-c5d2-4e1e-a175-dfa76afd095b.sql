
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS organization text,
  ADD COLUMN IF NOT EXISTS username text UNIQUE,
  ADD COLUMN IF NOT EXISTS interests text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'Research Member',
  ADD COLUMN IF NOT EXISTS membership text NOT NULL DEFAULT 'Standard';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    NEW.id,
    v_display,
    v_initials,
    'Standard',
    v_first,
    v_last,
    NULLIF(meta->>'phone', ''),
    NULLIF(meta->>'country', ''),
    NULLIF(meta->>'organization', ''),
    NULLIF(meta->>'username', ''),
    COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(meta->'interests')),
      '{}'::text[]
    ),
    'Research Member',
    'Standard'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
