import { createFileRoute } from "@tanstack/react-router";

/**
 * Retry sweep for document-published notifications, called by the scheduled job.
 * Picks up deliveries parked as "retrying" whose next attempt is due, so a
 * transient provider outage never turns into a missed investor notification.
 * Callers must present the project anon key.
 */
export const Route = createFileRoute("/api/public/document-notification-retry")({
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

        const { retryDocumentDeliveries } = await import("@/lib/document-notifications.server");
        const result = await retryDocumentDeliveries({ limit: 200 });
        return Response.json(result);
      },
    },
  },
});
