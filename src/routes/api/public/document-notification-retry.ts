import { createFileRoute } from "@tanstack/react-router";
import { isAuthorizedCronRequest } from "@/lib/cron-auth.server";

/**
 * Retry sweep for document-published notifications, called by the scheduled job.
 * Picks up deliveries parked as "retrying" whose next attempt is due, so a
 * transient provider outage never turns into a missed investor notification.
 * Callers must present the CRON_SECRET shared secret.
 */
export const Route = createFileRoute("/api/public/document-notification-retry")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isAuthorizedCronRequest(request)) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { retryDocumentDeliveries } = await import("@/lib/document-notifications.server");
        const result = await retryDocumentDeliveries({ limit: 200 });
        return Response.json(result);
      },
    },
  },
});
