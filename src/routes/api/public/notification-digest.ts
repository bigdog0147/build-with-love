import { createFileRoute } from "@tanstack/react-router";

/**
 * Flushes queued quiet-hours and digest notification emails whose delivery
 * window has opened. Called by the scheduled job with the project anon key.
 */
export const Route = createFileRoute("/api/public/notification-digest")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key =
          request.headers.get("apikey") ??
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
          "";
        const expected =
          process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"] ?? "";
        if (!expected || key !== expected) return new Response("Unauthorized", { status: 401 });

        const { flushDueDigests } = await import("@/lib/notification-digest.server");
        const result = await flushDueDigests();
        return Response.json(result, { status: result.ok ? 200 : 500 });
      },
    },
  },
});
