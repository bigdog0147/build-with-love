import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { logAdminAction, requireAdminPermission, serviceClient } from "@/lib/admin-guard.server";
import { HOLDING_SELECT, PRODUCT_SELECT } from "@/lib/investments.server";

export const DOC_BUCKET = "investor-documents";

const DOC_SELECT =
  "id, title, description, category, visibility, product_id, user_id, file_name, file_path, file_size, content_type, is_published, published_at, created_at";

/**
 * Documents the signed-in investor is entitled to: everything published to all
 * investors, anything addressed to them personally, and product collateral for
 * products they actually hold. RLS enforces the same rule server-side.
 */
export const listInvestorDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const [documents, products] = await Promise.all([
      supabase
        .from("documents")
        .select(DOC_SELECT)
        .eq("is_published", true)
        .order("published_at", { ascending: false }),
      supabase.from("investment_products").select("id, name, slug"),
    ]);
    if (documents.error) throw new Error(documents.error.message);

    const productNames: Record<string, string> = {};
    for (const p of products.data ?? []) productNames[p.id] = p.name;

    return { documents: documents.data ?? [], productNames };
  });

/** Short-lived signed URL for one entitled document. */
export const getDocumentDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => ({ id: String(input.id ?? "") }))
  .handler(async ({ data, context }) => {
    // The read goes through the user's client, so RLS decides entitlement.
    const { data: doc, error } = await context.supabase
      .from("documents")
      .select("id, file_path, file_name")
      .eq("id", data.id)
      .eq("is_published", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!doc) throw new Error("This document is not available to your account.");

    const db = await serviceClient();
    const { data: signed, error: signError } = await db.storage
      .from(DOC_BUCKET)
      .createSignedUrl(doc.file_path, 120, { download: doc.file_name });
    if (signError || !signed) throw new Error(signError?.message ?? "Could not prepare the download.");

    return { url: signed.signedUrl, fileName: doc.file_name };
  });

/**
 * Portfolio statement data for a period — positions, valuations, distributions
 * and subscription activity. Rendered client-side into a printable statement
 * and a CSV so no server-side document generation is required.
 */
export const getInvestorStatement = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { from: string; to: string }) => ({
    from: String(input.from ?? ""),
    to: String(input.to ?? ""),
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const from = /^\d{4}-\d{2}-\d{2}$/.test(data.from) ? data.from : "1970-01-01";
    const to = /^\d{4}-\d{2}-\d{2}$/.test(data.to) ? data.to : new Date().toISOString().slice(0, 10);
    const toEnd = `${to}T23:59:59.999Z`;

    const [profile, holdings, products, valuations, distributions] = await Promise.all([
      supabase.from("profiles").select("display_name, membership, tier").eq("id", userId).maybeSingle(),
      supabase.from("investment_holdings").select(HOLDING_SELECT).eq("user_id", userId),
      supabase.from("investment_products").select(PRODUCT_SELECT),
      supabase
        .from("holding_valuations")
        .select("id, holding_id, product_id, as_of, unit_price, value, note")
        .eq("user_id", userId)
        .gte("as_of", from)
        .lte("as_of", toEnd)
        .order("as_of"),
      supabase
        .from("distributions")
        .select("id, holding_id, product_id, kind, amount, currency, paid_at, note")
        .eq("user_id", userId)
        .gte("paid_at", from)
        .lte("paid_at", toEnd)
        .order("paid_at"),
    ]);
    if (holdings.error) throw new Error(holdings.error.message);

    return {
      investor: {
        name: profile.data?.display_name ?? "Investor",
        membership: profile.data?.membership ?? "Standard",
      },
      range: { from, to },
      holdings: holdings.data ?? [],
      products: products.data ?? [],
      valuations: valuations.data ?? [],
      distributions: distributions.data ?? [],
      generatedAt: new Date().toISOString(),
    };
  });

/* ─────────────────────────── administration ─────────────────────────── */

export const adminListDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdminPermission(context as never, "investments");
    const db = await serviceClient();
    const [documents, products, profiles] = await Promise.all([
      db.from("documents").select(DOC_SELECT).order("created_at", { ascending: false }),
      db.from("investment_products").select("id, name, slug").order("name"),
      db.from("profiles").select("id, display_name").order("display_name"),
    ]);
    return {
      documents: documents.data ?? [],
      products: products.data ?? [],
      investors: profiles.data ?? [],
    };
  });

export type DocumentDeliveryRow = {
  id: string;
  document_id: string;
  user_id: string;
  status: string;
  inapp_sent: boolean;
  email_sent: boolean;
  reason: string | null;
  error: string | null;
  attempts: number;
  retryable: boolean;
  last_error: string | null;
  last_attempt_at: string | null;
  next_attempt_at: string | null;
  queued_at: string;
  sent_at: string | null;
  failed_at: string | null;
};

/**
 * Delivery log for document-published notifications: one row per investor with
 * the moment it was queued, sent (and on which channels) or failed.
 */
export const adminListDocumentDeliveries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input?: { documentId?: string | null; status?: string | null }) => ({
    documentId: input?.documentId ? String(input.documentId) : null,
    status: input?.status ? String(input.status) : null,
  }))
  .handler(async ({ data, context }) => {
    await requireAdminPermission(context as never, "investments");
    const db = await serviceClient();
    let query = db
      .from("document_notification_deliveries")
      .select(
        "id, document_id, user_id, status, inapp_sent, email_sent, reason, error, attempts, retryable, last_error, last_attempt_at, next_attempt_at, queued_at, sent_at, failed_at",
      )
      .order("queued_at", { ascending: false })
      .limit(500);
    if (data.documentId) query = query.eq("document_id", data.documentId);
    if (data.status) query = query.eq("status", data.status);

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    const deliveries = (rows ?? []) as DocumentDeliveryRow[];

    const docIds = Array.from(new Set(deliveries.map((r) => r.document_id)));
    const userIds = Array.from(new Set(deliveries.map((r) => r.user_id)));
    const [docs, profiles] = await Promise.all([
      docIds.length
        ? db.from("documents").select("id, title, category").in("id", docIds)
        : Promise.resolve({ data: [] }),
      userIds.length
        ? db.from("profiles").select("id, display_name").in("id", userIds)
        : Promise.resolve({ data: [] }),
    ]);

    return {
      deliveries,
      documentTitles: Object.fromEntries(
        ((docs.data ?? []) as { id: string; title: string }[]).map((d) => [d.id, d.title]),
      ),
      investorNames: Object.fromEntries(
        ((profiles.data ?? []) as { id: string; display_name: string }[]).map((p) => [
          p.id,
          p.display_name,
        ]),
      ),
    };
  });


/** Registers a document already uploaded to the private bucket. */
export const adminCreateDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      title: string;
      description?: string;
      category: string;
      visibility: string;
      productId?: string | null;
      investorId?: string | null;
      filePath: string;
      fileName: string;
      fileSize: number;
      contentType: string;
      isPublished: boolean;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const identity = await requireAdminPermission(context as never, "investments");
    const title = String(data.title ?? "").trim();
    if (!title) throw new Error("A document title is required.");
    if (!data.filePath) throw new Error("Upload a file before saving.");
    if (data.visibility === "single_investor" && !data.investorId)
      throw new Error("Choose the investor this document belongs to.");
    if (data.visibility === "product_subscribers" && !data.productId)
      throw new Error("Choose the product this document belongs to.");

    const db = await serviceClient();
    const row = {
      title,
      description: (data.description ?? "").slice(0, 1000) || null,
      category: data.category as never,
      visibility: data.visibility as never,
      product_id: data.productId || null,
      user_id: data.visibility === "single_investor" ? data.investorId : null,
      file_path: data.filePath,
      file_name: data.fileName,
      file_size: Number(data.fileSize) || 0,
      content_type: data.contentType || "application/octet-stream",
      is_published: Boolean(data.isPublished),
      created_by: identity.userId,
    };
    const { data: created, error } = await db.from("documents").insert(row).select("id").single();
    if (error) throw new Error(error.message);

    await logAdminAction(identity, {
      action: "documents.created",
      targetType: "document",
      targetId: created.id,
      targetLabel: title,
      after: { category: data.category, visibility: data.visibility, published: row.is_published },
    });

    let notice = "";
    if (row.is_published) {
      const { notifyDocumentPublished } = await import("@/lib/document-notifications.server");
      const fanout = await notifyDocumentPublished(created.id);
      if (fanout.notified || fanout.emails)
        notice = ` ${fanout.notified} investor${fanout.notified === 1 ? "" : "s"} notified (${fanout.emails} email${fanout.emails === 1 ? "" : "s"}).`;
    }
    return { message: `${title} added to the document library.${notice}` };
  });

export const adminSetDocumentPublished = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; isPublished: boolean }) => ({
    id: String(input.id ?? ""),
    isPublished: Boolean(input.isPublished),
  }))
  .handler(async ({ data, context }) => {
    const identity = await requireAdminPermission(context as never, "investments");
    const db = await serviceClient();
    const { error } = await db
      .from("documents")
      .update({ is_published: data.isPublished })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await logAdminAction(identity, {
      action: data.isPublished ? "documents.published" : "documents.unpublished",
      targetType: "document",
      targetId: data.id,
      after: { is_published: data.isPublished },
    });

    if (!data.isPublished) return { message: "Document hidden from investors." };

    const { notifyDocumentPublished } = await import("@/lib/document-notifications.server");
    const fanout = await notifyDocumentPublished(data.id);
    const notice =
      fanout.notified || fanout.emails
        ? ` ${fanout.notified} investor${fanout.notified === 1 ? "" : "s"} notified (${fanout.emails} email${fanout.emails === 1 ? "" : "s"}).`
        : "";
    return { message: `Document published.${notice}` };
  });

export const adminDeleteDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => ({ id: String(input.id ?? "") }))
  .handler(async ({ data, context }) => {
    const identity = await requireAdminPermission(context as never, "investments");
    const db = await serviceClient();
    const { data: doc } = await db
      .from("documents")
      .select("id, title, file_path")
      .eq("id", data.id)
      .maybeSingle();
    if (!doc) throw new Error("Document not found.");
    await db.storage.from(DOC_BUCKET).remove([doc.file_path]);
    const { error } = await db.from("documents").delete().eq("id", doc.id);
    if (error) throw new Error(error.message);
    await logAdminAction(identity, {
      action: "documents.deleted",
      targetType: "document",
      targetId: doc.id,
      targetLabel: doc.title,
    });
    return { message: `${doc.title} removed.` };
  });

/** Signed upload target so the browser sends the file straight to storage. */
export const adminCreateDocumentUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { fileName: string }) => ({ fileName: String(input.fileName ?? "file") }))
  .handler(async ({ data, context }) => {
    await requireAdminPermission(context as never, "investments");
    const safe = data.fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);
    const path = `library/${new Date().getFullYear()}/${crypto.randomUUID()}-${safe}`;
    const db = await serviceClient();
    const { data: signed, error } = await db.storage.from(DOC_BUCKET).createSignedUploadUrl(path);
    if (error || !signed) throw new Error(error?.message ?? "Could not prepare the upload.");
    return { path, token: signed.token, signedUrl: signed.signedUrl };
  });

/** Re-attempts document notification deliveries that are parked or failed. */
export const adminRetryDocumentDeliveries = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input?: { deliveryIds?: string[]; documentId?: string | null }) => ({
    deliveryIds: Array.isArray(input?.deliveryIds) ? input!.deliveryIds.map(String).slice(0, 200) : [],
    documentId: input?.documentId ? String(input.documentId) : null,
  }))
  .handler(async ({ data, context }) => {
    const identity = await requireAdminPermission(context as never, "investments");
    const { retryDocumentDeliveries } = await import("@/lib/document-notifications.server");
    const result = await retryDocumentDeliveries({
      deliveryIds: data.deliveryIds.length ? data.deliveryIds : null,
      documentId: data.documentId,
      force: true,
    });
    await logAdminAction(identity, {
      action: "documents.deliveries_retried",
      targetType: "document_delivery",
      targetId: data.deliveryIds[0] ?? data.documentId ?? "all",
      after: result,
    });
    const message = result.attempted
      ? `Retried ${result.attempted} deliver${result.attempted === 1 ? "y" : "ies"} — ${result.sent} sent, ${result.retrying} awaiting another attempt, ${result.failed} failed.`
      : "Nothing to retry.";
    return { message, ...result };
  });
