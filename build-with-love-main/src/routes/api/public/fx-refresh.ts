import { createFileRoute } from "@tanstack/react-router";
import { isAuthorizedCronRequest } from "@/lib/cron-auth.server";

/**
 * Hourly exchange-rate refresh, called by the scheduled job.
 * Callers must present the CRON_SECRET shared secret; the handler never returns data.
 */
export const Route = createFileRoute("/api/public/fx-refresh")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isAuthorizedCronRequest(request)) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { refreshRatesFromFeed } = await import("@/lib/fx.server");
        const result = await refreshRatesFromFeed("frankfurter");
        return Response.json(result, { status: result.ok ? 200 : 502 });
      },
    },
  },
});
