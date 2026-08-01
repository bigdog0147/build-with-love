import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Admin-gated KYC document workflow.
 * Files live in the EXTERNAL backend's private `kyc-documents` bucket and the
 * resulting object path is written back onto that project's kyc_profiles row.
 */

export const KYC_BUCKET = "kyc-documents";
export const KYC_SLOTS = ["doc_front_path", "doc_back_path", "selfie_path"] as const;
export type KycSlot = (typeof KYC_SLOTS)[number];

export type AdminKycRow = {
  user_id: string;
  full_legal_name: string | null;
  nationality: string | null;
  doc_type: string | null;
  id_status: string;
  doc_front_path: string | null;
  doc_back_path: string | null;
  selfie_path: string | null;
  updated_at: string | null;
};

const MAX_BYTES = 8 * 1024 * 1024;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("Forbidden");
}

/** List KYC records on the external project. Admins only. */
export const listExternalKyc = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { externalSupabaseAdmin } = await import("./external-supabase.server");
    const { data, error } = await externalSupabaseAdmin()
      .from("kyc_profiles")
      .select(
        "user_id, full_legal_name, nationality, doc_type, id_status, doc_front_path, doc_back_path, selfie_path, updated_at",
      )
      .order("updated_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return { rows: (data ?? []) as AdminKycRow[] };
  });

/** Upload a document, store it externally and link it to the kyc_profiles row. */
export const uploadExternalKycDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      userId: string;
      slot: KycSlot;
      fileName: string;
      contentType: string;
      base64: string;
    }) => {
      if (!UUID_RE.test(input.userId)) throw new Error("Invalid user id");
      if (!KYC_SLOTS.includes(input.slot)) throw new Error("Invalid document slot");
      if (!input.base64) throw new Error("Empty file");
      if (!/^(image\/(png|jpe?g|webp|heic)|application\/pdf)$/.test(input.contentType))
        throw new Error("Only PNG, JPEG, WEBP, HEIC or PDF files are allowed");
      const approxBytes = Math.ceil((input.base64.length * 3) / 4);
      if (approxBytes > MAX_BYTES) throw new Error("File exceeds the 8 MB limit");
      return input;
    },
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { externalSupabaseAdmin } = await import("./external-supabase.server");
    const admin = externalSupabaseAdmin();

    // Ensure the private bucket exists on the external project.
    const buckets = await admin.storage.listBuckets();
    if (!buckets.error && !buckets.data?.some((b) => b.name === KYC_BUCKET)) {
      await admin.storage.createBucket(KYC_BUCKET, { public: false });
    }

    const bin = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
    const ext = (data.fileName.split(".").pop() ?? "bin").toLowerCase().slice(0, 8);
    const slotName = data.slot.replace("_path", "");
    const path = `${data.userId}/${slotName}-${Date.now()}.${ext}`;

    const up = await admin.storage
      .from(KYC_BUCKET)
      .upload(path, bin, { contentType: data.contentType, upsert: true });
    if (up.error) throw new Error(up.error.message);

    const prev = await admin
      .from("kyc_profiles")
      .select(data.slot)
      .eq("user_id", data.userId)
      .maybeSingle();

    const res = await admin
      .from("kyc_profiles")
      .upsert(
        { user_id: data.userId, [data.slot]: path, updated_at: new Date().toISOString() },
        { onConflict: "user_id" },
      )
      .select("user_id")
      .single();
    if (res.error) throw new Error(res.error.message);

    // Clean up the replaced object, if any.
    const old = (prev.data as Record<string, string | null> | null)?.[data.slot];
    if (old && old !== path) await admin.storage.from(KYC_BUCKET).remove([old]);

    return { path };
  });

/** Short-lived signed URL for reviewing a stored document. */
export const getExternalKycDocumentUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { path: string }) => {
    if (!input.path || input.path.includes("..")) throw new Error("Invalid path");
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { externalSupabaseAdmin } = await import("./external-supabase.server");
    const { data: signed, error } = await externalSupabaseAdmin()
      .storage.from(KYC_BUCKET)
      .createSignedUrl(data.path, 300);
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });

/** Delete a stored document and unlink it from the record. */
export const deleteExternalKycDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; slot: KycSlot }) => {
    if (!UUID_RE.test(input.userId)) throw new Error("Invalid user id");
    if (!KYC_SLOTS.includes(input.slot)) throw new Error("Invalid document slot");
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { externalSupabaseAdmin } = await import("./external-supabase.server");
    const admin = externalSupabaseAdmin();

    const prev = await admin
      .from("kyc_profiles")
      .select(data.slot)
      .eq("user_id", data.userId)
      .maybeSingle();
    const path = (prev.data as Record<string, string | null> | null)?.[data.slot];
    if (path) await admin.storage.from(KYC_BUCKET).remove([path]);

    const res = await admin
      .from("kyc_profiles")
      .update({ [data.slot]: null, updated_at: new Date().toISOString() })
      .eq("user_id", data.userId);
    if (res.error) throw new Error(res.error.message);
    return { ok: true as const };
  });

/** Move a record through the review states. */
export const setExternalKycStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; status: string }) => {
    if (!UUID_RE.test(input.userId)) throw new Error("Invalid user id");
    if (!["not_started", "submitted", "under_review", "verified", "rejected"].includes(input.status))
      throw new Error("Invalid status");
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { externalSupabaseAdmin } = await import("./external-supabase.server");
    const res = await externalSupabaseAdmin()
      .from("kyc_profiles")
      .update({ id_status: data.status, updated_at: new Date().toISOString() })
      .eq("user_id", data.userId);
    if (res.error) throw new Error(res.error.message);

    if (data.status !== "not_started") {
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: userRes } = await supabaseAdmin.auth.admin.getUserById(data.userId);
        const email = userRes?.user?.email;
        if (email) {
          const { sendTemplateEmailWithRetry } = await import("@/lib/email-retry.server");
          const sendRes = await sendTemplateEmailWithRetry(
            "kyc-status",
            email,
            {
              templateData: { status: data.status },
              idempotencyKey: `kyc-status-${data.status}-${data.userId}`,
            },
            { attempts: 4, baseDelayMs: 1000 },
          );
          if (!sendRes.sent) {
            console.error(
              `KYC decision email not delivered after ${sendRes.attempts} attempt(s): ${sendRes.reason}`,
            );
          }
        }
      } catch (err) {
        console.error("KYC status email failed", err);
      }
    }

    return { ok: true as const };
  });

