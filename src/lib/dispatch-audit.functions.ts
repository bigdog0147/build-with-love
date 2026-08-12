import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireAdminPermission, serviceClient } from "./admin-guard.server";
import { resendIdempotencyKey } from "./dispatch-resend";
import { normalizeAttemptTrail, type DispatchAttemptRow } from "./dispatch-attempts";

/**
 * Admin-gated read of `notification_dispatch_log` — the append-only audit trail
 * of background notification/email dispatch jobs (sent, skipped, failed) with
 * their idempotency keys and attempt counts.
 */

export const DISPATCH_STATUSES = ["sent", "skipped", "failed"] as const;
export type DispatchStatus = (typeof DISPATCH_STATUSES)[number];

export type { DispatchAttemptRow };


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
  /** True when the original notice content was captured and can be replayed. */
  resendable: boolean;
  /** Set when this row was itself queued by an admin resend. */
  resentFrom: string | null;
  resentAt: string | null;
  /** Per-attempt trail: timings, backoff waited, and failure reasons. */
  attemptTrail: DispatchAttemptRow[];
};

export type DispatchLogResult = {
  rows: DispatchLogRow[];
  templates: string[];
  /** Counts across every row matching the filters, not just the current page. */
  counts: { sent: number; skipped: number; failed: number; total: number };
  hasMore: boolean;
  page: number;
  pageSize: number;
  /** Total matching rows (capped at the audit read ceiling). */
  totalRows: number;
  totalPages: number;
};

type Input = {
  template?: string;
  status?: string;
  from?: string;
  to?: string;
  idempotencyKey?: string;
  page?: number;
  pageSize?: number;
};

/** Selectable rows per page in the audit viewer. */
export const DISPATCH_PAGE_SIZES = [25, 50, 100, 200] as const;
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

const normalizeTrail = normalizeAttemptTrail;



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
    page: Math.max(Math.trunc(Number(input.page) || 1), 1),
    pageSize: Math.min(
      Math.max(Math.trunc(Number(input.pageSize) || DEFAULT_PAGE_SIZE), 10),
      MAX_PAGE_SIZE,
    ),
  }))
  .handler(async ({ data, context }): Promise<DispatchLogResult> => {
    await requireAdminPermission(context as never, "notifications");
    const db = await serviceClient();

    /** Applies the active filters to any query builder for this table. */
    const applyFilters = <T extends { eq: unknown }>(builder: T): T => {
      let q = builder as never as {
        eq: (c: string, v: unknown) => typeof q;
        gte: (c: string, v: unknown) => typeof q;
        lte: (c: string, v: unknown) => typeof q;
        ilike: (c: string, v: string) => typeof q;
      };
      if (data.template) q = q.eq("template", data.template);
      if (data.status) q = q.eq("status", data.status);
      if (data.from) q = q.gte("created_at", data.from);
      if (data.to) q = q.lte("created_at", data.to);
      if (data.idempotencyKey) q = q.ilike("idempotency_key", `%${data.idempotencyKey}%`);
      return q as never as T;
    };

    // Outcome counts across the whole filtered set, so the summary line and the
    // page navigation describe the same universe of rows.
    const statusCount = async (status: DispatchStatus) => {
      const { count } = await applyFilters(
        db
          .from("notification_dispatch_log")
          .select("id", { count: "exact", head: true })
          .eq("status", status),
      );
      return count ?? 0;
    };
    const [sent, skipped, failed] = await Promise.all([
      statusCount("sent"),
      statusCount("skipped"),
      statusCount("failed"),
    ]);

    const totalRows = data.status
      ? data.status === "sent"
        ? sent
        : data.status === "failed"
          ? failed
          : skipped
      : sent + skipped + failed;
    const totalPages = Math.max(Math.ceil(totalRows / data.pageSize), 1);
    const page = Math.min(data.page, totalPages);
    const offset = (page - 1) * data.pageSize;

    const { data: raw, error } = await applyFilters(
      db
        .from("notification_dispatch_log")
        .select(
          "id, created_at, user_id, category, template, idempotency_key, label, status, attempts, detail, retryable, payload, resent_from, resent_at, attempt_trail",
        )
        .order("created_at", { ascending: false })
        .range(offset, offset + data.pageSize - 1),
    );
    if (error) throw new Error(error.message);

    const rows: DispatchLogRow[] = ((raw ?? []) as Record<string, unknown>[]).map((r) => ({
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
      resendable: Boolean(r.payload && typeof r.payload === "object" && r.user_id),
      resentFrom: (r.resent_from as string | null) ?? null,
      resentAt: (r.resent_at as string | null) ?? null,
      attemptTrail: normalizeTrail(r.attempt_trail),
    }));

    const counts = { sent, skipped, failed, total: totalRows };

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

    return {
      rows,
      templates,
      counts,
      hasMore: page < totalPages,
      page,
      pageSize: data.pageSize,
      totalRows,
      totalPages,
    };
  });


export type ResendDispatchResult = {
  ok: boolean;
  idempotencyKey: string;
  message: string;
};

/**
 * Queues a fresh dispatch of an audited notice.
 *
 * The replayed job carries a resend-scoped idempotency key derived from the
 * source row (`<original>:resend:<logId>`): it is distinct from the original —
 * so the provider does not dedupe it away — yet stable per audit row, so
 * clicking Resend twice on the same entry can never deliver two emails.
 */
export const resendDispatchJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => ({ id: String(input.id ?? "").trim() }))
  .handler(async ({ data, context }): Promise<ResendDispatchResult> => {
    await requireAdminPermission(context as never, "notifications");
    if (!/^[0-9a-f-]{36}$/i.test(data.id)) throw new Error("A valid log entry id is required.");

    const db = await serviceClient();
    const { data: row, error } = await db
      .from("notification_dispatch_log")
      .select("id, user_id, category, template, idempotency_key, label, payload")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("That dispatch log entry no longer exists.");

    const payload = (row.payload ?? null) as Record<string, unknown> | null;
    if (!payload || !row.user_id)
      throw new Error(
        "This entry was recorded before notice snapshots were stored, so it cannot be replayed.",
      );

    const idempotencyKey = resendIdempotencyKey(row.idempotency_key, String(row.id));
    const { dispatchInBackground } = await import("./email-dispatch.server");
    dispatchInBackground({
      userId: String(row.user_id),
      category: (payload.category as never) ?? (row.category as never),
      title: String(payload.title ?? row.label ?? "Notice"),
      detail: String(payload.detail ?? ""),
      tone: (payload.tone as never) ?? undefined,
      template: (payload.template as string | null) ?? undefined,
      templateData: (payload.templateData as Record<string, unknown> | null) ?? undefined,
      roundId: (payload.roundId as string | null) ?? undefined,
      raiseEvent: (payload.raiseEvent as string | null) ?? undefined,
      idempotencyKey,
      label: `${row.label ?? "notice"} (resend)`,
      resend: { fromId: String(row.id), by: context.userId },
    });

    return {
      ok: true,
      idempotencyKey,
      message: "Resend queued. Delivery runs in the background with retries.",
    };
  });
