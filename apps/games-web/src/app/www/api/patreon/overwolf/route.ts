import { getToken } from "@/lib/tokens";
import {
  decodeUserSecret,
  setTokenBestEffort,
  signTokenCookie,
} from "@/lib/token-cookie";
import { type NextRequest } from "next/server";
import {
  CORS_HEADERS,
  type PatreonToken,
  type PatreonUser,
  getCurrentUser,
  getPerks,
  isSupporter,
  postRefreshToken,
} from "@/games/thgl-web/lib/patreon";
import { games } from "@repo/lib";

export const maxDuration = 25;
export async function POST(request: NextRequest) {
  try {
    const requestBody = (await request.json()) as {
      userId: string;
      appId: string;
    };

    if (!requestBody.userId) {
      return Response.json(
        { error: "userId and appId are required" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const game = games.find(
      (a) => a.id === requestBody.appId || a.overwolf?.id === requestBody.appId,
    );

    const decoded = decodeUserSecret(requestBody.userId);
    if (!decoded) {
      return Response.json(
        { error: "Invalid userId" },
        {
          status: 400,
          headers: CORS_HEADERS,
        },
      );
    }
    const userId = decoded.userId;
    // Enriched secrets (minted by /support-me/account) carry the
    // Patreon token — the OW equivalent of the patreonToken cookie.
    const embeddedToken = decoded.token;

    // Primary: token store; fallback: the token embedded in an
    // enriched secret. A store outage must not sign the user out —
    // the client only clears the session on 404, so store failures
    // without any fallback surface as 503.
    let storedToken = null;
    let storeUnavailable = false;
    try {
      storedToken = await getToken(userId);
    } catch (err) {
      storeUnavailable = true;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[patreon/overwolf] getToken failed for ${userId}: ${msg}`);
    }
    const patreonToken = storedToken ?? embeddedToken;
    if (!patreonToken) {
      return Response.json(
        {
          error: storeUnavailable
            ? "Token store unavailable"
            : "Token not found",
        },
        {
          status: storeUnavailable ? 503 : 404,
          headers: CORS_HEADERS,
        },
      );
    }

    let patreonTokenRefreshed: PatreonToken;
    if (storeUnavailable && !storedToken && embeddedToken) {
      // Store down, running on the embedded token only. Do NOT refresh:
      // Patreon rotates refresh tokens on use, and with the store down
      // (and no way to update the secret the OW app holds) the rotated
      // token would be lost — the secret must stay valid for the next
      // call. The embedded access token is good for ~a month; use it
      // for identity directly.
      patreonTokenRefreshed = embeddedToken;
    } else {
      let refreshTokenResponse = await postRefreshToken(
        patreonToken.refresh_token,
      );
      let refreshTokenResult =
        (await refreshTokenResponse.json()) as PatreonToken;
      if (
        !refreshTokenResponse.ok &&
        refreshTokenResponse.status < 500 &&
        embeddedToken &&
        patreonToken !== embeddedToken &&
        embeddedToken.refresh_token !== patreonToken.refresh_token
      ) {
        // Stored token went stale (rotated elsewhere) — retry with the
        // embedded one before treating the session as dead. Mirrors the
        // cookie retry in /api/patreon.
        console.warn(
          `[patreon/overwolf] stored refresh token rejected (${refreshTokenResponse.status}) for ${userId} — retrying with embedded token`,
        );
        refreshTokenResponse = await postRefreshToken(
          embeddedToken.refresh_token,
        );
        refreshTokenResult =
          (await refreshTokenResponse.json()) as PatreonToken;
      }
      if (!refreshTokenResponse.ok) {
        return Response.json(refreshTokenResult, {
          status: refreshTokenResponse.status,
          headers: CORS_HEADERS,
        });
      }
      await setTokenBestEffort(
        "[patreon/overwolf]",
        userId,
        refreshTokenResult,
      );
      patreonTokenRefreshed = refreshTokenResult;
    }

    const currentUserResponse = await getCurrentUser(patreonTokenRefreshed);
    const currentUserResult = (await currentUserResponse.json()) as PatreonUser;
    if (!currentUserResponse.ok) {
      return Response.json(
        { userId },
        {
          status: currentUserResponse.status,
          headers: CORS_HEADERS,
        },
      );
    }
    const currentUser = currentUserResult;
    if (!isSupporter(currentUser, game)) {
      return Response.json(
        { error: "User is not a patron", currentUser },
        {
          status: 403,
          headers: CORS_HEADERS,
        },
      );
    }

    const perks = getPerks(currentUser, game);
    const result = {
      ...perks,
      // Fresh enriched secret (rotates with the token). Newer OW app
      // versions store it back so the secret self-updates like the web
      // cookie; older versions simply ignore the field.
      secret: signTokenCookie(userId, patreonTokenRefreshed),
      expiresIn: patreonTokenRefreshed.expires_in,
      decryptedUserId: userId,
      email: currentUser.data.attributes.email,
    };
    return Response.json(result, {
      headers: CORS_HEADERS,
    });
  } catch (err) {
    return Response.json(
      { error: "Internal Server Error", err },
      {
        status: 500,
        headers: CORS_HEADERS,
      },
    );
  }
}

export function OPTIONS() {
  return Response.json({}, { headers: CORS_HEADERS });
}
