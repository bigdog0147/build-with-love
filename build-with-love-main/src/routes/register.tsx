import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Diamond } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
  head: () => ({
    meta: [
      { title: "Create your account — Gigafactory 3X" },
      {
        name: "description",
        content:
          "Open a Gigafactory 3X customer account to access wallets, investments and identity verification.",
      },
      { property: "og:title", content: "Create your account — Gigafactory 3X" },
      {
        property: "og:description",
        content: "Register for the Gigafactory 3X customer portal.",
      },
    ],
  }),
});

const schema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(80),
  lastName: z.string().trim().min(1, "Last name is required").max(80),
  email: z.string().trim().email("Enter a valid email address").max(255),
  password: z.string().min(8, "Use at least 8 characters").max(200),
});

function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your details");
      return;
    }
    setLoading(true);
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            first_name: parsed.data.firstName,
            last_name: parsed.data.lastName,
            full_name: `${parsed.data.firstName} ${parsed.data.lastName}`,
          },
        },
      });
      if (signUpError) throw signUpError;
      setSent(true);
      navigate({ to: "/verify-email", search: { email: parsed.data.email } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden text-foreground">
      <div
        className="pointer-events-none absolute -right-40 -top-40 h-[26rem] w-[26rem] rounded-full opacity-25 blur-3xl"
        style={{ background: "var(--gradient-gold)" }}
      />
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-14">
        <Link to="/" className="mb-10 flex items-center gap-3">
          <div
            className="grid h-10 w-10 place-items-center rounded-lg"
            style={{ background: "var(--gradient-gold)" }}
          >
            <Diamond className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-display text-lg leading-none">Gigafactory 3X</div>
            <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              Customer Portal
            </div>
          </div>
        </Link>

        <div
          className="rounded-2xl border border-border p-8"
          style={{ background: "var(--gradient-surface)", boxShadow: "var(--shadow-card)" }}
        >
          {sent ? (
            <>
              <h1 className="font-display text-3xl">Check your email</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                We sent a verification link to <span className="text-foreground">{form.email}</span>.
                Confirm your address to activate your account, then sign in and complete identity
                verification.
              </p>
              <button
                onClick={() => navigate({ to: "/login" })}
                className="mt-6 w-full rounded-xl py-2.5 text-sm font-medium text-primary-foreground"
                style={{ background: "var(--gradient-gold)" }}
              >
                Go to sign in
              </button>
            </>
          ) : (
            <>
              <h1 className="font-display text-3xl">Create your account</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Registration takes a minute. Identity verification (KYC) follows after your first
                sign-in.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="First name">
                    <input
                      value={form.firstName}
                      onChange={(e) => set("firstName", e.target.value)}
                      required
                      maxLength={80}
                      autoComplete="given-name"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Last name">
                    <input
                      value={form.lastName}
                      onChange={(e) => set("lastName", e.target.value)}
                      required
                      maxLength={80}
                      autoComplete="family-name"
                      className={inputClass}
                    />
                  </Field>
                </div>
                <Field label="Email">
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    required
                    maxLength={255}
                    autoComplete="email"
                    className={inputClass}
                  />
                </Field>
                <Field label="Password">
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className={inputClass}
                  />
                </Field>

                {error && (
                  <div
                    role="alert"
                    className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-xs text-[var(--danger)]"
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
                  style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
                >
                  {loading ? "Creating account…" : "Create account"}
                </button>
              </form>

              <p className="mt-5 text-center text-xs text-muted-foreground">
                Already registered?{" "}
                <Link to="/login" className="text-[var(--gold)] hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-border bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--gold)]/60";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
