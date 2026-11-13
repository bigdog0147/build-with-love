/**
 * Server-only fan-out for investor document notifications.
 *
 * A document published to the library is announced to exactly the investors
 * entitled to see it, and only through the channels each investor kept enabled
 * under "Reports & statements" in their notification preferences.
 */
import { serviceClient } from "./admin-guard.server";
import { DOCUMENT_TOKEN_TTL_SECONDS, signDocumentToken } from "./document-link-token";
import {
  DOCUMENT_LABELS,
  isDocumentNotifiable,
  isEntitledToDocument,
} from "./document-entitlement";

const SITE_URL = "https://www.gf3x.space";

type DocRow = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  visibility: string;
  product_id: string | null;
  user_id: string | null;
  is_published: boolean;
};

/** Investors entitled to a document, mirroring the library's RLS rules. */
async function resolveAudience(db: any, doc: DocRow): Promise<string[]> {
  if (doc.visibility === "single_investor") {
    return doc.user_id && isEntitledToDocument(doc, { userId: doc.user_id }) ? [doc.user_id] : [];
  }

  if (doc.visibility === "product_subscribers") {
    if (!doc.product_id) return [];
    const { data } = await db
      .from("investment_holdings")
      .select("user_id")
      .eq("product_id", doc.product_id)
      .eq("status", "active");
    return unique((data ?? []).map((r: { user_id: string }) => r.user_id));
  }

  // all_investors: everyone who actually holds a position on the platform.
  const { data } = await db.from("investment_holdings").select("user_id").eq("status", "active");
  return unique((data ?? []).map((r: { user_id: string }) => r.user_id));
}

function unique(ids: string[]) {
  return Array.from(new Set(ids.filter(Boolean)));
}

/**
 * Announces a newly published document. Safe to call more than once for the
 * same document: the idempotency key keeps repeat emails from going out.
 */
export async function notifyDocumentPublished(documentId: string): Promise<{
  notified: number;
  emails: number;
  failed?: number;
  retrying?: number;
  skipped?: string;
}> {
  const db = await serviceClient();
  const { data: doc } = await db
    .from("documents")
    .select("id, title, description, category, visibility, product_id, user_id, is_published")
    .eq("id", documentId)
    .maybeSingle();

  if (!doc) return { notified: 0, emails: 0, skipped: "document_not_found" };
  const row = doc as DocRow;
  if (!row.is_published) return { notified: 0, emails: 0, skipped: "not_published" };
  if (!isDocumentNotifiable(row.category)) return { notified: 0, emails: 0, skipped: "category_not_notifiable" };

  const audience = await resolveAudience(db, row);
  if (audience.length === 0) return { notified: 0, emails: 0, skipped: "no_audience" };

  let productName: string | undefined;
  if (row.product_id) {
    const { data: product } = await db
      .from("investment_products")
      .select("name")
      .eq("id", row.product_id)
      .maybeSingle();
    productName = product?.name ?? undefined;
  }

  const payload = buildPayload(row, productName);

  // Queue one delivery row per investor first, so the admin log shows the
  // intended audience even if the process dies mid fan-out.
  const queuedAt = new Date().toISOString();
  const rows = audience.map((userId) => ({
    document_id: row.id,
    user_id: userId,
    status: "queued",
    idempotency_key: `document-published-${row.id}-${userId}`,
    queued_at: queuedAt,
  }));
  const { data: inserted } = await db
    .from("document_notification_deliveries")
    .insert(rows)
    .select("id, user_id");
  const deliveryId = new Map<string, string>(
    ((inserted ?? []) as { id: string; user_id: string }[]).map((r) => [r.user_id, r.id]),
  );

  let inapp = 0;
  let email = 0;
  let failed = 0;
  let retrying = 0;

  for (const userId of audience) {
    const outcome = await attemptDelivery(db, {
      deliveryId: deliveryId.get(userId) ?? null,
      documentId: row.id,
      userId,
      payload,
      previousAttempts: 0,
    });
    if (outcome.inapp) inapp += 1;
    if (outcome.email) email += 1;
    if (outcome.status === "failed") failed += 1;
    if (outcome.status === "retrying") retrying += 1;
  }

  return { notified: inapp, emails: email, failed, retrying };
}

/** Notification content for one document — identical on the first try and on retries. */
function buildPayload(row: DocRow, productName?: string) {
  const label = DOCUMENT_LABELS[row.category] ?? "Document";
  return {
    category: "reports" as const,
    title: `${label} available: ${row.title}`,
    detail:
      row.description?.trim() ||
      `${row.title} has been published to your document library and is ready to download.`,
    tone: "info" as const,
    template: "document-published",
    templateData: {
      title: row.title,
      description: row.description ?? "",
      category: row.category,
      productName,
      libraryUrl: `${SITE_URL}/library`,
      isStatement: row.category === "statement",
      linkDays: Math.round(DOCUMENT_TOKEN_TTL_SECONDS / 86_400),
    },
  };
}

/** Attempts remaining after the immediate send, before a delivery is given up on. */
export const MAX_DELIVERY_ATTEMPTS = 5;

/** Minutes to wait before attempt N+1 — widening so a provider outage has time to clear. */
const RETRY_SCHEDULE_MINUTES = [5, 15, 60, 180];

export function nextAttemptAt(attempts: number, from: Date = new Date()): string | null {
  if (attempts >= MAX_DELIVERY_ATTEMPTS) return null;
  const minutes = RETRY_SCHEDULE_MINUTES[attempts - 1] ?? RETRY_SCHEDULE_MINUTES.at(-1)!;
  return new Date(from.getTime() + minutes * 60_000).toISOString();
}

/**
 * Per-recipient signed download link. The token is minted fresh on every
 * attempt, so a retry days later still hands the investor a link with a full
 * window rather than one that is already stale. Without the secret configured
 * the email falls back to the library, which requires signing in.
 */
async function buildDocumentLink(documentId: string, userId: string): Promise<string> {
  const secret = process.env["DOCUMENT_LINK_SECRET"] ?? "";
  if (!secret) return `${SITE_URL}/library`;
  try {
    const token = await signDocumentToken({ documentId, userId, secret });
    return `${SITE_URL}/api/public/document-access?t=${encodeURIComponent(token)}`;
  } catch (error) {
    console.error("[documents] could not sign document link", error);
    return `${SITE_URL}/library`;
  }
}

type AttemptOutcome = {
  inapp: boolean;
  email: boolean;
  status: "sent" | "skipped" | "retrying" | "failed";
};

/**
 * One delivery attempt for one investor. The email layer already retries
 * transient provider errors inline; anything still unsent but transient is
 * parked as `retrying` with a due time so a later run picks it up. The stable
 * idempotency key means a retry can never duplicate an accepted email.
 */
async function attemptDelivery(
  db: any,
  args: {
    deliveryId: string | null;
    documentId: string;
    userId: string;
    payload: ReturnType<typeof buildPayload>;
    previousAttempts: number;
  },
): Promise<AttemptOutcome> {
  const { dispatchNotification } = await import("./notification-dispatcher.server");
  const documentUrl = await buildDocumentLink(args.documentId, args.userId);
  const attempts = args.previousAttempts + 1;
  const now = new Date();
  const stamp = now.toISOString();

  const save = async (patch: Record<string, unknown>) => {
    if (!args.deliveryId) return;
    await db
      .from("document_notification_deliveries")
      .update({ attempts, last_attempt_at: stamp, ...patch })
      .eq("id", args.deliveryId);
  };

  try {
    const res = await dispatchNotification({
      ...args.payload,
      templateData: { ...args.payload.templateData, documentUrl },
      userId: args.userId,
      idempotencyKey: `document-published-${args.documentId}-${args.userId}`,
    });

    // A transient email failure keeps the delivery open for another attempt,
    // even when the in-app notice already landed.
    const transient = !res.email && res.emailRetryable === true;
    if (transient) {
      const due = nextAttemptAt(attempts, now);
      const status = due ? "retrying" : "failed";
      await save({
        status,
        inapp_sent: Boolean(res.inapp),
        email_sent: false,
        retryable: Boolean(due),
        reason: res.emailSkippedReason ?? null,
        last_error: res.emailSkippedReason ?? "The email provider did not accept the send.",
        error: due ? null : (res.emailSkippedReason ?? "Retries exhausted."),
        next_attempt_at: due,
        sent_at: null,
        failed_at: due ? null : stamp,
      });
      return { inapp: Boolean(res.inapp), email: false, status };
    }

    const status = res.inapp || res.email ? "sent" : "skipped";
    await save({
      status,
      inapp_sent: Boolean(res.inapp),
      email_sent: Boolean(res.email),
      retryable: false,
      reason: res.emailSkippedReason ?? null,
      last_error: null,
      error: null,
      next_attempt_at: null,
      sent_at: stamp,
      failed_at: null,
    });
    return { inapp: Boolean(res.inapp), email: Boolean(res.email), status };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[documents] notification attempt ${attempts} failed for ${args.userId}`, message);
    const due = nextAttemptAt(attempts, now);
    const status = due ? "retrying" : "failed";
    await save({
      status,
      retryable: Boolean(due),
      last_error: message.slice(0, 500),
      error: due ? null : message.slice(0, 500),
      next_attempt_at: due,
      failed_at: due ? null : stamp,
    });
    return { inapp: false, email: false, status };
  }
}

type PendingRow = {
  id: string;
  document_id: string;
  user_id: string;
  attempts: number;
};

/**
 * Re-attempts deliveries that are parked for retry (or, when `force` is set,
 * ones already given up on). Used by the scheduled retry endpoint and by the
 * admin "Retry" action in the delivery log.
 */
export async function retryDocumentDeliveries(options: {
  documentId?: string | null;
  deliveryIds?: string[] | null;
  /** Include exhausted/failed rows — an explicit admin retry. */
  force?: boolean;
  limit?: number;
} = {}): Promise<{ attempted: number; sent: number; retrying: number; failed: number }> {
  const db = await serviceClient();
  let query = db
    .from("document_notification_deliveries")
    .select("id, document_id, user_id, attempts")
    .order("next_attempt_at", { ascending: true, nullsFirst: true })
    .limit(Math.min(options.limit ?? 100, 500));

  if (options.deliveryIds?.length) {
    query = query.in("id", options.deliveryIds);
  } else if (options.force) {
    query = query.in("status", ["retrying", "failed", "queued"]);
  } else {
    query = query.eq("status", "retrying").lte("next_attempt_at", new Date().toISOString());
  }
  if (options.documentId) query = query.eq("document_id", options.documentId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const pending = (data ?? []) as PendingRow[];
  if (pending.length === 0) return { attempted: 0, sent: 0, retrying: 0, failed: 0 };

  // Payloads are built once per document rather than per delivery row.
  const payloads = new Map<string, ReturnType<typeof buildPayload> | null>();
  const loadPayload = async (documentId: string) => {
    if (payloads.has(documentId)) return payloads.get(documentId)!;
    const { data: doc } = await db
      .from("documents")
      .select("id, title, description, category, visibility, product_id, user_id, is_published")
      .eq("id", documentId)
      .maybeSingle();
    let payload: ReturnType<typeof buildPayload> | null = null;
    if (doc && (doc as DocRow).is_published) {
      let productName: string | undefined;
      if ((doc as DocRow).product_id) {
        const { data: product } = await db
          .from("investment_products")
          .select("name")
          .eq("id", (doc as DocRow).product_id)
          .maybeSingle();
        productName = product?.name ?? undefined;
      }
      payload = buildPayload(doc as DocRow, productName);
    }
    payloads.set(documentId, payload);
    return payload;
  };

  let attempted = 0;
  let sent = 0;
  let retrying = 0;
  let failed = 0;

  for (const row of pending) {
    const payload = await loadPayload(row.document_id);
    if (!payload) {
      await db
        .from("document_notification_deliveries")
        .update({ status: "skipped", reason: "document_unpublished", next_attempt_at: null })
        .eq("id", row.id);
      continue;
    }
    attempted += 1;
    const outcome = await attemptDelivery(db, {
      deliveryId: row.id,
      documentId: row.document_id,
      userId: row.user_id,
      payload,
      previousAttempts: Number(row.attempts) || 0,
    });
    if (outcome.status === "sent") sent += 1;
    if (outcome.status === "retrying") retrying += 1;
    if (outcome.status === "failed") failed += 1;
  }

  return { attempted, sent, retrying, failed };
}


