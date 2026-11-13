/**
 * Pure builder for the investor-facing status history of a capital raising round.
 *
 * Every decision the desk or the investor made is derived from the timestamps
 * already stored on the round, the indication of interest and the commitment,
 * then sorted oldest-first so investors can audit the whole journey.
 */

import { change, changes, type RaiseHistoryChange } from "./raise-history-diff";

export type RaiseHistoryTone = "neutral" | "progress" | "success" | "warning";

export interface RaiseHistoryEvent {
  key: string;
  /** ISO timestamp, or null when the source row has no timestamp for the stage. */
  at: string | null;
  label: string;
  detail: string;
  actor: "Investor" | "Capital markets desk" | "System";
  tone: RaiseHistoryTone;
  /** Amount the event concerns, when money was involved. */
  amount?: number | null;
  /** Desk note recorded with the decision, kept separate from the detail copy. */
  note?: string | null;
  /** Source row reference so a downloaded confirmation can be traced back. */
  reference?: string | null;
  /** Decision events can be downloaded as a confirmation document. */
  downloadable?: boolean;
  /** Field-level before/after diff for the transition this event records. */
  changes?: RaiseHistoryChange[];
}

interface RoundLike {
  id?: string | null;
  name?: string | null;
  status: string;
  currency: string;
  opens_at?: string | null;
  closes_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface RowLike {
  id?: string | null;
  status: string;
  created_at?: string | null;
  reviewed_at?: string | null;
  updated_at?: string | null;
  review_note?: string | null;
  amount?: number | string | null;
  indicative_amount?: number | string | null;
  currency?: string | null;
}

const money = (value: unknown, currency: string) => {
  const n = Number(value ?? 0);
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${n.toLocaleString()} ${currency}`;
  }
};

const ROUND_STATUS: Record<string, { label: string; detail: string; tone: RaiseHistoryTone }> = {
  open: {
    label: "Round opened",
    detail: "The desk opened the round for indications of interest.",
    tone: "progress",
  },
  closed: {
    label: "Round closed",
    detail: "The round stopped accepting new indications of interest.",
    tone: "warning",
  },
  funded: {
    label: "Round fully funded",
    detail: "The target allocation was reached and capital is being deployed.",
    tone: "success",
  },
  draft: {
    label: "Round returned to draft",
    detail: "The desk paused the round while terms are revised.",
    tone: "neutral",
  },
};

const INTEREST_DECISION: Record<
  string,
  { label: string; detail: string; tone: RaiseHistoryTone }
> = {
  invited: {
    label: "Invitation to commit issued",
    detail: "The desk allocated capacity and invited you to confirm and fund a commitment.",
    tone: "success",
  },
  declined: {
    label: "Indication not progressed",
    detail: "The desk did not progress your indication for this round.",
    tone: "warning",
  },
  withdrawn: {
    label: "Indication withdrawn",
    detail: "You withdrew your indication of interest.",
    tone: "warning",
  },
};

const COMMITMENT_DECISION: Record<
  string,
  { label: string; detail: string; tone: RaiseHistoryTone; actor: RaiseHistoryEvent["actor"] }
> = {
  funded: {
    label: "Commitment funded",
    detail: "Your commitment amount was held from your wallet, pending desk acceptance.",
    tone: "progress",
    actor: "Investor",
  },
  accepted: {
    label: "Commitment accepted",
    detail: "The desk accepted your funded commitment and deployed the capital.",
    tone: "success",
    actor: "Capital markets desk",
  },
  released: {
    label: "Held amount released",
    detail: "The held amount was returned to your wallet in full.",
    tone: "warning",
    actor: "Capital markets desk",
  },
  cancelled: {
    label: "Commitment cancelled",
    detail: "The commitment was cancelled and no funds remain held.",
    tone: "warning",
    actor: "Investor",
  },
};

/** Oldest-first history of every past decision stage for one round. */
export function raiseHistory(input: {
  round: RoundLike;
  interest?: RowLike | null;
  commitment?: RowLike | null;
}): RaiseHistoryEvent[] {
  const { round, interest, commitment } = input;
  const currency = round.currency || "USD";
  const events: RaiseHistoryEvent[] = [];

  if (round.opens_at || round.status !== "draft") {
    events.push({
      key: "round-open",
      at: round.opens_at ?? round.created_at ?? null,
      label: ROUND_STATUS.open.label,
      detail: ROUND_STATUS.open.detail,
      actor: "Capital markets desk",
      tone: "progress",
      changes: changes(change("Round status", "draft", "open")),
    });
  }

  if (interest) {
    events.push({
      key: "interest-submitted",
      at: interest.created_at ?? null,
      label: "Indication of interest registered",
      detail: `You registered a non-binding indication of ${money(
        interest.indicative_amount ?? interest.amount,
        interest.currency || currency,
      )}.`,
      actor: "Investor",
      tone: "progress",
      changes: changes(
        change("Indication status", null, "pending"),
        change(
          "Indicative amount",
          null,
          money(interest.indicative_amount ?? interest.amount, interest.currency || currency),
        ),
      ),
    });

    const decision = INTEREST_DECISION[interest.status];
    if (decision) {
      events.push({
        key: `interest-${interest.status}`,
        at: interest.reviewed_at ?? interest.updated_at ?? null,
        label: decision.label,
        detail: decision.detail,
        actor: interest.status === "withdrawn" ? "Investor" : "Capital markets desk",
        tone: decision.tone,
        amount: Number(interest.indicative_amount ?? interest.amount ?? 0) || null,
        note: interest.review_note ?? null,
        reference: interest.id ?? null,
        downloadable: true,
        changes: changes(
          change("Indication status", "pending", interest.status),
          change("Desk note", null, interest.review_note ?? null),
        ),
      });
    }
  }

  if (commitment) {
    events.push({
      key: "commitment-created",
      at: commitment.created_at ?? null,
      label: "Commitment created",
      detail: `You confirmed a commitment of ${money(
        commitment.amount,
        commitment.currency || currency,
      )}, awaiting funding.`,
      actor: "Investor",
      tone: "progress",
      changes: changes(
        change("Commitment status", null, "pending"),
        change(
          "Commitment amount",
          null,
          money(commitment.amount, commitment.currency || currency),
        ),
      ),
    });

    const decision = COMMITMENT_DECISION[commitment.status];
    if (decision) {
      events.push({
        key: `commitment-${commitment.status}`,
        at: commitment.reviewed_at ?? commitment.updated_at ?? null,
        label: decision.label,
        detail: decision.detail,
        actor: decision.actor,
        tone: decision.tone,
        amount: Number(commitment.amount ?? 0) || null,
        note: commitment.review_note ?? null,
        reference: commitment.id ?? null,
        downloadable: true,
        changes: changes(
          change("Commitment status", "pending", commitment.status),
          change("Desk note", null, commitment.review_note ?? null),
        ),
      });
    }
  }

  const roundClose = ROUND_STATUS[round.status];
  if (roundClose && round.status !== "open") {
    events.push({
      key: `round-${round.status}`,
      at:
        (round.status === "closed" ? round.closes_at : null) ?? round.updated_at ?? round.closes_at ?? null,
      label: roundClose.label,
      detail: roundClose.detail,
      actor: "Capital markets desk",
      tone: roundClose.tone,
      reference: round.id ?? null,
      downloadable: true,
      changes: changes(change("Round status", "open", round.status)),
    });
  }

  return events.sort((a, b) => {
    if (!a.at) return 1;
    if (!b.at) return -1;
    return new Date(a.at).getTime() - new Date(b.at).getTime();
  });
}
