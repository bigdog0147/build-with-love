import { createFileRoute } from "@tanstack/react-router";

/**
 * Hourly exchange-rate refresh, called by the scheduled job.
 * Callers must present the project anon key; the handler never returns data.
 */
export const Route = createFileRoute("/api/public/fx-refresh")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key =
          request.headers.get("apikey") ??
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
          "";
        const expected =
          process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"] ?? "";
        if (!expected || key !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { refreshRatesFromFeed } = await import("@/lib/fx.server");
        const result = await refreshRatesFromFeed("frankfurter");
        return Response.json(result, { status: result.ok ? 200 : 502 });
      },
    },
  },
});
