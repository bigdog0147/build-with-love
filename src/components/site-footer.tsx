import { Link, type LinkProps } from "@tanstack/react-router";
import { SocialLinksBar } from "@/components/social-links-bar";
import { X3Logo3D } from "@/components/x3-logo-3d";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-[var(--surface)]/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <X3Logo3D size="sm" />
          </div>
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            High-performance engineering, advanced electric powertrains, renewable energy infrastructure, and precision computing systems.
          </p>
          <div className="mt-6">
            <SocialLinksBar />
          </div>
        </div>

        <FooterCol
          title="Company"
          links={[
            { to: "/about", label: "About" },
            { to: "/innovation", label: "Innovation" },
            { to: "/sustainability", label: "Sustainability" },
            { to: "/careers", label: "Careers" },
            { to: "/contact", label: "Contact" },
          ]}
        />
        <FooterCol
          title="Platform"
          links={[
            { to: "/technologies", label: "Core Technologies" },
            { to: "/industries", label: "Industries" },
            { to: "/infrastructure", label: "Global Infrastructure" },
            { to: "/resources/smart-factory-guide", label: "Smart Factory Guide" },
          ]}
        />
        <FooterCol
          title="Investors & Media"
          links={[
            { to: "/investors", label: "Investor Overview" },
            { to: "/news", label: "News & Press" },
            { to: "/search", label: "Search" },
            { to: "/contact", label: "IR Contact" },
          ]}
        />

      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-2 px-6 py-6 text-xs text-muted-foreground md:flex-row md:items-center">
          <div>© {new Date().getFullYear()} X3. All rights reserved.</div>
          <div className="uppercase tracking-[0.24em]">High-Performance Engineering & Systems</div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: readonly { to: LinkProps["to"]; label: string }[];
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">{title}</div>
      <ul className="mt-4 space-y-2 text-sm">
        {links.map((l) => (
          <li key={l.to + l.label}>
            <Link to={l.to} className="text-foreground/80 hover:text-foreground">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
