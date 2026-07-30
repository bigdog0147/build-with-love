import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createPublicSupabase } from "./supabase-public";
import type { SocialLink, SocialLinkInput } from "./social.types";

export const listPublicSocialLinks = createServerFn({ method: "GET" }).handler(
  async (): Promise<SocialLink[]> => {
    const supabase = createPublicSupabase();
    const { data, error } = await supabase
      .from("social_links")
      .select("id, network, label, url, handle, icon_key, is_visible, sort_order")
      .eq("is_visible", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as SocialLink[];
  },
);

export const getAdminStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ isAdmin: boolean }> => {
    const { data, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error) throw error;
    return { isAdmin: Boolean(data) };
  });

export const listAllSocialLinks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SocialLink[]> => {
    const { data, error } = await context.supabase
      .from("social_links")
      .select("id, network, label, url, handle, icon_key, is_visible, sort_order")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as SocialLink[];
  });

export const saveSocialLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: SocialLinkInput) => input)
  .handler(async ({ data, context }): Promise<SocialLink> => {
    const url = data.url.trim();
    if (url && !/^https?:\/\/[^\s]+$/i.test(url)) {
      throw new Error("Enter a full URL starting with http:// or https://");
    }
    const network = data.network.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
    if (!network) throw new Error("Network key is required");
    if (!data.label.trim()) throw new Error("Label is required");

    const row = {
      network,
      label: data.label.trim().slice(0, 60),
      url: url.slice(0, 500),
      handle: data.handle?.trim().slice(0, 80) || null,
      icon_key: data.icon_key || "link",
      is_visible: data.is_visible && url.length > 0,
      sort_order: Number.isFinite(data.sort_order) ? data.sort_order : 0,
    };

    const query = data.id
      ? context.supabase.from("social_links").update(row).eq("id", data.id)
      : context.supabase.from("social_links").insert(row);

    const { data: saved, error } = await query
      .select("id, network, label, url, handle, icon_key, is_visible, sort_order")
      .single();
    if (error) throw error;
    return saved as SocialLink;
  });

export const deleteSocialLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("social_links")
      .delete()
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
