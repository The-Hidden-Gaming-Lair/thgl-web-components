import { sign, verify } from "jsonwebtoken";
import { type PatreonToken, setToken } from "./tokens";

/**
 * Signed-cookie fallback for the Patreon token store.
 *
 * The primary store is Bunny DB (lib/tokens.ts). During the
 * 2026-07-27 outage the Magic Container network couldn't reach the
 * DB at all, which both blocked sign-in ("Token store failed") and
 * signed existing users out (getAccount/perks refresh failed). To
 * make auth survive a token-store outage, the login routes ALSO
 * place the Patreon token in an httpOnly signed cookie, and every
 * reader falls back to it when the DB read throws or misses.
 *
 * The payload is bound to the userId it was issued for and signed
 * with JWT_SECRET, so it can't be forged or replayed across
 * accounts. httpOnly keeps it out of client-side JS (unlike the
 * `userId` cookie, which js-cookie reads on purpose).
 */

export const TOKEN_COOKIE_NAME = "patreonToken";

// 31 days — matches the userId cookie and the Patreon refresh-token
// lifetime that lib/tokens.ts pins.
const TOKEN_COOKIE_MAX_AGE = 2678400;

export function signTokenCookie(userId: string, token: PatreonToken): string {
  return sign({ u: userId, t: token }, process.env.JWT_SECRET!);
}

export function parseTokenCookie(
  value: string | undefined,
  expectedUserId: string,
): PatreonToken | null {
  if (!value || !process.env.JWT_SECRET) return null;
  try {
    const decoded = verify(value, process.env.JWT_SECRET) as {
      u: string;
      t: PatreonToken;
    };
    if (decoded.u !== expectedUserId) return null;
    return decoded.t;
  } catch {
    return null;
  }
}

function cookieDomain(): string {
  return process.env.COOKIE_DOMAIN
    ? `; domain=${process.env.COOKIE_DOMAIN}`
    : "";
}

export function toTokenCookieString(signedValue: string): string {
  return `${TOKEN_COOKIE_NAME}=${signedValue}; path=/; Max-Age=${TOKEN_COOKIE_MAX_AGE}${cookieDomain()}; SameSite=Lax; HttpOnly;`;
}

export function toTokenCookieStringEmpty(): string {
  return `${TOKEN_COOKIE_NAME}=; path=/; Max-Age=0${cookieDomain()}; SameSite=Lax; HttpOnly;`;
}

/**
 * Best-effort write to the primary token store. A token-store outage
 * must never fail the caller — the cookie fallback carries the
 * session until the store is reachable again.
 */
export async function setTokenBestEffort(
  log: string,
  userId: string,
  token: PatreonToken,
): Promise<void> {
  try {
    await setToken(userId, token);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(
      `${log} setToken failed for id=${userId}: ${msg} — continuing with cookie fallback`,
    );
  }
}
