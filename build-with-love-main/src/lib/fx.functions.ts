import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { CurrencySetting, FxRate } from "./fx";

export type FxSnapshot = {
  currencies: CurrencySetting[];
  rates: FxRate[];
  lastRun: {
    source: string;
    ok: boolean;
    currency_count: number;
    error: string | null;
    created_at: string;
  } | null;
};

/** Public rate + currency snapshot used by wallet valuations and the admin console. */
export const getFxSnapshot = createServerFn({ method: "GET" }).handler(async (): Promise<FxSnapshot> => {
  const { serviceClient, loadCurrencies, loadRates, lastRefreshRun } = await import("./fx.server");
  const db = await serviceClient();
  const [currencies, rates, lastRun] = await Promise.all([
    loadCurrencies(db),
    loadRates(db),
    lastRefreshRun(db),
  ]);
  return { currencies, rates, lastRun };
});

/** Admin: pull the newest rates from the public feed immediately. */
export const refreshFxRates = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireAdminPermission, logAdminAction } = await import("./admin-guard.server");
    const identity = await requireAdminPermission(context as never, "transactions");
    const { refreshRatesFromFeed } = await import("./fx.server");
    const result = await refreshRatesFromFeed("frankfurter");
    await logAdminAction(identity, {
      action: "fx.refresh",
      targetType: "fx_rates",
      after: result,
    });
    return result;
  });

/** Admin: pin a currency to a manual rate (or hand it back to the feed). */
export const setManualRate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { code: string; rate: number | null }) => input)
  .handler(async ({ data, context }) => {
    const { requireAdminPermission, logAdminAction } = await import("./admin-guard.server");
    const identity = await requireAdminPermission(context as never, "transactions");
    const code = String(data.code ?? "").toUpperCase().slice(0, 8);
    if (!/^[A-Z]{3,8}$/.test(code)) throw new Error("Enter a valid currency code.");

    const { serviceClient, refreshRatesFromFeed } = await import("./fx.server");
    const db = await serviceClient();

    if (data.rate == null) {
      await db.from("fx_rates").update({ is_manual: false }).eq("code", code);
      await refreshRatesFromFeed("frankfurter");
    } else {
      const rate = Number(data.rate);
      if (!Number.isFinite(rate) || rate <= 0) throw new Error("Enter a rate greater than zero.");
      await db.from("fx_rates").upsert(
        {
          code,
          rate_to_usd: rate,
          source: "manual",
          is_manual: true,
          fetched_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "code" },
      );
    }

    await logAdminAction(identity, {
      action: data.rate == null ? "fx.manual_cleared" : "fx.manual_set",
      targetType: "fx_rates",
      targetId: code,
      targetLabel: code,
      after: { rate: data.rate },
    });
    return { ok: true as const };
  });

/** Admin: enable or disable a currency platform-wide. */
export const setCurrencyEnabled = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { code: string; enabled: boolean }) => input)
  .handler(async ({ data, context }) => {
    const { requireAdminPermission, logAdminAction } = await import("./admin-guard.server");
    const identity = await requireAdminPermission(context as never, "system_settings");
    const code = String(data.code ?? "").toUpperCase();
    if (code === "USD" && !data.enabled) throw new Error("The USD base currency cannot be disabled.");

    const { serviceClient } = await import("./fx.server");
    const db = await serviceClient();
    const { error } = await db
      .from("currency_settings")
      .update({ is_enabled: Boolean(data.enabled) })
      .eq("code", code);
    if (error) throw new Error(error.message);

    await logAdminAction(identity, {
      action: "currency.toggle",
      targetType: "currency_settings",
      targetId: code,
      targetLabel: code,
      after: { enabled: Boolean(data.enabled) },
    });
    return { ok: true as const };
  });

/** Customer: open a new wallet in an enabled currency. */
export const openWallet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { code: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const code = String(data.code ?? "").toUpperCase();

    const { data: currency } = await supabase
      .from("currency_settings")
      .select("code, label, is_enabled")
      .eq("code", code)
      .maybeSingle();
    if (!currency || !currency.is_enabled) throw new Error("That currency is not available.");

    const { data: existing } = await supabase
      .from("wallets")
      .select("id")
      .eq("user_id", userId)
      .eq("code", code)
      .maybeSingle();
    if (existing) throw new Error(`You already hold a ${code} wallet.`);

    const { count } = await supabase
      .from("wallets")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    const tints = ["gold", "electric", "silver"];
    const { error } = await supabase.from("wallets").insert({
      user_id: userId,
      code,
      label: `${currency.label} wallet`,
      balance: 0,
      fiat_value: 0,
      delta_pct: 0,
      tint: tints[(count ?? 0) % tints.length]!,
      sort_order: (count ?? 0) + 1,
    });
    if (error) throw new Error(error.message);
    return { ok: true as const, message: `${code} wallet opened.` };
  });

/** Customer: quote a cross-currency conversion without moving money. */
export const quoteConversion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { fromWalletId: string; toWalletId: string; amount: number }) => input)
  .handler(async ({ data, context }) => {
    const { quoteWalletConversion } = await import("./fx-transfer.server");
    return quoteWalletConversion(context.supabase, context.userId, data);
  });

/** Customer: execute a cross-currency conversion between two of their wallets. */
export const convertBetweenWallets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { fromWalletId: string; toWalletId: string; amount: number }) => input)
  .handler(async ({ data, context }) => {
    const { assertNotBlocked } = await import("./risk-engine.server");
    const { getRequestIP, getRequestHeader } = await import("@tanstack/react-start/server");
    await assertNotBlocked({
      userId: context.userId,
      kind: "conversion",
      amount: Number(data.amount),
      currency: "USD",
      ip: getRequestIP({ xForwardedFor: true }) ?? null,
      userAgent: getRequestHeader("user-agent") ?? null,
      subjectType: "wallet_conversion",
    });
    const { executeWalletConversion } = await import("./fx-transfer.server");
    return executeWalletConversion(context.supabase, context.userId, data);
  });
