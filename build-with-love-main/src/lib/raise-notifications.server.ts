/**
 * Server-only helper that turns a raise timeline advance into a
 * preference-aware, idempotent notice delivered in the background.
 *
 * Every stage change in the capital raising journey funnels through here so the
 * copy, the "raise" preference category, and the idempotency key format stay
 * consistent across investor- and desk-initiated advances.
 */
import { notifyInvestor } from "@/lib/investments.server";
import { raiseAdvanceNotice, type RaiseTimeline } from "@/lib/raise-timeline";

export type RaiseAdvanceInput = {
  userId: string;
  roundId: string;
  roundName: string;
  roundStatus: string;
  currency: string;
  idStatus?: string;
  interestStatus?: string | null;
  commitmentStatus?: string | null;
  amount?: number | null;
  note?: string | null;
  /** Distinguishes the advance in the idempotency key (e.g. "interest-submitted"). */
  event: string;
  tone?: "info" | "success" | "warning" | "danger";
  /** Reference printed on the confirmation document (commitment/interest id). */
  reference?: string;
  /** Who recorded the decision, printed on the confirmation document. */
  actor?: string;
  decidedAt?: string;
};

/** Human copy for the in-app notice; the email uses the same stage + next step. */
function detailFor(stageLabel: string, nextStep: string, ended: RaiseTimeline["ended"] | undefined, roundName: string) {
  if (ended === "withdrawn") return `Your indication of interest in ${roundName} has been withdrawn.`;
  if (ended === "cancelled") return `Your commitment to ${roundName} has been cancelled and no capital is held.`;
  return `${roundName} — ${stageLabel}. Next step: ${nextStep}`;
}

export async function notifyRaiseAdvance(input: RaiseAdvanceInput) {
  const advance = raiseAdvanceNotice({
    roundStatus: input.roundStatus,
    roundName: input.roundName,
    currency: input.currency,
    idStatus: input.idStatus ?? "verified",
    interest: input.interestStatus ? { status: input.interestStatus } : null,
    commitment: input.commitmentStatus ? { status: input.commitmentStatus } : null,
  });

  await notifyInvestor({
    userId: input.userId,
    category: "raise",
    title: `Capital raise: ${advance.stageLabel}`,
    detail: detailFor(advance.stageLabel, advance.nextStep, advance.ended, input.roundName),
    tone: input.tone ?? (advance.ended ? "warning" : "info"),
    template: "raise-timeline-advance",
    templateData: {
      stageLabel: advance.stageLabel,
      nextStep: advance.nextStep,
      roundName: input.roundName,
      currency: input.currency,
      amount: input.amount ?? undefined,
      ended: advance.ended ?? "",
      note: input.note || "",
    },
    roundId: input.roundId,
    raiseEvent: input.event,
    // Email attachments are unsupported, so the identical confirmation document
    // is folded in as a signed, per-recipient download link.
    confirmation: {
      kind: input.event,
      reference: input.reference || `${input.roundId}-${input.event}`,
      roundName: input.roundName,
      currency: input.currency,
      investorName: "",
      amount: input.amount ?? null,
      decidedAt: input.decidedAt ?? new Date().toISOString(),
      actor: input.actor || "Capital markets desk",
      headline: advance.stageLabel,
      detail: detailFor(advance.stageLabel, advance.nextStep, advance.ended, input.roundName),
      note: input.note ?? null,
    },
    idempotencyKey: `raise-advance-${input.roundId}-${input.userId}-${input.event}`,
  });
}
