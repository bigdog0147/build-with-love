import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { validateCommitment } from "@/lib/investments";
import { notifyInvestor } from "@/lib/investments.server";
import { moveWalletBalance } from "@/lib/withdrawals.server";
import { logAdminAction, requireAdminPermission, serviceClient } from "@/lib/admin-guard.server";

const ROUND_SELECT =
  "id, slug, name, product_id, narrative, highlights, target_amount, minimum_ticket, currency, opens_at, closes_at, status, sort_order, created_at, updated_at";

/** Rounds visible to investors, plus their own interests and commitments. */
export const getRaisePortal = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [rounds, interests, commitments, wallets, kyc] = await Promise.all([
      supabase.from("raise_rounds").select(ROUND_SELECT).neq("status", "draft").order("sort_order"),
      supabase
        .from("raise_interests")
        .select("id, round_id, indicative_amount, currency, note, status, review_note, created_at")
        .eq("user_id", userId),
      supabase
        .from("raise_commitments")
        .select("id, round_id, interest_id, amount, currency, wallet_id, status, review_note, created_at")
        .eq("user_id", userId),
      supabase.from("wallets").select("id, code, label, balance").eq("user_id", userId).order("sort_order"),
      supabase.from("kyc_profiles").select("id_status").eq("user_id", userId).maybeSingle(),
    ]);
    if (rounds.error) throw new Error(rounds.error.message);

    // Funding progress is aggregate information about each round, not per-investor data.
    const db = await serviceClient();
    const { data: all } = await db
      .from("raise_commitments")
      .select("round_id, amount, status")
      .in("status", ["funded", "accepted"]);
    const committed: Record<string, number> = {};
    for (const row of all ?? [])
      committed[row.round_id] = (committed[row.round_id] ?? 0) + Number(row.amount ?? 0);

    return {
      rounds: rounds.data ?? [],
      interests: interests.data ?? [],
      commitments: commitments.data ?? [],
      wallets: wallets.data ?? [],
      committed,
      idStatus: (kyc.data?.id_status as string | undefined) ?? "not_started",
    };
  });

/** Stage 1 — non-binding expression of interest. No money moves. */
export const submitRaiseInterest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { roundId: string; amount: number; note?: string }) => ({
    roundId: String(input.roundId ?? ""),
    amount: Number(input.amount),
    note: (input.note ?? "").slice(0, 1000),
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (!Number.isFinite(data.amount) || data.amount <= 0)
      throw new Error("Enter an indicative amount greater than zero.");

    const { data: round } = await supabase
      .from("raise_rounds")
      .select("id, name, currency, status, minimum_ticket")
      .eq("id", data.roundId)
      .maybeSingle();
    if (!round) throw new Error("Round not found.");
    if (round.status !== "open") throw new Error("This round is not accepting interest right now.");

    const { data: existing } = await supabase
      .from("raise_interests")
      .select("id, status")
      .eq("round_id", round.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("raise_interests")
        .update({
          indicative_amount: data.amount,
          note: data.note || null,
          status: existing.status === "declined" ? "submitted" : existing.status,
        })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { message: `Your indication of interest in ${round.name} was updated.` };
    }

    const { error } = await supabase.from("raise_interests").insert({
      round_id: round.id,
      user_id: userId,
      indicative_amount: data.amount,
      currency: round.currency,
      note: data.note || null,
    });
    if (error) throw new Error(error.message);
    return { message: `Interest registered for ${round.name}. The capital markets desk will be in touch.` };
  });

export const withdrawRaiseInterest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => ({ id: String(input.id ?? "") }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("raise_interests")
      .update({ status: "withdrawn" })
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .in("status", ["submitted", "invited"]);
    if (error) throw new Error(error.message);
    return { message: "Interest withdrawn." };
  });

/** Stage 2 — confirm an invited commitment; the amount is held from the wallet. */
export const fundRaiseCommitment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { commitmentId: string; amount: number; walletId: string }) => ({
    commitmentId: String(input.commitmentId ?? ""),
    amount: Number(input.amount),
    walletId: String(input.walletId ?? ""),
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: kyc } = await supabase
      .from("kyc_profiles")
      .select("id_status")
      .eq("user_id", userId)
      .maybeSingle();
    if (kyc?.id_status !== "verified")
      throw new Error("Identity verification must be approved before you can fund a commitment.");

    const { data: commitment } = await supabase
      .from("raise_commitments")
      .select("id, round_id, status, currency")
      .eq("id", data.commitmentId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!commitment) throw new Error("Commitment not found.");
    if (commitment.status !== "awaiting_funding")
      throw new Error("This commitment is no longer awaiting funding.");

    const { data: round } = await supabase
      .from("raise_rounds")
      .select("id, name, currency, minimum_ticket, status")
      .eq("id", commitment.round_id)
      .maybeSingle();
    if (!round) throw new Error("Round not found.");

    const amount = validateCommitment({
      amount: data.amount,
      minimumTicket: Number(round.minimum_ticket ?? 0),
      status: round.status,
    });

    const { data: wallet } = await supabase
      .from("wallets")
      .select("id, code, balance")
      .eq("id", data.walletId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!wallet) throw new Error("Choose a funding wallet.");
    if (wallet.code !== round.currency)
      throw new Error(`This round is funded in ${round.currency}. Choose a ${round.currency} wallet.`);

    const { assertNotBlocked } = await import("@/lib/risk-engine.server");
    await assertNotBlocked({
      userId,
      kind: "investment",
      amount,
      currency: round.currency,
      subjectType: "raise_round",
      subjectId: round.id,
    });

    const db = await serviceClient();
    // Hold the capital: it leaves the wallet now and is either deployed on
    // acceptance or returned in full if the desk releases the commitment.
    await moveWalletBalance(db, userId, wallet.id, -amount);

    const { error } = await db
      .from("raise_commitments")
      .update({ amount, wallet_id: wallet.id, status: "funded" })
      .eq("id", commitment.id);
    if (error) throw new Error(error.message);

    await notifyInvestor({
      userId,
      title: "Commitment funded",
      detail: `${amount.toLocaleString()} ${round.currency} is held against your commitment to ${round.name}, pending final acceptance.`,
      tone: "info",
      template: "commitment-status",
      templateData: { roundName: round.name, amount, currency: round.currency, outcome: "funded" },
      idempotencyKey: `commitment-funded-${commitment.id}`,
    });

    return { message: `${amount.toLocaleString()} ${round.currency} held against ${round.name}.` };
  });

export const cancelRaiseCommitment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => ({ id: String(input.id ?? "") }))
  .handler(async ({ data, context }) => {
    const db = await serviceClient();
    const { data: commitment } = await db
      .from("raise_commitments")
      .select("id, status")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!commitment) throw new Error("Commitment not found.");
    if (commitment.status !== "awaiting_funding")
      throw new Error("Funded commitments can only be released by the capital markets desk.");
    const { error } = await db
      .from("raise_commitments")
      .update({ status: "cancelled" })
      .eq("id", commitment.id);
    if (error) throw new Error(error.message);
    return { message: "Commitment cancelled." };
  });

/* ─────────────────────────── administration ─────────────────────────── */

/** Rounds, the interest queue and the commitment queue with investor labels. */
export const adminGetRaise = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdminPermission(context as never, "investments");
    const db = await serviceClient();
    const [rounds, interests, commitments, products, profiles] = await Promise.all([
      db.from("raise_rounds").select(ROUND_SELECT).order("sort_order"),
      db
        .from("raise_interests")
        .select("id, round_id, user_id, indicative_amount, currency, note, status, review_note, created_at")
        .order("created_at", { ascending: false }),
      db
        .from("raise_commitments")
        .select("id, round_id, user_id, interest_id, amount, currency, status, review_note, created_at")
        .order("created_at", { ascending: false }),
      db.from("investment_products").select("id, name, slug, currency, status").order("name"),
      db.from("profiles").select("id, display_name"),
    ]);

    const names: Record<string, string> = {};
    for (const p of profiles.data ?? []) names[p.id] = p.display_name;

    return {
      rounds: rounds.data ?? [],
      interests: interests.data ?? [],
      commitments: commitments.data ?? [],
      products: products.data ?? [],
      investorNames: names,
    };
  });

export const adminSaveRound = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      id?: string;
      name: string;
      productId?: string | null;
      narrative?: string;
      highlights?: string[];
      targetAmount: number;
      minimumTicket: number;
      currency: string;
      opensAt?: string | null;
      closesAt?: string | null;
      status: string;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const identity = await requireAdminPermission(context as never, "investments");
    const db = await serviceClient();

    const name = String(data.name ?? "").trim();
    if (!name) throw new Error("A round name is required.");
    const target = Number(data.targetAmount);
    if (!Number.isFinite(target) || target <= 0) throw new Error("Enter a target amount greater than zero.");

    const patch = {
      name,
      product_id: data.productId || null,
      narrative: (data.narrative ?? "").slice(0, 4000),
      highlights: (data.highlights ?? []).filter(Boolean).slice(0, 8),
      target_amount: target,
      minimum_ticket: Number(data.minimumTicket) || 0,
      currency: (data.currency || "USD").toUpperCase(),
      opens_at: data.opensAt || null,
      closes_at: data.closesAt || null,
      status: data.status,
    };

    if (data.id) {
      const { error } = await db.from("raise_rounds").update(patch).eq("id", data.id);
      if (error) throw new Error(error.message);
      await logAdminAction(identity, {
        action: "raise.round.updated",
        targetType: "raise_round",
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
        .slice(0, 60) || `round-${Date.now()}`;
    const { data: created, error } = await db
      .from("raise_rounds")
      .insert({ ...patch, slug, created_by: identity.userId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await logAdminAction(identity, {
      action: "raise.round.created",
      targetType: "raise_round",
      targetId: created.id,
      targetLabel: name,
      after: patch,
    });
    return { message: `${name} created.` };
  });

/** Invite an interested investor to commit, or decline their interest. */
export const adminReviewInterest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; decision: "invite" | "decline"; note?: string }) => ({
    id: String(input.id ?? ""),
    decision: input.decision,
    note: (input.note ?? "").slice(0, 500),
  }))
  .handler(async ({ data, context }) => {
    const identity = await requireAdminPermission(context as never, "investments");
    const db = await serviceClient();

    const { data: interest } = await db
      .from("raise_interests")
      .select("id, round_id, user_id, indicative_amount, currency, status")
      .eq("id", data.id)
      .maybeSingle();
    if (!interest) throw new Error("Interest not found.");
    if (interest.status !== "submitted") throw new Error("This interest has already been reviewed.");

    const { data: round } = await db
      .from("raise_rounds")
      .select("id, name, currency, minimum_ticket")
      .eq("id", interest.round_id)
      .maybeSingle();

    const invited = data.decision === "invite";
    const { error } = await db
      .from("raise_interests")
      .update({
        status: invited ? "invited" : "declined",
        review_note: data.note || null,
        reviewed_by: identity.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", interest.id);
    if (error) throw new Error(error.message);

    if (invited) {
      const { error: cErr } = await db.from("raise_commitments").insert({
        round_id: interest.round_id,
        interest_id: interest.id,
        user_id: interest.user_id,
        amount: interest.indicative_amount,
        currency: interest.currency,
        status: "awaiting_funding",
      });
      if (cErr) throw new Error(cErr.message);
    }

    await notifyInvestor({
      userId: interest.user_id,
      title: invited ? "Invitation to commit" : "Interest not progressed",
      detail: invited
        ? `You are invited to commit capital to ${round?.name ?? "the round"}. Confirm and fund your commitment in the capital raising portal.`
        : `Your interest in ${round?.name ?? "the round"} was not progressed at this time.${data.note ? ` ${data.note}` : ""}`,
      tone: invited ? "success" : "warning",
      template: "raise-invitation",
      templateData: {
        roundName: round?.name ?? "Capital raise",
        amount: Number(interest.indicative_amount ?? 0),
        currency: interest.currency,
        minimumTicket: Number(round?.minimum_ticket ?? 0),
        outcome: invited ? "invited" : "declined",
        note: data.note || "",
      },
      idempotencyKey: `raise-interest-${interest.id}-${invited ? "invited" : "declined"}`,
    });

    await logAdminAction(identity, {
      action: invited ? "raise.interest.invited" : "raise.interest.declined",
      targetType: "raise_interest",
      targetId: interest.id,
      targetLabel: round?.name ?? null,
      after: { status: invited ? "invited" : "declined", note: data.note || null },
    });

    return { message: invited ? "Investor invited to commit." : "Interest declined." };
  });

/** Accept a funded commitment (deploys the held capital) or release it back. */
export const adminReviewCommitment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; decision: "accept" | "release"; note?: string }) => ({
    id: String(input.id ?? ""),
    decision: input.decision,
    note: (input.note ?? "").slice(0, 500),
  }))
  .handler(async ({ data, context }) => {
    const identity = await requireAdminPermission(context as never, "investments");
    const db = await serviceClient();

    const { data: commitment } = await db
      .from("raise_commitments")
      .select("id, round_id, user_id, amount, currency, wallet_id, status")
      .eq("id", data.id)
      .maybeSingle();
    if (!commitment) throw new Error("Commitment not found.");
    if (commitment.status !== "funded")
      throw new Error("Only funded commitments can be accepted or released.");

    const { data: round } = await db
      .from("raise_rounds")
      .select("id, name, product_id, currency")
      .eq("id", commitment.round_id)
      .maybeSingle();

    const amount = Number(commitment.amount ?? 0);

    if (data.decision === "release") {
      if (commitment.wallet_id)
        await moveWalletBalance(db, commitment.user_id, commitment.wallet_id, amount);
      const { error } = await db
        .from("raise_commitments")
        .update({
          status: "released",
          review_note: data.note || null,
          reviewed_by: identity.userId,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", commitment.id);
      if (error) throw new Error(error.message);

      await notifyInvestor({
        userId: commitment.user_id,
        title: "Commitment released",
        detail: `${amount.toLocaleString()} ${commitment.currency} held for ${round?.name ?? "the round"} has been returned to your wallet.${data.note ? ` ${data.note}` : ""}`,
        tone: "warning",
        template: "commitment-status",
        templateData: {
          roundName: round?.name ?? "Capital raise",
          amount,
          currency: commitment.currency,
          outcome: "released",
          note: data.note || "",
        },
        idempotencyKey: `commitment-released-${commitment.id}`,
      });
      await logAdminAction(identity, {
        action: "raise.commitment.released",
        targetType: "raise_commitment",
        targetId: commitment.id,
        targetLabel: round?.name ?? null,
        after: { amount, status: "released" },
      });
      return { message: `Commitment released and ${amount.toLocaleString()} ${commitment.currency} returned.` };
    }

    let holdingId: string | null = null;
    if (round?.product_id) {
      const { data: product } = await db
        .from("investment_products")
        .select("id, name, currency")
        .eq("id", round.product_id)
        .maybeSingle();
      if (product) {
        // The capital already left the wallet when the commitment was funded, so
        // the holding is booked directly rather than through a second debit.
        const { data: holding, error: hErr } = await db
          .from("investment_holdings")
          .insert({
            user_id: commitment.user_id,
            product_id: product.id,
            wallet_id: commitment.wallet_id,
            invested: amount,
            current_value: amount,
            units: amount,
            currency: commitment.currency,
            status: "active",
            review_note: `Funded via ${round.name}`,
            reviewed_by: identity.userId,
            reviewed_at: new Date().toISOString(),
          })
          .select("id")
          .single();
        if (hErr) throw new Error(hErr.message);
        holdingId = holding.id;
        await db.from("holding_valuations").insert({
          holding_id: holding.id,
          user_id: commitment.user_id,
          product_id: product.id,
          unit_price: 1,
          value: amount,
          note: `Committed via ${round.name}`,
          created_by: identity.userId,
        });
      }
    }

    const { error } = await db
      .from("raise_commitments")
      .update({
        status: "accepted",
        holding_id: holdingId,
        review_note: data.note || null,
        reviewed_by: identity.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", commitment.id);
    if (error) throw new Error(error.message);

    await notifyInvestor({
      userId: commitment.user_id,
      title: "Commitment accepted",
      detail: `Your ${amount.toLocaleString()} ${commitment.currency} commitment to ${round?.name ?? "the round"} has been accepted and deployed.`,
      tone: "success",
      template: "commitment-status",
      templateData: {
        roundName: round?.name ?? "Capital raise",
        amount,
        currency: commitment.currency,
        outcome: "accepted",
        note: data.note || "",
      },
      idempotencyKey: `commitment-accepted-${commitment.id}`,
    });
    await logAdminAction(identity, {
      action: "raise.commitment.accepted",
      targetType: "raise_commitment",
      targetId: commitment.id,
      targetLabel: round?.name ?? null,
      after: { amount, status: "accepted", holdingId },
    });

    return { message: `Commitment accepted${holdingId ? " and holding created" : ""}.` };
  });

/**
 * Update a round's lifecycle status and automatically send the matching
 * decision email + in-app notice to every investor participating in it.
 */
export const adminUpdateRoundStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { id: string; status: "draft" | "open" | "closed" | "funded"; note?: string; notify?: boolean }) => ({
      id: String(input.id ?? ""),
      status: input.status,
      note: (input.note ?? "").slice(0, 500),
      notify: input.notify !== false,
    }),
  )
  .handler(async ({ data, context }) => {
    const identity = await requireAdminPermission(context as never, "investments");
    const db = await serviceClient();

    const allowed = ["draft", "open", "closed", "funded"];
    if (!allowed.includes(data.status)) throw new Error("Unknown round status.");

    const { data: round } = await db
      .from("raise_rounds")
      .select("id, name, currency, target_amount, minimum_ticket, closes_at, status")
      .eq("id", data.id)
      .maybeSingle();
    if (!round) throw new Error("Round not found.");
    if (round.status === data.status) throw new Error(`This round is already ${data.status}.`);

    const { error } = await db
      .from("raise_rounds")
      .update({ status: data.status })
      .eq("id", round.id);
    if (error) throw new Error(error.message);

    let notified = 0;
    if (data.notify) {
      const [interests, commitments] = await Promise.all([
        db
          .from("raise_interests")
          .select("user_id, status")
          .eq("round_id", round.id)
          .in("status", ["submitted", "invited"]),
        db
          .from("raise_commitments")
          .select("user_id, status")
          .eq("round_id", round.id)
          .in("status", ["awaiting_funding", "funded", "accepted"]),
      ]);

      const recipients = new Set<string>();
      for (const row of interests.data ?? []) recipients.add(row.user_id);
      for (const row of commitments.data ?? []) recipients.add(row.user_id);

      const titles: Record<string, string> = {
        open: "Round now open",
        closed: "Round closed",
        funded: "Round fully funded",
        draft: "Round paused",
      };
      const details: Record<string, string> = {
        open: `${round.name} is now open for participation. Register or confirm your indication in the capital raising portal.`,
        closed: `${round.name} is now closed. Accepted commitments remain deployed; anything still held is returned to your wallet.`,
        funded: `${round.name} has reached its target and is fully funded. Accepted commitments are tracked in your portfolio.`,
        draft: `${round.name} has been paused while the desk revises its terms. Your indication is retained.`,
      };
      const tones: Record<string, "info" | "success" | "warning"> = {
        open: "success",
        closed: "warning",
        funded: "success",
        draft: "warning",
      };

      for (const userId of recipients) {
        await notifyInvestor({
          userId,
          title: titles[data.status]!,
          detail: `${details[data.status]!}${data.note ? ` ${data.note}` : ""}`,
          tone: tones[data.status] ?? "info",
          template: "raise-round-update",
          templateData: {
            outcome: data.status,
            roundName: round.name,
            currency: round.currency,
            targetAmount: Number(round.target_amount ?? 0),
            minimumTicket: Number(round.minimum_ticket ?? 0),
            closesAt: round.closes_at ? String(round.closes_at).slice(0, 10) : "",
            note: data.note || "",
          },
          idempotencyKey: `raise-round-${round.id}-${data.status}-${userId}`,
        });
        notified += 1;
      }
    }

    await logAdminAction(identity, {
      action: "raise.round.status",
      targetType: "raise_round",
      targetId: round.id,
      targetLabel: round.name,
      before: { status: round.status },
      after: { status: data.status, notified, note: data.note || null },
    });

    return {
      message: `${round.name} marked ${data.status}${data.notify ? ` · ${notified} investor${notified === 1 ? "" : "s"} notified` : " · no emails sent"}.`,
      notified,
    };
  });
