import { kv } from "@vercel/kv";
import jwt from "jsonwebtoken";
import { type NextRequest } from "next/server";
import {
  CORS_HEADERS,
  type PatreonToken,
  type PatreonUser,
  getCurrentUser,
  hasPreviewAccess,
  isSupporter,
  postRefreshToken,
} from "@/lib/patreon";
import { apps } from "@/lib/apps";

export const maxDuration = 25;
export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();

    if (!requestBody.userId) {
      return Response.json(
        { error: "userId and appId are required" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const app = apps.find((app) => app.overwolf?.id === requestBody.appId);
    const userId = jwt.verify(
      requestBody.userId,
      process.env.JWT_SECRET!,
    ) as string;

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

    const refreshTokenResult = await refreshTokenResponse.json();
    if (!refreshTokenResponse.ok) {
      return Response.json(refreshTokenResult, {
        status: refreshTokenResponse.status,
        headers: CORS_HEADERS,
      });
    }
    await kv.set(`token:${userId}`, refreshTokenResult, {
      ex: refreshTokenResult.expires_in,
    });

    const patreonTokenRefreshed = refreshTokenResult as PatreonToken;

    const currentUserResponse = await getCurrentUser(patreonTokenRefreshed);
    const currentUserResult = await currentUserResponse.json();
    if (!currentUserResponse.ok) {
      return Response.json(
        { userId },
        {
          status: currentUserResponse.status,
          headers: CORS_HEADERS,
        },
      );
    }
    const currentUser = currentUserResult as PatreonUser;
    if (!isSupporter(currentUser, app)) {
      return Response.json(
        { error: "User is not a patron", currentUser },
        {
          status: 403,
          headers: CORS_HEADERS,
        },
      );
    }

    const previewAccess = hasPreviewAccess(currentUser, app);
    const result = {
      previewAccess,
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

export async function OPTIONS() {
  return Response.json({}, { headers: CORS_HEADERS });
}
