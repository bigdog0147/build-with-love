import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/g3-logo.png";

const NAV = [
  { to: "/about", label: "About" },
  { to: "/technologies", label: "Technologies" },
  { to: "/industries", label: "Industries" },
  { to: "/innovation", label: "Innovation" },
  { to: "/investors", label: "Investors" },
  { to: "/careers", label: "Careers" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-[var(--background)]/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-3">
          <img
            src={logo}
            alt="Gigafactory 3 logo"
            width={36}
            height={36}
            className="h-9 w-9 object-contain"
          />
          <div>
            <div className="font-display text-base leading-none tracking-wide">
              GIGAFACTORY <span className="gold-text">3</span>
            </div>
            <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              Intelligent Industry
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            to="/login"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            activeProps={{ className: "text-foreground" }}
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="rounded-lg border border-border bg-[var(--surface-elevated)] px-3 py-2 text-sm font-medium transition-colors hover:border-[var(--gold)]/60"
          >
            Register
          </Link>
          <Link
            to="/investors"
            className="rounded-lg px-4 py-2 text-sm font-medium text-primary-foreground"
            style={{ background: "var(--gradient-gold)" }}
          >
            Investor Overview
          </Link>
        </div>

        <button
          type="button"
          className="grid h-9 w-9 place-items-center rounded-md border border-border lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border/60 lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-6 py-4">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-[var(--surface)] hover:text-foreground"
              >
                {n.label}
              </Link>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border/60 pt-3">
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center rounded-lg border border-border bg-[var(--surface-elevated)] py-2.5 text-sm font-medium"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center rounded-lg py-2.5 text-sm font-medium text-primary-foreground"
                style={{ background: "var(--gradient-gold)" }}
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
