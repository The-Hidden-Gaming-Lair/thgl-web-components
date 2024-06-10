import { apps } from "@/lib/apps";
import {
  PatreonToken,
  PatreonUser,
  getCurrentUser,
  hasPreviewAccess,
  isSupporter,
  postRefreshToken,
  toCookieStringEmpty,
} from "@/lib/patreon";
import { kv } from "@vercel/kv";
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

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
        { status: 400, headers: headers },
      );
    }
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get("appId");

    if (!appId) {
      return Response.json(
        { error: "No appId provided" },
        { status: 400, headers: headers },
      );
    }
    const app = apps.find((app) => app.overwolf?.id === appId);
    if (!app) {
      return Response.json(
        { error: "App not found" },
        {
          status: 404,
          headers: headers,
        },
      );
    }

    const userId = jwt.verify(
      userIdCookie.value,
      process.env.JWT_SECRET!,
    ) as string;

    const patreonToken = await kv.get<PatreonToken>(`token:${userId}`);
    if (!patreonToken) {
      return Response.json(
        { error: "Token not found" },
        {
          status: 404,
          headers: headers,
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
        headers: headers,
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
          headers: headers,
        },
      );
    }
    const currentUser = currentUserResult as PatreonUser;
    if (!isSupporter(currentUser, app)) {
      return Response.json(
        { error: "User is not a patron", currentUser },
        {
          status: 403,
          headers: headers,
        },
      );
    }
    const previewAccess = hasPreviewAccess(currentUser, app);
    const result = {
      previewAccess,
    };
    return Response.json(result, {
      headers: headers,
    });
  } catch (err) {
    return Response.json(
      { error: "Internal Server Error", err },
      {
        status: 500,
        headers: headers,
      },
    );
  }
}

export async function DELETE(request: NextRequest) {
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
  return Response.json({}, { headers: headers });
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) {
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  }
  const headers = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, DELETE, OPTIONS",
    "Access-Control-Allow-Credentials": "true",
  };
  return Response.json({}, { headers: headers });
}
