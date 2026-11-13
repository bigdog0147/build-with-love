import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { KeyRound, ShieldCheck, Smartphone, Mail } from "lucide-react";
import { getKyc } from "@/lib/kyc.functions";
import { DashShell, PageHeading } from "@/components/dashboard-chrome";

export const Route = createFileRoute("/_authenticated/security")({
  component: SecurityPage,
  head: () => ({
    meta: [
      { title: "Security — Gigafactory 3" },
      { name: "description", content: "Review sign-in protection, two-factor status and verified contact channels." },
      { property: "og:title", content: "Security — Gigafactory 3" },
      { property: "og:description", content: "Two-factor status and account protection." },
    ],
  }),
});

function SecurityPage() {
  const fetchKyc = useServerFn(getKyc);
  const { data: kyc } = useQuery({ queryKey: ["kyc"], queryFn: () => fetchKyc({} as never) });

  const rows = [
    { icon: Mail, label: "Email verified", ok: !!kyc?.email_verified, hint: "Used for sign-in codes and alerts." },
    { icon: Smartphone, label: "Phone verified", ok: !!kyc?.phone_verified, hint: "Adds a second recovery channel." },
    { icon: KeyRound, label: "Two-factor authentication", ok: !!kyc?.two_factor_enabled, hint: "Protects high-value actions." },
    {
      icon: ShieldCheck,
      label: "Identity verified",
      ok: kyc?.id_status === "verified",
      hint: "Required for transfers and private markets.",
    },
  ];

  return (
    <DashShell>
      <PageHeading eyebrow="Security" title="Account protection" sub="Everything guarding access to your accounts." />
      <div className="grid gap-4 sm:grid-cols-2">
        {rows.map(({ icon: Icon, label, ok, hint }) => (
          <div key={label} className="rounded-2xl border border-border p-5 glass">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Icon className="h-4 w-4 text-[var(--gold)]" />
                {label}
              </div>
              <span
                className={
                  "rounded-full px-2 py-0.5 text-[11px] " +
                  (ok
                    ? "bg-[var(--success)]/10 text-[var(--success)]"
                    : "bg-[var(--warning)]/10 text-[var(--warning)]")
                }
              >
                {ok ? "Active" : "Action needed"}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
          </div>
        ))}
      </div>
      <Link
        to="/verify"
        className="inline-block rounded-xl px-4 py-2.5 text-sm font-medium text-primary-foreground"
        style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
      >
        Manage verification
      </Link>
    </DashShell>
  );
}
