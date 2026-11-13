import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createPublicSupabase } from "@/lib/supabase-public";

const BASE_URL = "https://www.gf3x.space";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const entries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/about", changefreq: "monthly", priority: "0.8" },
  { path: "/technologies", changefreq: "monthly", priority: "0.9" },
  { path: "/industries", changefreq: "monthly", priority: "0.8" },
  { path: "/infrastructure", changefreq: "monthly", priority: "0.8" },
  { path: "/sustainability", changefreq: "monthly", priority: "0.8" },
  { path: "/news", changefreq: "weekly", priority: "0.8" },
  { path: "/innovation", changefreq: "monthly", priority: "0.8" },
  { path: "/investors", changefreq: "monthly", priority: "0.7" },
  { path: "/careers", changefreq: "weekly", priority: "0.7" },
  { path: "/resources/smart-factory-guide", changefreq: "monthly", priority: "0.8" },
  { path: "/contact", changefreq: "yearly", priority: "0.6" },
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        let all = entries;
        try {
          const supabase = createPublicSupabase();
          const { data } = await supabase
            .from("news_posts")
            .select("slug, updated_at")
            .eq("status", "published")
            .order("published_at", { ascending: false })
            .limit(200);
          all = [
            ...entries,
            ...(data ?? []).map((row) => ({
              path: `/news/${row.slug}`,
              changefreq: "monthly" as const,
              priority: "0.6",
            })),
          ];
        } catch {
          all = entries;
        }

        const urls = all
          .map((e) =>
            [
              `  <url>`,
              `    <loc>${BASE_URL}${e.path}</loc>`,
              e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
              e.priority ? `    <priority>${e.priority}</priority>` : null,
              `  </url>`,
            ]
              .filter(Boolean)
              .join("\n"),
          )
          .join("\n");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
