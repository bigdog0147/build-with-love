import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  insertHeldTransaction,
  moveWalletBalance,
  notifyWithdrawalDecision,
  setTransactionStatus,
  validateWithdrawalInput,
} from "@/lib/withdrawals.server";
export type { WithdrawalRow, WithdrawalStatus, WithdrawalDestination } from "@/lib/withdrawals.server";

const SELECT =
  "id, user_id, wallet_id, transaction_id, amount, currency, destination_type, destination_label, destination_details, note, status, review_note, reviewed_at, created_at";

/** Wallets + KYC gate + the customer's own withdrawal history. */
export const getWithdrawals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [wallets, requests, kyc] = await Promise.all([
      supabase
        .from("wallets")
        .select("id, code, label, balance, fiat_value")
        .eq("user_id", userId)
        .order("sort_order"),
      supabase
        .from("withdrawal_requests")
        .select(SELECT)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.from("kyc_profiles").select("id_status").eq("user_id", userId).maybeSingle(),
    ]);
    if (wallets.error) throw new Error(wallets.error.message);
    if (requests.error) throw new Error(requests.error.message);
    return {
      wallets: wallets.data ?? [],
      requests: requests.data ?? [],
      idStatus: (kyc.data?.id_status as string | undefined) ?? "not_started",
    };
  });

export const requestWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      walletId: string;
      amount: number;
      destinationType: string;
      destinationLabel: string;
      destinationDetails?: string;
      note?: string;
    }) => validateWithdrawalInput(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: kyc } = await supabase
      .from("kyc_profiles")
      .select("id_status")
      .eq("user_id", userId)
      .maybeSingle();
    if (kyc?.id_status !== "verified")
      throw new Error("Identity verification must be approved before you can withdraw funds.");

    // Fraud controls run before any money moves.
    const { assertNotBlocked } = await import("./risk-engine.server");
    const { getRequestIP, getRequestHeader } = await import("@tanstack/react-start/server");
    const assessment = await assertNotBlocked({
      userId,
      kind: "withdrawal",
      amount: data.amount,
      currency: "USD",
      ip: getRequestIP({ xForwardedFor: true }) ?? null,
      userAgent: getRequestHeader("user-agent") ?? null,
      subjectType: "withdrawal_request",
    });

    // Hold the amount immediately so it cannot be spent twice.
    const wallet = await moveWalletBalance(supabase, userId, data.walletId, -data.amount);
    const transactionId = await insertHeldTransaction(supabase, userId, {
      name: `Withdrawal · ${data.destinationLabel}`,
      amount: data.amount,
      currency: wallet.code,
    });

    const { error } = await supabase.from("withdrawal_requests").insert({
      user_id: userId,
      wallet_id: data.walletId,
      transaction_id: transactionId,
      amount: data.amount,
      currency: wallet.code,
      destination_type: data.destinationType,
      destination_label: data.destinationLabel,
      destination_details: data.destinationDetails,
      note: data.note || null,
      status: "pending",
    });
    if (error) {
      // Roll the hold back so the customer is never short.
      await moveWalletBalance(supabase, userId, data.walletId, data.amount);
      await setTransactionStatus(supabase, transactionId, "Reversed");
      throw new Error(error.message);
    }

    return {
      ok: true as const,
      message:
        assessment.band === "review"
          ? `Withdrawal of ${data.amount} ${wallet.code} submitted — our compliance desk will complete an additional check.`
          : `Withdrawal of ${data.amount} ${wallet.code} submitted for review.`,
    };
  });

export const cancelWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input?.id) throw new Error("Missing request id.");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("withdrawal_requests")
      .select("id, wallet_id, amount, currency, status, transaction_id")
      .eq("id", data.id)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Request not found.");
    if (row.status !== "pending") throw new Error("Only requests awaiting review can be cancelled.");

    const { error: upErr } = await supabase
      .from("withdrawal_requests")
      .update({ status: "cancelled" })
      .eq("id", row.id)
      .eq("user_id", userId);
    if (upErr) throw new Error(upErr.message);

    await moveWalletBalance(supabase, userId, row.wallet_id, Number(row.amount));
    await setTransactionStatus(supabase, row.transaction_id, "Reversed");
    return { ok: true as const, message: "Withdrawal cancelled and funds released." };
  });

/* ------------------------------- admin side ------------------------------- */

export const adminListWithdrawals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("withdrawal_requests")
      .select(SELECT)
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);

    const rows = data ?? [];
    const userIds = [...new Set(rows.map((r: any) => r.user_id))];
    let people: Record<string, { name: string; idStatus: string }> = {};
    if (userIds.length) {
      const [profiles, kyc] = await Promise.all([
        supabaseAdmin.from("profiles").select("id, display_name").in("id", userIds),
        supabaseAdmin.from("kyc_profiles").select("user_id, id_status").in("user_id", userIds),
      ]);
      const statusById = new Map((kyc.data ?? []).map((k: any) => [k.user_id, k.id_status]));
      people = Object.fromEntries(
        (profiles.data ?? []).map((p: any) => [
          p.id,
          { name: p.display_name as string, idStatus: (statusById.get(p.id) as string) ?? "not_started" },
        ]),
      );
    }
    return { rows, people };
  });

export const reviewWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; decision: "approved" | "rejected"; reviewNote?: string }) => {
    if (!input?.id) throw new Error("Missing request id.");
    if (input.decision !== "approved" && input.decision !== "rejected")
      throw new Error("Invalid decision.");
    const reviewNote = (input.reviewNote ?? "").trim().slice(0, 400);
    if (input.decision === "rejected" && reviewNote.length < 3)
      throw new Error("A reason is required when declining a withdrawal.");
    return { id: input.id, decision: input.decision, reviewNote };
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("withdrawal_requests")
      .select("id, user_id, wallet_id, amount, currency, status, transaction_id")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Request not found.");
    if (row.status !== "pending") throw new Error("This request has already been reviewed.");

    const { error: upErr } = await supabaseAdmin
      .from("withdrawal_requests")
      .update({
        status: data.decision,
        review_note: data.reviewNote || null,
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    if (upErr) throw new Error(upErr.message);

    if (data.decision === "approved") {
      await setTransactionStatus(supabaseAdmin, row.transaction_id, "Cleared");
    } else {
      // Release the hold back to the wallet.
      await moveWalletBalance(supabaseAdmin, row.user_id, row.wallet_id, Number(row.amount));
      await setTransactionStatus(supabaseAdmin, row.transaction_id, "Reversed");
    }

    await notifyWithdrawalDecision(
      supabaseAdmin,
      row.user_id,
      data.decision,
      Number(row.amount),
      row.currency,
      data.reviewNote,
    );

    return { ok: true as const, message: `Withdrawal ${data.decision}.` };
  });
