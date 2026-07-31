export type KycStatus = "not_started" | "submitted" | "under_review" | "verified" | "rejected";
export type KycDocType = "passport" | "national_id" | "drivers_license" | "residence_permit";

export type KycProfile = {
  user_id: string;
  full_legal_name: string | null;
  date_of_birth: string | null;
  nationality: string | null;
  country_of_residence: string | null;
  residential_address: string | null;
  postal_code: string | null;
  doc_type: KycDocType | null;
  doc_front_path: string | null;
  doc_back_path: string | null;
  selfie_path: string | null;
  id_status: KycStatus;
  email_verified: boolean;
  phone_number: string | null;
  phone_verified: boolean;
  tax_country: string | null;
  source_of_funds: string | null;
  expected_usage: string | null;
  two_factor_enabled: boolean;
  recovery_email: string | null;
  current_step: number;
};

export function computeCompletion(k: KycProfile): number {
  const checks: boolean[] = [
    !!k.full_legal_name,
    !!k.date_of_birth,
    !!k.nationality,
    !!k.country_of_residence,
    !!k.residential_address,
    !!k.postal_code,
    !!k.doc_type,
    !!k.doc_front_path,
    k.id_status === "verified" || k.id_status === "under_review" || k.id_status === "submitted",
    k.email_verified,
    k.phone_verified,
    !!k.tax_country,
    !!k.source_of_funds,
    !!k.expected_usage,
    k.two_factor_enabled || !!k.recovery_email,
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

export function statusMeta(status: KycStatus) {
  switch (status) {
    case "verified":
      return { label: "Verified", className: "border border-[var(--success)]/40 bg-[var(--success)]/10 text-[var(--success)]" };
    case "under_review":
      return { label: "In review", className: "border border-[var(--electric)]/40 bg-[var(--electric)]/10 text-[var(--electric)]" };
    case "submitted":
      return { label: "Submitted", className: "border border-[var(--gold)]/40 bg-[var(--gold)]/10 text-[var(--gold)]" };
    case "rejected":
      return { label: "Action required", className: "border border-[var(--danger)]/40 bg-[var(--danger)]/10 text-[var(--danger)]" };
    default:
      return { label: "Not started", className: "border border-border text-muted-foreground" };
  }
}

