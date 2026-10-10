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
 *
 * A THIRD, per-account scope lives in games.ts: `companion.inviteOnly` (e.g. Pax Dei) — never
 * advertised, opened only for accounts whose server-resolved `invites` include the game
 * (`isCompanionAccessible`, admin UI at www.th.gl/admin/invites, gate = InviteOnlyGate).
 */
export const PREVIEW_RELEASE_APPS = new Set<string>([
  // blood-of-dawnwalker: Elite-gated 2026-09-13 → opened to everyone 2026-09-15 (creature
  // spawns, Enemies/Characters filters and codex links landed); its companion went public
  // 2026-09-16 (`inDevelopment` dropped in games.ts).
  // sinking-city-2 + where-winds-meet: Elite-gated since 2026-09-13 → opened to everyone
  // 2026-09-28.
]);

/** Games whose IN-GAME COMPANION is Elite-only, but whose WEBSITE is public. */
export const PREVIEW_RELEASE_COMPANION_APPS = new Set<string>([
  // baldurs-gate-ee: Elite companion preview 2026-10-05 → opened to everyone 2026-10-10.
]);
// enshrouded fully opened 2026-09-13 — live chest/item tracking landed; app no
// longer Elite-gated.

/**
 * A FEATURE (not a whole game) in Elite Supporter preview: early access for
 * features that need real-user testing before everyone gets them.
 */
export type PreviewFeature = {
  /** Shown in upsell/lock texts: "<title> is a Preview for Elite Supporters". */
  title: string;
  /** ISO date the preview started. */
  since: string;
  /** ISO date it is planned to go public (a target, not a promise). */
  plannedPublic?: string;
  /** Inbox item that tracks the preview and its go-public date. */
  inboxItem?: number;
};

/**
 * THE registry of preview features. Gate a feature with `usePreviewFeature(id)`
 * (hooks.ts) — or `isPreviewFeatureEnabled(id, hasPreviewAccess)` outside
 * React — and mark it with `<PreviewBadge>` (packages/ui). To make a feature
 * public, DELETE its entry here: every call site then reports it as a normal
 * feature (enabled, no badge, no lock) — then clean up the call sites and add a
 * "now available to everyone" release-notes line.
 *
 * Live modes use ids `live-mode:<mode>` (e.g. `live-mode:combined`), read by
 * `PREVIEW_LIVE_MODES` in settings.ts. Filter values use `previewFilterId()`.
 */
export const PREVIEW_FEATURES: Readonly<Record<string, PreviewFeature>> = {
  // "widgets-only-overlay" (Widgets Only) was an Elite preview 2026-10-04..2026-10-10.
  // "discord-presence" (Discord Rich Presence) was an Elite preview
  // 2026-10-05..2026-10-10; it is public now.
  // "live-mode:combined" was an Elite preview; it is public now.
  // "filter:palworld:lucky_pal" (Lucky Pals) was an Elite preview 2026-10-06..2026-10-10.
  // Palia My Plot Items: everything placed on your own housing plot, live (THGLApp
  // re-types own-plot items "<class>_PLOT"). Three filters, one preview.
  "filter:palia:plot_item": {
    title: "My Plot Items",
    since: "2026-10-10",
    inboxItem: 154,
  },
  "filter:palia:plot_storage": {
    title: "My Plot Items",
    since: "2026-10-10",
    inboxItem: 154,
  },
  "filter:palia:plot_crafter": {
    title: "My Plot Items",
    since: "2026-10-10",
    inboxItem: 154,
  },
};

/**
 * Preview id of one filter value: `filter:<app>:<filterId>`. A live filter in
 * preview is shown with a Preview badge, can't be enabled without access, and
 * its types are not requested from the app (ActorTypeFilter).
 */
export function previewFilterId(appName: string, filterId: string): string {
  return `filter:${appName}:${filterId}`;
}

/**
 * The actor classes to request from the app: those whose filter value is
 * enabled, minus live filters in preview unless `previewAllowed`.
 */
export function selectRequestedActorTypes(
  appName: string,
  typesIdMap: Record<string, string>,
  enabledFilters: Iterable<string>,
  previewAllowed: boolean,
  registry: Readonly<Record<string, PreviewFeature>> = PREVIEW_FEATURES,
): string[] {
  const enabled = new Set(enabledFilters);
  return Object.keys(typesIdMap).filter(
    (key) =>
      enabled.has(typesIdMap[key]) &&
      (previewAllowed ||
        !isPreviewFeature(previewFilterId(appName, typesIdMap[key]), registry)),
  );
}

/** True while `id` is in preview (listed in PREVIEW_FEATURES). */
export function isPreviewFeature(
  id: string,
  registry: Readonly<Record<string, PreviewFeature>> = PREVIEW_FEATURES,
): boolean {
  return Object.prototype.hasOwnProperty.call(registry, id);
}

/**
 * Pure access check for non-React call sites: a preview feature needs the
 * Elite perk, everything else is open. React code uses `usePreviewFeature`,
 * which also handles SSR/hydration and the local-dev bypass.
 */
export function isPreviewFeatureEnabled(
  id: string,
  hasPreviewAccess: boolean,
  registry: Readonly<Record<string, PreviewFeature>> = PREVIEW_FEATURES,
): boolean {
  return hasPreviewAccess || !isPreviewFeature(id, registry);
}

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
