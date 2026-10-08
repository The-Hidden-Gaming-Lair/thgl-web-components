import { type NextRequest } from "next/server";
import { CORS_HEADERS } from "@/games/thgl-web/lib/patreon";
import { normalizeEmail, requestLoginCode } from "@/lib/email-login";
import { clientIpFrom } from "@/lib/tebex";

// Email sign-in step 1: mail a one-time code (lib/email-login.ts). Global
// route (every host, CORS) so www, the game sites and the Companion App
// (app.th.gl -> www.th.gl) share it. The answer never reveals whether the
// email has an account: unknown emails get a code too (email sign-up).
export const maxDuration = 25;

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    email?: unknown;
    lang?: unknown;
  } | null;
  const email = normalizeEmail(body?.email);
  if (!email) {
    return Response.json(
      { error: "invalid-email" },
      { status: 400, headers: CORS_HEADERS },
    );
  }
  const ip = clientIpFrom(request.headers) ?? "unknown";
  try {
    const result = await requestLoginCode(
      email,
      ip,
      body?.lang === "zh" ? "zh" : "en",
    );
    if (result.status === "rate-limited") {
      return Response.json(
        { error: "rate-limited" },
        { status: 429, headers: CORS_HEADERS },
      );
    }
    if (result.status === "send-failed") {
      return Response.json(
        { error: "send-failed" },
        { status: 502, headers: CORS_HEADERS },
      );
    }
    return Response.json(
      {
        ok: true,
        // Dev only: lets the e2e flow finish without reading the inbox.
        ...(process.env.NODE_ENV === "development"
          ? { devCode: result.code }
          : {}),
      },
      { headers: CORS_HEADERS },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[auth/email/request] ${msg}`);
    return Response.json(
      { error: "unavailable" },
      { status: 503, headers: CORS_HEADERS },
    );
  }
}

export function OPTIONS() {
  return Response.json({}, { headers: CORS_HEADERS });
}
