CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule('gf3x-fx-hourly') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'gf3x-fx-hourly');

SELECT cron.schedule(
  'gf3x-fx-hourly',
  '7 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--bf5c2b79-d0e2-46e2-8025-708d09651abd.lovable.app/api/public/fx-refresh',
    headers := '{"Content-Type": "application/json", "apikey": "sb_publishable_Xu7AHPy_4aMEcfr99AYz6Q_rXZuzeUH"}'::jsonb,
    body := '{"source": "cron"}'::jsonb
  );
  $$
);