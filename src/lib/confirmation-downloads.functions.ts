import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  normalizeDownloadSource,
  type ConfirmationDownloadRow,
} from "@/lib/confirmation-downloads";

const MAX_PAGE = 50;

/**
 * Records one confirmation-document download for the signed-in investor.
 *
 * The trail is append-only (no update/delete policy), so it stays a faithful
 * record of what the investor took away and from which round.
 */
export const recordConfirmationDownload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      roundId?: string | null;
      roundName: string;
      eventKey: string;
      documentTitle: string;
      reference?: string | null;
      source?: string;
      documentCount?: number;
    }) => ({
      roundId: input.roundId ? String(input.roundId) : null,
      roundName: String(input.roundName ?? "Capital raise").slice(0, 160),
      eventKey: String(input.eventKey ?? "confirmation").slice(0, 80),
      documentTitle: String(input.documentTitle ?? "Confirmation document").slice(0, 160),
      reference: input.reference ? String(input.reference).slice(0, 120) : null,
      source: normalizeDownloadSource(input.source),
      documentCount: Math.max(1, Math.min(500, Math.round(Number(input.documentCount ?? 1)) || 1)),
    }),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("confirmation_downloads").insert({
      user_id: context.userId,
      round_id: data.roundId,
      round_name: data.roundName,
      event_key: data.eventKey,
      document_title: data.documentTitle,
      reference: data.reference,
      source: data.source,
      document_count: data.documentCount,
    } as never);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/** Paged audit trail for the signed-in investor, newest first. */
export const listConfirmationDownloads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { page?: number; pageSize?: number; roundId?: string | null } = {}) => ({
    page: Math.max(1, Math.round(Number(input.page ?? 1)) || 1),
    pageSize: Math.max(1, Math.min(MAX_PAGE, Math.round(Number(input.pageSize ?? 10)) || 10)),
    roundId: input.roundId ? String(input.roundId) : null,
  }))
  .handler(async ({ data, context }) => {
    const from = (data.page - 1) * data.pageSize;
    let query = context.supabase
      .from("confirmation_downloads")
      .select(
        "id, round_id, round_name, event_key, document_title, reference, source, document_count, created_at",
        { count: "exact" },
      )
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .range(from, from + data.pageSize - 1);
    if (data.roundId) query = query.eq("round_id", data.roundId);

    const { data: rows, count, error } = await query;
    if (error) throw new Error(error.message);
    return {
      rows: (rows ?? []) as ConfirmationDownloadRow[],
      total: count ?? 0,
      page: data.page,
      pageSize: data.pageSize,
    };
  });
