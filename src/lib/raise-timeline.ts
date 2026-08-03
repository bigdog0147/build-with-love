/**
 * Pure stage machine for the capital raising journey. Given an investor's
 * interest and commitment for a round, it returns the five-step timeline and
 * the single next action the investor should take.
 */

export type RaiseStageState = "done" | "current" | "upcoming" | "blocked";

export interface RaiseStage {
  key: string;
  label: string;
  detail: string;
  state: RaiseStageState;
  at?: string | null;
}

export interface RaiseTimeline {
  stages: RaiseStage[];
  nextStep: string;
  /** Set when the journey ended without deployment (declined, released, cancelled). */
  ended?: "declined" | "withdrawn" | "released" | "cancelled";
}

interface InterestLike {
  status: string;
  created_at?: string | null;
  review_note?: string | null;
}
interface CommitmentLike {
  status: string;
  created_at?: string | null;
  review_note?: string | null;
}

export function raiseTimeline(input: {
  roundStatus: string;
  roundName?: string;
  currency: string;
  idStatus: string;
  interest?: InterestLike | null;
  commitment?: CommitmentLike | null;
}): RaiseTimeline {
  const { interest, commitment, currency, idStatus, roundStatus } = input;
  const iStatus = interest?.status ?? null;
  const cStatus = commitment?.status ?? null;
  const verified = idStatus === "verified";

  const stages: RaiseStage[] = [
    {
      key: "interest",
      label: "Register interest",
      detail: "Submit a non-binding indication of the amount you would consider.",
      state: "upcoming",
      at: interest?.created_at ?? null,
    },
    {
      key: "review",
      label: "Desk review",
      detail: "The capital markets desk reviews your indication and allocates capacity.",
      state: "upcoming",
    },
    {
      key: "fund",
      label: "Confirm & fund",
      detail: `Confirm your amount and fund it from a ${currency} wallet. The amount is held, not spent.`,
      state: "upcoming",
      at: commitment?.created_at ?? null,
    },
    {
      key: "accept",
      label: "Desk acceptance",
      detail: "The desk accepts the funded commitment, usually within two business days.",
      state: "upcoming",
    },
    {
      key: "deployed",
      label: "Capital deployed",
      detail: "Your capital is deployed and the position appears in your portfolio.",
      state: "upcoming",
    },
  ];

  const set = (key: string, state: RaiseStageState) => {
    const stage = stages.find((s) => s.key === key);
    if (stage) stage.state = state;
  };

  // No interest yet.
  if (!iStatus) {
    set("interest", roundStatus === "open" ? "current" : "blocked");
    return {
      stages,
      nextStep:
        roundStatus === "open"
          ? "Register a non-binding indication of interest to start the process."
          : "This round is not currently accepting new indications of interest.",
    };
  }

  set("interest", "done");

  if (iStatus === "withdrawn") {
    set("review", "blocked");
    return {
      stages,
      nextStep: "You withdrew your interest. Register again while the round remains open.",
      ended: "withdrawn",
    };
  }
  if (iStatus === "declined") {
    set("review", "blocked");
    return {
      stages,
      nextStep:
        "The desk did not progress your interest in this round. You remain eligible for future rounds.",
      ended: "declined",
    };
  }
  if (iStatus === "submitted") {
    set("review", "current");
    return {
      stages,
      nextStep:
        "No action needed. The desk is reviewing your indication and will email you with a decision.",
    };
  }

  // Invited from here on.
  set("review", "done");

  if (!cStatus || cStatus === "cancelled") {
    set("fund", verified ? "current" : "blocked");
    return {
      stages,
      nextStep: verified
        ? "You are invited to commit. Confirm your amount and fund it from your wallet below."
        : "Identity verification must be approved before you can fund a commitment.",
      ...(cStatus === "cancelled" ? { ended: "cancelled" as const } : {}),
    };
  }

  if (cStatus === "awaiting_funding") {
    set("fund", verified ? "current" : "blocked");
    return {
      stages,
      nextStep: verified
        ? "Confirm the amount and fund your commitment below. The funds are held until the desk accepts."
        : "Identity verification must be approved before you can fund a commitment.",
    };
  }

  set("fund", "done");

  if (cStatus === "funded") {
    set("accept", "current");
    return {
      stages,
      nextStep:
        "No action needed. Your funds are held while the desk finalises acceptance — you will be emailed either way.",
    };
  }

  if (cStatus === "released") {
    set("accept", "blocked");
    return {
      stages,
      nextStep: "The held amount has been returned to your wallet in full.",
      ended: "released",
    };
  }

  // accepted
  set("accept", "done");
  set("deployed", "done");
  return {
    stages,
    nextStep: "Your capital is deployed. Track performance in Portfolio and export a statement any time.",
  };
}

/**
 * Notice-friendly view of a timeline transition: the stage the investor is now on
 * and the highlighted next step, so alerts say exactly what the portal shows.
 */
export function raiseAdvanceNotice(input: Parameters<typeof raiseTimeline>[0]): {
  stageLabel: string;
  nextStep: string;
  ended?: RaiseTimeline["ended"];
} {
  const timeline = raiseTimeline(input);
  const stage =
    timeline.stages.find((s) => s.state === "current") ??
    [...timeline.stages].reverse().find((s) => s.state === "done");
  return {
    stageLabel: stage?.label ?? "Capital raise",
    nextStep: timeline.nextStep,
    ...(timeline.ended ? { ended: timeline.ended } : {}),
  };
}
