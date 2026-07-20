import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Diamond,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { maskEmail } from "@/lib/recovery-hint";
import { lovable } from "@/integrations/lovable";
import roboticsLine from "@/assets/robotics-line.jpg.asset.json";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Join the Gigafactory 3 Network — Register" },
      {
        name: "description",
        content:
          "Create your Gigafactory 3 account to access research, technology insights, project updates and personalized dashboard features.",
      },
    ],
  }),
});

const INTEREST_OPTIONS = [
  "Artificial Intelligence",
  "Robotics",
  "Manufacturing",
  "Renewable Energy",
  "Digital Finance",
  "Research Updates",
] as const;

const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Germany",
  "France",
  "United Arab Emirates",
  "Saudi Arabia",
  "Singapore",
  "China",
  "Japan",
  "South Korea",
  "India",
  "Australia",
  "Canada",
  "Brazil",
  "South Africa",
  "Other",
];

type Mode = "sign-up" | "sign-in" | "forgot-password";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("sign-up");
  const [welcome, setWelcome] = useState<{ name: string } | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) return;
      const confirmed =
        Boolean(user.email_confirmed_at) ||
        Boolean((user as { confirmed_at?: string }).confirmed_at);
      if (confirmed && !welcome && !pendingEmail) {
        navigate({ to: "/dashboard", replace: true });
      } else if (!confirmed && !pendingEmail) {
        setPendingEmail(user.email ?? "");
      }
    });
  }, [navigate, welcome, pendingEmail]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-2">
        <LeftPanel />
        <div className="relative flex items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-xl">
            <Link to="/" className="mb-8 inline-flex items-center gap-3">
              <div
                className="grid h-10 w-10 place-items-center rounded-lg"
                style={{ background: "var(--gradient-gold)" }}
              >
                <Diamond className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <div className="font-display text-lg leading-none">Gigafactory 3</div>
                <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                  Global Network
                </div>
              </div>
            </Link>

            {pendingEmail ? (
              <VerifyEmailScreen
                email={pendingEmail}
                onBack={async () => {
                  await supabase.auth.signOut();
                  setPendingEmail(null);
                  setMode("sign-in");
                }}
              />
            ) : welcome ? (
              <WelcomeScreen
                name={welcome.name}
                onContinue={() => navigate({ to: "/dashboard", replace: true })}
              />
            ) : mode === "sign-up" ? (
              <RegisterForm
                onPendingVerification={(email) => setPendingEmail(email)}
                switchToSignIn={() => setMode("sign-in")}
              />
            ) : mode === "forgot-password" ? (
              <ForgotPasswordForm switchToSignIn={() => setMode("sign-in")} />
            ) : (
              <SignInForm
                switchToSignUp={() => setMode("sign-up")}
                switchToForgot={() => setMode("forgot-password")}
                onSignedIn={() => navigate({ to: "/dashboard", replace: true })}
                onNeedsVerification={(email) => setPendingEmail(email)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LeftPanel() {
  return (
    <div className="relative hidden overflow-hidden lg:block">
      <img
        src={roboticsLine.url}
        alt="AI-powered manufacturing campus"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(140deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.85) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute -left-24 top-1/3 h-96 w-96 rounded-full opacity-30 blur-3xl"
        style={{ background: "var(--gradient-gold)" }}
      />
      <div className="relative z-10 flex h-full flex-col justify-between p-12">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-[var(--gold)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
          Membership
        </div>
        <div>
          <h2 className="gold-text font-display text-5xl leading-tight sm:text-6xl">
            Shape Tomorrow With Us
          </h2>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-white/75">
            Join a growing community exploring advanced technology, engineering
            innovation, and future industrial solutions across AI, robotics,
            manufacturing and clean energy.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-white/70">
            {[
              "Personalized research feed and bookmarks",
              "Early access to technology briefings",
              "Invitations to engineering talks and webinars",
            ].map((line) => (
              <li key={line} className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-[var(--gold)]" />
                {line}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/50">
          <ShieldCheck className="h-3.5 w-3.5 text-[var(--gold)]" />
          Secure enrollment · Encrypted in transit
        </div>
      </div>
    </div>
  );
}

/* ---------------- Registration ---------------- */

interface RegState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  organization: string;
  username: string;
  password: string;
  confirm: string;
  interests: string[];
  terms: boolean;
}

const initialReg: RegState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  country: "",
  organization: "",
  username: "",
  password: "",
  confirm: "",
  interests: [],
  terms: false,
};

function RegisterForm({
  onPendingVerification,
  switchToSignIn,
}: {
  onPendingVerification: (email: string) => void;
  switchToSignIn: () => void;
}) {
  const [f, setF] = useState<RegState>(initialReg);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const errors = useMemo(() => validate(f), [f]);
  const isValid = Object.keys(errors).length === 0;

  function update<K extends keyof RegState>(k: K, v: RegState[K]) {
    setF((s) => ({ ...s, [k]: v }));
  }

  function toggleInterest(name: string) {
    setF((s) => ({
      ...s,
      interests: s.interests.includes(name)
        ? s.interests.filter((i) => i !== name)
        : [...s.interests, name],
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signUp({
        email: f.email,
        password: f.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            first_name: f.firstName,
            last_name: f.lastName,
            full_name: `${f.firstName} ${f.lastName}`.trim(),
            phone: f.phone,
            country: f.country,
            organization: f.organization,
            username: f.username,
            interests: f.interests,
          },
        },
      });
      if (error) throw error;
      // Email verification required — sign out any provisional session and
      // route the user to the verification screen.
      await supabase.auth.signOut();
      onPendingVerification(f.email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }


  async function handleGoogle() {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) setError(result.error.message ?? "Google sign-in failed");
  }

  return (
    <div>
      <div className="text-xs uppercase tracking-[0.24em] text-[var(--gold)]">
        Join the network
      </div>
      <h1 className="mt-2 font-display text-3xl sm:text-4xl">
        Create your account
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Access research, technology insights, project updates and personalized
        dashboard features.
      </p>

      <button
        onClick={handleGoogle}
        className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-[var(--surface-elevated)] py-2.5 text-sm font-medium transition-colors hover:border-[var(--gold)]/60"
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or register with email
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={submit} className="space-y-6" noValidate>
        <Section title="Personal information">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="First name" error={errors.firstName}>
              <Input
                value={f.firstName}
                onChange={(v) => update("firstName", v)}
                placeholder="Elena"
                autoComplete="given-name"
              />
            </Field>
            <Field label="Last name" error={errors.lastName}>
              <Input
                value={f.lastName}
                onChange={(v) => update("lastName", v)}
                placeholder="Marchetti"
                autoComplete="family-name"
              />
            </Field>
            <Field label="Email address" error={errors.email}>
              <Input
                type="email"
                value={f.email}
                onChange={(v) => update("email", v)}
                placeholder="you@company.com"
                autoComplete="email"
              />
            </Field>
            <Field label="Mobile number" error={errors.phone}>
              <Input
                type="tel"
                value={f.phone}
                onChange={(v) => update("phone", v)}
                placeholder="+1 555 000 0000"
                autoComplete="tel"
              />
            </Field>
            <Field label="Country" error={errors.country}>
              <select
                value={f.country}
                onChange={(e) => update("country", e.target.value)}
                className="w-full rounded-xl border border-border bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--gold)]/60"
              >
                <option value="">Select country</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Organization (optional)">
              <Input
                value={f.organization}
                onChange={(v) => update("organization", v)}
                placeholder="Acme Industrial Group"
                autoComplete="organization"
              />
            </Field>
          </div>
        </Section>

        <Section title="Account details">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Username" error={errors.username}>
              <Input
                value={f.username}
                onChange={(v) => update("username", v.toLowerCase())}
                placeholder="elena.m"
                autoComplete="username"
              />
            </Field>
            <div className="hidden sm:block" />
            <Field label="Password" error={errors.password}>
              <div className="relative">
                <Input
                  type={showPw ? "text" : "password"}
                  value={f.password}
                  onChange={(v) => update("password", v)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
            <Field label="Confirm password" error={errors.confirm}>
              <Input
                type={showPw ? "text" : "password"}
                value={f.confirm}
                onChange={(v) => update("confirm", v)}
                placeholder="Repeat password"
                autoComplete="new-password"
              />
            </Field>
          </div>
        </Section>

        <Section title="Interests">
          <div className="grid gap-2 sm:grid-cols-2">
            {INTEREST_OPTIONS.map((name) => {
              const active = f.interests.includes(name);
              return (
                <label
                  key={name}
                  className={
                    "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors " +
                    (active
                      ? "border-[var(--gold)]/70 bg-[var(--gold)]/10"
                      : "border-border bg-[var(--surface)] hover:border-[var(--gold)]/40")
                  }
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggleInterest(name)}
                    className="h-4 w-4 accent-[var(--gold)]"
                  />
                  {name}
                </label>
              );
            })}
          </div>
        </Section>

        <label className="flex items-start gap-3 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={f.terms}
            onChange={(e) => update("terms", e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[var(--gold)]"
          />
          <span>
            I agree to the{" "}
            <a href="#" className="text-[var(--gold)] hover:underline">
              Terms of Use
            </a>{" "}
            and{" "}
            <a href="#" className="text-[var(--gold)] hover:underline">
              Privacy Policy
            </a>
            .
          </span>
        </label>
        {errors.terms && (
          <div className="text-xs text-[var(--danger)]">{errors.terms}</div>
        )}

        {error && (
          <div className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-xs text-[var(--danger)]">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!isValid || loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium text-primary-foreground transition-all disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: "var(--gradient-gold)",
            boxShadow: isValid ? "var(--shadow-glow)" : undefined,
          }}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account…
            </>
          ) : (
            <>
              Create account
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        <div className="text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <button
            type="button"
            onClick={switchToSignIn}
            className="text-[var(--gold)] hover:underline"
          >
            Sign in
          </button>
        </div>
      </form>
    </div>
  );
}

function validate(f: RegState): Partial<Record<keyof RegState, string>> {
  const e: Partial<Record<keyof RegState, string>> = {};
  if (f.firstName.trim().length < 2) e.firstName = "Required";
  if (f.lastName.trim().length < 2) e.lastName = "Required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = "Enter a valid email";
  if (f.phone.replace(/\D/g, "").length < 6) e.phone = "Enter a valid phone";
  if (!f.country) e.country = "Select a country";
  if (!/^[a-z0-9_.-]{3,24}$/.test(f.username))
    e.username = "3–24 chars: letters, numbers, . _ -";
  if (f.password.length < 8) e.password = "At least 8 characters";
  if (f.confirm !== f.password) e.confirm = "Passwords do not match";
  if (!f.terms) e.terms = "You must accept the terms";
  return e;
}

/* ---------------- Sign In ---------------- */

function SignInForm({
  switchToSignUp,
  switchToForgot,
  onSignedIn,
  onNeedsVerification,
}: {
  switchToSignUp: () => void;
  switchToForgot: () => void;
  onSignedIn: () => void;
  onNeedsVerification: (email: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("confirm") || msg.includes("not confirmed") || msg.includes("verified")) {
          onNeedsVerification(email);
          return;
        }
        throw error;
      }
      const user = data.user;
      const confirmed =
        Boolean(user?.email_confirmed_at) ||
        Boolean((user as { confirmed_at?: string } | null)?.confirmed_at);
      if (!confirmed) {
        await supabase.auth.signOut();
        onNeedsVerification(email);
        return;
      }
      onSignedIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }


  async function handleGoogle() {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) setError(result.error.message ?? "Google sign-in failed");
  }

  return (
    <div>
      <div className="text-xs uppercase tracking-[0.24em] text-[var(--gold)]">
        Member sign in
      </div>
      <h1 className="mt-2 font-display text-3xl sm:text-4xl">Welcome back</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Access your dashboard, research library and technology briefings.
      </p>

      <button
        onClick={handleGoogle}
        className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-[var(--surface-elevated)] py-2.5 text-sm font-medium transition-colors hover:border-[var(--gold)]/60"
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or use email
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={submit} className="space-y-4">
        <Field label="Email">
          <Input type="email" value={email} onChange={setEmail} placeholder="you@company.com" />
        </Field>
        <Field label="Password">
          <Input
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
          />
        </Field>
        <div className="-mt-2 text-right">
          <button
            type="button"
            onClick={switchToForgot}
            className="text-xs text-[var(--gold)] hover:underline"
          >
            Forgot password?
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-xs text-[var(--danger)]">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
          style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <div className="text-center text-xs text-muted-foreground">
          New to Gigafactory 3?{" "}
          <button
            type="button"
            onClick={switchToSignUp}
            className="text-[var(--gold)] hover:underline"
          >
            Create an account
          </button>
        </div>
      </form>
    </div>
  );
}

/* ---------------- Welcome ---------------- */

function WelcomeScreen({
  name,
  onContinue,
}: {
  name: string;
  onContinue: () => void;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-border p-10 text-center"
      style={{ background: "var(--gradient-surface)", boxShadow: "var(--shadow-card)" }}
    >
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-40 blur-3xl"
        style={{ background: "var(--gradient-gold)" }}
      />
      <div className="relative">
        <div
          className="mx-auto grid h-16 w-16 place-items-center rounded-2xl"
          style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
        >
          <Sparkles className="h-8 w-8 text-primary-foreground" />
        </div>
        <div className="mt-6 text-xs uppercase tracking-[0.28em] text-[var(--gold)]">
          Welcome to Gigafactory 3
        </div>
        <h2 className="mt-3 font-display text-4xl">Hello, {name}.</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Your account has been created successfully. Continue to your
          personalized dashboard to explore research, technology updates and
          upcoming events.
        </p>
        <button
          onClick={onContinue}
          className="mt-8 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium text-primary-foreground"
          style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
        >
          Go to dashboard
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ---------------- Verify Email ---------------- */

function VerifyEmailScreen({
  email,
  onBack,
}: {
  email: string;
  onBack: () => void;
}) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function resend() {
    setSending(true);
    setError(null);
    setSent(false);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend email");
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-border p-10 text-center"
      style={{ background: "var(--gradient-surface)", boxShadow: "var(--shadow-card)" }}
    >
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-30 blur-3xl"
        style={{ background: "var(--gradient-gold)" }}
      />
      <div className="relative">
        <div
          className="mx-auto grid h-16 w-16 place-items-center rounded-2xl"
          style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
        >
          <Mail className="h-8 w-8 text-primary-foreground" />
        </div>
        <div className="mt-6 text-xs uppercase tracking-[0.28em] text-[var(--gold)]">
          Verify your email
        </div>
        <h2 className="mt-3 font-display text-3xl sm:text-4xl">Check your inbox</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          We sent a verification link to{" "}
          <span className="text-foreground">{email || "your email"}</span>. Click the link
          to activate your account and unlock the member dashboard.
        </p>

        {sent && (
          <div className="mt-6 rounded-lg border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-3 py-2 text-xs text-[var(--gold)]">
            Verification email sent. Please check your inbox and spam folder.
          </div>
        )}
        {error && (
          <div className="mt-6 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-xs text-[var(--danger)]">
            {error}
          </div>
        )}

        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            onClick={resend}
            disabled={sending || !email}
            className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
            style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            {sending ? "Sending…" : "Resend verification email"}
          </button>
          <button
            onClick={onBack}
            className="text-xs text-muted-foreground hover:text-[var(--gold)]"
          >
            Use a different account
          </button>
        </div>

        <p className="mt-8 text-[11px] text-muted-foreground">
          Dashboard access is restricted until your email address is verified.
        </p>
      </div>
    </div>
  );
}

/* ---------------- Forgot Password ---------------- */

function ForgotPasswordForm({ switchToSignIn }: { switchToSignIn: () => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    setError(null);
    try {
      const { requestPasswordReset } = await import("@/lib/reset-request.functions");
      await requestPasswordReset({
        data: {
          email,
          redirectTo: `${window.location.origin}/reset-password`,
        },
      });
      // Persist a masked hint so the reset page can show the same badge
      // even after the user closes this tab and returns from their inbox.
      const { saveRecoveryHint } = await import("@/lib/recovery-hint");
      saveRecoveryHint(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset email");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    const masked = maskEmail(email);
    return (
      <div
        className="relative overflow-hidden rounded-3xl border border-border p-10 text-center"
        style={{ background: "var(--gradient-surface)", boxShadow: "var(--shadow-card)" }}
      >
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-30 blur-3xl"
          style={{ background: "var(--gradient-gold)" }}
        />
        <div className="relative">
          <div
            className="mx-auto grid h-16 w-16 place-items-center rounded-2xl"
            style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
          >
            <Mail className="h-8 w-8 text-primary-foreground" />
          </div>
          <div className="mt-6 text-xs uppercase tracking-[0.28em] text-[var(--gold)]">
            Request received
          </div>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl">Check your inbox</h2>

          <div
            className="mx-auto mt-5 inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-[var(--surface)] px-3 py-1.5 text-[11px] text-muted-foreground"
            title="Only a masked version of the email is shown. This protects your privacy and never reveals whether an account exists."
          >
            <Mail className="h-3.5 w-3.5 text-[var(--gold)]" />
            <span className="uppercase tracking-[0.18em]">Reset for</span>
            <span className="font-mono text-foreground">{masked}</span>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            If an account matches that address, a secure reset link is on its way.
            For your privacy, we show the same confirmation whether or not an
            account exists. The link will expire shortly for your safety.
          </p>
          <button
            onClick={switchToSignIn}
            className="mt-8 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium text-primary-foreground"
            style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-xs uppercase tracking-[0.24em] text-[var(--gold)]">
        Password recovery
      </div>
      <h1 className="mt-2 font-display text-3xl sm:text-4xl">Reset your password</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter the email associated with your account and we'll send a secure
        link to choose a new password.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        <Field label="Email">
          <Input
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@company.com"
            autoComplete="email"
          />
        </Field>

        {error && (
          <div className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-xs text-[var(--danger)]">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!isValid || loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: "var(--gradient-gold)",
            boxShadow: isValid ? "var(--shadow-glow)" : undefined,
          }}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending link…
            </>
          ) : (
            <>
              Send reset link
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        <div className="text-center text-xs text-muted-foreground">
          Remembered it?{" "}
          <button
            type="button"
            onClick={switchToSignIn}
            className="text-[var(--gold)] hover:underline"
          >
            Back to sign in
          </button>
        </div>
      </form>
    </div>
  );
}


/* ---------------- UI primitives ---------------- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-3 text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
        {title}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      {children}
      {error && <span className="mt-1 block text-[11px] text-[var(--danger)]">{error}</span>}
    </label>
  );
}

function Input({
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      className="w-full rounded-xl border border-border bg-[var(--surface)] px-3 py-2.5 text-sm outline-none transition-colors focus:border-[var(--gold)]/60"
    />
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
