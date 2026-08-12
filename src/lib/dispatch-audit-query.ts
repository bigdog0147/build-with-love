import { normalizeAttemptTrail, type DispatchAttemptRow } from "./dispatch-attempts";

/**
 * Shared query pieces for the `notification_dispatch_log` audit reads: the
 * column list, the day-boundary parser, the filter applier used by both the
 * paged viewer and the filtered CSV export, and the row mapper.
 */

export const DISPATCH_STATUSES = ["sent", "skipped", "failed"] as const;
export type DispatchStatus = (typeof DISPATCH_STATUSES)[number];

export const DISPATCH_LOG_COLUMNS =
  "id, created_at, user_id, category, template, idempotency_key, label, status, attempts, detail, retryable, payload, resent_from, resent_at, attempt_trail";

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

export type DispatchFilters = {
  template: string;
  /** Multi-select outcomes; empty means "all outcomes". */
  statuses: DispatchStatus[];
  from: string | null;
  to: string | null;
  idempotencyKey: string;
};

export type DispatchFilterInput = {
  template?: string;
  /** Legacy single-select outcome, still accepted. */
  status?: string;
  statuses?: string[];
  from?: string;
  to?: string;
  idempotencyKey?: string;
};

/** Normalizes a `YYYY-MM-DD` input into an ISO instant, or null when unusable. */
export function isoDayBoundary(value: string | undefined, endOfDay: boolean) {
  const raw = (value ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const d = new Date(`${raw}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Validates raw client filter input into the shared filter shape. */
export function parseDispatchFilters(input: DispatchFilterInput): DispatchFilters {
  const raw = [...(input.statuses ?? []), ...(input.status ? [input.status] : [])];
  const statuses = DISPATCH_STATUSES.filter((s) => raw.includes(s));
  return {
    template: (input.template ?? "").trim().slice(0, 120),
    statuses,
    from: isoDayBoundary(input.from, false),
    to: isoDayBoundary(input.to, true),
    idempotencyKey: (input.idempotencyKey ?? "").trim().slice(0, 200),
  };
}

/**
 * Applies the active filters to any PostgREST builder for this table.
 * Pass `skipStatus` when the caller already constrains the outcome itself
 * (used by the per-outcome count queries).
 */
export function applyDispatchFilters<T>(builder: T, f: DispatchFilters, skipStatus = false): T {
  let q = builder as never as {
    eq: (c: string, v: unknown) => typeof q;
    in: (c: string, v: unknown[]) => typeof q;
    gte: (c: string, v: unknown) => typeof q;
    lte: (c: string, v: unknown) => typeof q;
    ilike: (c: string, v: string) => typeof q;
  };
  if (f.template) q = q.eq("template", f.template);
  if (!skipStatus && f.statuses.length && f.statuses.length < DISPATCH_STATUSES.length)
    q = q.in("status", f.statuses);
  if (f.from) q = q.gte("created_at", f.from);
  if (f.to) q = q.lte("created_at", f.to);
  if (f.idempotencyKey) q = q.ilike("idempotency_key", `%${f.idempotencyKey}%`);
  return q as never as T;
}


export function mapDispatchLogRow(r: Record<string, unknown>): DispatchLogRow {
  return {
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
    attemptTrail: normalizeAttemptTrail(r.attempt_trail),
  };
}
