import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type AmountInput = { walletId: string; amount: number; note?: string };

function validAmount(n: unknown) {
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) throw new Error("Enter an amount greater than zero.");
  return v;
}

/** Adjust a wallet's balance (and its USD estimate proportionally). */
async function adjustWallet(
  supabase: any,
  userId: string,
  walletId: string,
  delta: number,
) {
  const { data: wallet, error } = await supabase
    .from("wallets")
    .select("*")
    .eq("id", walletId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!wallet) throw new Error("Wallet not found.");

  const balance = Number(wallet.balance);
  const next = balance + delta;
  if (next < 0) throw new Error("Insufficient balance in this wallet.");

  const ratio = balance > 0 && wallet.fiat_value != null ? Number(wallet.fiat_value) / balance : null;
  const patch: Record<string, number> = { balance: next };
  if (ratio != null) patch.fiat_value = Number((next * ratio).toFixed(2));

  const { error: upErr } = await supabase.from("wallets").update(patch).eq("id", walletId).eq("user_id", userId);
  if (upErr) throw new Error(upErr.message);
  return wallet;
}

async function logTransaction(
  supabase: any,
  userId: string,
  row: { name: string; kind: string; amount: number; currency: string; status?: string },
) {
  const { error } = await supabase.from("transactions").insert({
    user_id: userId,
    name: row.name,
    kind: row.kind,
    amount: row.amount,
    currency: row.currency,
    status: row.status ?? "Cleared",
    occurred_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

export const transferFunds = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: AmountInput & { recipient: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const amount = validAmount(data.amount);
    const recipient = (data.recipient ?? "").trim();
    if (recipient.length < 2) throw new Error("Enter a recipient name or account.");
    const wallet = await adjustWallet(supabase, userId, data.walletId, -amount);
    await logTransaction(supabase, userId, {
      name: `Transfer to ${recipient}`,
      kind: "Outgoing transfer",
      amount: -amount,
      currency: wallet.code,
      status: "Pending",
    });
    return { ok: true as const, message: `Transfer of ${amount} ${wallet.code} submitted.` };
  });

export const depositFunds = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: AmountInput & { source: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const amount = validAmount(data.amount);
    const wallet = await adjustWallet(supabase, userId, data.walletId, amount);
    await logTransaction(supabase, userId, {
      name: `Deposit · ${data.source || "Bank transfer"}`,
      kind: "Deposit",
      amount,
      currency: wallet.code,
    });
    return { ok: true as const, message: `Deposit of ${amount} ${wallet.code} credited.` };
  });

export const investFunds = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: AmountInput & { strategy: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const amount = validAmount(data.amount);
    const strategy = data.strategy || "Balanced growth";
    const wallet = await adjustWallet(supabase, userId, data.walletId, -amount);
    await logTransaction(supabase, userId, {
      name: `Allocation · ${strategy}`,
      kind: "Investment",
      amount: -amount,
      currency: wallet.code,
      status: "Pending",
    });
    return { ok: true as const, message: `${amount} ${wallet.code} allocated to ${strategy}.` };
  });

const CARD_TIERS: Record<string, string> = {
  "Metal · Unlimited": "linear-gradient(135deg, #17181c, #33363d)",
  "Gold · Priority": "linear-gradient(135deg, #e8c069, #c9922f)",
  "Digital · Instant": "linear-gradient(135deg, #2b8bff, #5b5bf5)",
};

export const issueCard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { name: string; tier: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const name = (data.name ?? "").trim();
    if (name.length < 2) throw new Error("Give your card a name.");
    const tier = CARD_TIERS[data.tier] ? data.tier : "Digital · Instant";

    const { count } = await supabase
      .from("cards")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    const last4 = String(Math.floor(1000 + Math.random() * 9000));
    const { error } = await supabase.from("cards").insert({
      user_id: userId,
      name,
      last4,
      tier,
      gradient: CARD_TIERS[tier],
      sort_order: (count ?? 0) + 1,
    });
    if (error) throw new Error(error.message);
    return { ok: true as const, message: `${name} issued · •••• ${last4}` };
  });

export const requestVaultAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await logTransaction(supabase, userId, {
      name: "Obsidian Vault access request",
      kind: "Request",
      amount: 0,
      currency: "USD",
      status: "Pending",
    });
    return { ok: true as const, message: "Request submitted — your advisor will be in touch." };
  });
