import { cookies, headers } from "next/headers";
import { verify } from "jsonwebtoken";

/**
 * Account auth for route handlers.
 *
 * The Patreon OAuth flow stores a JWT-signed `userId` value as a
 * cookie (web) or in client storage (Overwolf). This module extracts
 * the decrypted Patreon user id from whichever credential the client
 * sends. No Patreon API roundtrip — the JWT itself is the credential,
 * signed by us, so we only verify the signature.
 *
 * Credential precedence:
 *   1. `userId` cookie — used by web clients in same-origin requests
 *      to *.th.gl (cookie is .th.gl-scoped in prod, host-scoped in dev).
 *   2. `X-User-Id` header — used by Overwolf apps, whose
 *      `overwolf-extension://` origin can't reach the th.gl cookie.
 *      The Overwolf user-dialog populates useAccountStore.userId via
 *      the existing /api/patreon/overwolf flow; filters-api.ts sends
 *      it back here as the header.
 *
 *   getUserIdFromRequest() → string | null   (soft, for optional auth)
 *   requireAccount()       → string          (throws UnauthenticatedError)
 */

export class UnauthenticatedError extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "UnauthenticatedError";
  }
}

async function readJwt(): Promise<string | null> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get("userId")?.value;
  if (fromCookie) return fromCookie;
  const headerStore = await headers();
  return headerStore.get("x-user-id");
}

export async function getUserIdFromRequest(): Promise<string | null> {
  const raw = await readJwt();
  if (!raw) return null;
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("[auth] JWT_SECRET not set");
    return null;
  }
  try {
    const decoded = verify(raw, secret);
    if (typeof decoded === "string") return decoded;
    // Enriched Overwolf secrets carry { u: userId, t: patreonToken } —
    // see lib/token-cookie.ts decodeUserSecret.
    const u = (decoded as { u?: unknown }).u;
    return typeof u === "string" ? u : null;
  } catch {
    return null;
  }
}

/** @deprecated kept for callers that haven't migrated; alias of getUserIdFromRequest. */
export const getUserIdFromCookies = getUserIdFromRequest;

export async function requireAccount(): Promise<string> {
  const id = await getUserIdFromRequest();
  if (!id) throw new UnauthenticatedError();
  return id;
}
