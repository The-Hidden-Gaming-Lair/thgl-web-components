import Cookies from "js-cookie";

/**
 * Client-side restore of the `userId` cookie from a verified account secret.
 *
 * The server normally mints this cookie (login routes / api/patreon refresh),
 * but when the WebView2 cookie store churns (DPAPI cross-account wipe in
 * THGLApp) only localStorage survives — after re-verifying the stored secret
 * via /api/patreon/overwolf, writing it back here makes server-side reads
 * (getAccount on the controller page, /api/patreon) work again on the next
 * load. Both cookie readers accept legacy AND enriched secrets via
 * decodeUserSecret, so the enriched value is safe to store.
 *
 * Attributes mirror the server's toCookieString: 31 days, SameSite=Lax, and
 * the cross-subdomain th.gl scope in prod (host-scoped on dev hosts, matching
 * the dev sign-in flow).
 */
export function restoreUserIdCookie(secret: string) {
  Cookies.set("userId", secret, {
    expires: 31,
    path: "/",
    sameSite: "lax",
    ...(window.location.hostname.endsWith("th.gl") ? { domain: "th.gl" } : {}),
  });
}
