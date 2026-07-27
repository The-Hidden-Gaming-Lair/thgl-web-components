import {
  setTokenBestEffort,
  signTokenCookie,
  toTokenCookieString,
} from "@/lib/token-cookie";
import { sign } from "jsonwebtoken";
import {
  type PatreonToken,
  type PatreonUser,
  getCurrentUser,
  getRedirectUriFromRequest,
  postToken,
  toCookieString,
  toCookieStringEmpty,
} from "@/games/thgl-web/lib/patreon";

const ALLOWED_DOMAINS = [".th.gl", "localhost"];
const DEFAULT_REDIRECT = "/support-me/account";

function parseReturnTo(state: string | null): string {
  if (!state) return DEFAULT_REDIRECT;
  try {
    const decoded = JSON.parse(
      Buffer.from(state, "base64url").toString("utf-8"),
    );
    const returnTo = decoded?.return_to;
    if (typeof returnTo !== "string") return DEFAULT_REDIRECT;

    // Validate the return URL
    const parsed = new URL(returnTo);
    const isAllowed = ALLOWED_DOMAINS.some(
      (domain) =>
        parsed.hostname === domain || parsed.hostname.endsWith(domain),
    );
    return isAllowed ? returnTo : DEFAULT_REDIRECT;
  } catch {
    return DEFAULT_REDIRECT;
  }
}

export const maxDuration = 25;
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const returnTo = parseReturnTo(state);

  if (!code) {
    return new Response(null, {
      status: 302,
      headers: {
        "Set-Cookie": toCookieStringEmpty(),
        location: returnTo,
      },
    });
  }

  // Must match the redirect_uri used in the authorize step. Derived
  // from this request's host so app.th.gl and www.th.gl each
  // round-trip to themselves.
  const tokenResponse = await postToken(
    code,
    getRedirectUriFromRequest(request),
  );
  const tokenResult = (await tokenResponse.json()) as
    | PatreonToken
    | { error: string };
  if (!tokenResponse.ok) {
    return Response.json(tokenResult, {
      status: tokenResponse.status,
    });
  }

  const patreonToken = tokenResult as PatreonToken;
  const currentUserResponse = await getCurrentUser(patreonToken);
  const currentUserResult = (await currentUserResponse.json()) as
    | PatreonUser
    | { error: string };
  if (!currentUserResponse.ok) {
    return Response.json(currentUserResult, {
      status: currentUserResponse.status,
    });
  }
  const currentUser = currentUserResult as PatreonUser;

  const signed = sign(currentUser.data.id, process.env.JWT_SECRET!);
  // Best-effort: a token-store outage must not block sign-in — the
  // httpOnly cookie set below carries the token until the store heals.
  await setTokenBestEffort(
    "[www/patreon/redirect]",
    currentUser.data.id,
    patreonToken,
  );

  const responseHeaders = new Headers({ location: returnTo });
  responseHeaders.append("Set-Cookie", toCookieString(signed, 2678400));
  responseHeaders.append(
    "Set-Cookie",
    toTokenCookieString(signTokenCookie(currentUser.data.id, patreonToken)),
  );
  return new Response(null, {
    status: 302,
    headers: responseHeaders,
  });
}
