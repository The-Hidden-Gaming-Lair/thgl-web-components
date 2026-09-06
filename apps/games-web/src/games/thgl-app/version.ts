import { type CurrentVersion } from "@repo/lib/thgl-app";

/**
 * Read the deployed thgl-app version. Called only from the (app)
 * layout during server render — no client-side invocation, so this
 * is a plain async function rather than a Server Action.
 *
 * The previous "use server" directive forced Next.js to register
 * an action ID for this export. Action IDs change across builds,
 * and on Bunny (no skew protection / sticky deployments) every
 * deploy invalidated all in-flight clients with "Failed to find
 * Server Action X" — observed after the app.th.gl Vercel→Bunny
 * cutover.
 */
export async function getCurrentVersion(): Promise<CurrentVersion> {
  // During SSR, server-side fetch to `*.localhost` can fail DNS resolution on Windows,
  // or return 404 if version.txt is missing in local dev. We target 127.0.0.1 directly
  // with an explicit Host header and guard with try/catch to prevent unhandled 500 crashes.
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://127.0.0.1:3100";
    const versionRes = await fetch(`${baseUrl}/version.txt`, {
      headers: { host: "app.th.gl" },
    });
    if (versionRes.ok) {
      const version = (await versionRes.text()).trim();
      return { version };
    }
  } catch {
    // Gracefully fall back to default version in local dev environments
  }

  return {
    version: "1.0.0",
  };
}
