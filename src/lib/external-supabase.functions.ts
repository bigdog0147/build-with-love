import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };
export type ExternalRow = Record<string, Json>;

/**
 * Typed RPC surface over the external Supabase project.
 * The secret key never leaves the server: it is loaded inside each handler.
 */

/** Connectivity + reachable-table probe. Admins only. */
export const checkExternalSupabase = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    // PostgREST root returns the OpenAPI doc listing exposed tables.
    const url = process.env.EXT_SUPABASE_URL!;
    const key = process.env.EXT_SUPABASE_SECRET_KEY!;
    const openapi = await fetch(`${url}/rest/v1/`, {
      headers: { apikey: key, Accept: "application/openapi+json" },
    });

    if (!openapi.ok) {
      return { ok: false as const, status: openapi.status, tables: [] as string[] };
    }
    const doc = (await openapi.json()) as { definitions?: Record<string, unknown> };
    return {
      ok: true as const,
      status: openapi.status,
      tables: Object.keys(doc.definitions ?? {}).sort(),
    };
  });

/** Read rows from any table on the external project. Admins only. */
export const readExternalTable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { table: string; limit?: number }) => {
    if (!/^[a-zA-Z0-9_]+$/.test(input.table)) throw new Error("Invalid table name");
    return { table: input.table, limit: Math.min(Math.max(input.limit ?? 25, 1), 200) };
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { externalSupabaseAdmin } = await import("./external-supabase.server");
    const { data: rows, error } = await externalSupabaseAdmin()
      .from(data.table)
      .select("*")
      .limit(data.limit);
    if (error) throw new Error(error.message);
    return { rows: (rows ?? []) as ExternalRow[] };
  });
