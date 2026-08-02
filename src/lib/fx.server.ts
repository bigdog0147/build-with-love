/**
 * Server-only exchange-rate plumbing: pulls fiat rates from the ECB-backed
 * Frankfurter feed (no API key) and persists them for the whole platform.
 */
import { fromFrankfurter, toRateMap, type CurrencySetting, type FxRate, type RateMap } from "./fx";

const FEED_URL = "https://api.frankfurter.app/latest?base=USD";

export async function serviceClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

export async function loadCurrencies(db: any): Promise<CurrencySetting[]> {
  const { data, error } = await db.from("currency_settings").select("*").order("sort_order");
  if (error) throw new Error(error.message);
  return (data ?? []) as CurrencySetting[];
}

export async function loadRates(db: any): Promise<FxRate[]> {
  const { data, error } = await db.from("fx_rates").select("*").order("code");
  if (error) throw new Error(error.message);
  return (data ?? []) as FxRate[];
}

/** Latest rate lookup for conversions. Never throws — falls back to `{ USD: 1 }`. */
export async function rateMap(db: any): Promise<RateMap> {
  try {
    return toRateMap(await loadRates(db));
  } catch {
    return { USD: 1 };
  }
}

/**
 * Refreshes every non-manual enabled currency from the public feed. Manual
 * overrides are preserved, and a failed fetch leaves the last good rates in
 * place while recording the failure.
 */
export async function refreshRatesFromFeed(source = "frankfurter") {
  const db = await serviceClient();
  const currencies = await loadCurrencies(db);
  const wanted = currencies.filter((c) => c.is_enabled && c.kind === "fiat").map((c) => c.code);

  try {
    const response = await fetch(FEED_URL, { headers: { accept: "application/json" } });
    if (!response.ok) throw new Error(`Feed responded ${response.status}`);
    const feed = fromFrankfurter((await response.json()) as never);

    const existing = await loadRates(db);
    const manual = new Set(existing.filter((r) => r.is_manual).map((r) => r.code));

    const rows = wanted
      .filter((code) => !manual.has(code) && feed[code] != null)
      .map((code) => ({
        code,
        rate_to_usd: feed[code]!,
        source,
        is_manual: false,
        fetched_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

    if (rows.length) {
      const { error } = await db.from("fx_rates").upsert(rows, { onConflict: "code" });
      if (error) throw new Error(error.message);
    }

    await db.from("fx_refresh_runs").insert({ source, ok: true, currency_count: rows.length });
    return { ok: true as const, updated: rows.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await db.from("fx_refresh_runs").insert({ source, ok: false, currency_count: 0, error: message });
    return { ok: false as const, updated: 0, error: message };
  }
}

export async function lastRefreshRun(db: any) {
  const { data } = await db
    .from("fx_refresh_runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as
    | { source: string; ok: boolean; currency_count: number; error: string | null; created_at: string }
    | null;
}

/** Recomputes a wallet's stored USD estimate from the live rate table. */
export async function revalueWallet(db: any, walletId: string) {
  const { data: wallet } = await db
    .from("wallets")
    .select("id, code, balance")
    .eq("id", walletId)
    .maybeSingle();
  if (!wallet) return;
  const rates = await rateMap(db);
  const rate = rates[String(wallet.code).toUpperCase()];
  if (rate == null) return;
  await db
    .from("wallets")
    .update({ fiat_value: Number((Number(wallet.balance) * rate).toFixed(2)) })
    .eq("id", walletId);
}
