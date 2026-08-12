import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { computeCompletion } from "@/lib/kyc-utils";
import type { KycProfile } from "@/lib/kyc-utils";

export { computeCompletion, statusMeta } from "@/lib/kyc-utils";
export type { KycProfile, KycDocType, KycStatus } from "@/lib/kyc-utils";

export const getKyc = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<KycProfile> => {
    const { supabase, userId, claims } = context;
    let { data, error } = await supabase
      .from("kyc_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) {
      const ins = await supabase
        .from("kyc_profiles")
        .insert({ user_id: userId })
        .select("*")
        .single();
      if (ins.error) throw new Error(ins.error.message);
      data = ins.data;
    }
    // Mirror auth email confirmation onto the KYC row if needed. Verified flags
    // are protected columns, so this must go through the privileged client after
    // the claim has been checked server-side.
    const emailConfirmed = Boolean((claims as { email_verified?: boolean })?.email_verified);
    if (emailConfirmed && data && !data.email_verified) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const upd = await supabaseAdmin
        .from("kyc_profiles")
        .update({ email_verified: true })
        .eq("user_id", userId)
        .select("*")
        .single();
      if (!upd.error && upd.data) data = upd.data;
    }
    return data as KycProfile;
  });

export const saveKyc = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Partial<KycProfile>) => input)
  .handler(async ({ data, context }): Promise<KycProfile> => {
    const { supabase, userId } = context;
    const {
      user_id: _ignore,
      // Verification outcome fields are decided by compliance, never by the customer.
      id_status: _status,
      email_verified: _email,
      phone_verified: _phone,
      ...patch
    } = data as Partial<KycProfile> & { user_id?: string };
    const res = await supabase
      .from("kyc_profiles")
      .update(patch)
      .eq("user_id", userId)
      .select("*")
      .single();
    if (res.error) throw new Error(res.error.message);
    return res.data as KycProfile;
  });

export const submitKyc = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<KycProfile> => {
    const { supabase, userId, claims } = context;
    // Only a submission from a not-yet-decided record may enter review; a
    // verified/rejected decision can never be set by the customer.
    const current = await supabase
      .from("kyc_profiles")
      .select("id_status, doc_type, doc_front_path, selfie_path, full_legal_name")
      .eq("user_id", userId)
      .maybeSingle();
    if (current.error) throw new Error(current.error.message);
    if (!current.data) throw new Error("Verification record not found.");
    const currentStatus = current.data.id_status as string;
    if (currentStatus === "verified" || currentStatus === "under_review") {
      throw new Error("Your verification is already in review.");
    }
    if (!current.data.full_legal_name || !current.data.doc_type || !current.data.doc_front_path) {
      throw new Error("Complete your details and upload your ID before submitting.");
    }

    // Status is a protected column; the transition runs through the privileged
    // client after the server-side checks above.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const res = await supabaseAdmin
      .from("kyc_profiles")
      .update({ id_status: "under_review", current_step: 6 })
      .eq("user_id", userId)
      .select("*")
      .single();
    if (res.error) throw new Error(res.error.message);

    const email = (claims as { email?: string })?.email;
    if (email) {
      try {
        const { sendTemplateEmailWithRetry } = await import("@/lib/email-retry.server");
        const sendRes = await sendTemplateEmailWithRetry(
          "kyc-status",
          email,
          {
            templateData: {
              name: (res.data as KycProfile).full_legal_name ?? undefined,
              status: "under_review",
            },
            idempotencyKey: `kyc-status-under_review-${userId}`,
          },
          { attempts: 4, baseDelayMs: 1000 },
        );
        if (!sendRes.sent) {
          console.error(
            `KYC status email not delivered after ${sendRes.attempts} attempt(s): ${sendRes.reason}`,
          );
        }
      } catch (err) {
        console.error("KYC status email failed", err);
      }
    }

    return res.data as KycProfile;
  });


export type KycTimelineStep = {
  key: string;
  label: string;
  detail: string;
  state: "done" | "current" | "pending" | "failed";
  at: string | null;
};

export type KycDocumentSlot = {
  key: "doc_front_path" | "doc_back_path" | "selfie_path";
  label: string;
  path: string | null;
  required: boolean;
};

export type KycStatusView = {
  profile: KycProfile;
  completion: number;
  updated_at: string | null;
  documents: KycDocumentSlot[];
  timeline: KycTimelineStep[];
};

/** Read-only status view for the signed-in customer's verification review. */
export const getKycStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<KycStatusView> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("kyc_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);

    const profile = (data ?? {
      user_id: userId,
      id_status: "not_started",
      current_step: 1,
      email_verified: false,
      phone_verified: false,
      two_factor_enabled: false,
    }) as KycProfile;

    const status = profile.id_status;
    const needsBack = profile.doc_type && profile.doc_type !== "passport";
    const updated_at = (data as { updated_at?: string } | null)?.updated_at ?? null;

    const documents: KycDocumentSlot[] = [
      { key: "doc_front_path", label: "Identity document — front", path: profile.doc_front_path, required: true },
      { key: "doc_back_path", label: "Identity document — back", path: profile.doc_back_path, required: Boolean(needsBack) },
      { key: "selfie_path", label: "Liveness selfie", path: profile.selfie_path, required: false },
    ];

    const submitted = status !== "not_started";
    const reviewing = status === "under_review";
    const decided = status === "verified" || status === "rejected";

    const timeline: KycTimelineStep[] = [
      {
        key: "profile",
        label: "Personal details",
        detail: profile.full_legal_name ? `Recorded for ${profile.full_legal_name}` : "Awaiting your personal information",
        state: profile.full_legal_name ? "done" : "current",
        at: null,
      },
      {
        key: "documents",
        label: "Documents uploaded",
        detail: `${documents.filter((d) => d.path).length} of ${documents.filter((d) => d.required).length} required file(s) on file`,
        state: documents.filter((d) => d.required).every((d) => d.path) ? "done" : profile.full_legal_name ? "current" : "pending",
        at: null,
      },
      {
        key: "submitted",
        label: "Submitted for review",
        detail: submitted ? "Your application reached our compliance queue." : "Submit your application from the verification wizard.",
        state: submitted ? "done" : "pending",
        at: submitted ? updated_at : null,
      },
      {
        key: "review",
        label: "Compliance review",
        detail: reviewing
          ? "A compliance officer is reviewing your documents. This usually takes 1–2 business days."
          : decided
            ? "Review complete."
            : "Starts automatically once you submit.",
        state: decided ? "done" : reviewing ? "current" : "pending",
        at: reviewing || decided ? updated_at : null,
      },
      {
        key: "decision",
        label: "Decision",
        detail:
          status === "verified"
            ? "Approved — your account is fully verified."
            : status === "rejected"
              ? "We could not verify your documents. Please re-upload clearer images and resubmit."
              : "Pending review outcome.",
        state: status === "verified" ? "done" : status === "rejected" ? "failed" : "pending",
        at: decided ? updated_at : null,
      },
    ];

    return { profile, completion: computeCompletion(profile), updated_at, documents, timeline };
  });

/** Short-lived signed URL for one of the caller's own verification documents. */
export const getOwnKycDocumentUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { path: string }) => ({ path: String(input.path ?? "") }))
  .handler(async ({ data, context }): Promise<{ url: string }> => {
    const { supabase, userId } = context;
    if (!data.path.startsWith(`${userId}/`)) throw new Error("Not permitted.");
    const { data: signed, error } = await supabase.storage
      .from("kyc-documents")
      .createSignedUrl(data.path, 300);
    if (error || !signed) throw new Error(error?.message ?? "Could not create link.");
    return { url: signed.signedUrl };
  });
