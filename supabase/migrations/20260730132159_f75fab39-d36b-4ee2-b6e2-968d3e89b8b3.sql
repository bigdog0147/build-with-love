DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  network text NOT NULL UNIQUE,
  label text NOT NULL,
  url text NOT NULL DEFAULT '',
  handle text,
  icon_key text NOT NULL DEFAULT 'link',
  is_visible boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.social_links TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_links TO authenticated;
GRANT ALL ON public.social_links TO service_role;
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Visible social links are public" ON public.social_links;
CREATE POLICY "Visible social links are public"
  ON public.social_links FOR SELECT
  USING (is_visible = true AND url <> '');

DROP POLICY IF EXISTS "Admins read all social links" ON public.social_links;
CREATE POLICY "Admins read all social links"
  ON public.social_links FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins insert social links" ON public.social_links;
CREATE POLICY "Admins insert social links"
  ON public.social_links FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins update social links" ON public.social_links;
CREATE POLICY "Admins update social links"
  ON public.social_links FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins delete social links" ON public.social_links;
CREATE POLICY "Admins delete social links"
  ON public.social_links FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.set_social_links_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS social_links_updated_at ON public.social_links;
CREATE TRIGGER social_links_updated_at
  BEFORE UPDATE ON public.social_links
  FOR EACH ROW EXECUTE FUNCTION public.set_social_links_updated_at();

INSERT INTO public.social_links (network, label, icon_key, sort_order) VALUES
  ('linkedin', 'LinkedIn', 'linkedin', 10),
  ('x', 'X (Twitter)', 'twitter', 20),
  ('youtube', 'YouTube', 'youtube', 30),
  ('instagram', 'Instagram', 'instagram', 40),
  ('facebook', 'Facebook', 'facebook', 50),
  ('github', 'GitHub', 'github', 60),
  ('medium', 'Medium', 'link', 70),
  ('crunchbase', 'Crunchbase', 'link', 80)
ON CONFLICT (network) DO NOTHING;