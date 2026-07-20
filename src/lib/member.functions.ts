import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type MemberProfile = {
  id: string;
  display_name: string;
  initials: string;
  avatar_url: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  country: string | null;
  organization: string | null;
  username: string | null;
  interests: string[];
  role: string;
  membership: string;
};

export const getMemberProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MemberProfile> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, display_name, initials, avatar_url, first_name, last_name, phone, country, organization, username, interests, role, membership",
      )
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (
      (data as MemberProfile | null) ?? {
        id: userId,
        display_name: "Member",
        initials: "GM",
        avatar_url: null,
        first_name: null,
        last_name: null,
        phone: null,
        country: null,
        organization: null,
        username: null,
        interests: [],
        role: "Research Member",
        membership: "Standard",
      }
    );
  });
