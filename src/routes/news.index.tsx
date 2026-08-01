import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Newspaper } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GlassCard, PageHero, Section } from "@/components/section";
import { listPublishedNews } from "@/lib/news.functions";
import { CATEGORY_LABEL, formatNewsDate, type NewsPost } from "@/lib/news.types";
import { useT } from "@/lib/i18n";

const newsQuery = queryOptions({
  queryKey: ["news", "published"],
  queryFn: () => listPublishedNews(),
  staleTime: 60_000,
});

export const Route = createFileRoute("/news/")({
  loader: ({ context }) => {
    void context.queryClient.ensureQueryData(newsQuery);
  },
  component: NewsIndexPage,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-3xl px-6 py-24" role="alert">
      <h1 className="font-display text-2xl">The newsroom didn't load</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="font-display text-2xl">No articles found</h1>
    </div>
  ),
  head: () => ({
    meta: [
      { title: "News & Press — Gigafactory 3X" },
      {
        name: "description",
        content:
          "Press releases, programme announcements and media coverage from the Gigafactory 3X newsroom.",
      },
      { property: "og:title", content: "News & Press — Gigafactory 3X" },
      {
        property: "og:description",
        content: "Announcements and media coverage from across our global operations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://www.gf3x.space/news" }],
  }),
});

const FILTERS = ["all", "press_release", "announcement", "media_coverage"] as const;

function NewsIndexPage() {
  const { data: posts } = useSuspenseQuery(newsQuery);
  const t = useT();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");

  const filtered = useMemo(
    () => (filter === "all" ? posts : posts.filter((p) => p.category === filter)),
    [posts, filter],
  );
  const [featured, ...rest] = filtered;

  const filterLabel = (key: (typeof FILTERS)[number]) =>
    key === "all"
      ? t("news.all")
      : key === "press_release"
        ? t("news.pressRelease")
        : key === "announcement"
          ? t("news.announcement")
          : t("news.mediaCoverage");

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <PageHero
        eyebrow={t("news.eyebrow")}
        title={t("news.title")}
        gold={t("news.titleGold")}
        lead={t("news.lead")}
      />

      <Section>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              aria-pressed={filter === key}
              className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.16em] transition-colors ${
                filter === key
                  ? "border-[var(--gold)]/60 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {filterLabel(key)}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="mt-10 text-sm text-muted-foreground">{t("news.empty")}</p>
        ) : (
          <div className="mt-8 space-y-4">
            {featured && <FeaturedCard post={featured} cta={t("news.readMore")} />}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rest.map((post) => (
                <ArticleCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        )}
      </Section>

      <Section>
        <GlassCard className="p-8">
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            <Newspaper className="h-4 w-4 text-[var(--gold)]" /> {t("news.pressKit")}
          </div>
          <p className="mt-4 max-w-2xl text-sm text-muted-foreground">{t("news.pressKitBody")}</p>
          <Link
            to="/contact"
            className="mt-6 inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-medium text-primary-foreground"
            style={{ background: "var(--gradient-gold)" }}
          >
            {t("news.mediaContact")} <ArrowRight className="h-4 w-4" />
          </Link>
        </GlassCard>
      </Section>

      <SiteFooter />
    </div>
  );
}

function FeaturedCard({ post, cta }: { post: NewsPost; cta: string }) {
  return (
    <GlassCard className="overflow-hidden p-0">
      <Link to="/news/$slug" params={{ slug: post.slug }} className="grid gap-0 md:grid-cols-2">
        {post.cover_url ? (
          <img
            src={post.cover_url}
            alt={post.title}
            loading="lazy"
            className="h-56 w-full object-cover md:h-full"
          />
        ) : (
          <div
            className="h-40 w-full md:h-full"
            style={{ background: "var(--gradient-gold)", opacity: 0.18 }}
          />
        )}
        <div className="p-8">
          <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            {CATEGORY_LABEL[post.category] ?? post.category} · {formatNewsDate(post.published_at)}
          </div>
          <h2 className="mt-4 font-display text-2xl sm:text-3xl">{post.title}</h2>
          <p className="mt-3 text-sm text-muted-foreground">{post.excerpt}</p>
          <span className="mt-6 inline-flex items-center gap-2 text-sm text-[var(--gold)]">
            {cta} <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </Link>
    </GlassCard>
  );
}

function ArticleCard({ post }: { post: NewsPost }) {
  return (
    <GlassCard className="h-full p-0">
      <Link to="/news/$slug" params={{ slug: post.slug }} className="block h-full p-7">
        <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
          {CATEGORY_LABEL[post.category] ?? post.category}
        </div>
        <h3 className="mt-3 font-display text-lg leading-snug">{post.title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{post.excerpt}</p>
        <div className="mt-5 text-xs text-muted-foreground">
          {formatNewsDate(post.published_at)}
        </div>
      </Link>
    </GlassCard>
  );
}
