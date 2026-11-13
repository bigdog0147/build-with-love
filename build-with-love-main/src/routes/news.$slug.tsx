import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Section } from "@/components/section";
import { getPublishedNewsPost } from "@/lib/news.functions";
import { CATEGORY_LABEL, formatNewsDate } from "@/lib/news.types";
import { useT } from "@/lib/i18n";

const postQuery = (slug: string) =>
  queryOptions({
    queryKey: ["news", "post", slug],
    queryFn: () => getPublishedNewsPost({ data: { slug } }),
    staleTime: 60_000,
  });

export const Route = createFileRoute("/news/$slug")({
  loader: async ({ params, context }) => {
    const post = await context.queryClient.ensureQueryData(postQuery(params.slug));
    if (!post) throw notFound();
    return { post };
  },
  component: NewsArticlePage,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-3xl px-6 py-24" role="alert">
      <h1 className="font-display text-2xl">This article didn't load</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      <Link to="/news" className="mt-6 inline-block text-sm text-[var(--gold)]">
        Back to newsroom
      </Link>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="font-display text-2xl">Article not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This story may have been unpublished or moved.
      </p>
      <Link to="/news" className="mt-6 inline-block text-sm text-[var(--gold)]">
        Back to newsroom
      </Link>
    </div>
  ),
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Unavailable — Gigafactory 3X" }, { name: "robots", content: "noindex" }],
      };
    }
    const { post } = loaderData;
    const url = `https://www.gf3x.space/news/${post.slug}`;
    return {
      meta: [
        { title: `${post.title} — Gigafactory 3X` },
        { name: "description", content: post.excerpt },
        { property: "og:title", content: post.title },
        { property: "og:description", content: post.excerpt },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        ...(post.cover_url
          ? [
              { property: "og:image", content: post.cover_url },
              { name: "twitter:image", content: post.cover_url },
            ]
          : []),
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            headline: post.title,
            description: post.excerpt,
            datePublished: post.published_at,
            dateModified: post.updated_at,
            author: { "@type": "Organization", name: post.author },
            publisher: {
              "@type": "Organization",
              name: "Gigafactory 3X",
              logo: {
                "@type": "ImageObject",
                url: "https://www.gf3x.space/favicon.png",
              },
            },
            mainEntityOfPage: url,
            ...(post.cover_url ? { image: post.cover_url } : {}),
          }),
        },
      ],
    };
  },
});

function NewsArticlePage() {
  const { slug } = Route.useParams();
  const { data: post } = useSuspenseQuery(postQuery(slug));
  const t = useT();
  if (!post) return null;

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <article>
        <header className="relative overflow-hidden border-b border-border/60">
          <div
            className="pointer-events-none absolute -right-40 -top-40 h-[26rem] w-[26rem] rounded-full opacity-25 blur-3xl"
            style={{ background: "var(--gradient-gold)" }}
          />
          <div className="relative mx-auto max-w-3xl px-6 py-20">
            <Link
              to="/news"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> {t("news.back")}
            </Link>
            <div className="mt-8 text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
              {CATEGORY_LABEL[post.category] ?? post.category} ·{" "}
              {formatNewsDate(post.published_at)}
            </div>
            <h1 className="mt-4 font-display text-3xl leading-tight sm:text-4xl lg:text-5xl">
              {post.title}
            </h1>
            <p className="mt-5 text-lg text-muted-foreground">{post.excerpt}</p>
            <div className="mt-6 text-xs text-muted-foreground">{post.author}</div>
          </div>
        </header>

        {post.cover_url && (
          <div className="mx-auto max-w-5xl px-6 pt-10">
            <img
              src={post.cover_url}
              alt={post.title}
              className="w-full rounded-2xl border border-border object-cover"
            />
          </div>
        )}

        <Section>
          <div className="mx-auto max-w-3xl space-y-5 text-base leading-relaxed text-foreground/85">
            {post.body
              .split(/\n{2,}/)
              .map((para) => para.trim())
              .filter(Boolean)
              .map((para, i) => (
                <p key={i}>{para}</p>
              ))}
          </div>
        </Section>
      </article>

      <SiteFooter />
    </div>
  );
}
