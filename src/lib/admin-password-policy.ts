/**
 * Shared administrator password policy — used by the client forms for instant
 * feedback and re-enforced on the server before any password is written.
 */
export const ADMIN_PASSWORD_MIN_LENGTH = 12;

export function validateAdminPassword(password: string): string | null {
  if (password.length < ADMIN_PASSWORD_MIN_LENGTH) {
    return `Use at least ${ADMIN_PASSWORD_MIN_LENGTH} characters.`;
  }
  if (password.length > 200) return "Use at most 200 characters.";
  if (!/[A-Z]/.test(password)) return "Include at least one upper case letter.";
  if (!/[a-z]/.test(password)) return "Include at least one lower case letter.";
  if (!/[0-9]/.test(password)) return "Include at least one number.";
  return null;
}

/** Verification code shown in the reset email (email-possession proof). */
export const ADMIN_RESET_CODE_LENGTH = 6;
/** One-time link/code lifetime. */
export const ADMIN_RESET_TTL_SECONDS = 30 * 60;
/** Wrong-code attempts allowed before the token is burned. */
export const ADMIN_RESET_MAX_ATTEMPTS = 5;
