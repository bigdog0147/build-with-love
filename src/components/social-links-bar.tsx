import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SocialIcon } from "@/components/social-icon";
import { listPublicSocialLinks } from "@/lib/social.functions";

export function SocialLinksBar() {
  const fetchLinks = useServerFn(listPublicSocialLinks);
  const { data } = useQuery({
    queryKey: ["social-links", "public"],
    queryFn: () => fetchLinks({}),
    staleTime: 5 * 60 * 1000,
  });

  if (!data || data.length === 0) return null;

  return (
    <ul className="flex flex-wrap items-center gap-3">
      {data.map((link) => (
        <li key={link.id}>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.label}
            title={link.handle ? `${link.label} — ${link.handle}` : link.label}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border/70 text-foreground/70 transition-colors hover:border-[var(--gold)]/60 hover:text-[var(--gold)]"
          >
            <SocialIcon iconKey={link.icon_key} />
          </a>
        </li>
      ))}
    </ul>
  );
}
