import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireAdminIdentity, requirePermission, logAdminAction, serviceClient } from "./admin-guard.server";

/** Tables included in a platform snapshot, in restore-safe order. */
export const BACKUP_TABLES = [
  "profiles",
  "wallets",
  "transactions",
  "deposit_requests",
  "withdrawal_requests",
  "investment_products",
  "investment_holdings",
  "kyc_profiles",
  "notifications",
  "support_tickets",
  "news_posts",
  "social_links",
  "currency_settings",
  "fx_rates",
] as const;

function fnv1a(input: string) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

/**
 * Admin: builds a JSON snapshot of the platform's operational tables and
 * records the run. The payload is returned to the browser for download —
 * nothing is written to storage, so a snapshot never lingers server-side.
 */
export const createBackup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const identity = await requireAdminIdentity(context as never);
    requirePermission(identity, "system_settings");
    const db = await serviceClient();

    const snapshot: Record<string, unknown[]> = {};
    const rowCounts: Record<string, number> = {};
    let total = 0;
    let failure: string | null = null;

    for (const table of BACKUP_TABLES) {
      const { data, error } = await db.from(table).select("*").limit(5000);
      if (error) {
        failure = `${table}: ${error.message}`;
        break;
      }
      snapshot[table] = data ?? [];
      rowCounts[table] = (data ?? []).length;
      total += (data ?? []).length;
    }

    const generatedAt = new Date().toISOString();
    const payload = failure
      ? null
      : JSON.stringify({ platform: "GF3X", generated_at: generatedAt, tables: snapshot });
    const checksum = payload ? fnv1a(payload) : null;

    await db.from("backup_runs").insert({
      kind: "manual",
      status: failure ? "failed" : "complete",
      tables: [...BACKUP_TABLES],
      total_rows: total,
      row_counts: rowCounts as never,
      checksum,
      error: failure,
      created_by: identity.userId,
    });

    await logAdminAction(identity, {
      action: "system.backup_created",
      targetType: "backup_run",
      after: { total, checksum, failed: failure },
    });

    if (failure) throw new Error(`Snapshot failed — ${failure}`);

    return {
      ok: true as const,
      filename: `gf3x-backup-${generatedAt.slice(0, 19).replace(/[:T]/g, "-")}.json`,
      checksum: checksum!,
      totalRows: total,
      rowCounts,
      payload: payload!,
      message: `Snapshot complete — ${total} rows across ${BACKUP_TABLES.length} tables.`,
    };
  });
