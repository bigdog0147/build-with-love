import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { LEDGER_PAGE_SIZE, normalizeLedgerFilters } from "@/lib/transactions.server";
import type { LedgerFilters } from "@/lib/transactions.server";

export type LedgerRow = {
  id: string;
  name: string;
  kind: string;
  amount: number;
  currency: string;
  status: string;
  occurred_at: string;
};

/** Paginated, filterable transaction ledger for the signed-in customer. */
export const getTransactionLedger = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: LedgerFilters) => normalizeLedgerFilters(input ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    let query = supabase
      .from("transactions")
      .select("id, name, kind, amount, currency, status, occurred_at", { count: "exact" })
      .eq("user_id", userId);

    if (data.kind) query = query.eq("kind", data.kind);
    if (data.status) query = query.eq("status", data.status);
    if (data.from) query = query.gte("occurred_at", `${data.from}T00:00:00.000Z`);
    if (data.to) query = query.lte("occurred_at", `${data.to}T23:59:59.999Z`);
    if (data.q) query = query.ilike("name", `%${data.q}%`);

    const start = (data.page - 1) * LEDGER_PAGE_SIZE;
    const { data: rows, error, count } = await query
      .order("occurred_at", { ascending: false })
      .range(start, start + LEDGER_PAGE_SIZE - 1);
    if (error) throw new Error(error.message);

    return {
      rows: (rows ?? []) as LedgerRow[],
      total: count ?? 0,
      page: data.page,
      pageSize: LEDGER_PAGE_SIZE,
    };
  });

/** Same filters, no pagination — powers the CSV export (capped for safety). */
export const exportTransactionLedger = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: LedgerFilters) => normalizeLedgerFilters(input ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let query = supabase
      .from("transactions")
      .select("id, name, kind, amount, currency, status, occurred_at")
      .eq("user_id", userId);

    if (data.kind) query = query.eq("kind", data.kind);
    if (data.status) query = query.eq("status", data.status);
    if (data.from) query = query.gte("occurred_at", `${data.from}T00:00:00.000Z`);
    if (data.to) query = query.lte("occurred_at", `${data.to}T23:59:59.999Z`);
    if (data.q) query = query.ilike("name", `%${data.q}%`);

    const { data: rows, error } = await query
      .order("occurred_at", { ascending: false })
      .limit(5000);
    if (error) throw new Error(error.message);
    return { rows: (rows ?? []) as LedgerRow[] };
  });
