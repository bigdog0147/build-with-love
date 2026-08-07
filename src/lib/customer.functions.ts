import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { paginate, resolveRoundId, type RoundRef } from "./notification-links";

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
  /** Underlying notifications-table row id when the item is a dismissible alert. */
  alertId: string | null;
  title: string;
  detail: string;
  at: string;
  tone: "info" | "success" | "warning";
  read: boolean;
  source: "alert" | "transaction" | "ticket";
  /** Capital raising round this notice refers to, when one could be resolved. */
  roundId: string | null;
};

export type NotificationFeed = {
  items: CustomerNotification[];
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
  unread: number;
};

/** Paginated activity feed: automated notices plus transactions and support tickets. */
export const listNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { page?: number; pageSize?: number; unreadOnly?: boolean } | undefined) => ({
    page: Math.max(1, Math.floor(Number(input?.page ?? 1)) || 1),
    pageSize: Math.min(50, Math.max(5, Math.floor(Number(input?.pageSize ?? 10)) || 10)),
    unreadOnly: Boolean(input?.unreadOnly),
  }))
  .handler(async ({ context, data }): Promise<NotificationFeed> => {
    const [alerts, tx, tickets, commitments, interests] = await Promise.all([
      context.supabase
        .from("notifications")
        .select("id, title, detail, tone, read_at, created_at")
        .eq("user_id", context.userId)
        .order("created_at", { ascending: false })
        .limit(200),
      context.supabase
        .from("transactions")
        .select("id, name, kind, amount, currency, status, occurred_at")
        .eq("user_id", context.userId)
        .order("occurred_at", { ascending: false })
        .limit(60),
      context.supabase
        .from("support_tickets")
        .select("id, subject, status, created_at")
        .eq("user_id", context.userId)
        .order("created_at", { ascending: false })
        .limit(30),
      context.supabase.from("raise_commitments").select("round_id").eq("user_id", context.userId),
      context.supabase.from("raise_interests").select("round_id").eq("user_id", context.userId),
    ]);

    const roundIds = Array.from(
      new Set(
        [...(commitments.data ?? []), ...(interests.data ?? [])]
          .map((r) => (r as { round_id: string | null }).round_id)
          .filter((id): id is string => Boolean(id)),
      ),
    );
    let rounds: RoundRef[] = [];
    if (roundIds.length) {
      const { data: roundRows } = await context.supabase
        .from("raise_rounds")
        .select("id, name")
        .in("id", roundIds);
      rounds = (roundRows ?? []).map((r) => ({ id: String(r.id), name: String(r.name ?? "") }));
    }

    const items: CustomerNotification[] = [];

    for (const a of alerts.data ?? []) {
      items.push({
        id: `alert-${a.id}`,
        alertId: String(a.id),
        title: a.title,
        detail: a.detail,
        at: a.created_at,
        tone: (a.tone as CustomerNotification["tone"]) ?? "info",
        read: Boolean(a.read_at),
        source: "alert",
        roundId: resolveRoundId(`${a.title} ${a.detail}`, rounds),
      });
    }

    for (const t of tx.data ?? []) {
      items.push({
        id: `tx-${t.id}`,
        alertId: null,
        title: `${t.kind} — ${t.name}`,
        detail: `${Number(t.amount).toLocaleString("en-US")} ${t.currency} · ${t.status}`,
        at: t.occurred_at,
        tone: t.status === "Cleared" ? "success" : "info",
        read: true,
        source: "transaction",
        roundId: resolveRoundId(String(t.name ?? ""), rounds),
      });
    }

    for (const t of tickets.data ?? []) {
      items.push({
        id: `ticket-${t.id}`,
        alertId: null,
        title: `Support ticket ${t.status}`,
        detail: t.subject,
        at: t.created_at,
        tone: "info",
        read: true,
        source: "ticket",
        roundId: null,
      });
    }

    items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    const unread = items.filter((i) => !i.read).length;
    const visible = data.unreadOnly ? items.filter((i) => !i.read) : items;
    const page = paginate(visible, data.page, data.pageSize);
    return { ...page, unread };
  });

/** Marks every automated notification for the signed-in customer as read. */
export const markNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", context.userId)
      .is("read_at", null);
    if (error) throw error;
    return { ok: true };
  });

/** Toggles the read state of a single alert owned by the signed-in customer. */
export const setNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; read: boolean }) => ({
    id: String(input?.id ?? "").trim(),
    read: Boolean(input?.read),
  }))
  .handler(async ({ context, data }) => {
    if (!data.id) throw new Error("Notification id is required.");
    const { error } = await context.supabase
      .from("notifications")
      .update({ read_at: data.read ? new Date().toISOString() : null })
      .eq("user_id", context.userId)
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
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
