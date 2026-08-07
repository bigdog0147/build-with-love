/**
 * Redeems a signed confirmation link from a capital raising decision email.
 *
 * Email attachments are not supported by the sending platform, so the decision
 * email links here instead. The document content travels inside the signed
 * token, so this route is stateless: it verifies the signature, version and
 * expiry, rebuilds the exact same confirmation document the portal renders, and
 * returns it as a download. No session and no database read are involved, and a
 * forged or edited link cannot produce a document.
 */
import { createFileRoute } from "@tanstack/react-router";
import { buildRaiseConfirmationPdf } from "@/lib/raise-confirmation";
import {
  RAISE_CONFIRMATION_MESSAGES,
  verifyRaiseConfirmationToken,
  type RaiseConfirmationFailure,
} from "@/lib/raise-confirmation-token";

const SITE_URL = "https://www.gf3x.space";

function notice(message: string, status: number) {
  const safe = message.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Confirmation link — Gigafactory 3X</title></head>
<body style="margin:0;background:#0b0b0c;color:#f5f3ef;font-family:Helvetica,Arial,sans-serif">
<div style="max-width:520px;margin:12vh auto;padding:0 24px">
<p style="letter-spacing:3px;font-size:12px;color:#c8a24a;margin:0 0 16px">GIGAFACTORY 3X</p>
<h1 style="font-size:22px;margin:0 0 12px">Confirmation unavailable</h1>
<p style="font-size:14px;line-height:22px;color:#c9c6bf">${safe}</p>
<p><a href="${SITE_URL}/capital-raising" style="display:inline-block;margin-top:12px;padding:12px 20px;border-radius:8px;background:#c8a24a;color:#0b0b0c;font-size:14px;text-decoration:none">Open capital raising portal</a></p>
</div></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
  );
}

export const Route = createFileRoute("/api/public/raise-confirmation")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const secret = process.env["DOCUMENT_LINK_SECRET"] ?? "";
        const url = new URL(request.url);
        const token = url.searchParams.get("t") ?? "";

        const verified = await verifyRaiseConfirmationToken(token, secret);
        if (!verified.ok) {
          const reason = verified.reason as RaiseConfirmationFailure;
          return notice(RAISE_CONFIRMATION_MESSAGES[reason], reason === "expired" ? 410 : 403);
        }

        const doc = buildRaiseConfirmationPdf(verified.payload.c);

        // Append-only audit trail entry so the investor sees email-link
        // downloads next to portal downloads. Never blocks the file.
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          await supabaseAdmin.from("confirmation_downloads").insert({
            user_id: verified.payload.u,
            round_name: verified.payload.c.roundName,
            event_key: verified.payload.c.kind,
            document_title: doc.title,
            reference: verified.payload.c.reference ?? null,
            source: "email_link",
            document_count: 1,
          } as never);
        } catch {
          // Recording is best-effort; the document is still delivered.
        }
        // `view=1` renders it in the browser; the email link downloads the file.
        const inline = url.searchParams.get("view") === "1";
        return new Response(doc.bytes as unknown as BodyInit, {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${doc.fileName}"`,
            "Cache-Control": "no-store",
            "X-Robots-Tag": "noindex",
          },
        });
      },
    },
  },
});
