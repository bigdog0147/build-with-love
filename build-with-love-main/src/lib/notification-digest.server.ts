/**
 * Server-only queue for notification emails that quiet hours or a digest
 * cadence pushed into the future.
 *
 * Deferred alerts land in `notification_digest_queue`; the scheduled flush
 * groups everything that is due per customer and category into a single
 * digest email so a quiet night never produces a burst of separate messages.
 */
import { serviceClient } from "./admin-guard.server";
import { sendTemplateEmailWithRetry } from "./email-retry.server";
import type { ScheduleDecision } from "./notification-schedule";

export type QueueInput = {
  userId: string;
  category: string;
  title: string;
  detail: string;
  tone?: string;
  template?: string;
  templateData?: Record<string, unknown>;
  idempotencyKey?: string;
};

/** Parks a deferred alert so the flush job can deliver it inside the window. */
export async function queueDeferredEmail(
  db: any,
  input: QueueInput,
  decision: Extract<ScheduleDecision, { mode: "deferred" }>,
) {
  const { error } = await db.from("notification_digest_queue").upsert(
    {
      user_id: input.userId,
      category: input.category,
      title: input.title,
      detail: input.detail,
      tone: input.tone ?? "info",
      template: input.template ?? null,
      template_data: input.templateData ?? {},
      idempotency_key: input.idempotencyKey ?? null,
      reason: decision.reason,
      deliver_after: decision.deliverAfter.toISOString(),
      status: "queued",
    },
    { onConflict: "idempotency_key", ignoreDuplicates: true },
  );
  if (error) {
    console.error("[digest] queue insert failed", error.message);
    return false;
  }
  return true;
}

type QueueRow = {
  id: string;
  user_id: string;
  category: string;
  title: string;
  detail: string;
  template: string | null;
  template_data: Record<string, unknown> | null;
  attempts: number;
};

/** Delivers every queued alert whose window has opened. */
export async function flushDueDigests(limit = 200) {
  const db = await serviceClient();
  const { data, error } = await db
    .from("notification_digest_queue")
    .select("id, user_id, category, title, detail, template, template_data, attempts")
    .eq("status", "queued")
    .lte("deliver_after", new Date().toISOString())
    .order("deliver_after", { ascending: true })
    .limit(limit);
  if (error) return { ok: false as const, error: error.message, sent: 0, groups: 0 };

  const rows = (data ?? []) as QueueRow[];
  const groups = new Map<string, QueueRow[]>();
  for (const row of rows) {
    const key = `${row.user_id}:${row.category}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }

  let sent = 0;
  for (const [key, batch] of groups) {
    const first = batch[0]!;
    const { data: user } = await db.auth.admin.getUserById(first.user_id);
    const email = user?.user?.email as string | undefined;
    const template = batch.find((r) => r.template)?.template;

    if (!email || !template) {
      await markBatch(db, batch, "skipped", email ? "no_template" : "no_email_on_file");
      continue;
    }

    const templateData = {
      ...(first.template_data ?? {}),
      digestCount: batch.length,
      digestItems: batch.map((r) => ({ title: r.title, detail: r.detail })),
    };

    const result = await sendTemplateEmailWithRetry(template, email, {
      templateData,
      idempotencyKey: `digest-${key}-${first.id}`,
    });

    if (result.sent) {
      sent += batch.length;
      await markBatch(db, batch, "sent");
    } else {
      await markBatch(db, batch, result.retryable ? "queued" : "failed", result.reason);
    }
  }

  return { ok: true as const, sent, groups: groups.size };
}

async function markBatch(db: any, batch: QueueRow[], status: string, error?: string) {
  const ids = batch.map((r) => r.id);
  const patch: Record<string, unknown> = {
    status,
    error: error ?? null,
    ...(status === "sent" ? { sent_at: new Date().toISOString() } : {}),
  };
  const { error: updateError } = await db.from("notification_digest_queue").update(patch).in("id", ids);
  if (updateError) console.error("[digest] status update failed", updateError.message);
}
