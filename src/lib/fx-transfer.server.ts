/**
 * Server-only cross-currency conversion between two wallets owned by the same
 * customer. Quotes and executions share one code path so the rate the customer
 * sees is the rate that gets applied.
 */
import { applySpread, convert, round } from "./fx";

/** House spread applied against the customer on conversions (percent). */
export const CONVERSION_SPREAD_PCT = 0.35;
export const CONVERSION_MIN = 1;

type ConvertInput = { fromWalletId: string; toWalletId: string; amount: number };

export type ConversionQuote = {
  from: { id: string; code: string; balance: number };
  to: { id: string; code: string; balance: number };
  amount: number;
  rate: number;
  gross: number;
  net: number;
  spreadPct: number;
};

async function loadPair(supabase: any, userId: string, input: ConvertInput) {
  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter an amount greater than zero.");
  if (amount < CONVERSION_MIN) throw new Error(`The minimum conversion is ${CONVERSION_MIN}.`);
  if (!input.fromWalletId || !input.toWalletId) throw new Error("Choose both wallets.");
  if (input.fromWalletId === input.toWalletId) throw new Error("Choose two different wallets.");

  const { data: wallets, error } = await supabase
    .from("wallets")
    .select("id, code, balance")
    .eq("user_id", userId)
    .in("id", [input.fromWalletId, input.toWalletId]);
  if (error) throw new Error(error.message);

  const from = (wallets ?? []).find((w: any) => w.id === input.fromWalletId);
  const to = (wallets ?? []).find((w: any) => w.id === input.toWalletId);
  if (!from || !to) throw new Error("Wallet not found.");
  if (Number(from.balance) < amount) throw new Error("Insufficient balance in the source wallet.");

  return { amount, from, to };
}

async function currentRates(supabase: any) {
  const { toRateMap } = await import("./fx");
  const { data } = await supabase.from("fx_rates").select("code, rate_to_usd");
  return toRateMap((data ?? []) as { code: string; rate_to_usd: number }[]);
}

export async function quoteWalletConversion(
  supabase: any,
  userId: string,
  input: ConvertInput,
): Promise<ConversionQuote> {
  const { amount, from, to } = await loadPair(supabase, userId, input);
  const rates = await currentRates(supabase);
  const converted = convert(amount, from.code, to.code, rates);
  if (!converted) throw new Error("No exchange rate is available for that pair yet.");

  return {
    from: { id: from.id, code: from.code, balance: Number(from.balance) },
    to: { id: to.id, code: to.code, balance: Number(to.balance) },
    amount,
    rate: converted.rate,
    gross: round(converted.amount, 2),
    net: round(applySpread(converted.amount, CONVERSION_SPREAD_PCT), 2),
    spreadPct: CONVERSION_SPREAD_PCT,
  };
}

export async function executeWalletConversion(supabase: any, userId: string, input: ConvertInput) {
  const quote = await quoteWalletConversion(supabase, userId, input);
  const rates = await currentRates(supabase);

  const debited = round(quote.from.balance - quote.amount, 8);
  const credited = round(quote.to.balance + quote.net, 8);

  const usdRateFrom = rates[quote.from.code] ?? null;
  const usdRateTo = rates[quote.to.code] ?? null;

  const updates = [
    supabase
      .from("wallets")
      .update({
        balance: debited,
        fiat_value: usdRateFrom == null ? null : round(debited * usdRateFrom, 2),
      })
      .eq("id", quote.from.id)
      .eq("user_id", userId),
    supabase
      .from("wallets")
      .update({
        balance: credited,
        fiat_value: usdRateTo == null ? null : round(credited * usdRateTo, 2),
      })
      .eq("id", quote.to.id)
      .eq("user_id", userId),
  ];
  for (const result of await Promise.all(updates)) {
    if (result.error) throw new Error(result.error.message);
  }

  const label = `Conversion ${quote.from.code} → ${quote.to.code} @ ${quote.rate}`;
  const { error: txErr } = await supabase.from("transactions").insert([
    {
      user_id: userId,
      name: label,
      kind: "Currency conversion",
      amount: -quote.amount,
      currency: quote.from.code,
      status: "Cleared",
      occurred_at: new Date().toISOString(),
    },
    {
      user_id: userId,
      name: label,
      kind: "Currency conversion",
      amount: quote.net,
      currency: quote.to.code,
      status: "Cleared",
      occurred_at: new Date().toISOString(),
    },
  ]);
  if (txErr) throw new Error(txErr.message);

  return {
    ok: true as const,
    message: `Converted ${quote.amount} ${quote.from.code} into ${quote.net} ${quote.to.code}.`,
    quote,
  };
}
