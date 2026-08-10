/**
 * Sample scenarios for the "Raise timeline advance" email — one per capital
 * raise event type. Each scenario feeds the real stage machine
 * (`raiseAdvanceNotice`) so previews show exactly what investors receive.
 */
import { raiseAdvanceNotice } from "@/lib/raise-timeline";

export const RAISE_EMAIL_EVENTS = [
  "interest_submitted",
  "interest_invited",
  "interest_declined",
  "interest_withdrawn",
  "commitment_awaiting_funding",
  "commitment_funded",
  "commitment_accepted",
  "commitment_released",
  "commitment_cancelled",
  "interest_blocked_unverified",
] as const;

export type RaiseEmailEvent = (typeof RAISE_EMAIL_EVENTS)[number];

export const RAISE_EMAIL_EVENT_LABEL: Record<RaiseEmailEvent, string> = {
  interest_submitted: "Interest submitted",
  interest_invited: "Invited to commit",
  interest_declined: "Interest declined",
  interest_withdrawn: "Interest withdrawn",
  commitment_awaiting_funding: "Awaiting funding",
  commitment_funded: "Commitment funded",
  commitment_accepted: "Commitment accepted",
  commitment_released: "Capital released",
  commitment_cancelled: "Commitment cancelled",
  interest_blocked_unverified: "Blocked — identity unverified",
};

const SAMPLE = {
  roundName: "Gigafactory 3X — Series C",
  currency: "USD",
  amount: 500000,
  name: "Alex Morgan",
  at: "2026-05-14T09:30:00.000Z",
};

type TimelineInput = Parameters<typeof raiseAdvanceNotice>[0];

function inputFor(event: RaiseEmailEvent): TimelineInput {
  const base: TimelineInput = {
    roundStatus: "open",
    roundName: SAMPLE.roundName,
    currency: SAMPLE.currency,
    idStatus: "verified",
    interest: null,
    commitment: null,
  };
  const interest = (status: string, note?: string) => ({
    status,
    created_at: SAMPLE.at,
    review_note: note ?? null,
  });
  const commitment = (status: string, note?: string) => ({
    status,
    created_at: SAMPLE.at,
    review_note: note ?? null,
  });

  switch (event) {
    case "interest_submitted":
      return { ...base, interest: interest("submitted") };
    case "interest_invited":
      return { ...base, interest: interest("invited", "Capacity confirmed at the indicated size.") };
    case "interest_declined":
      return { ...base, interest: interest("declined", "Round oversubscribed at this ticket size.") };
    case "interest_withdrawn":
      return { ...base, interest: interest("withdrawn") };
    case "commitment_awaiting_funding":
      return { ...base, interest: interest("invited"), commitment: commitment("awaiting_funding") };
    case "commitment_funded":
      return { ...base, interest: interest("invited"), commitment: commitment("funded") };
    case "commitment_accepted":
      return {
        ...base,
        interest: interest("invited"),
        commitment: commitment("accepted", "Allocation finalised by the capital markets desk."),
      };
    case "commitment_released":
      return {
        ...base,
        interest: interest("invited"),
        commitment: commitment("released", "Held capital returned in full."),
      };
    case "commitment_cancelled":
      return {
        ...base,
        interest: interest("invited"),
        commitment: commitment("cancelled", "Cancelled at the investor's request."),
      };
    case "interest_blocked_unverified":
      return {
        ...base,
        idStatus: "under_review",
        interest: interest("invited"),
      };
  }
}

export type RaiseEmailVariables = {
  stageLabel: string;
  nextStep: string;
  roundName: string;
  currency: string;
  amount: number;
  ended: string;
  note: string;
  name: string;
  confirmationUrl: string;
  confirmationTitle: string;
};

/** Template props for one event, built from the live timeline stage machine. */
export function raiseEmailTemplateData(event: RaiseEmailEvent): RaiseEmailVariables {
  const input = inputFor(event);
  const notice = raiseAdvanceNotice(input);
  const note = input.commitment?.review_note ?? input.interest?.review_note ?? "";
  const showsConfirmation =
    event === "commitment_accepted" || event === "commitment_funded" || event === "commitment_released";

  return {
    stageLabel: notice.stageLabel,
    nextStep: notice.nextStep,
    roundName: SAMPLE.roundName,
    currency: SAMPLE.currency,
    amount: SAMPLE.amount,
    ended: notice.ended ?? "",
    note,
    name: SAMPLE.name,
    confirmationUrl: showsConfirmation
      ? "https://www.gf3x.space/api/public/raise-confirmation?token=sample-preview-token"
      : "",
    confirmationTitle: showsConfirmation ? `${SAMPLE.roundName} — decision confirmation` : "",
  };
}
