import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import {
  Bell,
  BookMarked,
  Bookmark,
  Calendar,
  Compass,
  Diamond,
  Download,
  FileText,
  GraduationCap,
  Home,
  LayoutGrid,
  LifeBuoy,
  LogOut,
  Megaphone,
  MessagesSquare,
  Newspaper,
  PlayCircle,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  Video,
} from "lucide-react";
import { getMemberProfile, type MemberProfile } from "@/lib/member.functions";
import { supabase } from "@/integrations/supabase/client";

const memberQuery = queryOptions({
  queryKey: ["member-profile"],
  queryFn: () => getMemberProfile(),
});

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "Member Dashboard — Gigafactory 3" },
      { name: "description", content: "Your personalized Gigafactory 3 member portal." },
    ],
  }),
  pendingComponent: () => (
    <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
      Loading your workspace…
    </div>
  ),
});

function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <DashboardInner />
    </Suspense>
  );
}

function cx(...c: (string | false | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

function DashboardInner() {
  const { data: profile } = useSuspenseQuery(memberQuery);
  const [active, setActive] = useState("Home");

  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto flex max-w-[1440px] gap-6 px-4 py-6 lg:px-8">
        <Sidebar active={active} onSelect={setActive} />
        <main className="min-w-0 flex-1 space-y-6">
          <TopBar profile={profile} />
          <WelcomeHeader profile={profile} />
          <StatsStrip profile={profile} />
          <div className="grid gap-6 xl:grid-cols-3">
            <ResearchCard interests={profile.interests} />
            <TechUpdatesCard />
            <EventsCard />
          </div>
          <div className="grid gap-6 xl:grid-cols-3">
            <AccountCard profile={profile} />
            <NotificationsCard />
            <LearningCard />
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------------- Sidebar ---------------- */

const NAV = [
  { icon: Home, label: "Home" },
  { icon: BookMarked, label: "Research" },
  { icon: LayoutGrid, label: "Technology" },
  { icon: Compass, label: "Projects" },
  { icon: Download, label: "Downloads" },
  { icon: Users, label: "Community" },
  { icon: LifeBuoy, label: "Support" },
  { icon: Settings, label: "Settings" },
];

function Sidebar({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (l: string) => void;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-64 shrink-0 flex-col justify-between rounded-2xl p-5 lg:flex glass">
      <div>
        <div className="mb-8 flex items-center gap-2">
          <div
            className="grid h-9 w-9 place-items-center rounded-lg"
            style={{ background: "var(--gradient-gold)" }}
          >
            <Diamond className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-display text-base leading-none">Gigafactory 3</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Member Portal
            </div>
          </div>
        </div>
        <nav className="space-y-1">
          {NAV.map(({ icon: Icon, label }) => {
            const isActive = active === label;
            return (
              <button
                key={label}
                onClick={() => onSelect(label)}
                className={cx(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
      <div className="space-y-3">
        <div className="rounded-xl border border-border/70 p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-[var(--gold)]" />
            Concierge
          </div>
          <div className="mt-1 text-sm">Talk to our team</div>
          <button className="mt-3 w-full rounded-md bg-foreground/95 px-3 py-1.5 text-xs font-medium text-background">
            Open a request
          </button>
        </div>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}

/* ---------------- Top Bar ---------------- */

function TopBar({ profile }: { profile: MemberProfile }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search research, reports, events…"
          className="w-full rounded-xl border border-border bg-[var(--surface)] py-2.5 pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:border-[var(--gold)]/60"
        />
      </div>
      <button
        aria-label="Notifications"
        className="relative grid h-10 w-10 place-items-center rounded-xl border border-border bg-[var(--surface)] text-muted-foreground hover:text-foreground"
      >
        <Bell className="h-4 w-4" />
        <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
      </button>
      <button
        aria-label="Settings"
        className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-[var(--surface)] text-muted-foreground hover:text-foreground"
      >
        <Settings className="h-4 w-4" />
      </button>
      <div className="flex items-center gap-3 rounded-xl border border-border bg-[var(--surface)] py-1.5 pl-1.5 pr-3">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.display_name}
            className="h-8 w-8 rounded-lg object-cover"
          />
        ) : (
          <div
            className="grid h-8 w-8 place-items-center rounded-lg font-display text-sm text-primary-foreground"
            style={{ background: "var(--gradient-gold)" }}
          >
            {profile.initials}
          </div>
        )}
        <div className="hidden text-xs leading-tight sm:block">
          <div className="font-medium">{profile.display_name}</div>
          <div className="text-muted-foreground">{profile.role}</div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Welcome Header ---------------- */

function WelcomeHeader({ profile }: { profile: MemberProfile }) {
  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-border p-8"
      style={{ background: "var(--gradient-surface)", boxShadow: "var(--shadow-card)" }}
    >
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-40 blur-3xl"
        style={{ background: "var(--gradient-gold)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-10 h-72 w-72 rounded-full opacity-25 blur-3xl"
        style={{ background: "var(--gradient-electric)" }}
      />
      <div className="relative flex flex-wrap items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
            Member workspace
          </div>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl">
            Welcome back,{" "}
            <span className="gold-text">
              {profile.first_name || profile.display_name.split(" ")[0]}
            </span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your personalized brief across research, technology and upcoming programs.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Chip icon={<ShieldCheck className="h-3 w-3" />}>{profile.role}</Chip>
            <Chip>Membership · {profile.membership}</Chip>
            {profile.country && <Chip>{profile.country}</Chip>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <PrimaryButton icon={<Newspaper className="h-4 w-4" />}>Latest brief</PrimaryButton>
          <GhostButton icon={<Calendar className="h-4 w-4" />}>Upcoming events</GhostButton>
        </div>
      </div>
    </section>
  );
}

function Chip({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-[var(--surface)] px-3 py-1 text-[11px] text-muted-foreground">
      {icon}
      {children}
    </span>
  );
}

function PrimaryButton({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5"
      style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
    >
      {icon}
      {children}
    </button>
  );
}

function GhostButton({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm transition-transform hover:-translate-y-0.5"
      style={{ background: "color-mix(in oklab, var(--surface-elevated) 80%, transparent)" }}
    >
      {icon}
      {children}
    </button>
  );
}

/* ---------------- Stats strip ---------------- */

function StatsStrip({ profile }: { profile: MemberProfile }) {
  const stats = [
    { label: "Saved articles", value: 12, hint: "This month" },
    { label: "Downloads", value: 8, hint: "Reports & briefs" },
    { label: "Upcoming events", value: 3, hint: "Registered" },
    { label: "Learning progress", value: "42%", hint: "2 courses active" },
  ];
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-2xl border border-border p-5 glass"
        >
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            {s.label}
          </div>
          <div className="mt-2 font-display text-3xl">{s.value}</div>
          <div className="mt-1 text-[11px] text-muted-foreground">{s.hint}</div>
        </div>
      ))}
      {profile.interests.length > 0 && (
        <div className="rounded-2xl border border-border p-5 glass sm:col-span-2 xl:col-span-4">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Your interests
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.interests.map((i) => (
              <span
                key={i}
                className="rounded-full border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-3 py-1 text-xs text-[var(--gold)]"
              >
                {i}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/* ---------------- Cards ---------------- */

function CardShell({
  title,
  eyebrow,
  action,
  children,
}: {
  title: string;
  eyebrow: string;
  action?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border p-6 glass">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            {eyebrow}
          </div>
          <div className="mt-1 font-display text-xl">{title}</div>
        </div>
        {action && (
          <button className="text-[11px] text-muted-foreground hover:text-foreground">
            {action} →
          </button>
        )}
      </div>
      <div className="mt-5 space-y-3">{children}</div>
    </div>
  );
}

function RowItem({
  icon,
  title,
  meta,
  tag,
}: {
  icon: React.ReactNode;
  title: string;
  meta: string;
  tag?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-[var(--surface)]/40 p-3 transition-colors hover:border-[var(--gold)]/40">
      <div
        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border/70 text-[var(--gold)]"
        style={{ background: "color-mix(in oklab, var(--gold) 8%, transparent)" }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{title}</div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">{meta}</div>
      </div>
      {tag && (
        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
          {tag}
        </span>
      )}
    </div>
  );
}

function ResearchCard({ interests }: { interests: string[] }) {
  const items = [
    {
      title: "Autonomous fleets at scale",
      meta: "Whitepaper · 24 pages",
      icon: <FileText className="h-4 w-4" />,
      tag: "Saved",
    },
    {
      title: "Solid-state battery roadmap 2027",
      meta: "Research report",
      icon: <Bookmark className="h-4 w-4" />,
      tag: "New",
    },
    {
      title: "Digital twins for grid operations",
      meta: "Case study",
      icon: <FileText className="h-4 w-4" />,
    },
  ];
  return (
    <CardShell
      eyebrow="My research"
      title={
        interests.length
          ? `Curated for ${interests[0]}`
          : "Saved articles & reports"
      }
      action="Library"
    >
      {items.map((i) => (
        <RowItem key={i.title} {...i} />
      ))}
    </CardShell>
  );
}

function TechUpdatesCard() {
  const items = [
    {
      title: "Robotics platform v3.2 released",
      meta: "Product update · 2h ago",
      icon: <Megaphone className="h-4 w-4" />,
      tag: "Live",
    },
    {
      title: "New AI inference accelerator",
      meta: "Announcement · Yesterday",
      icon: <Sparkles className="h-4 w-4" />,
    },
    {
      title: "Semiconductor line expansion",
      meta: "Industry news · 3d",
      icon: <Newspaper className="h-4 w-4" />,
    },
  ];
  return (
    <CardShell eyebrow="Technology updates" title="Latest from the network" action="All updates">
      {items.map((i) => (
        <RowItem key={i.title} {...i} />
      ))}
    </CardShell>
  );
}

function EventsCard() {
  const items = [
    {
      title: "Frontier AI: engineering keynote",
      meta: "Webinar · Aug 4, 15:00 UTC",
      icon: <Video className="h-4 w-4" />,
      tag: "Registered",
    },
    {
      title: "Advanced manufacturing forum",
      meta: "Conference · Singapore · Sept 12",
      icon: <Calendar className="h-4 w-4" />,
    },
    {
      title: "Robotics engineering talk",
      meta: "Live session · Sept 22",
      icon: <PlayCircle className="h-4 w-4" />,
    },
  ];
  return (
    <CardShell eyebrow="Events" title="Upcoming programs" action="Calendar">
      {items.map((i) => (
        <RowItem key={i.title} {...i} />
      ))}
    </CardShell>
  );
}

function AccountCard({ profile }: { profile: MemberProfile }) {
  const rows = [
    {
      icon: <User className="h-4 w-4" />,
      title: "Profile",
      meta: profile.organization ?? "Complete your profile",
    },
    {
      icon: <ShieldCheck className="h-4 w-4" />,
      title: "Security",
      meta: "Two-factor authentication recommended",
      tag: "Setup",
    },
    {
      icon: <Settings className="h-4 w-4" />,
      title: "Preferences",
      meta: "Email digests · Weekly",
    },
  ];
  return (
    <CardShell eyebrow="Account" title="Manage your access" action="Settings">
      {rows.map((r) => (
        <RowItem key={r.title} {...r} />
      ))}
    </CardShell>
  );
}

function NotificationsCard() {
  const rows = [
    {
      icon: <Bell className="h-4 w-4" />,
      title: "New research digest available",
      meta: "System · 12m ago",
      tag: "New",
    },
    {
      icon: <MessagesSquare className="h-4 w-4" />,
      title: "Reply from Innovation team",
      meta: "Community · 1h ago",
    },
    {
      icon: <Megaphone className="h-4 w-4" />,
      title: "Quarterly announcement posted",
      meta: "Announcement · Yesterday",
    },
  ];
  return (
    <CardShell eyebrow="Notifications" title="Recent updates" action="See all">
      {rows.map((r) => (
        <RowItem key={r.title} {...r} />
      ))}
    </CardShell>
  );
}

function LearningCard() {
  const rows = [
    {
      icon: <GraduationCap className="h-4 w-4" />,
      title: "Foundations of industrial AI",
      meta: "Course · 6 modules",
      tag: "42%",
    },
    {
      icon: <Video className="h-4 w-4" />,
      title: "Robotics safety in production",
      meta: "Video series · 45 min",
    },
    {
      icon: <Download className="h-4 w-4" />,
      title: "Advanced manufacturing handbook",
      meta: "PDF · 3.4 MB",
    },
  ];
  return (
    <CardShell eyebrow="Learning centre" title="Courses & resources" action="Browse">
      {rows.map((r) => (
        <RowItem key={r.title} {...r} />
      ))}
    </CardShell>
  );
}
