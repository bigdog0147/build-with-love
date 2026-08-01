CREATE TABLE public.news_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'press_release',
  cover_url text,
  author text NOT NULL DEFAULT 'Gigafactory 3X Newsroom',
  status text NOT NULL DEFAULT 'draft',
  locale text NOT NULL DEFAULT 'en',
  published_at timestamp with time zone,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.news_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news_posts TO authenticated;
GRANT ALL ON public.news_posts TO service_role;

ALTER TABLE public.news_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published news is public"
  ON public.news_posts FOR SELECT
  USING (status = 'published' AND published_at IS NOT NULL AND published_at <= now());

CREATE POLICY "Admins read all news"
  ON public.news_posts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert news"
  ON public.news_posts FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update news"
  ON public.news_posts FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete news"
  ON public.news_posts FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.set_news_posts_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

REVOKE EXECUTE ON FUNCTION public.set_news_posts_updated_at() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER news_posts_updated_at
  BEFORE UPDATE ON public.news_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_news_posts_updated_at();

CREATE INDEX news_posts_published_idx ON public.news_posts (status, published_at DESC);

INSERT INTO public.news_posts (slug, title, excerpt, body, category, status, published_at, author) VALUES
('gigafactory-3x-announces-giga-campus-expansion',
 'Gigafactory 3X announces next-generation giga-campus expansion',
 'A new 240-hectare intelligent manufacturing campus will add autonomous production, battery assembly and on-site clean generation.',
 E'Gigafactory 3X today announced the next phase of its global giga-campus programme, adding 240 hectares of intelligent manufacturing capacity.\n\nThe campus integrates lights-out production cells, gigafactory-scale battery pack assembly, and on-site renewable generation with grid-scale storage. Every asset is mirrored by a real-time digital twin, allowing engineering teams to simulate and optimise output continuously.\n\n"Vertical integration is the only way to build industrial systems at this scale," said the company''s engineering leadership. "We design the silicon, the robotics and the energy system as one platform."',
 'press_release', 'published', now() - interval '3 days', 'Gigafactory 3X Newsroom'),
('industrial-ai-platform-reaches-production-scale',
 'Industrial AI platform reaches production scale across partner plants',
 'Foundation models tuned for physical systems are now running closed-loop quality control on partner production lines.',
 E'Our industrial AI platform has moved from pilot deployments to production scale, running closed-loop quality control across partner manufacturing lines.\n\nComputer-vision inspection now operates inline at full takt time, while reinforcement-learning schedulers optimise material flow across the plant. Early deployments report double-digit reductions in scrap and unplanned downtime.\n\nThe platform is delivered with edge inference silicon and a deterministic control fabric, so decisions execute within the plant''s real-time budget.',
 'announcement', 'published', now() - interval '11 days', 'Gigafactory 3X Newsroom'),
('sustainability-report-decarbonisation-roadmap',
 'Sustainability report sets out full decarbonisation roadmap',
 'Gigafactory 3X publishes its clean-energy strategy, circular manufacturing targets and ESG governance framework.',
 E'Gigafactory 3X has published its sustainability roadmap, covering clean-energy supply, circular manufacturing and water stewardship across every operating region.\n\nThe roadmap commits to renewable-matched electricity for all owned production, closed-loop material recovery for battery and semiconductor lines, and independently audited reporting on progress.\n\nGovernance sits with a board-level committee, with engineering accountability embedded in each site''s operating plan.',
 'announcement', 'published', now() - interval '26 days', 'Gigafactory 3X Newsroom');