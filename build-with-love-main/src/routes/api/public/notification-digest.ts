import { createFileRoute } from "@tanstack/react-router";
import { isAuthorizedCronRequest } from "@/lib/cron-auth.server";

/**
 * Flushes queued quiet-hours and digest notification emails whose delivery
 * window has opened. Called by the scheduled job with the CRON_SECRET shared secret.
 */
export const Route = createFileRoute("/api/public/notification-digest")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isAuthorizedCronRequest(request)) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { flushDueDigests } = await import("@/lib/notification-digest.server");
        const result = await flushDueDigests();
        return Response.json(result, { status: result.ok ? 200 : 500 });
      },
    },
  },
});
