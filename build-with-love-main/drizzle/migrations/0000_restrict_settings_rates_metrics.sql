DROP POLICY IF EXISTS "Anyone reads system settings" ON public.system_settings;
CREATE POLICY "Signed-in users read system settings" ON public.system_settings FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
REVOKE SELECT ON public.system_settings FROM anon;
DROP POLICY IF EXISTS "Rates are readable" ON public.fx_rates;
CREATE POLICY "Signed-in users read rates" ON public.fx_rates FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
REVOKE SELECT ON public.fx_rates FROM anon;
DROP POLICY IF EXISTS "Metrics are public read" ON public.metrics;
CREATE POLICY "Signed-in users read metrics" ON public.metrics FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
REVOKE SELECT ON public.metrics FROM anon;