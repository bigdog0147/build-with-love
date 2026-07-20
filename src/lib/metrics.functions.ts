import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type Metric = {
  id: string;
  label: string;
  value: number;
  suffix: string;
  decimals: number;
  sub: string | null;
  sort_order: number;
};

export const getMetrics = createServerFn({ method: "GET" }).handler(async (): Promise<Metric[]> => {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  const supabase = createClient<Database>(url, key, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });

  const { data, error } = await supabase
    .from("metrics")
    .select("id,label,value,suffix,decimals,sub,sort_order")
    .order("sort_order");

  if (error) throw new Error(error.message);
  return (data ?? []).map((m) => ({
    ...m,
    value: Number(m.value),
    decimals: Number(m.decimals),
  })) as Metric[];
});
