/**
 * Games that are PRE-RELEASE ("preview"): their in-game companion app AND their
 * web map/db pages are gated to Elite Supporters (perks.previewReleaseAccess)
 * while support is being finalized. Non-Elite users get a "sign in / become an
 * Elite Supporter" page instead of the content.
 *
 * The gate is CLIENT-SIDE on purpose: Elite status is resolved in the browser
 * (userId cookie -> /api/patreon fetch -> account store), so the server /
 * middleware can't know it without replicating that fetch on every request.
 *
 * To open a game to everyone, remove its id from this set.
 */
export const PREVIEW_RELEASE_APPS = new Set<string>([]);

/** True if the given app/game id is pre-release (Elite-only) right now. */
export function isPreviewReleaseApp(
  appName: string | undefined | null,
): boolean {
  return !!appName && PREVIEW_RELEASE_APPS.has(appName);
}
