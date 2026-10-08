import { type NextRequest } from "next/server";
import { sign } from "jsonwebtoken";
import { CORS_HEADERS, toCookieString } from "@/games/thgl-web/lib/patreon";
import { normalizeEmail, verifyLoginCode } from "@/lib/email-login";

// Email sign-in step 2: check the one-time code and sign in. Returns the
// account secret (same JWT-of-plain-id as a Patreon login / Account Key);
// the client stores it like a pasted key (useUnlockWithSecret), which also
// writes the cookie on its own host. Same-origin callers get the cookie
// straight away.
export const maxDuration = 25;

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    email?: unknown;
    code?: unknown;
  } | null;
  const email = normalizeEmail(body?.email);
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  if (!email || !/^\d{6}$/.test(code)) {
    return Response.json(
      { error: "invalid" },
      { status: 400, headers: CORS_HEADERS },
    );
  }
  try {
    const result = await verifyLoginCode(email, code);
    if (!result.ok) {
      return Response.json(
        { error: result.reason },
        { status: 401, headers: CORS_HEADERS },
      );
    }
    const secret = sign(result.userId, process.env.JWT_SECRET!);
    const headers = new Headers(CORS_HEADERS);
    headers.append("Set-Cookie", toCookieString(secret, 2678400));
    console.log(
      `[auth/email/verify] ${result.userId} signed in${result.merged ? ` (merged ${result.merged})` : ""}`,
    );
    return Response.json({ secret }, { headers });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[auth/email/verify] ${msg}`);
    return Response.json(
      { error: "unavailable" },
      { status: 503, headers: CORS_HEADERS },
    );
  }
}

export function OPTIONS() {
  return Response.json({}, { headers: CORS_HEADERS });
}
