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
import { computeBackoffMs, isRetryableEmailError } from "./email-retry.server";
import type { DispatchFailureReport } from "./email-dispatch-report.server";
import type { DispatchAttempt, DispatchAuditRecord } from "./email-dispatch-audit.server";

export type DispatchJob = DispatchInput & {
  label?: string;
  /** Set when this job was queued by an admin resend from the audit log. */
  resend?: { fromId: string; by?: string | null } | null;
};

/** Snapshot stored on the audit row so a later resend can replay the notice. */
function auditPayload(job: DispatchJob): Record<string, unknown> {
  return {
    category: job.category,
    title: job.title,
    detail: job.detail,
    tone: job.tone ?? null,
    template: job.template ?? null,
    templateData: job.templateData ?? null,
    roundId: job.roundId ?? null,
    raiseEvent: job.raiseEvent ?? null,
  };
}

export type JobOutcome =
  | { ok: true; label: string; result: DispatchResult; attempts: number }
  | { ok: false; label: string; error: string; attempts: number; retryable: boolean };

export type RunOptions = {
  /** Total attempts per job, including the first one. */
  attempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  sleep?: (ms: number) => Promise<void>;
  /** Called once per job that never succeeded, after all retries. */
  report?: (report: DispatchFailureReport) => Promise<unknown> | unknown;
  /** Called once per finished job with the audit record (sent / skipped / failed). */
  audit?: (record: DispatchAuditRecord) => Promise<unknown> | unknown;
};

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function reportFailure(
  options: RunOptions,
  report: DispatchFailureReport,
): Promise<void> {
  try {
    if (options.report) {
      await options.report(report);
      return;
    }
    const { reportDispatchFailure } = await import("./email-dispatch-report.server");
    await reportDispatchFailure(report);
  } catch (error) {
    console.error("[dispatch] failure reporting failed", error);
  }
}

/** Writes one audit row per finished job; never blocks or fails the dispatch. */
async function audit(options: RunOptions, record: DispatchAuditRecord): Promise<void> {
  try {
    if (options.audit) {
      await options.audit(record);
      return;
    }
    const { recordDispatchAudit } = await import("./email-dispatch-audit.server");
    await recordDispatchAudit(record);
  } catch (error) {
    console.error("[dispatch] audit logging failed", error);
  }
}


/**
 * Runs jobs sequentially, isolating failures so one bad recipient never blocks
 * the rest. Each job is retried with jittered exponential backoff while the
 * failure looks transient (network error, 5xx, 429, retryable email outcome);
 * terminal outcomes such as suppression or an opt-out are accepted immediately.
 * Idempotency keys are passed through untouched, so a retry can never duplicate
 * an accepted send. Jobs that still fail are reported for manual resend.
 */
export async function runDispatchJobs(
  jobs: DispatchJob[],
  dispatch: (input: DispatchInput) => Promise<DispatchResult>,
  log: (message: string, detail?: unknown) => void = console.error,
  options: RunOptions = {},
): Promise<JobOutcome[]> {
  const maxAttempts = Math.max(1, options.attempts ?? 3);
  const baseDelayMs = options.baseDelayMs ?? 1000;
  const maxDelayMs = options.maxDelayMs ?? 30000;
  const sleep = options.sleep ?? defaultSleep;

  const outcomes: JobOutcome[] = [];
  for (const job of jobs) {
    const label = job.label ?? job.idempotencyKey ?? job.template ?? job.category;
    let lastError = "The notice was not delivered.";
    let retryable = true;
    let attempt = 0;
    // One entry per attempt: outcome, duration, failure reason and the backoff
    // that was waited before the next pass — surfaced in the admin audit viewer.
    const trail: DispatchAttempt[] = [];
    let attemptStart = 0;
    const trace = (entry: Omit<DispatchAttempt, "attempt" | "startedAt" | "durationMs">) => {
      trail.push({
        attempt,
        startedAt: new Date(attemptStart).toISOString(),
        durationMs: Math.max(0, Date.now() - attemptStart),
        ...entry,
      });
    };

    while (attempt < maxAttempts) {
      attempt += 1;
      attemptStart = Date.now();
      let waitMs: number | null = null;
      try {
        const result = await dispatch(job);
        if (!result.email && result.emailSkippedReason)
          log(`[dispatch] email not sent for ${label}: ${result.emailSkippedReason}`);
        // A transient email failure inside the dispatcher is worth another pass;
        // the in-app notice is idempotent per attempt via the dedupe key.
        if (result.emailRetryable && !result.email && attempt < maxAttempts) {
          lastError = result.emailSkippedReason ?? lastError;
          retryable = true;
          waitMs = computeBackoffMs(attempt, { baseDelayMs, maxDelayMs });
          trace({ outcome: "retry", error: lastError, retryable: true, backoffMs: waitMs });
        } else {
          const emailFailed = Boolean(result.emailRetryable && !result.email);
          trace({
            outcome: emailFailed ? "failed" : result.email ? "sent" : "skipped",
            error: emailFailed || !result.email ? (result.emailSkippedReason ?? null) : null,
            retryable: emailFailed,
            backoffMs: null,
          });
          outcomes.push({ ok: true, label, result, attempts: attempt });
          if (emailFailed) {
            await reportFailure(options, {
              label,
              userId: job.userId,
              category: job.category,
              template: job.template,
              idempotencyKey: job.idempotencyKey,
              attempts: attempt,
              error: result.emailSkippedReason ?? lastError,
              retryable: true,
            });
          }
          await audit(options, {
            label,
            userId: job.userId,
            category: job.category,
            template: job.template,
            idempotencyKey: job.idempotencyKey,
            status: emailFailed ? "failed" : result.email ? "sent" : "skipped",
            payload: auditPayload(job),
            resentFrom: job.resend?.fromId ?? null,
            resentBy: job.resend?.by ?? null,
            attempts: attempt,
            detail: result.email
              ? null
              : (result.emailSkippedReason ?? (job.template ? lastError : "in_app_only")),
            retryable: emailFailed,
            trail,
          });
          break;

        }

      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        retryable = isRetryableEmailError(error);
        log(`[dispatch] attempt ${attempt}/${maxAttempts} failed for ${label}`, lastError);
        if (!retryable || attempt === maxAttempts) {
          trace({ outcome: "failed", error: lastError, retryable, backoffMs: null });
          outcomes.push({ ok: false, label, error: lastError, attempts: attempt, retryable });
          await reportFailure(options, {
            label,
            userId: job.userId,
            category: job.category,
            template: job.template,
            idempotencyKey: job.idempotencyKey,
            attempts: attempt,
            error: lastError,
            retryable,
          });
          await audit(options, {
            label,
            userId: job.userId,
            category: job.category,
            template: job.template,
            idempotencyKey: job.idempotencyKey,
            status: "failed",
            attempts: attempt,
            detail: lastError,
            retryable,
            trail,
            payload: auditPayload(job),
            resentFrom: job.resend?.fromId ?? null,
            resentBy: job.resend?.by ?? null,
          });
          break;

        }
        waitMs = computeBackoffMs(
          attempt,
          {
            baseDelayMs,
            maxDelayMs,
            retryAfterSeconds:
              (error as { retryAfterSeconds?: number | null } | null)?.retryAfterSeconds ?? null,
          },
        );
        trace({ outcome: "retry", error: lastError, retryable, backoffMs: waitMs });
      }

      if (waitMs !== null) {
        log(`[dispatch] retrying ${label} in ${waitMs}ms`);
        await sleep(waitMs);
      }
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
