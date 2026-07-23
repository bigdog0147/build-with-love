// Server-only helper: table-based rate limiter for password reset requests.
// Never import from route/component modules directly — load inside
// server function handlers with `await import(...)`.

// Defaults are used when the corresponding env var is unset or invalid.
// Env vars (all optional, positive integers):
//   RESET_LIMIT_EMAIL_PER_HOUR   default 3
//   RESET_LIMIT_EMAIL_PER_DAY    default 8
//   RESET_LIMIT_IP_PER_HOUR      default 10
//   RESET_LIMIT_IP_PER_DAY       default 30
export const DEFAULT_LIMITS = {
  emailPerHour: 3,
  emailPerDay: 8,
  ipPerHour: 10,
  ipPerDay: 30,
} as const;

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function getLimits() {
  const env = (typeof process !== "undefined" ? process.env : {}) as Record<
    string,
    string | undefined
  >;
  return {
    emailPerHour: parsePositiveInt(env.RESET_LIMIT_EMAIL_PER_HOUR, DEFAULT_LIMITS.emailPerHour),
    emailPerDay: parsePositiveInt(env.RESET_LIMIT_EMAIL_PER_DAY, DEFAULT_LIMITS.emailPerDay),
    ipPerHour: parsePositiveInt(env.RESET_LIMIT_IP_PER_HOUR, DEFAULT_LIMITS.ipPerHour),
    ipPerDay: parsePositiveInt(env.RESET_LIMIT_IP_PER_DAY, DEFAULT_LIMITS.ipPerDay),
  };
}

/** @deprecated Use getLimits() so overrides apply. Kept for backwards compat. */
export const LIMITS = DEFAULT_LIMITS;

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export type LimiterInput = {
  emailHash: string;
  ip: string | null;
};

export type LimiterResult = {
  limited: boolean;
  reason?: string;
};

export async function checkAndRecordResetAttempt(
  input: LimiterInput,
): Promise<LimiterResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const now = Date.now();
  const hourAgo = new Date(now - HOUR_MS).toISOString();
  const dayAgo = new Date(now - DAY_MS).toISOString();

  const keys: Array<{ key_type: "email_hash" | "ip"; key_value: string }> = [
    { key_type: "email_hash", key_value: input.emailHash },
  ];
  if (input.ip) keys.push({ key_type: "ip", key_value: input.ip });

  // Count existing attempts per key over both windows.
  let limited = false;
  let reason: string | undefined;

  const limits = getLimits();
  for (const k of keys) {
    const hourLimit =
      k.key_type === "email_hash" ? limits.emailPerHour : limits.ipPerHour;
    const dayLimit =
      k.key_type === "email_hash" ? limits.emailPerDay : limits.ipPerDay;

    const [{ count: hourCount }, { count: dayCount }] = await Promise.all([
      supabaseAdmin
        .from("reset_rate_limits")
        .select("id", { count: "exact", head: true })
        .eq("key_type", k.key_type)
        .eq("key_value", k.key_value)
        .gte("attempted_at", hourAgo),
      supabaseAdmin
        .from("reset_rate_limits")
        .select("id", { count: "exact", head: true })
        .eq("key_type", k.key_type)
        .eq("key_value", k.key_value)
        .gte("attempted_at", dayAgo),
    ]);

    if ((hourCount ?? 0) >= hourLimit) {
      limited = true;
      reason = reason ?? `${k.key_type} hourly limit reached`;
    } else if ((dayCount ?? 0) >= dayLimit) {
      limited = true;
      reason = reason ?? `${k.key_type} daily limit reached`;
    }
  }

  // Always record the attempt (so a limited caller still consumes their budget).
  await supabaseAdmin.from("reset_rate_limits").insert(
    keys.map((k) => ({ key_type: k.key_type, key_value: k.key_value })),
  );

  // Opportunistic cleanup ~1% of calls.
  if (Math.random() < 0.01) {
    const cutoff = new Date(now - DAY_MS).toISOString();
    await supabaseAdmin
      .from("reset_rate_limits")
      .delete()
      .lt("attempted_at", cutoff);
  }

  return { limited, reason };
}
