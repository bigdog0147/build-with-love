/**
 * Server-only investment plumbing: currency-aware wallet debits for
 * subscriptions, holding creation, valuation fan-out, distribution payouts and
 * the investor notifications that accompany each of them.
 */
import { applySpread, convert, toRateMap } from "./fx";
import { moveWalletBalance } from "./withdrawals.server";
import { unitsFor } from "./investments";

/** House spread applied when a subscription is funded from a different currency. */
export const SUBSCRIPTION_SPREAD_PCT = 0.35;

export const HOLDING_SELECT =
  "id, user_id, product_id, wallet_id, transaction_id, invested, current_value, units, currency, status, review_note, reviewed_at, created_at, updated_at";

export const PRODUCT_SELECT =
  "id, slug, name, category, sector, summary, description, cover_url, currency, minimum, target_yield, term_months, capacity, status, sort_order, created_at, updated_at";

export async function rateMap(client: any) {
  const { data } = await client.from("fx_rates").select("code, rate_to_usd");
  return toRateMap((data ?? []) as { code: string; rate_to_usd: number }[]);
}

export type WalletCharge = {
  walletAmount: number;
  walletCode: string;
  rate: number;
  spreadPct: number;
};

/**
 * Converts an amount denominated in the product currency into the amount that
 * must leave the funding wallet. Same-currency wallets are charged 1:1 with no
 * spread.
 */
export async function priceInWallet(
  client: any,
  amount: number,
  productCurrency: string,
  walletCode: string,
): Promise<WalletCharge> {
  if (walletCode === productCurrency)
    return { walletAmount: Number(amount.toFixed(2)), walletCode, rate: 1, spreadPct: 0 };

  const rates = await rateMap(client);
  const converted = convert(amount, productCurrency, walletCode, rates);
  if (converted == null)
    throw new Error(`No exchange rate is available to fund a ${productCurrency} subscription from ${walletCode}.`);

  // The spread widens what the investor pays; it never reduces what they receive.
  const discounted = applySpread(converted.amount, SUBSCRIPTION_SPREAD_PCT);
  const charged = converted.amount + (converted.amount - discounted);
  return {
    walletAmount: Number(charged.toFixed(2)),
    walletCode,
    rate: converted.rate,
    spreadPct: SUBSCRIPTION_SPREAD_PCT,
  };
}

/** Records a pending investment ledger entry for a subscription debit. */
export async function insertInvestmentTransaction(
  client: any,
  userId: string,
  row: { name: string; amount: number; currency: string; status?: string; kind?: string },
) {
  const { data, error } = await client
    .from("transactions")
    .insert({
      user_id: userId,
      name: row.name,
      kind: row.kind ?? "Investment",
      amount: -Math.abs(row.amount),
      currency: row.currency,
      status: row.status ?? "Pending",
      occurred_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

/** Debits the funding wallet and opens a pending holding on the product. */
export async function openHolding(
  client: any,
  userId: string,
  input: {
    productId: string;
    productName: string;
    productCurrency: string;
    amount: number;
    walletId: string;
    walletCode: string;
    roundName?: string;
  },
) {
  const charge = await priceInWallet(client, input.amount, input.productCurrency, input.walletCode);
  await moveWalletBalance(client, userId, input.walletId, -charge.walletAmount);

  const label = input.roundName
    ? `${input.roundName} — ${input.productName}`
    : `Subscription — ${input.productName}`;
  const transactionId = await insertInvestmentTransaction(client, userId, {
    name: label,
    amount: charge.walletAmount,
    currency: charge.walletCode,
  });

  const { data, error } = await client
    .from("investment_holdings")
    .insert({
      user_id: userId,
      product_id: input.productId,
      wallet_id: input.walletId,
      transaction_id: transactionId,
      invested: input.amount,
      current_value: input.amount,
      units: unitsFor(input.amount),
      currency: input.productCurrency,
      status: "pending",
    })
    .select(HOLDING_SELECT)
    .single();
  if (error) throw new Error(error.message);

  await client.from("holding_valuations").insert({
    holding_id: data.id,
    user_id: userId,
    product_id: input.productId,
    unit_price: 1,
    value: input.amount,
    note: "Subscription booked",
  });

  return { holding: data, charge, transactionId };
}

/** Sum of invested capital already committed to a product. */
export async function subscribedTotal(client: any, productId: string) {
  const { data } = await client
    .from("investment_holdings")
    .select("invested, status")
    .eq("product_id", productId)
    .in("status", ["pending", "active", "closed"]);
  return (data ?? []).reduce((sum: number, row: any) => sum + Number(row.invested ?? 0), 0);
}

/** Posts a valuation for one holding and syncs its current value. */
export async function postValuation(
  client: any,
  holding: { id: string; user_id: string; product_id: string; units: number | string },
  input: { unitPrice: number; asOf?: string; note?: string; createdBy?: string },
) {
  const units = Number(holding.units ?? 0);
  const value = Number((units * input.unitPrice).toFixed(2));
  const { error } = await client.from("holding_valuations").insert({
    holding_id: holding.id,
    user_id: holding.user_id,
    product_id: holding.product_id,
    as_of: input.asOf ?? new Date().toISOString().slice(0, 10),
    unit_price: input.unitPrice,
    value,
    note: input.note ?? null,
    created_by: input.createdBy ?? null,
  });
  if (error) throw new Error(error.message);
  await client.from("investment_holdings").update({ current_value: value }).eq("id", holding.id);
  return value;
}

/** Credits a distribution to the investor's wallet and records the payout. */
export async function payDistribution(
  client: any,
  holding: { id: string; user_id: string; product_id: string; currency: string; wallet_id: string | null },
  input: { amount: number; kind: "income" | "capital_return"; note?: string; createdBy?: string },
) {
  let walletId = holding.wallet_id;
  if (!walletId) {
    const { data: wallet } = await client
      .from("wallets")
      .select("id")
      .eq("user_id", holding.user_id)
      .eq("code", holding.currency)
      .maybeSingle();
    walletId = wallet?.id ?? null;
  }
  if (!walletId) throw new Error(`No ${holding.currency} wallet is available to receive this distribution.`);

  await moveWalletBalance(client, holding.user_id, walletId, Math.abs(input.amount));

  const { data: tx, error: txErr } = await client
    .from("transactions")
    .insert({
      user_id: holding.user_id,
      name: input.kind === "income" ? "Investment income" : "Capital return",
      kind: "Distribution",
      amount: Math.abs(input.amount),
      currency: holding.currency,
      status: "Cleared",
      occurred_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (txErr) throw new Error(txErr.message);

  const { error } = await client.from("distributions").insert({
    holding_id: holding.id,
    user_id: holding.user_id,
    product_id: holding.product_id,
    kind: input.kind,
    amount: Math.abs(input.amount),
    currency: holding.currency,
    wallet_id: walletId,
    transaction_id: tx.id,
    note: input.note ?? null,
    created_by: input.createdBy ?? null,
  });
  if (error) throw new Error(error.message);
  return { walletId, transactionId: tx.id as string };
}

/**
 * Investor-facing notice for any investment lifecycle event.
 *
 * Dispatch happens in the background by default so a slow or rate-limited email
 * provider can never fail or delay a status change. Pass `awaitDelivery` when the
 * caller genuinely needs the outcome before responding.
 */
export async function notifyInvestor(input: {
  userId: string;
  title: string;
  detail: string;
  tone?: "info" | "success" | "warning" | "danger";
  template?: string;
  templateData?: Record<string, unknown>;
  idempotencyKey?: string;
  awaitDelivery?: boolean;
  /** Preference category the notice is filtered against. Defaults to announcements. */
  category?: "announcements" | "reports" | "raise";
  /** Capital raising only: lets the investor's per-round opt-out apply. */
  roundId?: string;
  /** Capital raising only: event id so per-event email switches apply. */
  raiseEvent?: string;
  /**
   * Capital raising only: the confirmation document for this decision. The
   * platform cannot attach files, so a signed download link for the identical
   * document is folded into the email instead.
   */
  confirmation?: import("./raise-confirmation").RaiseConfirmationInput;
}) {
  let templateData = input.templateData;
  if (input.confirmation) {
    const { raiseConfirmationLink, investorDisplayName } = await import(
      "./raise-confirmation-link.server"
    );
    const confirmation = {
      ...input.confirmation,
      investorName:
        input.confirmation.investorName || (await investorDisplayName(input.userId)),
    };
    const link = await raiseConfirmationLink(input.userId, confirmation);
    if (link) {
      templateData = {
        ...(templateData ?? {}),
        confirmationUrl: link.url,
        confirmationTitle: link.title,
      };
    }
  }

  const payload = {
    userId: input.userId,
    category: input.category ?? ("announcements" as const),
    title: input.title,
    detail: input.detail,
    tone: input.tone ?? "info",
    template: input.template,
    templateData,
    idempotencyKey: input.idempotencyKey,
    roundId: input.roundId,
    raiseEvent: input.raiseEvent,
  };

  if (!input.awaitDelivery) {
    const { dispatchInBackground } = await import("./email-dispatch.server");
    dispatchInBackground({ ...payload, label: input.idempotencyKey ?? input.title });
    return;
  }

  const { dispatchNotification } = await import("./notification-dispatcher.server");
  try {
    await dispatchNotification(payload);
  } catch (error) {
    console.error("[investments] notification failed", error);
  }
}
