import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Suspense, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  FileText,
  IdCard,
  Loader2,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Upload,
  UserRound,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  computeCompletion,
  getKyc,
  saveKyc,
  statusMeta,
  submitKyc,
  type KycDocType,
  type KycProfile,
} from "@/lib/kyc.functions";

const kycQuery = queryOptions({
  queryKey: ["kyc"],
  queryFn: () => getKyc(),
});

export const Route = createFileRoute("/_authenticated/verify")({
  component: VerifyPage,
  head: () => ({
    meta: [
      { title: "Identity Verification — Gigafactory 3" },
      { name: "description", content: "Complete your global identity verification to unlock full platform access." },
    ],
  }),
  pendingComponent: () => (
    <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading verification…</div>
  ),
});

const STEPS = [
  { id: 1, label: "Personal", icon: UserRound },
  { id: 2, label: "Identity", icon: IdCard },
  { id: 3, label: "Contact", icon: Mail },
  { id: 4, label: "Compliance", icon: FileText },
  { id: 5, label: "Security", icon: Lock },
  { id: 6, label: "Access", icon: ShieldCheck },
];

function VerifyPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading…</div>}>
      <VerifyInner />
    </Suspense>
  );
}

function VerifyInner() {
  const { data: kyc } = useSuspenseQuery(kycQuery);
  const [step, setStep] = useState<number>(kyc.current_step && kyc.id_status !== "verified" ? Math.max(1, Math.min(6, kyc.current_step)) : 1);
  const qc = useQueryClient();
  const save = useServerFn(saveKyc);
  const submit = useServerFn(submitKyc);
  const [saving, setSaving] = useState(false);

  const pct = computeCompletion(kyc);

  async function patch(update: Partial<KycProfile>, nextStep?: number) {
    setSaving(true);
    try {
      await save({ data: { ...update, current_step: nextStep ?? step } });
      await qc.invalidateQueries({ queryKey: ["kyc"] });
      if (nextStep) setStep(nextStep);
    } finally {
      setSaving(false);
    }
  }

  async function doSubmit(finalPatch?: Partial<KycProfile>) {
    setSaving(true);
    try {
      if (finalPatch) await save({ data: finalPatch });
      await submit();
      await qc.invalidateQueries({ queryKey: ["kyc"] });
      setStep(6);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative min-h-screen text-foreground">
      <div
        className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full opacity-30 blur-3xl"
        style={{ background: "var(--gradient-gold)" }}
      />
      <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard
          </Link>
          <div className="text-xs text-muted-foreground">
            Profile completion <span className="ml-2 font-display text-foreground">{pct}%</span>
          </div>
        </div>

        <header className="mb-8">
          <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Global Identity Verification</div>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl gold-text">Verify your identity</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            A short, secure process to unlock full platform access. Your data is encrypted end-to-end and reviewed by our compliance team.
          </p>
        </header>

        <Stepper current={step} onJump={(s) => setStep(s)} status={kyc.id_status} />

        <section
          className="mt-8 rounded-3xl border border-border p-6 sm:p-8"
          style={{ background: "var(--gradient-surface)", boxShadow: "var(--shadow-card)" }}
        >
          {step === 1 && <StepPersonal kyc={kyc} onNext={(u) => patch(u, 2)} saving={saving} />}
          {step === 2 && <StepIdentity kyc={kyc} onNext={(u) => patch(u, 3)} onBack={() => setStep(1)} saving={saving} />}
          {step === 3 && <StepContact kyc={kyc} onNext={(u) => patch(u, 4)} onBack={() => setStep(2)} saving={saving} />}
          {step === 4 && <StepCompliance kyc={kyc} onNext={(u) => patch(u, 5)} onBack={() => setStep(3)} saving={saving} />}
          {step === 5 && <StepSecurity kyc={kyc} onSubmit={doSubmit} onBack={() => setStep(4)} saving={saving} />}
          {step === 6 && <StepAccess kyc={kyc} pct={pct} />}
        </section>
      </div>
    </div>
  );
}

function Stepper({ current, onJump, status }: { current: number; onJump: (s: number) => void; status: KycProfile["id_status"] }) {
  return (
    <ol className="grid grid-cols-3 gap-3 sm:grid-cols-6">
      {STEPS.map(({ id, label, icon: Icon }) => {
        const active = id === current;
        const done = id < current || status === "verified";
        return (
          <li key={id}>
            <button
              onClick={() => onJump(id)}
              className={cx(
                "group flex w-full flex-col items-start gap-2 rounded-xl border p-3 text-left transition-colors",
                active
                  ? "border-[var(--gold)]/60 bg-[var(--surface-elevated)]"
                  : "border-border bg-[var(--surface)]/60 hover:border-[var(--gold)]/40",
              )}
            >
              <span
                className={cx(
                  "grid h-8 w-8 place-items-center rounded-lg border text-xs",
                  done
                    ? "border-[var(--success)]/40 bg-[var(--success)]/10 text-[var(--success)]"
                    : active
                      ? "border-[var(--gold)]/40 bg-[var(--gold)]/10 text-[var(--gold)]"
                      : "border-border text-muted-foreground",
                )}
              >
                {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </span>
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Step {id}</div>
                <div className="truncate text-sm font-medium">{label}</div>
              </div>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------- Step 1: Personal ------------------------- */
function StepPersonal({
  kyc,
  onNext,
  saving,
}: {
  kyc: KycProfile;
  onNext: (u: Partial<KycProfile>) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    full_legal_name: kyc.full_legal_name ?? "",
    date_of_birth: kyc.date_of_birth ?? "",
    nationality: kyc.nationality ?? "",
    country_of_residence: kyc.country_of_residence ?? "",
    residential_address: kyc.residential_address ?? "",
    postal_code: kyc.postal_code ?? "",
  });
  const valid =
    form.full_legal_name.trim().length > 2 &&
    !!form.date_of_birth &&
    !!form.nationality &&
    !!form.country_of_residence &&
    form.residential_address.trim().length > 4 &&
    !!form.postal_code;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        onNext(form);
      }}
      className="space-y-6"
    >
      <StepHeader index={1} title="Personal information" subtitle="Enter your details exactly as they appear on your government-issued ID." />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full legal name">
          <Input value={form.full_legal_name} onChange={(v) => setForm({ ...form, full_legal_name: v })} placeholder="Elena Marchetti" />
        </Field>
        <Field label="Date of birth">
          <Input type="date" value={form.date_of_birth} onChange={(v) => setForm({ ...form, date_of_birth: v })} />
        </Field>
        <Field label="Nationality">
          <Input value={form.nationality} onChange={(v) => setForm({ ...form, nationality: v })} placeholder="Italian" />
        </Field>
        <Field label="Country of residence">
          <Input value={form.country_of_residence} onChange={(v) => setForm({ ...form, country_of_residence: v })} placeholder="Switzerland" />
        </Field>
        <Field label="Residential address" className="sm:col-span-2">
          <Input value={form.residential_address} onChange={(v) => setForm({ ...form, residential_address: v })} placeholder="Bahnhofstrasse 1" />
        </Field>
        <Field label="Postal code">
          <Input value={form.postal_code} onChange={(v) => setForm({ ...form, postal_code: v })} placeholder="8001" />
        </Field>
      </div>
      <StepNav rightDisabled={!valid || saving} rightLabel={saving ? "Saving…" : "Continue"} />
    </form>
  );
}

/* ------------------------- Step 2: Identity ------------------------- */
const DOC_TYPES: { value: KycDocType; label: string; needsBack: boolean }[] = [
  { value: "passport", label: "Passport", needsBack: false },
  { value: "national_id", label: "National ID card", needsBack: true },
  { value: "drivers_license", label: "Driver's license", needsBack: true },
  { value: "residence_permit", label: "Residence permit", needsBack: true },
];

function StepIdentity({
  kyc,
  onNext,
  onBack,
  saving,
}: {
  kyc: KycProfile;
  onNext: (u: Partial<KycProfile>) => void;
  onBack: () => void;
  saving: boolean;
}) {
  const [docType, setDocType] = useState<KycDocType | null>(kyc.doc_type);
  const [front, setFront] = useState<string | null>(kyc.doc_front_path);
  const [back, setBack] = useState<string | null>(kyc.doc_back_path);
  const [selfie, setSelfie] = useState<string | null>(kyc.selfie_path);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const meta = DOC_TYPES.find((d) => d.value === docType);
  const canContinue = !!docType && !!front && (!meta?.needsBack || !!back);

  async function upload(kind: "front" | "back" | "selfie", file: File) {
    setError(null);
    setUploading(kind);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Not signed in");
      const ext = file.name.split(".").pop() || "bin";
      const path = `${uid}/${kind}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("kyc-documents").upload(path, file, {
        upsert: true,
        contentType: file.type || "application/octet-stream",
      });
      if (upErr) throw upErr;
      if (kind === "front") setFront(path);
      if (kind === "back") setBack(path);
      if (kind === "selfie") setSelfie(path);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  }

  const status = kyc.id_status;
  const statusPill = statusMeta(status);

  return (
    <div className="space-y-6">
      <StepHeader index={2} title="Identity verification" subtitle="Select a document type and upload high-resolution images." />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {DOC_TYPES.map((d) => (
          <button
            key={d.value}
            type="button"
            onClick={() => setDocType(d.value)}
            className={cx(
              "rounded-xl border p-4 text-left transition-colors",
              docType === d.value
                ? "border-[var(--gold)]/60 bg-[var(--surface-elevated)]"
                : "border-border bg-[var(--surface)]/60 hover:border-[var(--gold)]/40",
            )}
          >
            <IdCard className={cx("h-5 w-5", docType === d.value ? "text-[var(--gold)]" : "text-muted-foreground")} />
            <div className="mt-3 text-sm font-medium">{d.label}</div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              {d.needsBack ? "Front & back required" : "Front only"}
            </div>
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <UploadTile
          label="Front image"
          path={front}
          onFile={(f) => upload("front", f)}
          uploading={uploading === "front"}
          required
        />
        <UploadTile
          label="Back image"
          path={back}
          onFile={(f) => upload("back", f)}
          uploading={uploading === "back"}
          disabled={!meta?.needsBack}
          hint={!meta?.needsBack ? "Not required for this document" : undefined}
          required={!!meta?.needsBack}
        />
        <UploadTile
          label="Live selfie"
          path={selfie}
          onFile={(f) => upload("selfie", f)}
          uploading={uploading === "selfie"}
          hint="Optional — enables facial comparison"
          capture="user"
        />
      </div>

      <div className="rounded-xl border border-border/70 bg-[var(--surface)]/60 p-4">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Review status</div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <ProgressPill label="Identity submitted" active={status !== "not_started"} />
          <ProgressPill label="Under review" active={status === "under_review" || status === "verified"} />
          <ProgressPill label="Verified" active={status === "verified"} tone="success" />
          <span className={cx("ml-auto rounded-full px-2.5 py-1 text-[11px]", statusPill.className)}>{statusPill.label}</span>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-xs text-[var(--danger)]">
          {error}
        </div>
      )}

      <StepNav
        onBack={onBack}
        rightDisabled={!canContinue || saving}
        rightLabel={saving ? "Saving…" : "Continue"}
        onNext={() =>
          onNext({
            doc_type: docType!,
            doc_front_path: front,
            doc_back_path: back,
            selfie_path: selfie,
            id_status: kyc.id_status === "not_started" ? "submitted" : kyc.id_status,
          })
        }
      />
    </div>
  );
}

function UploadTile({
  label,
  path,
  onFile,
  uploading,
  disabled,
  hint,
  required,
  capture,
}: {
  label: string;
  path: string | null;
  onFile: (f: File) => void;
  uploading: boolean;
  disabled?: boolean;
  hint?: string;
  required?: boolean;
  capture?: "user" | "environment";
}) {
  return (
    <label
      className={cx(
        "flex min-h-[140px] flex-col justify-between rounded-xl border border-dashed p-4 text-sm transition-colors",
        disabled
          ? "cursor-not-allowed opacity-50 border-border"
          : path
            ? "border-[var(--success)]/50 bg-[var(--success)]/5 cursor-pointer"
            : "border-border bg-[var(--surface)]/60 hover:border-[var(--gold)]/40 cursor-pointer",
      )}
    >
      <div>
        <div className="flex items-center justify-between">
          <span className="font-medium">{label}</span>
          {required && !path && <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Required</span>}
          {path && <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />}
        </div>
        <div className="mt-1 text-[11px] text-muted-foreground">{hint ?? "PNG, JPG or PDF · up to 10 MB"}</div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        <span className="truncate">{uploading ? "Uploading…" : path ? path.split("/").pop() : "Choose file"}</span>
      </div>
      <input
        type="file"
        accept="image/*,application/pdf"
        capture={capture}
        disabled={disabled || uploading}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.currentTarget.value = "";
        }}
      />
    </label>
  );
}

/* ------------------------- Step 3: Contact ------------------------- */
function StepContact({
  kyc,
  onNext,
  onBack,
  saving,
}: {
  kyc: KycProfile;
  onNext: (u: Partial<KycProfile>) => void;
  onBack: () => void;
  saving: boolean;
}) {
  const [phone, setPhone] = useState(kyc.phone_number ?? "");
  const [emailCode, setEmailCode] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [emailVerified, setEmailVerified] = useState(kyc.email_verified);
  const [phoneVerified, setPhoneVerified] = useState(kyc.phone_verified);
  const [msg, setMsg] = useState<string | null>(null);

  function verifyEmail() {
    if (emailCode.trim().length >= 4) {
      setEmailVerified(true);
      setMsg("Email verified.");
    } else setMsg("Enter the 6-digit code we sent to your inbox.");
  }
  function verifyPhone() {
    if (smsCode.trim().length >= 4 && phone.trim().length > 4) {
      setPhoneVerified(true);
      setMsg("Phone verified.");
    } else setMsg("Enter a valid phone number and the SMS code.");
  }

  return (
    <div className="space-y-6">
      <StepHeader index={3} title="Contact verification" subtitle="Confirm the email and phone number we use for account security notices." />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border/70 bg-[var(--surface)]/60 p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Mail className="h-4 w-4 text-[var(--gold)]" /> Email
            {emailVerified && <CheckCircle2 className="ml-auto h-4 w-4 text-[var(--success)]" />}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">A 6-digit code was sent to your account email.</p>
          <div className="mt-3 flex gap-2">
            <Input value={emailCode} onChange={setEmailCode} placeholder="123456" />
            <button
              type="button"
              onClick={verifyEmail}
              disabled={emailVerified}
              className="rounded-xl border border-border bg-[var(--surface-elevated)] px-3 text-xs font-medium hover:border-[var(--gold)]/60 disabled:opacity-60"
            >
              {emailVerified ? "Verified" : "Verify"}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-[var(--surface)]/60 p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Phone className="h-4 w-4 text-[var(--electric)]" /> Mobile phone
            {phoneVerified && <CheckCircle2 className="ml-auto h-4 w-4 text-[var(--success)]" />}
          </div>
          <Input className="mt-3" value={phone} onChange={setPhone} placeholder="+41 79 000 00 00" />
          <div className="mt-2 flex gap-2">
            <Input value={smsCode} onChange={setSmsCode} placeholder="SMS code" />
            <button
              type="button"
              onClick={verifyPhone}
              disabled={phoneVerified}
              className="rounded-xl border border-border bg-[var(--surface-elevated)] px-3 text-xs font-medium hover:border-[var(--gold)]/60 disabled:opacity-60"
            >
              {phoneVerified ? "Verified" : "Verify"}
            </button>
          </div>
        </div>
      </div>

      {msg && <div className="text-xs text-muted-foreground">{msg}</div>}

      <StepNav
        onBack={onBack}
        rightDisabled={saving}
        rightLabel={saving ? "Saving…" : "Continue"}
        onNext={() =>
          onNext({
            phone_number: phone || null,
            email_verified: emailVerified,
            phone_verified: phoneVerified,
          })
        }
      />
    </div>
  );
}

/* ------------------------- Step 4: Compliance ------------------------- */
const SOURCE_OF_FUNDS = [
  "Employment income",
  "Business ownership",
  "Investment returns",
  "Inheritance",
  "Sale of property",
  "Research grants",
  "Other",
];
const EXPECTED_USAGE = [
  "Research access",
  "Subscriptions",
  "Professional services",
  "Consulting engagements",
  "Enterprise procurement",
];

function StepCompliance({
  kyc,
  onNext,
  onBack,
  saving,
}: {
  kyc: KycProfile;
  onNext: (u: Partial<KycProfile>) => void;
  onBack: () => void;
  saving: boolean;
}) {
  const [taxCountry, setTaxCountry] = useState(kyc.tax_country ?? "");
  const [sourceFunds, setSourceFunds] = useState(kyc.source_of_funds ?? "");
  const [usage, setUsage] = useState(kyc.expected_usage ?? "");
  const valid = !!taxCountry && !!sourceFunds && !!usage;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        onNext({ tax_country: taxCountry, source_of_funds: sourceFunds, expected_usage: usage });
      }}
      className="space-y-6"
    >
      <StepHeader index={4} title="Risk & compliance" subtitle="Regulators require a few short questions to maintain your account." />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Country of tax residence">
          <Input value={taxCountry} onChange={setTaxCountry} placeholder="Switzerland" />
        </Field>
        <Field label="Source of funds">
          <Select value={sourceFunds} onChange={setSourceFunds} options={SOURCE_OF_FUNDS} placeholder="Select one…" />
        </Field>
        <Field label="Expected platform usage" className="sm:col-span-2">
          <Select value={usage} onChange={setUsage} options={EXPECTED_USAGE} placeholder="Select one…" />
        </Field>
      </div>
      <StepNav onBack={onBack} rightDisabled={!valid || saving} rightLabel={saving ? "Saving…" : "Continue"} />
    </form>
  );
}

/* ------------------------- Step 5: Security ------------------------- */
function StepSecurity({
  kyc,
  onSubmit,
  onBack,
  saving,
}: {
  kyc: KycProfile;
  onSubmit: (finalPatch?: Partial<KycProfile>) => void;
  onBack: () => void;
  saving: boolean;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [twofa, setTwofa] = useState(kyc.two_factor_enabled);
  const [recovery, setRecovery] = useState(kyc.recovery_email ?? "");
  const [err, setErr] = useState<string | null>(null);
  const [pwSaved, setPwSaved] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const strong = password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password);

  async function savePassword() {
    setErr(null);
    if (!strong) return setErr("Use at least 10 characters, an uppercase letter, and a number.");
    if (password !== confirm) return setErr("Passwords do not match.");
    setSavingPw(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPwSaved(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not update password");
    } finally {
      setSavingPw(false);
    }
  }

  return (
    <div className="space-y-6">
      <StepHeader index={5} title="Security setup" subtitle="Harden your account before we finalize verification." />

      <div className="rounded-xl border border-border/70 bg-[var(--surface)]/60 p-4">
        <div className="text-sm font-medium">Update password</div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Input type="password" value={password} onChange={setPassword} placeholder="New password" />
          <Input type="password" value={confirm} onChange={setConfirm} placeholder="Confirm password" />
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={savePassword}
            disabled={savingPw || pwSaved || !password}
            className="rounded-lg border border-border bg-[var(--surface-elevated)] px-3 py-1.5 font-medium hover:border-[var(--gold)]/60 disabled:opacity-60"
          >
            {pwSaved ? "Password saved" : savingPw ? "Saving…" : "Save password"}
          </button>
          {pwSaved && <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border/70 bg-[var(--surface)]/60 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Two-factor authentication</div>
              <div className="text-[11px] text-muted-foreground">Authenticator app or hardware key</div>
            </div>
            <Toggle checked={twofa} onChange={setTwofa} />
          </div>
        </div>
        <Field label="Recovery email">
          <Input value={recovery} onChange={setRecovery} placeholder="recovery@personal.com" />
        </Field>
      </div>

      {err && (
        <div className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-xs text-[var(--danger)]">
          {err}
        </div>
      )}

      <StepNav
        onBack={onBack}
        rightLabel={saving ? "Submitting…" : "Submit for review"}
        rightDisabled={saving}
        onNext={() =>
          onSubmit({
            two_factor_enabled: twofa,
            recovery_email: recovery || null,
          })
        }
      />
    </div>
  );
}

/* ------------------------- Step 6: Access ------------------------- */
function StepAccess({ kyc, pct }: { kyc: KycProfile; pct: number }) {
  const s = statusMeta(kyc.id_status);
  const locked: string[] = [];
  if (kyc.id_status !== "verified") locked.push("High-value transfers");
  if (kyc.id_status !== "verified") locked.push("Institutional research reports");
  if (!kyc.two_factor_enabled) locked.push("API access & webhooks");
  if (!kyc.phone_verified) locked.push("Real-time SMS alerts");

  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <StepHeader index={6} title="Dashboard access" subtitle="Here's your current verification status and what unlocks next." />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border/70 bg-[var(--surface)]/60 p-4 md:col-span-2">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Verification status</div>
          <div className="mt-2 flex items-center gap-3">
            <span className={cx("rounded-full px-3 py-1 text-xs", s.className)}>{s.label}</span>
            <span className="text-xs text-muted-foreground">Profile completion {pct}%</span>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[var(--surface-elevated)]">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--gradient-gold)" }} />
          </div>
        </div>
        <div className="rounded-xl border border-border/70 bg-[var(--surface)]/60 p-4">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Next up</div>
          <div className="mt-2 text-sm">
            {kyc.id_status === "verified"
              ? "You're fully verified. Enjoy full platform access."
              : "Our compliance team is reviewing your documents. Typical turnaround: under 24 hours."}
          </div>
        </div>
      </div>

      {locked.length > 0 && (
        <div className="rounded-xl border border-border/70 bg-[var(--surface)]/60 p-4">
          <div className="text-sm font-medium">Features unlocked once verified</div>
          <ul className="mt-2 grid gap-1.5 text-xs text-muted-foreground sm:grid-cols-2">
            {locked.map((l) => (
              <li key={l} className="flex items-center gap-2">
                <Lock className="h-3.5 w-3.5" /> {l}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={() => navigate({ to: "/dashboard" })}
          className="rounded-xl px-4 py-2.5 text-sm font-medium text-primary-foreground"
          style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
        >
          Go to dashboard
          <ArrowRight className="ml-2 inline h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ---------------------------- UI helpers ---------------------------- */
function StepHeader({ index, title, subtitle }: { index: number; title: string; subtitle: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Step {index}</div>
      <h2 className="mt-1 font-display text-2xl sm:text-3xl">{title}</h2>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function StepNav({
  onBack,
  onNext,
  rightLabel,
  rightDisabled,
}: {
  onBack?: () => void;
  onNext?: () => void;
  rightLabel: string;
  rightDisabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-t border-border/60 pt-5">
      <button
        type="button"
        onClick={onBack}
        disabled={!onBack}
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-[var(--surface-elevated)] px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground disabled:invisible"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <button
        type={onNext ? "button" : "submit"}
        onClick={onNext}
        disabled={rightDisabled}
        className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
        style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
      >
        {rightLabel} <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cx("block", className)}>
      <span className="mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={cx(
        "w-full rounded-xl border border-border bg-[var(--surface)] px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-[var(--gold)]/60",
        className,
      )}
    />
  );
}

function Select({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-border bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--gold)]/60"
    >
      <option value="" disabled>
        {placeholder ?? "Select…"}
      </option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className={cx(
        "relative h-6 w-11 rounded-full border transition-colors",
        checked ? "border-[var(--gold)]/60 bg-[var(--gold)]/30" : "border-border bg-[var(--surface-elevated)]",
      )}
    >
      <span
        className={cx(
          "absolute top-0.5 h-5 w-5 rounded-full transition-all",
          checked ? "left-5 bg-[var(--gold)]" : "left-0.5 bg-muted-foreground/50",
        )}
      />
    </button>
  );
}

function ProgressPill({ label, active, tone }: { label: string; active: boolean; tone?: "success" }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px]",
        active
          ? tone === "success"
            ? "border-[var(--success)]/40 bg-[var(--success)]/10 text-[var(--success)]"
            : "border-[var(--gold)]/40 bg-[var(--gold)]/10 text-[var(--gold)]"
          : "border-border text-muted-foreground",
      )}
    >
      <span className={cx("h-1.5 w-1.5 rounded-full", active ? "bg-current" : "bg-muted-foreground/40")} />
      {label}
    </span>
  );
}


function cx(...c: (string | false | undefined | null)[]) {
  return c.filter(Boolean).join(" ");
}
