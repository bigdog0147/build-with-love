import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Profile = {
  id: string;
  display_name: string;
  tier: string;
  initials: string;
  avatar_url: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  country?: string | null;
  organization?: string | null;
  username?: string | null;
  membership?: string | null;
  role?: string | null;
  updated_at?: string | null;
};

export type Wallet = {
  id: string;
  code: string;
  label: string;
  balance: number;
  fiat_value: number | null;
  delta_pct: number;
  tint: string;
  sort_order: number;
};

export type Transaction = {
  id: string;
  name: string;
  kind: string;
  amount: number;
  currency: string;
  occurred_at: string;
  status: string;
};

export type Card = {
  id: string;
  name: string;
  last4: string;
  tier: string;
  gradient: string;
  sort_order: number;
};

export type Allocation = {
  id: string;
  label: string;
  percent: number;
  color: string;
  sort_order: number;
};

export type DashboardData = {
  profile: Profile;
  wallets: Wallet[];
  transactions: Transaction[];
  cards: Card[];
  allocations: Allocation[];
};

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DashboardData> => {
    const { supabase, userId } = context;

    const [profileRes, walletsRes, txRes, cardsRes, allocRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("wallets").select("*").eq("user_id", userId).order("sort_order"),
      supabase.from("transactions").select("*").eq("user_id", userId).order("occurred_at", { ascending: false }).limit(20),
      supabase.from("cards").select("*").eq("user_id", userId).order("sort_order"),
      supabase.from("allocations").select("*").eq("user_id", userId).order("sort_order"),
    ]);

    if (profileRes.error) throw new Error(profileRes.error.message);
    if (walletsRes.error) throw new Error(walletsRes.error.message);
    if (txRes.error) throw new Error(txRes.error.message);
    if (cardsRes.error) throw new Error(cardsRes.error.message);
    if (allocRes.error) throw new Error(allocRes.error.message);

    const profile: Profile = profileRes.data ?? {
      id: userId,
      display_name: "Client",
      tier: "Obsidian",
      initials: "CL",
      avatar_url: null,
    };

    return {
      profile,
      wallets: (walletsRes.data ?? []) as Wallet[],
      transactions: (txRes.data ?? []) as Transaction[],
      cards: (cardsRes.data ?? []) as Card[],
      allocations: (allocRes.data ?? []) as Allocation[],
    };
  });
