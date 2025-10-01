import { kv } from "@vercel/kv";
import { verify } from "jsonwebtoken";
import { type NextRequest } from "next/server";
import {
  CORS_HEADERS,
  type PatreonToken,
  type PatreonUser,
  getCurrentUser,
  getPerks,
  isSupporter,
  postRefreshToken,
} from "@/lib/patreon";
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

    let userId;
    try {
      userId = verify(requestBody.userId, process.env.JWT_SECRET!) as string;
    } catch (err) {
      return Response.json(
        { error: "Invalid userId" },
        {
          status: 400,
          headers: CORS_HEADERS,
        },
      );
    }

    const patreonToken = await kv.get<PatreonToken>(`token:${userId}`);
    if (!patreonToken) {
      return Response.json(
        { error: "Token not found" },
        {
          status: 404,
          headers: CORS_HEADERS,
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
        headers: CORS_HEADERS,
      });
    }
    await kv.set(`token:${userId}`, refreshTokenResult, {
      ex: 2678400, // refreshTokenResult.expires_in,
    });

    const patreonTokenRefreshed = refreshTokenResult;

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
      expiresIn: refreshTokenResult.expires_in,
      decryptedUserId: userId,
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
