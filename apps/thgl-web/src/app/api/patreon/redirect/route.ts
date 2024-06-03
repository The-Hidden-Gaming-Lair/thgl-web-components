import {
  PatreonToken,
  PatreonUser,
  getCurrentUser,
  postToken,
  toCookieString,
  toCookieStringEmpty,
} from "@/lib/patreon";
import { kv } from "@vercel/kv";
import jwt from "jsonwebtoken";

export const maxDuration = 25;
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return new Response(null, {
      status: 302,
      headers: {
        "Set-Cookie": toCookieStringEmpty(),
        location: "/support-me/account",
      },
    });
  }

  const tokenResponse = await postToken(code);
  const tokenResult = await tokenResponse.json();
  if (!tokenResponse.ok) {
    return Response.json(tokenResult, {
      status: tokenResponse.status,
    });
  }

  const patreonToken = tokenResult as PatreonToken;
  const currentUserResponse = await getCurrentUser(patreonToken);
  const currentUserResult = await currentUserResponse.json();
  if (!currentUserResponse.ok) {
    return Response.json(currentUserResult, {
      status: currentUserResponse.status,
    });
  }
  const currentUser = currentUserResult as PatreonUser;

  const signed = jwt.sign(currentUser.data.id, process.env.JWT_SECRET!);

  await kv.set(`token:${currentUser.data.id}`, patreonToken, {
    ex: patreonToken.expires_in,
  });

  return new Response(null, {
    status: 302,
    headers: {
      "Set-Cookie": toCookieString(signed, patreonToken.expires_in),
      location: "/support-me/account",
    },
  });
}
