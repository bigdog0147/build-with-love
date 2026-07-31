import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Admin console data layer. Every function verifies the admin role first. */

type Ctx = { supabase: { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown }> }; userId: string };

async function assertAdmin(context: Ctx) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Error("Forbidden — administrator role required.");
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export type Row = Record<string, string | number | boolean | null>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type CustomerRow = {
  id: string;
  display_name: string;
  initials: string;
  tier: string;
  role: string;
  membership: string;
  country: string | null;
  organization: string | null;
  username: string | null;
  created_at: string;
  kyc_status: string;
  kyc_step: number;
  wallet_value: number;
  wallet_count: number;
  card_count: number;
  tx_count: number;
  risk_score: number;
};

export type Overview = {
  totals: {
    customers: number;
    verified: number;
    pendingKyc: number;
    aum: number;
    revenue: number;
    revenueMonth: number;
    revenueWeek: number;
    txToday: number;
    depositRequests: number;
    withdrawalRequests: number;
    fraudAlerts: number;
    tickets: number;
    activeUsers: number;
    onlineUsers: number;
    cards: number;
    investmentGrowth: number;
  };
  revenueSeries: { day: string; value: number }[];
  volumeSeries: { day: string; value: number }[];
  allocation: { label: string; value: number }[];
  currencies: { label: string; value: number }[];
  countries: { label: string; value: number }[];
  activity: { id: string; kind: string; name: string; amount: number; currency: string; at: string; status: string }[];
  health: { database: "operational" | "degraded"; api: "operational" | "degraded"; storage: "operational" | "degraded" };
};

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Overview> => {
    await assertAdmin(context as unknown as Ctx);
    const db = await admin();

    const since = new Date(Date.now() - 29 * 864e5);
    const [profiles, kyc, wallets, tx, cards, audit] = await Promise.all([
      db.from("profiles").select("id, country, created_at"),
      db.from("kyc_profiles").select("user_id, id_status, current_step"),
      db.from("wallets").select("code, balance, fiat_value"),
      db.from("transactions").select("id, name, kind, amount, currency, occurred_at, status").order("occurred_at", { ascending: false }).limit(1000),
      db.from("cards").select("id"),
      db.from("auth_audit_log").select("id, success, created_at").gte("created_at", since.toISOString()),
    ]);

    const txRows = tx.data ?? [];
    const walletRows = wallets.data ?? [];
    const kycRows = kyc.data ?? [];
    const profileRows = profiles.data ?? [];

    const aum = walletRows.reduce((s, w) => {
      const v = Number(w.fiat_value ?? w.balance ?? 0);
      return s + (Number.isFinite(v) ? v : 0);
    }, 0);

    const feeOf = (amount: number) => Math.abs(Number(amount) || 0) * 0.0075;
    const now = Date.now();
    const revenue = txRows.reduce((s, t) => s + feeOf(t.amount as number), 0);
    const revenueMonth = txRows
      .filter((t) => now - new Date(t.occurred_at as string).getTime() < 30 * 864e5)
      .reduce((s, t) => s + feeOf(t.amount as number), 0);
    const revenueWeek = txRows
      .filter((t) => now - new Date(t.occurred_at as string).getTime() < 7 * 864e5)
      .reduce((s, t) => s + feeOf(t.amount as number), 0);

    const today = dayKey(new Date());
    const buckets = new Map<string, { rev: number; vol: number }>();
    for (let i = 29; i >= 0; i--) buckets.set(dayKey(new Date(now - i * 864e5)), { rev: 0, vol: 0 });
    for (const t of txRows) {
      const k = dayKey(new Date(t.occurred_at as string));
      const b = buckets.get(k);
      if (!b) continue;
      b.rev += feeOf(t.amount as number);
      b.vol += Math.abs(Number(t.amount) || 0);
    }

    const byCurrency = new Map<string, number>();
    for (const w of walletRows) {
      const v = Number(w.fiat_value ?? w.balance ?? 0);
      byCurrency.set(w.code as string, (byCurrency.get(w.code as string) ?? 0) + (Number.isFinite(v) ? v : 0));
    }
    const byCountry = new Map<string, number>();
    for (const p of profileRows) {
      const c = (p.country as string | null) || "Unassigned";
      byCountry.set(c, (byCountry.get(c) ?? 0) + 1);
    }
    const byKind = new Map<string, number>();
    for (const t of txRows) {
      byKind.set(t.kind as string, (byKind.get(t.kind as string) ?? 0) + Math.abs(Number(t.amount) || 0));
    }

    const pending = (s: string) => s === "submitted" || s === "under_review";
    const failedLogins = (audit.data ?? []).filter((a) => a.success === false).length;

    const activeUsers = new Set(
      (audit.data ?? [])
        .filter((a) => now - new Date(a.created_at as string).getTime() < 7 * 864e5)
        .map((a) => a.id as string),
    ).size;

    return {
      totals: {
        customers: profileRows.length,
        verified: kycRows.filter((k) => k.id_status === "verified").length,
        pendingKyc: kycRows.filter((k) => pending(k.id_status as string)).length,
        aum,
        revenue,
        revenueMonth,
        revenueWeek,
        txToday: txRows.filter((t) => dayKey(new Date(t.occurred_at as string)) === today).length,
        depositRequests: txRows.filter((t) => t.kind === "Deposit" && t.status !== "Cleared").length,
        withdrawalRequests: txRows.filter((t) => t.kind === "Withdrawal" && t.status !== "Cleared").length,
        fraudAlerts: failedLogins,
        tickets: txRows.filter((t) => t.status === "Review").length,
        activeUsers,
        onlineUsers: (audit.data ?? []).filter((a) => now - new Date(a.created_at as string).getTime() < 9e5).length,
        cards: (cards.data ?? []).length,
        investmentGrowth: aum > 0 ? Math.min(48, (revenueMonth / aum) * 1200) : 0,
      },
      revenueSeries: [...buckets].map(([day, b]) => ({ day, value: Number(b.rev.toFixed(2)) })),
      volumeSeries: [...buckets].map(([day, b]) => ({ day, value: Number(b.vol.toFixed(2)) })),
      allocation: [...byKind].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
      currencies: [...byCurrency].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
      countries: [...byCountry].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
      activity: txRows.slice(0, 12).map((t) => ({
        id: t.id as string,
        kind: t.kind as string,
        name: t.name as string,
        amount: Number(t.amount),
        currency: t.currency as string,
        at: t.occurred_at as string,
        status: t.status as string,
      })),
      health: {
        database: profiles.error ? "degraded" : "operational",
        api: "operational",
        storage: "operational",
      },
    };
  });

export const listCustomers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ rows: CustomerRow[] }> => {
    await assertAdmin(context as unknown as Ctx);
    const db = await admin();

    const [profiles, kyc, wallets, cards, tx, audit] = await Promise.all([
      db.from("profiles").select("*").order("created_at", { ascending: false }),
      db.from("kyc_profiles").select("user_id, id_status, current_step, email_verified, phone_verified"),
      db.from("wallets").select("user_id, balance, fiat_value"),
      db.from("cards").select("user_id"),
      db.from("transactions").select("user_id, amount"),
      db.from("auth_audit_log").select("user_id, success"),
    ]);

    const kycMap = new Map((kyc.data ?? []).map((k) => [k.user_id as string, k]));
    const walletAgg = new Map<string, { v: number; n: number }>();
    for (const w of wallets.data ?? []) {
      const cur = walletAgg.get(w.user_id as string) ?? { v: 0, n: 0 };
      const v = Number(w.fiat_value ?? w.balance ?? 0);
      walletAgg.set(w.user_id as string, { v: cur.v + (Number.isFinite(v) ? v : 0), n: cur.n + 1 });
    }
    const count = (rows: { user_id: unknown }[] | null) => {
      const m = new Map<string, number>();
      for (const r of rows ?? []) m.set(r.user_id as string, (m.get(r.user_id as string) ?? 0) + 1);
      return m;
    };
    const cardMap = count(cards.data);
    const txMap = count(tx.data);
    const failMap = new Map<string, number>();
    for (const a of audit.data ?? []) {
      if (a.success === false && a.user_id) failMap.set(a.user_id as string, (failMap.get(a.user_id as string) ?? 0) + 1);
    }

    const rows: CustomerRow[] = (profiles.data ?? []).map((p) => {
      const k = kycMap.get(p.id as string);
      const w = walletAgg.get(p.id as string) ?? { v: 0, n: 0 };
      const status = (k?.id_status as string) ?? "not_started";
      const fails = failMap.get(p.id as string) ?? 0;
      const risk = Math.max(
        0,
        Math.min(
          100,
          (status === "verified" ? 8 : status === "rejected" ? 82 : 42) +
            fails * 6 -
            (w.v > 250_000 ? 10 : 0),
        ),
      );
      return {
        id: p.id as string,
        display_name: p.display_name as string,
        initials: p.initials as string,
        tier: p.tier as string,
        role: p.role as string,
        membership: p.membership as string,
        country: (p.country as string | null) ?? null,
        organization: (p.organization as string | null) ?? null,
        username: (p.username as string | null) ?? null,
        created_at: p.created_at as string,
        kyc_status: status,
        kyc_step: Number(k?.current_step ?? 1),
        wallet_value: w.v,
        wallet_count: w.n,
        card_count: cardMap.get(p.id as string) ?? 0,
        tx_count: txMap.get(p.id as string) ?? 0,
        risk_score: Math.round(risk),
      };
    });

    return { rows };
  });

export type CustomerDetail = {
  customer: CustomerRow;
  kyc: Row | null;
  wallets: Row[];
  cards: Row[];
  transactions: Row[];
  allocations: Row[];
  roles: string[];
  logins: Row[];
};

export const getCustomerDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!UUID_RE.test(input.id)) throw new Error("Invalid customer id");
    return input;
  })
  .handler(async ({ data, context }): Promise<CustomerDetail> => {
    await assertAdmin(context as unknown as Ctx);
    const db = await admin();
    const id = data.id;

    const [profile, kyc, wallets, cards, tx, alloc, roles, logins] = await Promise.all([
      db.from("profiles").select("*").eq("id", id).maybeSingle(),
      db.from("kyc_profiles").select("*").eq("user_id", id).maybeSingle(),
      db.from("wallets").select("*").eq("user_id", id).order("sort_order"),
      db.from("cards").select("*").eq("user_id", id).order("sort_order"),
      db.from("transactions").select("*").eq("user_id", id).order("occurred_at", { ascending: false }).limit(60),
      db.from("allocations").select("*").eq("user_id", id).order("sort_order"),
      db.from("user_roles").select("role").eq("user_id", id),
      db.from("auth_audit_log").select("*").eq("user_id", id).order("created_at", { ascending: false }).limit(25),
    ]);

    if (!profile.data) throw new Error("Customer not found");
    const p = profile.data as Record<string, unknown>;
    const walletValue = (wallets.data ?? []).reduce((s, w) => {
      const v = Number(w.fiat_value ?? w.balance ?? 0);
      return s + (Number.isFinite(v) ? v : 0);
    }, 0);
    const status = ((kyc.data as { id_status?: string } | null)?.id_status as string) ?? "not_started";

    return {
      customer: {
        id,
        display_name: p.display_name as string,
        initials: p.initials as string,
        tier: p.tier as string,
        role: p.role as string,
        membership: p.membership as string,
        country: (p.country as string | null) ?? null,
        organization: (p.organization as string | null) ?? null,
        username: (p.username as string | null) ?? null,
        created_at: p.created_at as string,
        kyc_status: status,
        kyc_step: Number((kyc.data as { current_step?: number } | null)?.current_step ?? 1),
        wallet_value: walletValue,
        wallet_count: (wallets.data ?? []).length,
        card_count: (cards.data ?? []).length,
        tx_count: (tx.data ?? []).length,
        risk_score: status === "verified" ? 8 : status === "rejected" ? 82 : 42,
      },
      kyc: (kyc.data as Row | null) ?? null,
      wallets: (wallets.data ?? []) as unknown as Row[],
      cards: (cards.data ?? []) as unknown as Row[],
      transactions: (tx.data ?? []) as unknown as Row[],
      allocations: (alloc.data ?? []) as unknown as Row[],
      roles: (roles.data ?? []).map((r) => r.role as string),
      logins: (logins.data ?? []) as unknown as Row[],
    };
  });

export const updateCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; tier?: string; membership?: string; role?: string }) => {
    if (!UUID_RE.test(input.id)) throw new Error("Invalid customer id");
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context as unknown as Ctx);
    const db = await admin();
    const patch: { tier?: string; membership?: string; role?: string } = {};
    if (data.tier) patch.tier = data.tier.slice(0, 40);
    if (data.membership) patch.membership = data.membership.slice(0, 40);
    if (data.role) patch.role = data.role.slice(0, 60);
    if (!Object.keys(patch).length) return { ok: true };
    const { error } = await db.from("profiles").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setKycDecision = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; status: string }) => {
    if (!UUID_RE.test(input.id)) throw new Error("Invalid customer id");
    if (!["not_started", "submitted", "under_review", "verified", "rejected"].includes(input.status))
      throw new Error("Invalid status");
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context as unknown as Ctx);
    const db = await admin();
    const { error } = await db
      .from("kyc_profiles")
      .upsert({ user_id: data.id, id_status: data.status as never }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setAdminRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; grant: boolean }) => {
    if (!UUID_RE.test(input.id)) throw new Error("Invalid customer id");
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context as unknown as Ctx);
    const db = await admin();
    if (data.grant) {
      const { error } = await db.from("user_roles").insert({ user_id: data.id, role: "admin" as never });
      if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    } else {
      const { error } = await db.from("user_roles").delete().eq("user_id", data.id).eq("role", "admin" as never);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export type FinanceRow = {
  id: string;
  user_id: string;
  customer: string;
  name: string;
  kind: string;
  amount: number;
  currency: string;
  occurred_at: string;
  status: string;
};

export const listFinance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as unknown as Ctx);
    const db = await admin();
    const [tx, profiles, wallets, cards] = await Promise.all([
      db.from("transactions").select("*").order("occurred_at", { ascending: false }).limit(500),
      db.from("profiles").select("id, display_name"),
      db.from("wallets").select("*").order("sort_order"),
      db.from("cards").select("*").order("sort_order"),
    ]);
    const names = new Map((profiles.data ?? []).map((p) => [p.id as string, p.display_name as string]));
    return {
      transactions: (tx.data ?? []).map((t) => ({
        id: t.id as string,
        user_id: t.user_id as string,
        customer: names.get(t.user_id as string) ?? "Unknown",
        name: t.name as string,
        kind: t.kind as string,
        amount: Number(t.amount),
        currency: t.currency as string,
        occurred_at: t.occurred_at as string,
        status: t.status as string,
      })) as FinanceRow[],
      wallets: (wallets.data ?? []).map((w) => ({
        ...(w as unknown as Row),
        customer: names.get(w.user_id as string) ?? "Unknown",
      })),
      cards: (cards.data ?? []).map((c) => ({
        ...(c as unknown as Row),
        customer: names.get(c.user_id as string) ?? "Unknown",
      })),
    };
  });

export const setTransactionStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; status: string }) => {
    if (!UUID_RE.test(input.id)) throw new Error("Invalid transaction id");
    if (!["Cleared", "Pending", "Review", "Rejected"].includes(input.status)) throw new Error("Invalid status");
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context as unknown as Ctx);
    const db = await admin();
    const { error } = await db.from("transactions").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listAuditLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as unknown as Ctx);
    const db = await admin();
    const [audit, profiles] = await Promise.all([
      db.from("auth_audit_log").select("*").order("created_at", { ascending: false }).limit(400),
      db.from("profiles").select("id, display_name"),
    ]);
    const names = new Map((profiles.data ?? []).map((p) => [p.id as string, p.display_name as string]));
    return {
      rows: (audit.data ?? []).map((a) => ({
        id: a.id as string,
        event_type: a.event_type as string,
        actor: a.user_id ? (names.get(a.user_id as string) ?? "Unknown") : (a.email_masked as string) || "Anonymous",
        ip: (a.ip as string) ?? "—",
        user_agent: (a.user_agent as string) ?? "—",
        success: Boolean(a.success),
        reason: (a.reason as string) ?? "—",
        created_at: a.created_at as string,
      })),
    };
  });
