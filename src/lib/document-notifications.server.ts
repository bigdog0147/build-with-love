/**
 * Server-only fan-out for investor document notifications.
 *
 * A document published to the library is announced to exactly the investors
 * entitled to see it, and only through the channels each investor kept enabled
 * under "Reports & statements" in their notification preferences.
 */
import { serviceClient } from "./admin-guard.server";
import { dispatchBroadcast } from "./notification-dispatcher.server";

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
  const result = await dispatchBroadcast(audience, {
    category: "reports",
    title: `${label} available: ${row.title}`,
    detail:
      row.description?.trim() ||
      `${row.title} has been published to your document library and is ready to download.`,
    tone: "info",
    template: "document-published",
    templateData: {
      title: row.title,
      description: row.description ?? "",
      category: row.category,
      productName,
      libraryUrl: `${SITE_URL}/library`,
      isStatement: row.category === "statement",
    },
    idempotencyKey: `document-published-${row.id}`,
  });

  return { notified: result.inapp, emails: result.email };
}
