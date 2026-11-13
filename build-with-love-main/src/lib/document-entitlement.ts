/**
 * Pure entitlement and channel rules for investor documents.
 *
 * Kept free of database and network access so both the publish-time fan-out and
 * the signed-link redemption endpoint decide "may this investor see this
 * document, and through which channels" from the same tested logic.
 */

/** Every document category the library supports. */
export const DOCUMENT_CATEGORIES = [
  "prospectus",
  "factsheet",
  "term_sheet",
  "report",
  "statement",
  "agreement",
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const DOCUMENT_LABELS: Record<string, string> = {
  prospectus: "Prospectus",
  factsheet: "Factsheet",
  term_sheet: "Term sheet",
  report: "Financial report",
  statement: "Statement",
  agreement: "Agreement",
};

/**
 * Categories announced under "Reports & statements". Agreements are excluded:
 * they are executed documents an investor is walked through directly, not
 * periodic reporting, so publishing one never triggers a broadcast.
 */
export const NOTIFIABLE_CATEGORIES = new Set<string>([
  "prospectus",
  "factsheet",
  "term_sheet",
  "report",
  "statement",
]);

export function isDocumentNotifiable(category: string): boolean {
  return NOTIFIABLE_CATEGORIES.has(category);
}

export type DocumentVisibility = "all_investors" | "single_investor" | "product_subscribers";

/** The document facts entitlement depends on. */
export type EntitlementDocument = {
  visibility: string;
  /** Addressee for `single_investor` documents. */
  user_id?: string | null;
  /** Product for `product_subscribers` documents. */
  product_id?: string | null;
  is_published?: boolean;
};

/** What we know about the investor at decision time. */
export type InvestorFacts = {
  userId: string;
  /** Products the investor holds an ACTIVE position in. */
  activeProductIds?: string[];
};

export type EntitlementReason =
  | "entitled"
  | "not_published"
  | "not_addressee"
  | "missing_product"
  | "not_subscribed"
  | "no_active_holding"
  | "unknown_visibility";

/**
 * Mirrors the library's RLS rules: platform-wide documents reach anyone with a
 * live position, personal documents only their addressee, and product collateral
 * only investors actually holding that product.
 */
export function checkDocumentEntitlement(
  doc: EntitlementDocument,
  investor: InvestorFacts,
): { entitled: boolean; reason: EntitlementReason } {
  if (doc.is_published === false) return { entitled: false, reason: "not_published" };
  const held = investor.activeProductIds ?? [];

  switch (doc.visibility) {
    case "single_investor":
      return doc.user_id && doc.user_id === investor.userId
        ? { entitled: true, reason: "entitled" }
        : { entitled: false, reason: "not_addressee" };

    case "product_subscribers":
      if (!doc.product_id) return { entitled: false, reason: "missing_product" };
      return held.includes(doc.product_id)
        ? { entitled: true, reason: "entitled" }
        : { entitled: false, reason: "not_subscribed" };

    case "all_investors":
      return held.length > 0
        ? { entitled: true, reason: "entitled" }
        : { entitled: false, reason: "no_active_holding" };

    default:
      return { entitled: false, reason: "unknown_visibility" };
  }
}

export function isEntitledToDocument(doc: EntitlementDocument, investor: InvestorFacts): boolean {
  return checkDocumentEntitlement(doc, investor).entitled;
}

/**
 * Channel preferences. A missing row, or a missing key, means "on" — an investor
 * who never opened settings still receives reporting notices.
 */
export type ReportPreferences = {
  reports_email?: boolean | null;
  reports_inapp?: boolean | null;
} | null | undefined;

export function allowsReportChannel(
  prefs: ReportPreferences,
  channel: "email" | "inapp",
): boolean {
  const value = prefs?.[channel === "email" ? "reports_email" : "reports_inapp"];
  return value === undefined || value === null ? true : Boolean(value);
}

export type DeliveryPlan = {
  /** Whether the investor belongs to this document's audience at all. */
  entitled: boolean;
  reason: EntitlementReason;
  /** Whether the publish notice should be announced for this category. */
  notifiable: boolean;
  inapp: boolean;
  email: boolean;
};

/**
 * The full include/exclude decision for one investor and one document: audience
 * membership first, then the category gate, then each channel's preference.
 */
export function planDocumentDelivery(args: {
  doc: EntitlementDocument & { category: string };
  investor: InvestorFacts;
  preferences?: ReportPreferences;
}): DeliveryPlan {
  const { entitled, reason } = checkDocumentEntitlement(args.doc, args.investor);
  const notifiable = isDocumentNotifiable(args.doc.category);
  const announce = entitled && notifiable;
  return {
    entitled,
    reason,
    notifiable,
    inapp: announce && allowsReportChannel(args.preferences, "inapp"),
    email: announce && allowsReportChannel(args.preferences, "email"),
  };
}
