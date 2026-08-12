/**
 * Shared shape for the per-attempt trail stored on
 * `notification_dispatch_log.attempt_trail`.
 */

export type DispatchAttemptRow = {
  attempt: number;
  startedAt: string | null;
  durationMs: number | null;
  outcome: string;
  error: string | null;
  retryable: boolean;
  backoffMs: number | null;
};

export function normalizeAttemptTrail(raw: unknown): DispatchAttemptRow[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((e): e is Record<string, unknown> => Boolean(e) && typeof e === "object")
    .map((e, index) => ({
      attempt: Number(e['attempt'] ?? index + 1),
      startedAt: typeof e['startedAt'] === "string" ? e['startedAt'] : null,
      durationMs:
        e['durationMs'] === null || e['durationMs'] === undefined ? null : Number(e['durationMs']),
      outcome: String(e['outcome'] ?? "unknown"),
      error: typeof e['error'] === "string" ? e['error'] : null,
      retryable: Boolean(e['retryable']),
      backoffMs:
        e['backoffMs'] === null || e['backoffMs'] === undefined ? null : Number(e['backoffMs']),
    }))
    .sort((a, b) => a.attempt - b.attempt);
}
