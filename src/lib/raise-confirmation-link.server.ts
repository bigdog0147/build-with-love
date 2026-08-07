/**
 * Server-only helper that turns a confirmation document into a signed download
 * link for a decision email.
 *
 * The sending platform does not support attachments, so instead of a file the
 * email carries a per-recipient signed link that returns the identical
 * confirmation document as a download. Minted fresh on every send, so a retry
 * days later still hands the investor a full validity window. Without the secret
 * configured the helper returns null and the email simply omits the download.
 */
import type { RaiseConfirmationInput } from "./raise-confirmation";
import { raiseConfirmationTitle } from "./raise-confirmation";
import { signRaiseConfirmationToken } from "./raise-confirmation-token";

const SITE_URL = "https://www.gf3x.space";

export type ConfirmationLink = { url: string; title: string; fileName: string };

/** Signs one confirmation for one investor; null when links are unavailable. */
export async function raiseConfirmationLink(
  userId: string,
  confirmation: RaiseConfirmationInput,
): Promise<ConfirmationLink | null> {
  const secret = process.env["DOCUMENT_LINK_SECRET"] ?? "";
  if (!secret || !userId) return null;
  try {
    const token = await signRaiseConfirmationToken({ confirmation, userId, secret });
    const { buildRaiseConfirmation } = await import("./raise-confirmation");
    const doc = buildRaiseConfirmation(confirmation);
    return {
      url: `${SITE_URL}/api/public/raise-confirmation?t=${encodeURIComponent(token)}`,
      title: raiseConfirmationTitle(confirmation.kind),
      fileName: doc.fileName,
    };
  } catch (error) {
    console.error("[raise] could not sign confirmation link", error);
    return null;
  }
}

/** Looks up the investor's display name so the document is personally addressed. */
export async function investorDisplayName(userId: string): Promise<string> {
  try {
    const { serviceClient } = await import("./admin-guard.server");
    const db = await serviceClient();
    const { data } = await db
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle();
    return (data?.full_name as string | undefined)?.trim() || "Investor";
  } catch {
    return "Investor";
  }
}
