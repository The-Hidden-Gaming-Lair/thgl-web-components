/**
 * Transactional email via Mailjet (EU provider, Send API v3.1) - same API as
 * nottuln-blog's src/lib/email.ts. Used for the email sign-in codes
 * (lib/email-login.ts). Sender domain th.gl is DNS-validated in Mailjet
 * (DKIM `mailjet._domainkey`, SPF include:spf.mailjet.com next to Google).
 */

const MAILJET_API = "https://api.mailjet.com/v3.1/send";

function mailjetAuth(): string | null {
  const key = process.env.MAILJET_API_KEY;
  const secret = process.env.MAILJET_SECRET_KEY;
  if (!key || !secret) return null;
  return `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`;
}

export function mailConfigured(): boolean {
  return !!mailjetAuth() && !!process.env.MAIL_FROM_EMAIL;
}

export async function sendMail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<boolean> {
  const auth = mailjetAuth();
  const from = process.env.MAIL_FROM_EMAIL;
  if (!auth || !from) {
    console.error("[mail] Mailjet is not configured");
    return false;
  }
  try {
    const res = await fetch(MAILJET_API, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: auth },
      body: JSON.stringify({
        Messages: [
          {
            From: { Email: from, Name: process.env.MAIL_FROM_NAME ?? "TH.GL" },
            To: [{ Email: to }],
            Subject: subject,
            TextPart: text,
            HTMLPart: html,
          },
        ],
      }),
      signal: AbortSignal.timeout(10_000),
    });
    // v3.1 answers 200 for partial failures too - the per-message status counts.
    const data = (await res.json().catch(() => null)) as {
      Messages?: { Status?: string }[];
    } | null;
    const ok = data?.Messages?.[0]?.Status === "success";
    if (!ok) console.error(`[mail] Mailjet send failed (${res.status})`);
    return ok;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[mail] Mailjet request failed: ${msg}`);
    return false;
  }
}
