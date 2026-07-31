import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SupportTicket = {
  id: string;
  subject: string;
  category: string;
  message: string;
  status: string;
  priority: string;
  created_at: string;
};

export const listSupportTickets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SupportTicket[]> => {
    const { data, error } = await context.supabase
      .from("support_tickets")
      .select("id, subject, category, message, status, priority, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data ?? []) as SupportTicket[];
  });

export const createSupportTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { subject: string; category: string; message: string }) => ({
    subject: String(input.subject ?? "").trim().slice(0, 160),
    category: String(input.category ?? "general").trim().slice(0, 40),
    message: String(input.message ?? "").trim().slice(0, 4000),
  }))
  .handler(async ({ data, context }) => {
    if (!data.subject || !data.message) throw new Error("Subject and message are required.");
    const { error } = await context.supabase.from("support_tickets").insert({
      user_id: context.userId,
      subject: data.subject,
      category: data.category,
      message: data.message,
    });
    if (error) throw error;
    return { ok: true };
  });

export type CustomerNotification = {
  id: string;
  title: string;
  detail: string;
  at: string;
  tone: "info" | "success" | "warning";
};

/** Activity feed derived from verification state, transactions and support tickets. */
export const listNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CustomerNotification[]> => {
    const [kyc, tx, tickets] = await Promise.all([
      context.supabase
        .from("kyc_profiles")
        .select("id_status, current_step, updated_at")
        .eq("user_id", context.userId)
        .maybeSingle(),
      context.supabase
        .from("transactions")
        .select("id, name, kind, amount, currency, status, occurred_at")
        .eq("user_id", context.userId)
        .order("occurred_at", { ascending: false })
        .limit(12),
      context.supabase
        .from("support_tickets")
        .select("id, subject, status, created_at")
        .eq("user_id", context.userId)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const items: CustomerNotification[] = [];

    if (kyc.data) {
      const status = kyc.data.id_status;
      items.push({
        id: `kyc-${status}`,
        title: `Identity verification — ${status.replace(/_/g, " ")}`,
        detail:
          status === "verified"
            ? "Your identity is verified. All account features are unlocked."
            : `Verification is at step ${kyc.data.current_step} of 6. Complete it to unlock transfers and cards.`,
        at: kyc.data.updated_at,
        tone: status === "verified" ? "success" : "warning",
      });
    }

    for (const t of tx.data ?? []) {
      items.push({
        id: `tx-${t.id}`,
        title: `${t.kind} — ${t.name}`,
        detail: `${Number(t.amount).toLocaleString("en-US")} ${t.currency} · ${t.status}`,
        at: t.occurred_at,
        tone: t.status === "Cleared" ? "success" : "info",
      });
    }

    for (const t of tickets.data ?? []) {
      items.push({
        id: `ticket-${t.id}`,
        title: `Support ticket ${t.status}`,
        detail: t.subject,
        at: t.created_at,
        tone: "info",
      });
    }

    return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 20);
  });

export type CustomerDocument = {
  key: string;
  label: string;
  uploaded: boolean;
  status: string;
};

/** Read-only inventory of the identity documents on file for the signed-in customer. */
export const listCustomerDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CustomerDocument[]> => {
    const { data, error } = await context.supabase
      .from("kyc_profiles")
      .select("doc_type, doc_front_path, doc_back_path, selfie_path, id_status")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw error;

    const status = data?.id_status ?? "not_started";
    return [
      {
        key: "front",
        label: `Identity document (front)${data?.doc_type ? ` · ${data.doc_type.replace(/_/g, " ")}` : ""}`,
        uploaded: Boolean(data?.doc_front_path),
        status,
      },
      {
        key: "back",
        label: "Identity document (back)",
        uploaded: Boolean(data?.doc_back_path),
        status,
      },
      { key: "selfie", label: "Liveness selfie", uploaded: Boolean(data?.selfie_path), status },
    ];
  });
