/**
 * Server-only outbound webhook delivery.
 *
 * Every payload is signed with the endpoint's secret (HMAC-SHA256 over
 * `timestamp.body`) so receivers can verify authenticity, and each attempt is
 * recorded in `webhook_deliveries` for replay and debugging.
 */
import { createHmac } from "crypto";
import { serviceClient } from "./admin-guard.server";

export type PlatformEvent =
  | "deposit.approved"
  | "deposit.rejected"
  | "withdrawal.approved"
  | "withdrawal.rejected"
  | "kyc.verified"
  | "kyc.rejected"
  | "risk.blocked";

export function signPayload(secret: string, timestamp: string, body: string) {
  return createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
}

/** Fans a platform event out to every active endpoint subscribed to it. */
export async function emitWebhook(event: PlatformEvent, payload: Record<string, unknown>) {
  const db = await serviceClient();
  const { data: endpoints } = await db
    .from("webhook_endpoints")
    .select("id, url, secret, events, is_active")
    .eq("is_active", true);

  const targets = ((endpoints ?? []) as any[]).filter(
    (e) => !e.events?.length || e.events.includes(event),
  );
  if (targets.length === 0) return { delivered: 0 };

  const body = JSON.stringify({ event, sent_at: new Date().toISOString(), data: payload });
  const timestamp = String(Math.floor(Date.now() / 1000));
  let delivered = 0;

  for (const endpoint of targets) {
    const signature = signPayload(endpoint.secret, timestamp, body);
    let status: number | null = null;
    let responseBody = "";
    let error: string | null = null;

    try {
      const res = await fetch(endpoint.url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-gf3x-event": event,
          "x-gf3x-timestamp": timestamp,
          "x-gf3x-signature": signature,
        },
        body,
      });
      status = res.status;
      responseBody = (await res.text()).slice(0, 2000);
      if (res.ok) delivered += 1;
    } catch (err) {
      error = err instanceof Error ? err.message : "Request failed";
    }

    const ok = status != null && status >= 200 && status < 300;
    await db.from("webhook_deliveries").insert({
      endpoint_id: endpoint.id,
      event,
      payload: JSON.parse(body),
      response_status: status,
      response_body: error ?? responseBody ?? null,
      status: ok ? "delivered" : "failed",
      attempts: 1,
      delivered_at: ok ? new Date().toISOString() : null,
    });
  }

  return { delivered };
}
