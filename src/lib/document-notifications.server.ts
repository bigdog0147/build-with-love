/**
 * Server-only fan-out for investor document notifications.
 *
 * A document published to the library is announced to exactly the investors
 * entitled to see it, and only through the channels each investor kept enabled
 * under "Reports & statements" in their notification preferences.
 */
import { serviceClient } from "./admin-guard.server";

const SITE_URL = "https://www.gf3x.space";

/** Categories investors care about as reports/statements; others stay silent. */
const NOTIFIABLE = new Set(["report", "statement", "factsheet", "prospectus", "term_sheet"]);

const LABELS: Record<string, string> = {
  prospectus: "Prospectus",
  factsheet: "Factsheet",
  term_sheet: "Term sheet",
  report: "Financial report",
  statement: "Statement",
  agreement: "Agreement",
};

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
  if (doc.visibility === "single_investor") return doc.user_id ? [doc.user_id] : [];

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
  if (!NOTIFIABLE.has(row.category)) return { notified: 0, emails: 0, skipped: "category_not_notifiable" };

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

  const label = LABELS[row.category] ?? "Document";
  const payload = {
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
    },
  };

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

  const { dispatchNotification } = await import("./notification-dispatcher.server");
  let inapp = 0;
  let email = 0;
  let failed = 0;

  for (const userId of audience) {
    const id = deliveryId.get(userId);
    try {
      const res = await dispatchNotification({
        ...payload,
        userId,
        idempotencyKey: `document-published-${row.id}-${userId}`,
      });
      if (res.inapp) inapp += 1;
      if (res.email) email += 1;
      if (id)
        await db
          .from("document_notification_deliveries")
          .update({
            status: res.inapp || res.email ? "sent" : "skipped",
            inapp_sent: Boolean(res.inapp),
            email_sent: Boolean(res.email),
            reason: res.emailSkippedReason ?? null,
            attempts: 1,
            sent_at: new Date().toISOString(),
            failed_at: null,
            error: null,
          })
          .eq("id", id);
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[documents] notification failed for ${userId}`, message);
      if (id)
        await db
          .from("document_notification_deliveries")
          .update({
            status: "failed",
            error: message.slice(0, 500),
            attempts: 1,
            failed_at: new Date().toISOString(),
          })
          .eq("id", id);
    }
  }

  return { notified: inapp, emails: email, failed };
}

