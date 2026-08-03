/**
 * Server-only background dispatch for investor decision notices.
 *
 * Status changes (commitments, subscriptions) must never fail or stall because
 * the email API is slow, rate limited or temporarily down. Callers enqueue the
 * notice and return immediately; the job runs after the response using the
 * platform's `waitUntil` when available, with the retry/idempotency behaviour of
 * the underlying dispatcher.
 */
import type { DispatchInput, DispatchResult } from "./notification-dispatcher.server";

export type DispatchJob = DispatchInput & { label?: string };

export type JobOutcome =
  | { ok: true; label: string; result: DispatchResult }
  | { ok: false; label: string; error: string };

/** Runs jobs sequentially, isolating failures so one bad recipient never blocks the rest. */
export async function runDispatchJobs(
  jobs: DispatchJob[],
  dispatch: (input: DispatchInput) => Promise<DispatchResult>,
  log: (message: string, detail?: unknown) => void = console.error,
): Promise<JobOutcome[]> {
  const outcomes: JobOutcome[] = [];
  for (const job of jobs) {
    const label = job.label ?? job.idempotencyKey ?? job.template ?? job.category;
    try {
      const result = await dispatch(job);
      outcomes.push({ ok: true, label, result });
      if (!result.email && result.emailSkippedReason)
        log(`[dispatch] email not sent for ${label}: ${result.emailSkippedReason}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      outcomes.push({ ok: false, label, error: message });
      log(`[dispatch] job failed for ${label}`, message);
    }
  }
  return outcomes;
}

/** Cloudflare-style deferral when the runtime exposes it; otherwise a detached promise. */
function resolveWaitUntil(): ((p: Promise<unknown>) => void) | null {
  const candidates = [
    (globalThis as Record<string, any>)["__lovableExecutionContext"],
    (globalThis as Record<string, any>)["ctx"],
    (globalThis as Record<string, any>)["executionContext"],
  ];
  for (const c of candidates) {
    if (c && typeof c.waitUntil === "function") return (p) => c.waitUntil(p);
  }
  return null;
}

const inFlight = new Set<Promise<unknown>>();

function schedule(task: Promise<unknown>) {
  const tracked = task.catch((error) => {
    console.error("[dispatch] background task crashed", error);
  });
  inFlight.add(tracked);
  void tracked.finally(() => inFlight.delete(tracked));
  const waitUntil = resolveWaitUntil();
  if (waitUntil) waitUntil(tracked);
}

/**
 * Enqueue one or more decision notices. Returns synchronously; delivery happens
 * in the background with retries and idempotency keys already applied.
 */
export function dispatchInBackground(jobs: DispatchJob | DispatchJob[]): number {
  const list = Array.isArray(jobs) ? jobs : [jobs];
  if (list.length === 0) return 0;
  schedule(
    (async () => {
      const { dispatchNotification } = await import("./notification-dispatcher.server");
      await runDispatchJobs(list, dispatchNotification);
    })(),
  );
  return list.length;
}

/** Awaits every scheduled job — used by tests and by callers that need certainty. */
export async function flushBackgroundDispatch(): Promise<void> {
  while (inFlight.size > 0) {
    await Promise.all([...inFlight]);
  }
}
