/**
 * Server-only rule-based fraud scoring.
 *
 * Every money movement is scored before it is accepted. Rules are configurable
 * rows in `risk_rules` (weight + threshold), so the compliance desk can retune
 * the engine without a deploy. Scores map to bands: allow / review / block.
 */
import { serviceClient } from "./admin-guard.server";

export type RiskBand = "allow" | "review" | "block";

export type RiskInput = {
  userId: string;
  kind: "deposit" | "withdrawal" | "conversion" | "transfer" | "investment";
  amount: number;
  currency: string;
  ip?: string | null;
  userAgent?: string | null;
  subjectType?: string;
  subjectId?: string;
};

export type TriggeredRule = { key: string; label: string; weight: number; detail: string };

export type RiskAssessment = {
  score: number;
  band: RiskBand;
  triggered: TriggeredRule[];
  eventId: string | null;
};

export const REVIEW_AT = 40;
export const BLOCK_AT = 75;

export function bandForScore(score: number): RiskBand {
  if (score >= BLOCK_AT) return "block";
  if (score >= REVIEW_AT) return "review";
  return "allow";
}

type Rule = { key: string; label: string; weight: number; threshold: number; is_enabled: boolean };

const FALLBACK_RULES: Rule[] = [
  { key: "velocity_24h", label: "High request velocity", weight: 25, threshold: 5, is_enabled: true },
  { key: "amount_spike", label: "Amount far above customer average", weight: 30, threshold: 5, is_enabled: true },
  { key: "new_account", label: "Very new account", weight: 15, threshold: 3, is_enabled: true },
  { key: "unverified_identity", label: "Identity not verified", weight: 35, threshold: 0, is_enabled: true },
  { key: "ip_change", label: "New IP address for this customer", weight: 15, threshold: 0, is_enabled: true },
  { key: "round_amount", label: "Suspiciously round large amount", weight: 10, threshold: 10000, is_enabled: true },
];

async function loadRules(db: any): Promise<Rule[]> {
  const { data } = await db.from("risk_rules").select("key, label, weight, threshold, is_enabled");
  const rows = (data ?? []) as Rule[];
  if (rows.length === 0) return FALLBACK_RULES;
  const byKey = new Map(rows.map((r) => [r.key, r]));
  return FALLBACK_RULES.map((fallback) => byKey.get(fallback.key) ?? fallback).filter((r) => r.is_enabled);
}

/** Scores an attempted money movement and records the assessment. */
export async function assessRisk(input: RiskInput): Promise<RiskAssessment> {
  const db = await serviceClient();
  const rules = await loadRules(db);
  const triggered: TriggeredRule[] = [];
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [{ data: recent }, { data: history }, { data: kyc }, { data: lastEvent }] = await Promise.all([
    db.from("risk_events").select("id").eq("user_id", input.userId).gte("created_at", since),
    db
      .from("transactions")
      .select("amount")
      .eq("user_id", input.userId)
      .order("occurred_at", { ascending: false })
      .limit(25),
    db.from("kyc_profiles").select("id_status, created_at").eq("user_id", input.userId).maybeSingle(),
    db
      .from("risk_events")
      .select("ip")
      .eq("user_id", input.userId)
      .not("ip", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const rule = (key: string) => rules.find((r) => r.key === key);

  const velocity = rule("velocity_24h");
  if (velocity && (recent?.length ?? 0) >= velocity.threshold) {
    triggered.push({
      key: velocity.key,
      label: velocity.label,
      weight: velocity.weight,
      detail: `${recent?.length ?? 0} scored requests in the last 24 hours (threshold ${velocity.threshold}).`,
    });
  }

  const spike = rule("amount_spike");
  const amounts = ((history ?? []) as { amount: number }[]).map((t) => Math.abs(Number(t.amount)));
  const average = amounts.length ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0;
  if (spike && average > 0 && input.amount > average * spike.threshold) {
    triggered.push({
      key: spike.key,
      label: spike.label,
      weight: spike.weight,
      detail: `${input.amount} ${input.currency} is over ${spike.threshold}× the customer's ${average.toFixed(2)} average.`,
    });
  }

  const fresh = rule("new_account");
  const createdAt = kyc?.created_at ? new Date(kyc.created_at).getTime() : null;
  const ageDays = createdAt ? (Date.now() - createdAt) / 86_400_000 : null;
  if (fresh && ageDays != null && ageDays < fresh.threshold) {
    triggered.push({
      key: fresh.key,
      label: fresh.label,
      weight: fresh.weight,
      detail: `Account is ${ageDays.toFixed(1)} days old (threshold ${fresh.threshold} days).`,
    });
  }

  const unverified = rule("unverified_identity");
  if (unverified && kyc?.id_status !== "verified") {
    triggered.push({
      key: unverified.key,
      label: unverified.label,
      weight: unverified.weight,
      detail: `Identity status is ${kyc?.id_status ?? "not_started"}.`,
    });
  }

  const ipRule = rule("ip_change");
  if (ipRule && input.ip && lastEvent?.ip && lastEvent.ip !== input.ip) {
    triggered.push({
      key: ipRule.key,
      label: ipRule.label,
      weight: ipRule.weight,
      detail: `Request came from ${input.ip}; the previous request came from ${lastEvent.ip}.`,
    });
  }

  const round = rule("round_amount");
  if (round && input.amount >= round.threshold && input.amount % 1000 === 0) {
    triggered.push({
      key: round.key,
      label: round.label,
      weight: round.weight,
      detail: `${input.amount} ${input.currency} is a round amount at or above ${round.threshold}.`,
    });
  }

  const score = Math.min(100, triggered.reduce((sum, t) => sum + t.weight, 0));
  const band = bandForScore(score);

  const { data: event } = await db
    .from("risk_events")
    .insert({
      user_id: input.userId,
      kind: input.kind,
      amount: input.amount,
      currency: input.currency,
      score,
      band,
      triggered: triggered as never,
      context: { average, recentCount: recent?.length ?? 0 } as never,
      ip: input.ip ?? null,
      user_agent: input.userAgent ?? null,
      subject_type: input.subjectType ?? null,
      subject_id: input.subjectId ?? null,
      decision: band === "block" ? "blocked" : band === "review" ? "pending" : "auto_allowed",
    })
    .select("id")
    .maybeSingle();

  return { score, band, triggered, eventId: event?.id ?? null };
}

/** Convenience guard: throws a customer-safe message when a request is blocked. */
export async function assertNotBlocked(input: RiskInput): Promise<RiskAssessment> {
  const assessment = await assessRisk(input);
  if (assessment.band === "block") {
    throw new Error(
      "This request was stopped by our fraud controls. Contact support and quote your account reference to continue.",
    );
  }
  return assessment;
}
