import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { logAdminAction, requireAdminPermission, serviceClient } from "@/lib/admin-guard.server";
import {
  HOLDING_SELECT,
  PRODUCT_SELECT,
  notifyInvestor,
  payDistribution,
  postValuation,
} from "@/lib/investments.server";

/** Products, holdings and recent valuation/distribution activity for the desk. */
export const adminGetInvestmentBook = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdminPermission(context as never, "investments");
    const db = await serviceClient();
    const [products, holdings, valuations, distributions, profiles] = await Promise.all([
      db.from("investment_products").select(PRODUCT_SELECT).order("sort_order"),
      db.from("investment_holdings").select(HOLDING_SELECT).order("created_at", { ascending: false }),
      db
        .from("holding_valuations")
        .select("id, holding_id, product_id, user_id, as_of, unit_price, value, note, created_at")
        .order("as_of", { ascending: false })
        .limit(200),
      db
        .from("distributions")
        .select("id, holding_id, product_id, user_id, kind, amount, currency, paid_at, note")
        .order("paid_at", { ascending: false })
        .limit(200),
      db.from("profiles").select("id, display_name"),
    ]);

    const investorNames: Record<string, string> = {};
    for (const p of profiles.data ?? []) investorNames[p.id] = p.display_name;

    return {
      products: products.data ?? [],
      holdings: holdings.data ?? [],
      valuations: valuations.data ?? [],
      distributions: distributions.data ?? [],
      investorNames,
    };
  });

export const adminSaveProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      id?: string;
      name: string;
      category: string;
      sector: string;
      summary: string;
      description: string;
      coverUrl?: string | null;
      currency: string;
      minimum: number;
      targetYield: number;
      termMonths: number;
      capacity?: number | null;
      status: string;
      sortOrder?: number;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const identity = await requireAdminPermission(context as never, "investments");
    const db = await serviceClient();

    const name = String(data.name ?? "").trim();
    if (!name) throw new Error("A product name is required.");
    const minimum = Number(data.minimum);
    if (!Number.isFinite(minimum) || minimum < 0) throw new Error("Enter a valid minimum subscription.");

    const patch = {
      name,
      category: String(data.category ?? "").trim() || "Private markets",
      sector: String(data.sector ?? "").trim() || "Industrial",
      summary: String(data.summary ?? "").slice(0, 400),
      description: String(data.description ?? "").slice(0, 6000),
      cover_url: data.coverUrl || null,
      currency: (data.currency || "USD").toUpperCase(),
      minimum,
      target_yield: Number(data.targetYield) || 0,
      term_months: Math.max(0, Math.round(Number(data.termMonths) || 0)),
      capacity: data.capacity == null || data.capacity === 0 ? null : Number(data.capacity),
      status: data.status as never,
      sort_order: Number(data.sortOrder) || 0,
    };

    if (data.id) {
      const { error } = await db.from("investment_products").update(patch).eq("id", data.id);
      if (error) throw new Error(error.message);
      await logAdminAction(identity, {
        action: "investments.product.updated",
        targetType: "investment_product",
        targetId: data.id,
        targetLabel: name,
        after: patch,
      });
      return { message: `${name} updated.` };
    }

    const slug =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .slice(0, 60) || `product-${Date.now()}`;
    const { data: created, error } = await db
      .from("investment_products")
      .insert({ ...patch, slug, created_by: identity.userId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await logAdminAction(identity, {
      action: "investments.product.created",
      targetType: "investment_product",
      targetId: created.id,
      targetLabel: name,
      after: patch,
    });
    return { message: `${name} created.` };
  });

/** Confirm or reject a pending subscription. Rejection refunds the wallet. */
export const adminReviewHolding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; decision: "activate" | "reject" | "close"; note?: string }) => ({
    id: String(input.id ?? ""),
    decision: input.decision,
    note: (input.note ?? "").slice(0, 500),
  }))
  .handler(async ({ data, context }) => {
    const identity = await requireAdminPermission(context as never, "investments");
    const db = await serviceClient();

    const { data: holding } = await db
      .from("investment_holdings")
      .select("id, user_id, product_id, wallet_id, invested, currency, status")
      .eq("id", data.id)
      .maybeSingle();
    if (!holding) throw new Error("Holding not found.");

    const { data: product } = await db
      .from("investment_products")
      .select("id, name, currency")
      .eq("id", holding.product_id)
      .maybeSingle();
    const label = product?.name ?? "your subscription";
    const invested = Number(holding.invested ?? 0);

    if (data.decision === "reject") {
      if (holding.status !== "pending")
        throw new Error("Only pending subscriptions can be rejected.");
      if (holding.wallet_id) {
        const { moveWalletBalance } = await import("@/lib/withdrawals.server");
        // Refund in the wallet currency the debit was taken in.
        const { data: wallet } = await db
          .from("wallets")
          .select("id, code")
          .eq("id", holding.wallet_id)
          .maybeSingle();
        if (wallet) {
          const { priceInWallet } = await import("@/lib/investments.server");
          const charge = await priceInWallet(db, invested, holding.currency, wallet.code);
          await moveWalletBalance(db, holding.user_id, wallet.id, charge.walletAmount);
        }
      }
    } else if (data.decision === "activate" && holding.status !== "pending") {
      throw new Error("Only pending subscriptions can be activated.");
    } else if (data.decision === "close" && holding.status !== "active") {
      throw new Error("Only active holdings can be closed.");
    }

    const status =
      data.decision === "activate" ? "active" : data.decision === "reject" ? "rejected" : "closed";
    const { error } = await db
      .from("investment_holdings")
      .update({
        status: status as never,
        review_note: data.note || null,
        reviewed_by: identity.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", holding.id);
    if (error) throw new Error(error.message);

    if (data.decision === "activate") {
      await postValuation(
        db,
        {
          id: holding.id,
          user_id: holding.user_id,
          product_id: holding.product_id,
          units: invested,
        },
        { unitPrice: 1, note: "Opening valuation", createdBy: identity.userId },
      );
    }

    await notifyInvestor({
      userId: holding.user_id,
      title:
        data.decision === "activate"
          ? "Subscription confirmed"
          : data.decision === "reject"
            ? "Subscription declined"
            : "Holding closed",
      detail:
        data.decision === "activate"
          ? `Your ${invested.toLocaleString()} ${holding.currency} subscription to ${label} is now active.`
          : data.decision === "reject"
            ? `Your subscription to ${label} was declined and the funds have been returned to your wallet.${data.note ? ` ${data.note}` : ""}`
            : `Your holding in ${label} has been closed.${data.note ? ` ${data.note}` : ""}`,
      tone: data.decision === "activate" ? "success" : "warning",
      template: "subscription-status",
      templateData: {
        productName: label,
        amount: invested,
        currency: holding.currency,
        outcome: status,
        note: data.note || "",
      },
      idempotencyKey: `holding-${status}-${holding.id}`,
    });

    await logAdminAction(identity, {
      action: `investments.holding.${status}`,
      targetType: "investment_holding",
      targetId: holding.id,
      targetLabel: label,
      before: { status: holding.status },
      after: { status, note: data.note || null },
    });

    return {
      message:
        data.decision === "activate"
          ? "Subscription activated."
          : data.decision === "reject"
            ? "Subscription rejected and funds returned."
            : "Holding closed.",
    };
  });

/** Marks a holding to a new unit price, which drives investor performance. */
export const adminPostValuation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { holdingId: string; unitPrice: number; asOf?: string; note?: string }) => ({
    holdingId: String(input.holdingId ?? ""),
    unitPrice: Number(input.unitPrice),
    asOf: input.asOf || undefined,
    note: (input.note ?? "").slice(0, 500),
  }))
  .handler(async ({ data, context }) => {
    const identity = await requireAdminPermission(context as never, "investments");
    if (!Number.isFinite(data.unitPrice) || data.unitPrice <= 0)
      throw new Error("Enter a unit price greater than zero.");

    const db = await serviceClient();
    const { data: holding } = await db
      .from("investment_holdings")
      .select("id, user_id, product_id, units, currency, status")
      .eq("id", data.holdingId)
      .maybeSingle();
    if (!holding) throw new Error("Holding not found.");
    if (holding.status !== "active") throw new Error("Only active holdings can be revalued.");

    const value = await postValuation(
      db,
      {
        id: holding.id,
        user_id: holding.user_id,
        product_id: holding.product_id,
        units: holding.units,
      },
      {
        unitPrice: data.unitPrice,
        asOf: data.asOf,
        note: data.note || undefined,
        createdBy: identity.userId,
      },
    );

    await logAdminAction(identity, {
      action: "investments.valuation.posted",
      targetType: "investment_holding",
      targetId: holding.id,
      after: { unitPrice: data.unitPrice, value },
    });

    return { message: `Valuation posted at ${data.unitPrice} per unit.` };
  });

/** Pays income or a capital return into the investor's wallet. */
export const adminPayDistribution = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { holdingId: string; amount: number; kind: "income" | "capital_return"; note?: string }) => ({
      holdingId: String(input.holdingId ?? ""),
      amount: Number(input.amount),
      kind: input.kind === "capital_return" ? ("capital_return" as const) : ("income" as const),
      note: (input.note ?? "").slice(0, 500),
    }),
  )
  .handler(async ({ data, context }) => {
    const identity = await requireAdminPermission(context as never, "investments");
    if (!Number.isFinite(data.amount) || data.amount <= 0)
      throw new Error("Enter a distribution amount greater than zero.");

    const db = await serviceClient();
    const { data: holding } = await db
      .from("investment_holdings")
      .select("id, user_id, product_id, currency, wallet_id, status")
      .eq("id", data.holdingId)
      .maybeSingle();
    if (!holding) throw new Error("Holding not found.");
    if (holding.status === "rejected") throw new Error("This holding cannot receive distributions.");

    await payDistribution(db, holding, {
      amount: data.amount,
      kind: data.kind,
      note: data.note || undefined,
      createdBy: identity.userId,
    });

    await notifyInvestor({
      userId: holding.user_id,
      title: data.kind === "income" ? "Distribution paid" : "Capital returned",
      detail: `${data.amount.toLocaleString()} ${holding.currency} has been credited to your wallet.${data.note ? ` ${data.note}` : ""}`,
      tone: "success",
      template: "distribution-paid",
      templateData: {
        amount: data.amount,
        currency: holding.currency,
        kind: data.kind,
        note: data.note || "",
      },
    });

    await logAdminAction(identity, {
      action: "investments.distribution.paid",
      targetType: "investment_holding",
      targetId: data.holdingId,
      after: { amount: data.amount, kind: data.kind },
    });

    return {
      message: `${data.amount.toLocaleString()} ${holding.currency} ${data.kind === "income" ? "distribution" : "capital return"} paid.`,
    };
  });
