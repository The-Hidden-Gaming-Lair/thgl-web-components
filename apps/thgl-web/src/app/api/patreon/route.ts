import { kv } from "@vercel/kv";
import { sign, verify } from "jsonwebtoken";
import { type NextRequest } from "next/server";
import {
  type PatreonToken,
  type PatreonUser,
  getCurrentUser,
  getPerks,
  isSupporter,
  postRefreshToken,
  toCookieString,
  toCookieStringEmpty,
} from "@/lib/patreon";
import { games } from "@repo/lib";

export const maxDuration = 25;
export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) {
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  }
  const headers = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, DELETE, OPTIONS",
    "Access-Control-Allow-Credentials": "true",
  };

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

    const userId = verify(
      userIdCookie.value,
      process.env.JWT_SECRET!,
    ) as string;

    const patreonToken = await kv.get<PatreonToken>(`token:${userId}`);
    if (!patreonToken) {
      return Response.json(
        { error: "Token not found" },
        {
          status: 404,
          headers,
        },
      );
    }

    const refreshTokenResponse = await postRefreshToken(
      patreonToken.refresh_token,
    );

    const refreshTokenResult =
      (await refreshTokenResponse.json()) as PatreonToken;
    if (!refreshTokenResponse.ok) {
      return Response.json(refreshTokenResult, {
        status: refreshTokenResponse.status,
        headers,
      });
    }
    const signed = sign(userId, process.env.JWT_SECRET!);
    await kv.set(`token:${userId}`, refreshTokenResult, {
      ex: 2678400, // refreshTokenResult.expires_in,
    });

    const patreonTokenRefreshed = refreshTokenResult;

    const responseHeaders = {
      "Set-Cookie": toCookieString(signed, 2678400),
      ...headers,
    };
    const currentUserResponse = await getCurrentUser(patreonTokenRefreshed);
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
    };
    return Response.json(result, {
      headers: responseHeaders,
    });
  } catch (err) {
    return Response.json(
      { error: "Internal Server Error", err },
      {
        status: 500,
        headers,
      },
    );
  }
}

export function DELETE(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) {
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  }
  const headers = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, DELETE, OPTIONS",
    "Access-Control-Allow-Credentials": "true",
    "Set-Cookie": toCookieStringEmpty(),
  };
  return Response.json({}, { headers });
}

export function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) {
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  }
  const headers = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, DELETE, OPTIONS",
    "Access-Control-Allow-Credentials": "true",
  };
  return Response.json({}, { headers });
}
