// Server-only helpers for the customer withdrawal workflow.
// Kept out of *.functions.ts so the server-fn splitter cannot drop them.

export type WithdrawalStatus = "pending" | "approved" | "rejected" | "cancelled";
export type WithdrawalDestination = "bank_account" | "external_wallet";

export type WithdrawalRow = {
  id: string;
  user_id: string;
  wallet_id: string;
  transaction_id: string | null;
  amount: number;
  currency: string;
  destination_type: WithdrawalDestination;
  destination_label: string;
  destination_details: string;
  note: string | null;
  status: WithdrawalStatus;
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export const WITHDRAWAL_MIN = 10;
export const WITHDRAWAL_MAX = 5_000_000;

export function validateWithdrawalInput(input: {
  walletId: string;
  amount: number;
  destinationType: string;
  destinationLabel: string;
  destinationDetails?: string;
  note?: string;
}) {
  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter an amount greater than zero.");
  if (amount < WITHDRAWAL_MIN) throw new Error(`The minimum withdrawal is ${WITHDRAWAL_MIN}.`);
  if (amount > WITHDRAWAL_MAX) throw new Error("That amount exceeds the per-request limit.");
  if (!input.walletId) throw new Error("Choose a wallet to withdraw from.");
  const destinationType =
    input.destinationType === "external_wallet" ? "external_wallet" : "bank_account";
  const destinationLabel = (input.destinationLabel ?? "").trim();
  if (destinationLabel.length < 2) throw new Error("Name the destination account.");
  if (destinationLabel.length > 120) throw new Error("Destination name is too long.");
  const raw = (input.destinationDetails ?? "").trim();
  if (raw.length > 140) throw new Error("Destination details are too long.");
  const note = (input.note ?? "").trim().slice(0, 400);
  return {
    walletId: input.walletId,
    amount,
    destinationType: destinationType as WithdrawalDestination,
    destinationLabel,
    destinationDetails: maskDestination(raw),
    note,
  };
}

/** Never persist full account numbers — keep the last four characters only. */
export function maskDestination(value: string) {
  const clean = value.replace(/\s+/g, "");
  if (!clean) return "";
  if (clean.length <= 4) return `•••• ${clean}`;
  return `•••• ${clean.slice(-4)}`;
}

/** Debit or credit a wallet, keeping its USD estimate proportional. */
export async function moveWalletBalance(
  client: any,
  userId: string,
  walletId: string,
  delta: number,
) {
  const { data: wallet, error } = await client
    .from("wallets")
    .select("*")
    .eq("id", walletId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!wallet) throw new Error("Wallet not found.");

  const balance = Number(wallet.balance);
  const next = balance + delta;
  if (next < 0) throw new Error("Insufficient available balance in this wallet.");

  const ratio = balance > 0 && wallet.fiat_value != null ? Number(wallet.fiat_value) / balance : null;
  const patch: Record<string, number> = { balance: next };
  if (ratio != null) patch.fiat_value = Number((next * ratio).toFixed(2));

  const { error: upErr } = await client
    .from("wallets")
    .update(patch)
    .eq("id", walletId)
    .eq("user_id", userId);
  if (upErr) throw new Error(upErr.message);
  return wallet as { code: string; label: string; balance: number };
}

export async function insertHeldTransaction(
  client: any,
  userId: string,
  row: { name: string; amount: number; currency: string },
) {
  const { data, error } = await client
    .from("transactions")
    .insert({
      user_id: userId,
      name: row.name,
      kind: "Withdrawal",
      amount: -Math.abs(row.amount),
      currency: row.currency,
      status: "Pending",
      occurred_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function setTransactionStatus(client: any, transactionId: string | null, status: string) {
  if (!transactionId) return;
  await client.from("transactions").update({ status }).eq("id", transactionId);
}

export async function notifyWithdrawalDecision(
  admin: any,
  userId: string,
  outcome: "approved" | "rejected",
  amount: number,
  currency: string,
  reviewNote: string,
) {
  const approved = outcome === "approved";
  const { dispatchNotification } = await import("./notification-dispatcher.server");
  try {
    await dispatchNotification({
      userId,
      category: "withdrawals",
      title: approved ? "Withdrawal approved" : "Withdrawal declined",
      detail: approved
        ? `Your withdrawal of ${amount} ${currency} was approved and is being settled.`
        : `Your withdrawal of ${amount} ${currency} was declined. ${reviewNote}`.trim(),
      tone: approved ? "success" : "warning",
      template: "withdrawal-status",
      templateData: { outcome, amount, currency, reason: reviewNote },
      idempotencyKey: `withdrawal-${outcome}-${userId}-${amount}-${currency}`,
    });
  } catch (err) {
    console.error("Withdrawal decision notification failed", err);
  }
}
