import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  insertPendingDepositTransaction,
  notifyDepositDecision,
  validateDepositInput,
} from "@/lib/deposits.server";
import { moveWalletBalance, setTransactionStatus } from "@/lib/withdrawals.server";
import {
  logAdminAction,
  requireAdminPermission,
  serviceClient,
} from "@/lib/admin-guard.server";
export type { DepositRow, DepositStatus, DepositMethod } from "@/lib/deposits.server";

const SELECT =
  "id, user_id, wallet_id, transaction_id, amount, currency, method, reference, proof_path, note, status, review_note, reviewed_at, created_at";

/** Wallets + verification gate + the customer's own deposit history. */
export const getDeposits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [wallets, requests, kyc, settings] = await Promise.all([
      supabase
        .from("wallets")
        .select("id, code, label, balance, fiat_value")
        .eq("user_id", userId)
        .order("sort_order"),
      supabase
        .from("deposit_requests")
        .select(SELECT)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.from("kyc_profiles").select("id_status").eq("user_id", userId).maybeSingle(),
      supabase.from("system_settings").select("deposit_min, support_email").maybeSingle(),
    ]);
    if (wallets.error) throw new Error(wallets.error.message);
    if (requests.error) throw new Error(requests.error.message);
    return {
      wallets: wallets.data ?? [],
      requests: requests.data ?? [],
      idStatus: (kyc.data?.id_status as string | undefined) ?? "not_started",
      depositMin: Number(settings.data?.deposit_min ?? 100),
      supportEmail: settings.data?.support_email ?? "support@gf3x.space",
    };
  });

export const requestDeposit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      walletId: string;
      amount: number;
      method: string;
      reference?: string;
      note?: string;
      proofPath?: string;
    }) => validateDepositInput(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: kyc } = await supabase
      .from("kyc_profiles")
      .select("id_status")
      .eq("user_id", userId)
      .maybeSingle();
    if (kyc?.id_status !== "verified")
      throw new Error("Identity verification must be approved before you can fund your account.");

    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("id, code")
      .eq("id", data.walletId)
      .eq("user_id", userId)
      .maybeSingle();
    if (walletError) throw new Error(walletError.message);
    if (!wallet) throw new Error("Wallet not found.");

    // Fraud controls score the declaration before it enters the queue.
    const { assertNotBlocked } = await import("./risk-engine.server");
    const { getRequestIP, getRequestHeader } = await import("@tanstack/react-start/server");
    await assertNotBlocked({
      userId,
      kind: "deposit",
      amount: data.amount,
      currency: wallet.code,
      ip: getRequestIP({ xForwardedFor: true }) ?? null,
      userAgent: getRequestHeader("user-agent") ?? null,
      subjectType: "deposit_request",
    });

    const transactionId = await insertPendingDepositTransaction(supabase, userId, {
      amount: data.amount,
      currency: wallet.code,
      method: data.method,
    });

    const { error } = await supabase.from("deposit_requests").insert({
      user_id: userId,
      wallet_id: data.walletId,
      transaction_id: transactionId,
      amount: data.amount,
      currency: wallet.code,
      method: data.method,
      reference: data.reference,
      note: data.note || null,
      proof_path: data.proofPath,
      status: "pending",
    });
    if (error) {
      await setTransactionStatus(supabase, transactionId, "Reversed");
      throw new Error(error.message);
    }

    return {
      ok: true as const,
      message: `Deposit of ${data.amount} ${wallet.code} submitted. Funds appear once operations confirm receipt.`,
    };
  });

export const cancelDeposit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input?.id) throw new Error("Missing request id.");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("deposit_requests")
      .select("id, status, transaction_id")
      .eq("id", data.id)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Request not found.");
    if (row.status !== "pending") throw new Error("Only requests awaiting review can be cancelled.");

    const { error: upErr } = await supabase
      .from("deposit_requests")
      .update({ status: "cancelled" })
      .eq("id", data.id)
      .eq("user_id", userId);
    if (upErr) throw new Error(upErr.message);
    await setTransactionStatus(supabase, row.transaction_id, "Cancelled");
    return { ok: true as const, message: "Deposit request cancelled." };
  });

/* ============================ administration ============================ */

export const adminListDeposits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdminPermission(context as never, "deposits");
    const db = await serviceClient();
    const { data: rows, error } = await db
      .from("deposit_requests")
      .select(SELECT)
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);

    const ids = [...new Set((rows ?? []).map((r: any) => r.user_id))];
    const people: Record<string, { name: string; tier: string }> = {};
    if (ids.length) {
      const { data: profiles } = await db
        .from("profiles")
        .select("id, display_name, tier")
        .in("id", ids);
      for (const p of profiles ?? [])
        people[p.id] = { name: p.display_name, tier: p.tier };
    }
    return { rows: rows ?? [], people };
  });

/** Signed, short-lived link to a customer's proof-of-payment document. */
export const getDepositProofUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { path: string }) => {
    if (!input?.path) throw new Error("Missing document path.");
    return input;
  })
  .handler(async ({ data, context }) => {
    await requireAdminPermission(context as never, "deposits");
    const db = await serviceClient();
    const { data: signed, error } = await db.storage
      .from("deposit-proofs")
      .createSignedUrl(data.path, 300);
    if (error) throw new Error(error.message);
    return { url: signed?.signedUrl as string };
  });

export const reviewDeposit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; decision: "approved" | "rejected"; reviewNote?: string }) => {
    if (!input?.id) throw new Error("Missing request id.");
    if (input.decision !== "approved" && input.decision !== "rejected")
      throw new Error("Invalid decision.");
    return { ...input, reviewNote: (input.reviewNote ?? "").trim().slice(0, 400) };
  })
  .handler(async ({ data, context }) => {
    const identity = await requireAdminPermission(context as never, "deposits");
    const db = await serviceClient();

    const { data: row, error } = await db
      .from("deposit_requests")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Request not found.");
    if (row.status !== "pending") throw new Error("This request has already been reviewed.");

    if (data.decision === "approved") {
      // Credit only on approval — a pending deposit never affects the balance.
      await moveWalletBalance(db, row.user_id, row.wallet_id, Number(row.amount));
      await setTransactionStatus(db, row.transaction_id, "Completed");
    } else {
      await setTransactionStatus(db, row.transaction_id, "Rejected");
    }

    const { error: upErr } = await db
      .from("deposit_requests")
      .update({
        status: data.decision,
        review_note: data.reviewNote || null,
        reviewed_by: identity.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (upErr) throw new Error(upErr.message);

    await notifyDepositDecision(
      db,
      row.user_id,
      data.decision,
      {
        amount: Number(row.amount),
        currency: row.currency,
        method: row.method,
        reference: row.reference,
      },
      data.reviewNote,
    );

    await logAdminAction(identity, {
      action: `deposit.${data.decision}`,
      targetType: "deposit_request",
      targetId: row.id,
      targetLabel: `${row.amount} ${row.currency}`,
      before: { status: row.status },
      after: { status: data.decision, review_note: data.reviewNote },
    });

    return {
      ok: true as const,
      message:
        data.decision === "approved"
          ? `Deposit approved — ${row.amount} ${row.currency} credited.`
          : "Deposit declined and the customer notified.",
    };
  });
