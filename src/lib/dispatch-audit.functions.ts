import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireAdminPermission, serviceClient } from "./admin-guard.server";

/**
 * Admin-gated read of `notification_dispatch_log` — the append-only audit trail
 * of background notification/email dispatch jobs (sent, skipped, failed) with
 * their idempotency keys and attempt counts.
 */

export const DISPATCH_STATUSES = ["sent", "skipped", "failed"] as const;
export type DispatchStatus = (typeof DISPATCH_STATUSES)[number];

export type DispatchLogRow = {
  id: string;
  createdAt: string;
  userId: string | null;
  category: string;
  template: string | null;
  idempotencyKey: string | null;
  label: string;
  status: string;
  attempts: number;
  detail: string | null;
  retryable: boolean;
};

export type DispatchLogResult = {
  rows: DispatchLogRow[];
  templates: string[];
  counts: { sent: number; skipped: number; failed: number; total: number };
  hasMore: boolean;
};

type Input = {
  template?: string;
  status?: string;
  from?: string;
  to?: string;
  idempotencyKey?: string;
  limit?: number;
};

const MAX_ROWS = 300;

function isoOrNull(value: string | undefined, endOfDay: boolean) {
  const raw = (value ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const d = new Date(`${raw}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export const listDispatchAuditLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Input) => ({
    template: (input.template ?? "").trim().slice(0, 120),
    status: DISPATCH_STATUSES.includes(input.status as DispatchStatus)
      ? (input.status as DispatchStatus)
      : "",
    from: isoOrNull(input.from, false),
    to: isoOrNull(input.to, true),
    idempotencyKey: (input.idempotencyKey ?? "").trim().slice(0, 200),
    limit: Math.min(Math.max(Number(input.limit) || 100, 10), MAX_ROWS),
  }))
  .handler(async ({ data, context }): Promise<DispatchLogResult> => {
    await requireAdminPermission(context as never, "notifications");
    const db = await serviceClient();

    let query = db
      .from("notification_dispatch_log")
      .select(
        "id, created_at, user_id, category, template, idempotency_key, label, status, attempts, detail, retryable",
      )
      .order("created_at", { ascending: false })
      .limit(data.limit + 1);

    if (data.template) query = query.eq("template", data.template);
    if (data.status) query = query.eq("status", data.status);
    if (data.from) query = query.gte("created_at", data.from);
    if (data.to) query = query.lte("created_at", data.to);
    if (data.idempotencyKey) query = query.ilike("idempotency_key", `%${data.idempotencyKey}%`);

    const { data: raw, error } = await query;
    if (error) throw new Error(error.message);

    const all = (raw ?? []) as Record<string, unknown>[];
    const hasMore = all.length > data.limit;
    const rows: DispatchLogRow[] = all.slice(0, data.limit).map((r) => ({
      id: String(r.id),
      createdAt: String(r.created_at),
      userId: (r.user_id as string | null) ?? null,
      category: String(r.category ?? ""),
      template: (r.template as string | null) ?? null,
      idempotencyKey: (r.idempotency_key as string | null) ?? null,
      label: String(r.label ?? ""),
      status: String(r.status ?? ""),
      attempts: Number(r.attempts ?? 0),
      detail: (r.detail as string | null) ?? null,
      retryable: Boolean(r.retryable),
    }));

    const counts = { sent: 0, skipped: 0, failed: 0, total: rows.length };
    for (const row of rows) {
      if (row.status === "sent") counts.sent += 1;
      else if (row.status === "failed") counts.failed += 1;
      else counts.skipped += 1;
    }

    // Distinct template names for the filter chips (recent activity only).
    const { data: recent } = await db
      .from("notification_dispatch_log")
      .select("template")
      .not("template", "is", null)
      .order("created_at", { ascending: false })
      .limit(500);
    const templates = Array.from(
      new Set(((recent ?? []) as { template: string | null }[]).map((r) => r.template ?? "")),
    )
      .filter(Boolean)
      .sort();

    return { rows, templates, counts, hasMore };
  });
