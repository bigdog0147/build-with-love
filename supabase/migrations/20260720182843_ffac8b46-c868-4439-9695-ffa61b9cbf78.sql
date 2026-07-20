
CREATE TABLE public.metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label text NOT NULL,
  value numeric NOT NULL DEFAULT 0,
  suffix text NOT NULL DEFAULT '',
  decimals integer NOT NULL DEFAULT 0,
  sub text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.metrics TO anon;
GRANT SELECT ON public.metrics TO authenticated;
GRANT ALL ON public.metrics TO service_role;

ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Metrics are public read" ON public.metrics
  FOR SELECT USING (true);

INSERT INTO public.metrics (label, value, suffix, decimals, sub, sort_order) VALUES
  ('Global Facilities', 24, '+', 0, NULL, 0),
  ('AI Systems Deployed', 1860, '', 0, NULL, 1),
  ('Manufacturing Capacity', 3.6, 'M', 1, 'units / yr', 2),
  ('Research Projects', 412, '', 0, NULL, 3),
  ('Countries Served', 47, '', 0, NULL, 4),
  ('Enterprise Partners', 320, '+', 0, NULL, 5);
