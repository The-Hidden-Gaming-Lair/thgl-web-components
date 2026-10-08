import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { arg, libsql } from "@/lib/libsql";
import { sendMail } from "@/lib/mail";
import { TEBEX_FREE_TIER_ID } from "@/lib/tebex";

/**
 * Passwordless email sign-in (one-time code) for accounts without a Patreon
 * login: Tebex buyers (their purchase email arrives with the webhook). It
 * NEVER creates accounts (Leon 2026-10-08: no free sign-up by email - a
 * gmail address got a free account + "Supporter Key" without paying). Works the same on www, the game sites and
 * inside the Companion App (typed in, like the Patreon sign-in popup).
 *
 * Accounts are the existing `tebex:<uuid>` ids, so every resolver
 * (api/patreon, verify-secret, getAccount) already understands them.
 *
 * Schema (scripts/apply-tebex-schema.mjs):
 *   account_emails       (email, user_id, created_at)  PK (email, user_id)
 *   email_login_codes    (email PK, code_hash, expires_at, attempts, created_at)
 *   email_login_requests (email, ip, created_at)       rate limiting
 *
 * Cases (Leon 2026-10-08):
 *   - email with one account        -> that account
 *   - email unknown                 -> no code is sent (same neutral answer)
 *   - email with several accounts   -> merged into the one with an active paid
 *     tier (else the oldest); entitlements + emails move over
 *   - Patreon supporters are separate: their Patreon id is never in
 *     account_emails, so this never touches a Patreon account
 */

const CODE_TTL_SECONDS = 10 * 60;
const MAX_ATTEMPTS = 5;
const MAX_CODES_PER_EMAIL_PER_HOUR = 3;
const MAX_CODES_PER_IP_PER_HOUR = 10;

const now = () => Math.floor(Date.now() / 1000);

/** Lower-cased, trimmed address, or null when it isn't a plausible email. */
export function normalizeEmail(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const email = input.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return null;
  }
  return email;
}

function codeHash(email: string, code: string): string {
  return createHmac("sha256", process.env.JWT_SECRET!)
    .update(`email-login:${email}:${code}`)
    .digest("hex");
}

export type RequestResult =
  | { status: "sent"; code: string }
  | { status: "rate-limited" }
  | { status: "no-account" }
  | { status: "send-failed" };

/**
 * Creates and mails a fresh 6-digit code to an email that has an account.
 * The caller answers the same way for unknown emails, so the endpoint never
 * reveals whether an email has an account.
 */
export async function requestLoginCode(
  email: string,
  ip: string,
  lang: "en" | "zh",
): Promise<RequestResult> {
  const hourAgo = now() - 3600;
  const [byEmail, byIp] = await libsql([
    {
      sql: `SELECT COUNT(*) FROM email_login_requests WHERE email = ? AND created_at > ?`,
      args: [arg.text(email), arg.int(hourAgo)],
    },
    {
      sql: `SELECT COUNT(*) FROM email_login_requests WHERE ip = ? AND created_at > ?`,
      args: [arg.text(ip), arg.int(hourAgo)],
    },
  ]);
  if (
    Number(byEmail.rows[0][0].value) >= MAX_CODES_PER_EMAIL_PER_HOUR ||
    Number(byIp.rows[0][0].value) >= MAX_CODES_PER_IP_PER_HOUR
  ) {
    return { status: "rate-limited" };
  }

  const [known] = await libsql([
    {
      sql: `SELECT 1 FROM account_emails WHERE email = ? LIMIT 1`,
      args: [arg.text(email)],
    },
  ]);
  if (known.rows.length === 0) {
    // Counted for the rate limit, but no code and no mail: email sign-in is
    // for existing (Tebex) accounts only. The caller answers the same way.
    await libsql([
      {
        sql: `INSERT INTO email_login_requests (email, ip, created_at) VALUES (?, ?, ?)`,
        args: [arg.text(email), arg.text(ip), arg.int(now())],
      },
    ]);
    return { status: "no-account" };
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await libsql([
    {
      sql: `INSERT INTO email_login_requests (email, ip, created_at) VALUES (?, ?, ?)`,
      args: [arg.text(email), arg.text(ip), arg.int(now())],
    },
    {
      // A new code replaces the previous one (only the newest works).
      sql: `INSERT INTO email_login_codes (email, code_hash, expires_at, attempts, created_at)
            VALUES (?, ?, ?, 0, ?)
            ON CONFLICT(email) DO UPDATE SET code_hash = excluded.code_hash,
              expires_at = excluded.expires_at, attempts = 0, created_at = excluded.created_at`,
      args: [
        arg.text(email),
        arg.text(codeHash(email, code)),
        arg.int(now() + CODE_TTL_SECONDS),
        arg.int(now()),
      ],
    },
    {
      sql: `DELETE FROM email_login_requests WHERE created_at < ?`,
      args: [arg.int(now() - 86400)],
    },
  ]);

  const sent = await sendMail({ to: email, ...codeEmail(code, lang) });
  return sent ? { status: "sent", code } : { status: "send-failed" };
}

function codeEmail(code: string, lang: "en" | "zh") {
  const zh = `你的 TH.GL 登录验证码是：${code}\n验证码 10 分钟内有效。如果不是你本人操作，请忽略此邮件。`;
  const en = `Your TH.GL sign-in code is: ${code}\nIt is valid for 10 minutes. If you didn't request it, you can ignore this email.`;
  const [first, second] = lang === "zh" ? [zh, en] : [en, zh];
  const block = (s: string) =>
    `<p style="margin:0 0 12px;color:#444;font-size:14px;line-height:1.5">${s
      .replace(code, `<strong>${code}</strong>`)
      .replace("\n", "<br>")}</p>`;
  return {
    subject:
      lang === "zh"
        ? `TH.GL 登录验证码 ${code}`
        : `Your TH.GL sign-in code: ${code}`,
    text: `${first}\n\n${second}\n\nTH.GL - The Hidden Gaming Lair\nhttps://www.th.gl`,
    html: `<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px">
<p style="font-size:32px;font-weight:bold;letter-spacing:6px;margin:0 0 20px;color:#111">${code}</p>
${block(first)}${block(second)}
<p style="margin:20px 0 0;color:#888;font-size:12px">TH.GL - The Hidden Gaming Lair · <a href="https://www.th.gl" style="color:#888">www.th.gl</a></p>
</div>`,
  };
}

export type VerifyResult =
  | { ok: true; userId: string; merged: number }
  | { ok: false; reason: "invalid" | "expired" | "too-many-attempts" };

export async function verifyLoginCode(
  email: string,
  code: string,
): Promise<VerifyResult> {
  const [row] = await libsql([
    {
      sql: `SELECT code_hash, expires_at, attempts FROM email_login_codes WHERE email = ?`,
      args: [arg.text(email)],
    },
  ]);
  const r = row.rows[0];
  if (!r) return { ok: false, reason: "invalid" };
  if (Number(r[1].value) < now()) return { ok: false, reason: "expired" };
  if (Number(r[2].value) >= MAX_ATTEMPTS) {
    return { ok: false, reason: "too-many-attempts" };
  }
  const expected = Buffer.from(r[0].value);
  const given = Buffer.from(codeHash(email, code.trim()));
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    await libsql([
      {
        sql: `UPDATE email_login_codes SET attempts = attempts + 1 WHERE email = ?`,
        args: [arg.text(email)],
      },
    ]);
    return { ok: false, reason: "invalid" };
  }
  // One-time: the code is gone once used.
  await libsql([
    {
      sql: `DELETE FROM email_login_codes WHERE email = ?`,
      args: [arg.text(email)],
    },
  ]);
  const account = await accountForEmail(email);
  return account ? { ok: true, ...account } : { ok: false, reason: "invalid" };
}

/** The account for a verified email (merged when there are several), or null. */
async function accountForEmail(
  email: string,
): Promise<{ userId: string; merged: number } | null> {
  const [linked] = await libsql([
    {
      // Each linked account with its best active paid expiry (0 = none) and
      // when it was linked, to pick the primary one.
      sql: `SELECT a.user_id, a.created_at,
                   COALESCE((SELECT MAX(e.expires_at) FROM tebex_entitlements e
                              WHERE e.user_id = a.user_id AND e.revoked = 0
                                AND e.expires_at > ? AND e.tier_id != ?), 0) AS paid_until
              FROM account_emails a WHERE a.email = ?`,
      args: [arg.int(now()), arg.text(TEBEX_FREE_TIER_ID), arg.text(email)],
    },
  ]);
  const accounts = linked.rows.map((row) => ({
    userId: row[0].value,
    createdAt: Number(row[1].value),
    paidUntil: Number(row[2].value),
  }));

  if (accounts.length === 0) {
    // The account was removed after the code was sent - nothing to sign in to.
    return null;
  }

  accounts.sort(
    (a, b) => b.paidUntil - a.paidUntil || a.createdAt - b.createdAt,
  );
  const primary = accounts[0].userId;
  const others = accounts.slice(1).map((a) => a.userId);
  if (others.length) {
    const inList = others.map(() => "?").join(",");
    const otherArgs = others.map((id) => arg.text(id));
    await libsql([
      {
        sql: `UPDATE tebex_entitlements SET user_id = ?, updated_at = ? WHERE user_id IN (${inList})`,
        args: [arg.text(primary), arg.int(now()), ...otherArgs],
      },
      {
        // Every email of the merged accounts now belongs to the primary one.
        sql: `INSERT OR IGNORE INTO account_emails (email, user_id, created_at)
              SELECT email, ?, created_at FROM account_emails WHERE user_id IN (${inList})`,
        args: [arg.text(primary), ...otherArgs],
      },
      {
        sql: `DELETE FROM account_emails WHERE user_id IN (${inList})`,
        args: otherArgs,
      },
    ]);
    console.log(
      `[email-login] merged ${others.length} account(s) into ${primary}`,
    );
  }
  return { userId: primary, merged: others.length };
}

/** Emails linked to an account (account page: "Signed in as"). */
export async function emailsForAccount(userId: string): Promise<string[]> {
  const [res] = await libsql([
    {
      sql: `SELECT email FROM account_emails WHERE user_id = ? ORDER BY created_at`,
      args: [arg.text(userId)],
    },
  ]);
  return res.rows.map((row) => row[0].value);
}
