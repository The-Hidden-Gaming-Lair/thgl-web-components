import type { Instrumentation } from "next";

/**
 * Give @repo/lib's resolveForgeUrl() access to the per-request Host so
 * server-side forge fetches can pick local vs prod data-forge in dev
 * proxy mode (see FORGE_DEV_PROXY in packages/lib/src/config.ts). The
 * resolver closure calls headers() lazily, inside the request scope of
 * whichever fetch invokes it. Outside a request scope (build-time
 * renders) headers() throws and resolveForgeUrl falls back to prod.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { setRequestHostResolver } = await import("@repo/lib");
  const { headers } = await import("next/headers");
  setRequestHostResolver(async () => (await headers()).get("host"));
  if (process.env.NODE_ENV === "production") {
    const { startPodHealth } = await import("@/lib/pod-health");
    startPodHealth();
    compactNetworkErrorLogs();
  }
}

const NETWORK_CODES = new Set([
  "ETIMEDOUT",
  "ECONNRESET",
  "ECONNREFUSED",
  "ENOTFOUND",
  "EAI_AGAIN",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_SOCKET",
  "UND_ERR_HEADERS_TIMEOUT",
  "UND_ERR_BODY_TIMEOUT",
]);

/** `fetch failed` and friends: the code of the underlying network failure, else null. */
function networkErrorCode(value: unknown): string | null {
  if (!(value instanceof Error)) return null;
  const cause = (value as { cause?: { code?: string; errors?: unknown[] } })
    .cause;
  const code =
    cause?.code ??
    (cause?.errors?.[0] as { code?: string } | undefined)?.code ??
    (value as { code?: string }).code;
  if (code && NETWORK_CODES.has(code)) return code;
  return value.message === "fetch failed" ? (code ?? "fetch failed") : null;
}

/**
 * A network blip makes every SSR render that awaits cdn.th.gl fail, and Next
 * prints each as a ~20-line stack (plus onRequestError's own copy). On
 * 2026-10-06 that was ~40k log lines in 85 min, drowning the [pod-health] lines
 * the incident tooling reads. One line per error keeps the signal: the route
 * comes from onRequestError, the per-host failure counts from [pod-health].
 */
function compactNetworkErrorLogs() {
  const original = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    const err = args.find((a) => networkErrorCode(a));
    if (err) {
      const e = err as Error & { digest?: string };
      original(
        `[net-error] ${e.name}: ${e.message} code=${networkErrorCode(e)} digest=${e.digest ?? "none"}`,
      );
      return;
    }
    original(...args);
  };
}

/**
 * Next.js error-tracing hook. Runs server-side on every error thrown
 * during a request (server component render, route handler, server
 * action). Logs the full error including stack and digest — production
 * builds normally strip the message + stack from the response error
 * to avoid leaking source paths, which makes diagnosing things like
 * `DYNAMIC_SERVER_USAGE` impossible. Here we deliberately keep the
 * raw stack server-side (it never reaches the client).
 *
 * Useful digests to look for:
 *   - DYNAMIC_SERVER_USAGE — a dynamic API (cookies/headers/searchParams)
 *     was touched in a code path Next thought was static. Fix is usually
 *     `export const dynamic = "force-dynamic"` on the offending route.
 *   - NEXT_NOT_FOUND — notFound() called normally, not actually an error.
 *   - NEXT_REDIRECT — redirect() called normally, not actually an error.
 *
 * Disable in dev: instrumentation already fires next dev's own pretty
 * formatter, no need to duplicate. Guard with NODE_ENV.
 */
/**
 * Suppressed error patterns. These come from clients holding old
 * bundle JS (cached WebView2 / stale browser tabs) that still
 * reference Server Action IDs from the previous Vercel deployment
 * — they POST to the new Bunny container with action IDs that no
 * longer exist. Spammy and unactionable: the new code is fine, the
 * cached clients will age out on their own.
 *
 * `Unexpected end of form` is the follow-up parsing error when Next
 * tries (and fails) to read the body of an action POST whose target
 * action no longer exists.
 */
const STALE_CLIENT_PATTERNS = [
  /Failed to find Server Action/i,
  /Unexpected end of form/i,
];

export const onRequestError: Instrumentation.onRequestError = async (
  err,
  request,
  context,
) => {
  const e = err as Error & { digest?: string; thglComponentStack?: string };
  // Don't log "errors" that are normal control-flow primitives.
  if (e.digest === "NEXT_NOT_FOUND" || e.digest === "NEXT_REDIRECT") return;
  if (STALE_CLIENT_PATTERNS.some((re) => re.test(e.message))) return;

  const host = request.headers["host"] ?? "?";
  console.error(
    `[onRequestError] digest=${e.digest ?? "none"} routePath=${context.routePath ?? "?"} routeType=${context.routeType ?? "?"} routerKind=${context.routerKind ?? "?"} method=${request.method} path=${request.path} host=${host}`,
  );
  console.error(`  message: ${e.message}`);
  if (e.stack && !networkErrorCode(e)) {
    console.error(`  stack:\n${e.stack}`);
  }
  // React's component stack for SSR render errors: prod stacks are React
  // internals only, this names the component (patches/next@16.3.3.patch copies
  // it onto the error; data-forge inbox #1116, "Element type is invalid").
  if (e.thglComponentStack) {
    console.error(`  componentStack:${e.thglComponentStack}`);
  }
};
