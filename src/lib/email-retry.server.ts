// Server-only: automatic retry with exponential backoff for transactional sends.
// Retries are safe because every call passes a stable idempotency key, so
// Lovable dedupes duplicate accepted sends.

export type RetryableSendResult =
  | { sent: true; attempts: number }
  | { sent: false; attempts: number; reason: string; retryable: boolean };

export interface RetryOptions {
  /** Total attempts including the first one. */
  attempts?: number;
  /** Delay before the 2nd attempt in ms; doubles each retry. */
  baseDelayMs?: number;
  /** Upper bound for a single backoff wait. */
  maxDelayMs?: number;
  sleep?: (ms: number) => Promise<void>;
}

type ErrorLike = {
  code?: string;
  status?: number;
  retryAfterSeconds?: number | null;
  message?: string;
};

/** Terminal server-side states — retrying cannot help. */
const NON_RETRYABLE_CODES = new Set([
  "recipient_suppressed",
  "domain_not_verified",
  "emails_disabled",
  "invalid_recipient",
  "invalid_request",
]);

export function isRetryableEmailError(err: unknown): boolean {
  const e = (err ?? {}) as ErrorLike;
  if (e.code && NON_RETRYABLE_CODES.has(e.code)) return false;
  if (e.status === 429) return true;
  if (typeof e.status === "number" && e.status >= 400 && e.status < 500) return false;
  return true;
}

/** Full jitter exponential backoff, honouring a server-provided retry-after. */
export function computeBackoffMs(
  attempt: number,
  opts: { baseDelayMs: number; maxDelayMs: number; retryAfterSeconds?: number | null },
  random: () => number = Math.random,
): number {
  if (opts.retryAfterSeconds && opts.retryAfterSeconds > 0) {
    return Math.min(opts.retryAfterSeconds * 1000, opts.maxDelayMs);
  }
  const exponential = Math.min(opts.baseDelayMs * 2 ** (attempt - 1), opts.maxDelayMs);
  // Full jitter: pick somewhere in (half, full] of the window to avoid thundering herds.
  return Math.round(exponential * (0.5 + random() * 0.5));
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Sends a template email, automatically retrying transient failures
 * (network errors, 5xx, 429) with exponential backoff before giving up and
 * leaving the send to a manual admin resend.
 */
export async function sendTemplateEmailWithRetry(
  templateName: string,
  to: string,
  options: {
    templateData?: Record<string, unknown>;
    idempotencyKey?: string;
    replyTo?: string;
  } = {},
  retry: RetryOptions = {},
): Promise<RetryableSendResult> {
  const attempts = Math.max(1, retry.attempts ?? 4);
  const baseDelayMs = retry.baseDelayMs ?? 1000;
  const maxDelayMs = retry.maxDelayMs ?? 30000;
  const sleep = retry.sleep ?? defaultSleep;

  const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");

  let lastReason = "The email was not accepted for delivery.";
  let lastRetryable = true;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await sendTemplateEmail(templateName, to, options as never);
      if (res.sent) return { sent: true, attempts: attempt };
      // Suppression is a terminal, expected outcome — never retry around it.
      return { sent: false, attempts: attempt, reason: res.reason, retryable: false };
    } catch (err) {
      const e = (err ?? {}) as ErrorLike;
      lastReason = e.message ?? lastReason;
      lastRetryable = isRetryableEmailError(err);
      if (!lastRetryable || attempt === attempts) break;
      const waitMs = computeBackoffMs(attempt, {
        baseDelayMs,
        maxDelayMs,
        retryAfterSeconds: e.retryAfterSeconds ?? null,
      });
      console.warn(
        `[email-retry] ${templateName} attempt ${attempt}/${attempts} failed (${lastReason}); retrying in ${waitMs}ms`,
      );
      await sleep(waitMs);
    }
  }

  return { sent: false, attempts, reason: lastReason, retryable: lastRetryable };
}
