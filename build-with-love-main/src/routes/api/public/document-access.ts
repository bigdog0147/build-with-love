/**
 * Redeems a signed document link from a notification email.
 *
 * Public by necessity — the recipient may well be signed out when they click.
 * Security comes from two independent gates:
 *   1. the signed, time-limited token proves the link was minted by us for that
 *      exact investor and document, and has not expired or been edited;
 *   2. entitlement is re-checked against the database on every redemption, so a
 *      document that was unpublished, or an investor whose position closed, is
 *      refused even while the token is still inside its window.
 *
 * Only on passing both does the handler mint a 60-second private storage URL and
 * redirect to it. The file itself is never public and never travels by email.
 */
import { createFileRoute } from "@tanstack/react-router";
import { isEntitledToDocument } from "@/lib/document-entitlement";
import {
  VERIFY_MESSAGES,
  verifyDocumentToken,
  type VerifyFailure,
} from "@/lib/document-link-token";

const SITE_URL = "https://www.gf3x.space";
const DOC_BUCKET = "investor-documents";

type DocRow = {
  id: string;
  title: string;
  file_path: string;
  file_name: string;
  visibility: string;
  product_id: string | null;
  user_id: string | null;
  is_published: boolean;
};

/** Loads the investor's active positions, then applies the shared entitlement rules. */
async function isEntitled(db: any, doc: DocRow, userId: string): Promise<boolean> {
  const { data } = await db
    .from("investment_holdings")
    .select("product_id")
    .eq("user_id", userId)
    .eq("status", "active");
  const activeProductIds = ((data ?? []) as { product_id: string }[]).map((r) => r.product_id);
  return isEntitledToDocument(doc, { userId, activeProductIds });
}

function notice(message: string, status: number) {
  const safe = message.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Document link — Gigafactory 3X</title></head>
<body style="margin:0;background:#0b0b0c;color:#f5f3ef;font-family:Helvetica,Arial,sans-serif">
<div style="max-width:520px;margin:12vh auto;padding:0 24px">
<p style="letter-spacing:3px;font-size:12px;color:#c8a24a;margin:0 0 16px">GIGAFACTORY 3X</p>
<h1 style="font-size:22px;margin:0 0 12px">Document unavailable</h1>
<p style="font-size:14px;line-height:22px;color:#c9c6bf">${safe}</p>
<p><a href="${SITE_URL}/library" style="display:inline-block;margin-top:12px;padding:12px 20px;border-radius:8px;background:#c8a24a;color:#0b0b0c;font-size:14px;text-decoration:none">Open document library</a></p>
</div></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
  );
}

export const Route = createFileRoute("/api/public/document-access")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const secret = process.env["DOCUMENT_LINK_SECRET"] ?? "";
        const token = new URL(request.url).searchParams.get("t") ?? "";

        const verified = await verifyDocumentToken(token, secret);
        if (!verified.ok) {
          const reason = verified.reason as VerifyFailure;
          return notice(VERIFY_MESSAGES[reason], reason === "expired" ? 410 : 403);
        }

        const { serviceClient } = await import("@/lib/admin-guard.server");
        const db = await serviceClient();
        const { data } = await db
          .from("documents")
          .select("id, title, file_path, file_name, visibility, product_id, user_id, is_published")
          .eq("id", verified.payload.d)
          .maybeSingle();

        const doc = data as DocRow | null;
        if (!doc || !(await isEntitled(db, doc, verified.payload.u))) {
          return notice(
            "This document is no longer available to your account. Sign in to your library to see current documents.",
            403,
          );
        }

        const { data: signed, error } = await db.storage
          .from(DOC_BUCKET)
          .createSignedUrl(doc.file_path, 60, { download: doc.file_name });
        if (error || !signed) {
          return notice("The download could not be prepared. Please try again from your library.", 502);
        }

        return new Response(null, {
          status: 302,
          headers: { Location: signed.signedUrl, "Cache-Control": "no-store" },
        });
      },
    },
  },
});
