import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createPublicSupabase } from "./supabase-public";
import { NEWS_CATEGORIES, NEWS_STATUSES, slugify, type NewsPost, type NewsPostInput } from "./news.types";

const COLUMNS =
  "id, slug, title, excerpt, body, category, cover_url, author, status, locale, published_at, created_at, updated_at";

/** Public: published articles only, newest first. */
export const listPublishedNews = createServerFn({ method: "GET" }).handler(
  async (): Promise<NewsPost[]> => {
    const supabase = createPublicSupabase();
    const { data, error } = await supabase
      .from("news_posts")
      .select(COLUMNS)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(120);
    if (error) throw error;
    return (data ?? []) as NewsPost[];
  },
);

/** Public: a single published article by slug, or null when missing. */
export const getPublishedNewsPost = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => ({ slug: String(input.slug).slice(0, 120) }))
  .handler(async ({ data }): Promise<NewsPost | null> => {
    const supabase = createPublicSupabase();
    const { data: rows, error } = await supabase
      .from("news_posts")
      .select(COLUMNS)
      .eq("slug", data.slug)
      .eq("status", "published")
      .limit(1);
    if (error) throw error;
    return ((rows ?? [])[0] as NewsPost | undefined) ?? null;
  });

/** Admin: every article, including drafts. */
export const listAllNews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<NewsPost[]> => {
    const { data, error } = await context.supabase
      .from("news_posts")
      .select(COLUMNS)
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw error;
    return (data ?? []) as NewsPost[];
  });

export const saveNewsPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: NewsPostInput) => input)
  .handler(async ({ data, context }): Promise<NewsPost> => {
    const title = data.title.trim();
    if (!title) throw new Error("Title is required");
    const slug = slugify(data.slug || title);
    if (!slug) throw new Error("Slug is required");
    if (!NEWS_CATEGORIES.includes(data.category)) throw new Error("Unknown category");
    if (!NEWS_STATUSES.includes(data.status)) throw new Error("Unknown status");

    const cover = data.cover_url.trim();
    if (cover && !/^https?:\/\/[^\s]+$/i.test(cover)) {
      throw new Error("Cover image must be a full URL starting with http:// or https://");
    }

    const publishedAt =
      data.status === "published" ? (data.published_at ?? new Date().toISOString()) : data.published_at;

    const row = {
      slug,
      title: title.slice(0, 200),
      excerpt: data.excerpt.trim().slice(0, 400),
      body: data.body.slice(0, 40000),
      category: data.category,
      cover_url: cover ? cover.slice(0, 500) : null,
      author: data.author.trim().slice(0, 120) || "Gigafactory 3X Newsroom",
      status: data.status,
      locale: data.locale.slice(0, 8) || "en",
      published_at: publishedAt,
    };

    const query = data.id
      ? context.supabase.from("news_posts").update(row).eq("id", data.id)
      : context.supabase.from("news_posts").insert({ ...row, created_by: context.userId });

    const { data: saved, error } = await query.select(COLUMNS).single();
    if (error) throw error;
    return saved as NewsPost;
  });

export const deleteNewsPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("news_posts").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
