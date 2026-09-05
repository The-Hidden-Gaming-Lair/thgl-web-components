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
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://127.0.0.1:3100";
    const versionRes = await fetch(`${baseUrl}/version.txt`, {
      headers: { host: "app.th.gl" },
    });
    if (versionRes.ok) {
      const version = await versionRes.text();
      return { version };
    }
  } catch {
    // Fall back in local development if host isn't reachable
  }

  return {
    version: "1.0.0",
  };
}
