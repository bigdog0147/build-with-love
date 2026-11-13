export const NEWS_CATEGORIES = ["press_release", "announcement", "media_coverage"] as const;
export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

export const NEWS_STATUSES = ["draft", "published"] as const;
export type NewsStatus = (typeof NEWS_STATUSES)[number];

export type NewsPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  cover_url: string | null;
  author: string;
  status: string;
  locale: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type NewsPostInput = {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: NewsCategory;
  cover_url: string;
  author: string;
  status: NewsStatus;
  locale: string;
  published_at: string | null;
};

export const CATEGORY_LABEL: Record<string, string> = {
  press_release: "Press release",
  announcement: "Announcement",
  media_coverage: "Media coverage",
};

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export function formatNewsDate(value: string | null): string {
  if (!value) return "Unpublished";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
