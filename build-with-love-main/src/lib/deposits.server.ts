/**
 * Server-only helpers for the customer deposit workflow.
 * Customers declare a deposit; an administrator confirms it before any wallet
 * balance moves, so a pending request never inflates the customer's balance.
 */
export type DepositStatus = "pending" | "approved" | "rejected" | "cancelled";
export type DepositMethod = "bank_transfer" | "card" | "crypto" | "wire";

export const DEPOSIT_METHODS: { value: DepositMethod; label: string }[] = [
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "wire", label: "International wire" },
  { value: "card", label: "Debit / credit card" },
  { value: "crypto", label: "Digital asset transfer" },
];

export const DEPOSIT_MIN = 100;
export const DEPOSIT_MAX = 10_000_000;

export type DepositRow = {
  id: string;
  user_id: string;
  wallet_id: string;
  transaction_id: string | null;
  amount: number;
  currency: string;
  method: DepositMethod;
  reference: string;
  proof_path: string | null;
  note: string | null;
  status: DepositStatus;
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export function methodLabel(method: string) {
  return DEPOSIT_METHODS.find((m) => m.value === method)?.label ?? method;
}

export function validateDepositInput(input: {
  walletId: string;
  amount: number;
  method: string;
  reference?: string;
  note?: string;
  proofPath?: string;
}) {
  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter an amount greater than zero.");
  if (amount < DEPOSIT_MIN) throw new Error(`The minimum deposit is ${DEPOSIT_MIN}.`);
  if (amount > DEPOSIT_MAX) throw new Error("That amount exceeds the per-request limit.");
  if (!input.walletId) throw new Error("Choose the wallet to fund.");
  const method = (DEPOSIT_METHODS.find((m) => m.value === input.method)?.value ??
    "bank_transfer") as DepositMethod;
  const reference = (input.reference ?? "").trim().slice(0, 120);
  if (reference && !/^[\w\s./-]{3,120}$/.test(reference))
    throw new Error("The payment reference contains unsupported characters.");
  const note = (input.note ?? "").trim().slice(0, 400);
  const proofPath = (input.proofPath ?? "").trim().slice(0, 400) || null;
  return { walletId: input.walletId, amount, method, reference, note, proofPath };
}

/** Records a pending inbound transaction so the ledger shows the expected credit. */
export async function insertPendingDepositTransaction(
  client: any,
  userId: string,
  row: { amount: number; currency: string; method: DepositMethod },
) {
  const { data, error } = await client
    .from("transactions")
    .insert({
      user_id: userId,
      name: `Deposit · ${methodLabel(row.method)}`,
      kind: "Deposit",
      amount: Math.abs(row.amount),
      currency: row.currency,
      status: "Pending",
      occurred_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function notifyDepositDecision(
  admin: any,
  userId: string,
  outcome: "approved" | "rejected",
  deposit: { amount: number; currency: string; method: string; reference: string },
  reviewNote: string,
) {
  const approved = outcome === "approved";
  const { dispatchNotification } = await import("./notification-dispatcher.server");
  try {
    await dispatchNotification({
      userId,
      category: "deposits",
      title: approved ? "Deposit confirmed" : "Deposit declined",
      detail: approved
        ? `Your deposit of ${deposit.amount} ${deposit.currency} has been credited to your wallet.`
        : `Your deposit of ${deposit.amount} ${deposit.currency} could not be confirmed. ${reviewNote}`.trim(),
      tone: approved ? "success" : "warning",
      template: "deposit-status",
      templateData: {
        outcome,
        amount: deposit.amount,
        currency: deposit.currency,
        method: methodLabel(deposit.method),
        reference: deposit.reference,
        reason: reviewNote,
      },
      idempotencyKey: `deposit-${outcome}-${userId}-${deposit.amount}-${deposit.currency}-${deposit.reference}`,
    });
  } catch (error) {
    console.error("Deposit decision notification failed", error);
  }
}
