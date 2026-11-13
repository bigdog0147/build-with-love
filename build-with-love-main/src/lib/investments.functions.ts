import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  HOLDING_SELECT,
  PRODUCT_SELECT,
  notifyInvestor,
  openHolding,
  subscribedTotal,
} from "@/lib/investments.server";
import { validateSubscription } from "@/lib/investments";

/** Published product shelf plus each product's subscribed total. */
export const listMarketplace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [products, holdings] = await Promise.all([
      supabase
        .from("investment_products")
        .select(PRODUCT_SELECT)
        .eq("status", "published")
        .order("sort_order")
        .order("created_at", { ascending: false }),
      supabase.from("investment_holdings").select("product_id, invested, status").eq("user_id", userId),
    ]);
    if (products.error) throw new Error(products.error.message);

    const ids = (products.data ?? []).map((p) => p.id);
    const subscribed: Record<string, number> = {};
    if (ids.length) {
      const { serviceClient } = await import("@/lib/admin-guard.server");
      const db = await serviceClient();
      const { data: all } = await db
        .from("investment_holdings")
        .select("product_id, invested, status")
        .in("product_id", ids)
        .in("status", ["pending", "active", "closed"]);
      for (const row of all ?? [])
        subscribed[row.product_id] = (subscribed[row.product_id] ?? 0) + Number(row.invested ?? 0);
    }

    const mine: Record<string, number> = {};
    for (const h of holdings.data ?? []) {
      if (h.status === "rejected") continue;
      mine[h.product_id] = (mine[h.product_id] ?? 0) + Number(h.invested ?? 0);
    }

    return { products: products.data ?? [], subscribed, mine };
  });

/** One product with its terms, valuation history, documents and funding state. */
export const getMarketplaceProduct = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { slug: string }) => ({ slug: String(input.slug ?? "") }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: product, error } = await supabase
      .from("investment_products")
      .select(PRODUCT_SELECT)
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!product) throw new Error("This opportunity is no longer available.");

    const [wallets, holdings, documents, kyc, valuations] = await Promise.all([
      supabase
        .from("wallets")
        .select("id, code, label, balance")
        .eq("user_id", userId)
        .order("sort_order"),
      supabase
        .from("investment_holdings")
        .select(HOLDING_SELECT)
        .eq("user_id", userId)
        .eq("product_id", product.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("documents")
        .select("id, title, category, file_name, file_size, published_at")
        .eq("product_id", product.id)
        .eq("is_published", true)
        .order("published_at", { ascending: false }),
      supabase.from("kyc_profiles").select("id_status").eq("user_id", userId).maybeSingle(),
      supabase
        .from("holding_valuations")
        .select("as_of, unit_price, value")
        .eq("user_id", userId)
        .eq("product_id", product.id)
        .order("as_of"),
    ]);

    const { serviceClient } = await import("@/lib/admin-guard.server");
    const subscribed = await subscribedTotal(await serviceClient(), product.id);

    return {
      product,
      wallets: wallets.data ?? [],
      holdings: holdings.data ?? [],
      documents: documents.data ?? [],
      valuations: valuations.data ?? [],
      subscribed,
      idStatus: (kyc.data?.id_status as string | undefined) ?? "not_started",
    };
  });

/** Subscribe to a published product: wallet debit, fraud check, pending holding. */
export const subscribeToProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { productId: string; walletId: string; amount: number }) => ({
    productId: String(input.productId ?? ""),
    walletId: String(input.walletId ?? ""),
    amount: Number(input.amount),
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: kyc } = await supabase
      .from("kyc_profiles")
      .select("id_status")
      .eq("user_id", userId)
      .maybeSingle();
    if (kyc?.id_status !== "verified")
      throw new Error("Identity verification must be approved before you can subscribe.");

    const { data: product, error } = await supabase
      .from("investment_products")
      .select(PRODUCT_SELECT)
      .eq("id", data.productId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!product) throw new Error("Opportunity not found.");

    const { data: wallet } = await supabase
      .from("wallets")
      .select("id, code, label, balance")
      .eq("id", data.walletId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!wallet) throw new Error("Choose a funding wallet.");

    const { serviceClient } = await import("@/lib/admin-guard.server");
    const db = await serviceClient();
    const subscribed = await subscribedTotal(db, product.id);
    const amount = validateSubscription({
      amount: data.amount,
      product,
      subscribed,
      status: product.status,
    });

    const { assertNotBlocked } = await import("@/lib/risk-engine.server");
    const risk = await assertNotBlocked({
      userId,
      kind: "investment",
      amount,
      currency: product.currency,
      subjectType: "investment_product",
      subjectId: product.id,
    });

    const { holding, charge } = await openHolding(db, userId, {
      productId: product.id,
      productName: product.name,
      productCurrency: product.currency,
      amount,
      walletId: wallet.id,
      walletCode: wallet.code,
    });

    await notifyInvestor({
      userId,
      title: "Subscription received",
      detail: `We received your ${amount.toLocaleString()} ${product.currency} subscription to ${product.name}. It is pending confirmation by the investment desk.`,
      tone: "info",
      template: "subscription-status",
      templateData: {
        productName: product.name,
        amount,
        currency: product.currency,
        outcome: "received",
        units: holding.units,
      },
      idempotencyKey: `subscription-received-${holding.id}`,
    });

    return {
      holding,
      charged: charge.walletAmount,
      chargedCurrency: charge.walletCode,
      riskBand: risk.band,
      message:
        charge.walletCode === product.currency
          ? `Subscription of ${amount.toLocaleString()} ${product.currency} submitted for confirmation.`
          : `${charge.walletAmount.toLocaleString()} ${charge.walletCode} debited for a ${amount.toLocaleString()} ${product.currency} subscription.`,
    };
  });

/** Everything the investor dashboard and portfolio page render. */
export const getInvestorOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [holdings, products, valuations, distributions, interests, commitments, rounds] =
      await Promise.all([
        supabase
          .from("investment_holdings")
          .select(HOLDING_SELECT)
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase.from("investment_products").select(PRODUCT_SELECT).order("sort_order"),
        supabase
          .from("holding_valuations")
          .select("id, holding_id, product_id, as_of, unit_price, value, note, created_at")
          .eq("user_id", userId)
          .order("as_of"),
        supabase
          .from("distributions")
          .select("id, holding_id, product_id, kind, amount, currency, paid_at, note")
          .eq("user_id", userId)
          .order("paid_at", { ascending: false }),
        supabase
          .from("raise_interests")
          .select("id, round_id, indicative_amount, currency, status, created_at")
          .eq("user_id", userId),
        supabase
          .from("raise_commitments")
          .select("id, round_id, amount, currency, status, created_at")
          .eq("user_id", userId),
        supabase
          .from("raise_rounds")
          .select("id, slug, name, currency, target_amount, status, closes_at")
          .neq("status", "draft"),
      ]);
    if (holdings.error) throw new Error(holdings.error.message);

    return {
      holdings: holdings.data ?? [],
      products: products.data ?? [],
      valuations: valuations.data ?? [],
      distributions: distributions.data ?? [],
      interests: interests.data ?? [],
      commitments: commitments.data ?? [],
      rounds: rounds.data ?? [],
    };
  });
