import { Link } from "@tanstack/react-router";
import logo from "@/assets/g3-logo.png";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-[var(--surface)]/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <img src={logo} alt="Gigafactory 3 logo" width={32} height={32} className="h-8 w-8 object-contain" />
            <div className="font-display text-base tracking-wide">
              GIGAFACTORY <span className="gold-text">3</span>
            </div>
          </div>
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            Engineering the future of intelligent industry — AI-powered manufacturing,
            clean energy and digital infrastructure at global scale.
          </p>
        </div>

        <FooterCol
          title="Company"
          links={[
            { to: "/about", label: "About" },
            { to: "/innovation", label: "Innovation" },
            { to: "/careers", label: "Careers" },
            { to: "/contact", label: "Contact" },
          ]}
        />
        <FooterCol
          title="Platform"
          links={[
            { to: "/technologies", label: "Core Technologies" },
            { to: "/industries", label: "Industries" },
          ]}
        />
        <FooterCol
          title="Investors"
          links={[
            { to: "/investors", label: "Overview" },
            { to: "/contact", label: "IR Contact" },
          ]}
        />
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-2 px-6 py-6 text-xs text-muted-foreground md:flex-row md:items-center">
          <div>© {new Date().getFullYear()} Gigafactory 3 Industries. All rights reserved.</div>
          <div className="uppercase tracking-[0.24em]">Engineering Tomorrow's Intelligent Infrastructure</div>
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
  links: readonly { to: "/about" | "/innovation" | "/careers" | "/contact" | "/technologies" | "/industries" | "/investors"; label: string }[];
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
