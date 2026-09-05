import { getToken } from "@/lib/tokens";
import {
  TOKEN_COOKIE_NAME,
  decodeUserSecret,
  parseTokenCookie,
  setTokenBestEffort,
  signTokenCookie,
  toTokenCookieString,
  toTokenCookieStringEmpty,
} from "@/lib/token-cookie";
import { sign } from "jsonwebtoken";
import {
  TEST_SUPPORTER_EMAIL,
  TEST_SUPPORTER_PERKS,
  isTestSupporter,
} from "@/lib/test-supporter";
import { type NextRequest } from "next/server";
import {
  type PatreonToken,
  type PatreonUser,
  getCurrentUser,
  getPerks,
  isSpecialUser,
  isSupporter,
  postRefreshToken,
  toCookieString,
  toCookieStringEmpty,
} from "@/games/thgl-web/lib/patreon";
import { games } from "@repo/lib";

/**
 * Account-perks refresh.
 *
 * Trades the stored Patreon refresh token for new perks + entitlement
 * info, sets a fresh signed-userId cookie, and returns the resulting
 * perks JSON. Called by the client (header/account.tsx) on app load
 * to verify the cookie still represents an active supporter.
 *
 * Mounted at the top level (not under /www/) so every tenant —
 * paxdei.th.gl, www.th.gl, app.th.gl, *.localhost — can call it
 * against its own origin. That lets the host-scoped cookie travel
 * with the request in dev where COOKIE_DOMAIN is unset and the
 * cookie can't cross subdomains.
 *
 * Origin policy: allow missing Origin (same-origin GET requests
 * from a tenant page don't set one) and echo the caller's Origin
 * back via ACAO when present.
 */

function corsHeaders(request: NextRequest, extra: HeadersInit = {}) {
  const origin = request.headers.get("origin") ?? "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, DELETE, OPTIONS",
    "Access-Control-Allow-Credentials": "true",
    ...extra,
  };
}

export const maxDuration = 25;
export async function GET(request: NextRequest) {
  const headers = corsHeaders(request);
  try {
    const userIdCookie = request.cookies.get("userId");
    if (!userIdCookie?.value) {
      return Response.json(
        { error: "No userId provided" },
        { status: 400, headers },
      );
    }
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get("appId");

    const game = appId
      ? games.find((a) => a.id === appId || a.overwolf?.id === appId)
      : undefined;

    // Accepts both cookie formats: the legacy JWT-of-plain-id minted at login
    // AND the enriched { u, t } secret the client writes back after healing a
    // wiped cookie store from localStorage (see reverifyAccountSecret).
    const decoded = decodeUserSecret(userIdCookie.value);
    if (!decoded) {
      return Response.json(
        { error: "Invalid userId" },
        { status: 400, headers },
      );
    }
    const userId = decoded.userId;

    // Dev-only test account (see lib/test-supporter.ts).
    if (isTestSupporter(userId)) {
      return Response.json(
        {
          ...TEST_SUPPORTER_PERKS,
          expiresIn: 2678400,
          decryptedUserId: userId,
          email: TEST_SUPPORTER_EMAIL,
        },
        { headers },
      );
    }

    // Primary: token store; fallback: the signed httpOnly cookie set
    // at login. A store outage must not sign the user out.
    let storedToken = null;
    let storeUnavailable = false;
    try {
      storedToken = await getToken(userId);
    } catch (err) {
      storeUnavailable = true;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[api/patreon] getToken failed for ${userId}: ${msg}`);
    }
    const cookieToken = parseTokenCookie(
      request.cookies.get(TOKEN_COOKIE_NAME)?.value,
      userId,
    );
    // Last fallback: the token embedded in an enriched userId cookie —
    // present exactly when the cookie store was healed from localStorage.
    const patreonToken = storedToken ?? cookieToken ?? decoded.token;
    if (!patreonToken) {
      if (storeUnavailable) {
        // 503, NOT 404 — clients sign the user out on 404. This is a
        // transient store outage, so tell them to keep the session.
        return Response.json(
          { error: "Token store unavailable" },
          { status: 503, headers },
        );
      }
      return Response.json(
        { error: "Token not found" },
        { status: 404, headers },
      );
    }

    let refreshTokenResponse = await postRefreshToken(
      patreonToken.refresh_token,
    );

    let refreshTokenResult =
      (await refreshTokenResponse.json()) as PatreonToken;
    if (
      !refreshTokenResponse.ok &&
      refreshTokenResponse.status < 500 &&
      cookieToken &&
      patreonToken !== cookieToken &&
      cookieToken.refresh_token !== patreonToken.refresh_token
    ) {
      // Patreon ROTATES refresh tokens, so the stored copy can go stale
      // while a store outage kept writes from landing (the newest token
      // then lives only in the cookie). Retry with the cookie before
      // treating the session as dead — otherwise exactly the users who
      // signed in during an outage get kicked once it ends.
      console.warn(
        `[api/patreon] stored refresh token rejected (${refreshTokenResponse.status}) for ${userId} — retrying with cookie token`,
      );
      refreshTokenResponse = await postRefreshToken(cookieToken.refresh_token);
      refreshTokenResult = (await refreshTokenResponse.json()) as PatreonToken;
    }
    if (!refreshTokenResponse.ok) {
      return Response.json(refreshTokenResult, {
        status: refreshTokenResponse.status,
        headers,
      });
    }
    const signed = sign(userId, process.env.JWT_SECRET!);
    await setTokenBestEffort("[api/patreon]", userId, refreshTokenResult);

    const responseHeaders = new Headers(headers);
    responseHeaders.append("Set-Cookie", toCookieString(signed, 2678400));
    responseHeaders.append(
      "Set-Cookie",
      toTokenCookieString(signTokenCookie(userId, refreshTokenResult)),
    );
    const currentUserResponse = await getCurrentUser(refreshTokenResult);
    const currentUserResult = (await currentUserResponse.json()) as PatreonUser;
    if (!currentUserResponse.ok) {
      return Response.json(
        { userId },
        {
          status: currentUserResponse.status,
          headers: responseHeaders,
        },
      );
    }
    const currentUser = currentUserResult;
    if (!isSupporter(currentUser, game)) {
      return Response.json(
        { error: "User is not a patron", currentUser },
        {
          status: 403,
          headers: responseHeaders,
        },
      );
    }

    const perks = getPerks(currentUser, game);
    const result = {
      ...perks,
      expiresIn: refreshTokenResult.expires_in,
      decryptedUserId: userId,
      email: currentUser.data.attributes.email,
      isSpecial: isSpecialUser(userId),
    };
    return Response.json(result, { headers: responseHeaders });
  } catch (err) {
    return Response.json(
      { error: "Internal Server Error", err },
      { status: 500, headers },
    );
  }
}

export function DELETE(request: NextRequest) {
  const headers = new Headers(corsHeaders(request));
  headers.append("Set-Cookie", toCookieStringEmpty());
  headers.append("Set-Cookie", toTokenCookieStringEmpty());
  return Response.json({}, { headers });
}

export function OPTIONS(request: NextRequest) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}
