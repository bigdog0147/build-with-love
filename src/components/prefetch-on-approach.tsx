import { useEffect, useRef, useState } from "react";

/**
 * Prefetch a set of image URLs when a sentinel is within `rootMargin` of the
 * viewport. Uses `<link rel="preload" as="image">` so the browser can honour
 * priority hints and share cache with a subsequent <img> render.
 *
 * Renders a zero-height sentinel — place it a section or two above the
 * assets you want to warm up.
 */
export function PrefetchOnApproach({
  urls,
  rootMargin = "800px 0px",
  fetchPriority = "low",
}: {
  urls: string[];
  rootMargin?: string;
  fetchPriority?: "high" | "low" | "auto";
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    if (triggered) return;
    const el = ref.current;
    if (!el || typeof window === "undefined") return;
    // Prefer the Save-Data hint — never speculatively fetch on constrained links.
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } })
      .connection;
    if (conn?.saveData) return;

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setTriggered(true);
            obs.disconnect();
            break;
          }
        }
      },
      { rootMargin, threshold: 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [rootMargin, triggered]);

  useEffect(() => {
    if (!triggered || typeof document === "undefined") return;
    const links: HTMLLinkElement[] = [];
    for (const href of urls) {
      // Skip if already preloaded or in the page.
      if (
        document.querySelector(
          `link[rel="preload"][href="${CSS.escape(href)}"]`,
        )
      )
        continue;
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = href;
      link.setAttribute("fetchpriority", fetchPriority);
      document.head.appendChild(link);
      links.push(link);
    }
    return () => {
      for (const link of links) link.remove();
    };
  }, [triggered, urls, fetchPriority]);

  return <div ref={ref} aria-hidden className="h-0 w-0" />;
}
