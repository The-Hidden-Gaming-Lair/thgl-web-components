/**
 * PRE-RELEASE ("preview") gating for games whose support is still being finalized. Two scopes:
 *
 *  • PREVIEW_RELEASE_APPS — gates BOTH the web map/db pages AND the in-game companion to Elite
 *    Supporters (perks.previewReleaseAccess). Non-Elite users get a "sign in / become Elite" page.
 *  • PREVIEW_RELEASE_COMPANION_APPS — gates ONLY the in-game companion (live mode / overlay); the
 *    web map/db pages are OPEN to everyone. Use when the website is ready but the companion isn't.
 *
 * The gate is CLIENT-SIDE on purpose: Elite status is resolved in the browser (userId cookie ->
 * /api/patreon fetch -> account store), so the server / middleware can't know it without replicating
 * that fetch on every request.
 *
 * To open a game to everyone, remove its id from both sets.
 */
export const PREVIEW_RELEASE_APPS = new Set<string>([]);

/** Games whose IN-GAME COMPANION is Elite-only, but whose WEBSITE is public. */
export const PREVIEW_RELEASE_COMPANION_APPS = new Set<string>(["enshrouded"]);

/**
 * True if the WEB pages (map/db) are Elite-gated. Companion-only preview games are NOT gated here —
 * their website is open.
 */
export function isPreviewReleaseApp(
  appName: string | undefined | null,
): boolean {
  return !!appName && PREVIEW_RELEASE_APPS.has(appName);
}

/**
 * True if the IN-GAME COMPANION (live mode / overlay) is Elite-gated — either a full preview game
 * or a companion-only preview game. Used by the THGLApp paywall (app.tsx `isPreviewLocked`).
 */
export function isCompanionPreviewApp(
  appName: string | undefined | null,
): boolean {
  return (
    !!appName &&
    (PREVIEW_RELEASE_APPS.has(appName) ||
      PREVIEW_RELEASE_COMPANION_APPS.has(appName))
  );
}
