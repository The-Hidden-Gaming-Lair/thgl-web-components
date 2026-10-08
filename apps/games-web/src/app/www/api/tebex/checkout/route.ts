import { type NextRequest } from "next/server";
import { TEBEX_ENABLED } from "@repo/lib";
import { sign } from "jsonwebtoken";
import { decodeUserSecret } from "@/lib/token-cookie";
import { toCookieString } from "@/games/thgl-web/lib/patreon";
import {
  clientIpFrom,
  createTebexCheckout,
  isTebexTierKey,
  isTebexUserId,
  newTebexUserId,
  resolveTebexAccount,
} from "@/lib/tebex";

// Plain <form method="post"> target on /support-me/tebex: resolves (or creates) the
// buyer's `tebex:` account, creates a Tebex basket tagged with it and 303s to
// the hosted checkout. Perks arrive via the webhook, not via this redirect.
export const maxDuration = 25;

function originOf(request: NextRequest): string {
  const host = request.headers.get("host") ?? "www.th.gl";
  const protocol = host.includes("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

export async function POST(request: NextRequest) {
  const origin = originOf(request);
  const back = (status: string) =>
    Response.redirect(`${origin}/support-me/tebex?tebex=${status}`, 303);

  // Off until Tebex approves the store (TEBEX_ENABLED, @repo/lib config).
  if (!TEBEX_ENABLED) return back("unavailable");

  const form = await request.formData().catch(() => null);
  const tier = form?.get("tier");
  if (!isTebexTierKey(tier)) return back("invalid-tier");

  // Reuse an existing Tebex account; a Patreon session must not be replaced
  // by a fresh anonymous id (the user would silently lose their Patreon
  // login), so those are sent back with a hint instead.
  let userId: string | null = null;
  const cookie = request.cookies.get("userId")?.value;
  if (cookie) {
    const decoded = decodeUserSecret(cookie);
    if (decoded && isTebexUserId(decoded.userId)) {
      userId = decoded.userId;
    } else if (decoded) {
      return back("patreon-session");
    }
  }
  const isNewAccount = !userId;
  // The Free package only creates the account - skip it when the account
  // already holds an entitlement (a cancelled paid checkout leaves a cookie
  // but no entitlement, so that one still gets the Free checkout).
  if (!isNewAccount && tier === "free") {
    const existing = await resolveTebexAccount(userId!);
    if (existing?.entitlements.length) {
      return Response.redirect(`${origin}/support-me/account`, 303);
    }
  }
  userId ??= newTebexUserId();

  // Dev has no CDN in front (x-forwarded-for is loopback, which Tebex can't
  // place); TEBEX_DEV_IP stands in, e.g. a mainland-China IP to see the
  // China price.
  const devIp =
    process.env.NODE_ENV !== "production" ? process.env.TEBEX_DEV_IP : null;
  const ip = devIp || clientIpFrom(request.headers);
  if (!ip) {
    console.error("[tebex/checkout] no client ip header");
    return back("error");
  }

  let checkoutUrl: string;
  try {
    checkoutUrl = await createTebexCheckout({
      userId,
      tier,
      ip,
      // `tier` tells the account page what to wait for (a Free account
      // upgrading to Pro already has an entitlement).
      completeUrl: `${origin}/support-me/account?tebex=complete&tier=${tier}`,
      cancelUrl: `${origin}/support-me/tebex?tebex=cancel`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[tebex/checkout] ${userId}: ${msg}`);
    return back("error");
  }

  const headers = new Headers({ location: checkoutUrl });
  if (isNewAccount) {
    // Same credential format as a Patreon login (JWT of the plain id), so
    // every existing reader/heal path accepts it.
    headers.append(
      "Set-Cookie",
      toCookieString(sign(userId, process.env.JWT_SECRET!), 2678400),
    );
  }
  return new Response(null, { status: 303, headers });
}
