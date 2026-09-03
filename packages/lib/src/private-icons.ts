import type { PrivateNode } from "./settings";

/**
 * Render-time repair of the sprite coordinates baked into a custom ("My
 * Filters") node's icon.
 *
 * A custom node stores its icon as a rectangle into the game's icon sprite
 * sheet (`x`, `y`, `width`, `height`) captured when the user picked it. Every
 * regeneration of a game's icons can repack that sheet, so those stored
 * coordinates go stale and the marker renders the wrong icon — or a blank
 * slice of the sheet. Coordinates must therefore be resolved from the CURRENT
 * filter config at render time; only the icon's IDENTITY is safe to persist.
 *
 * Two lookup strategies, in order:
 *
 *  1. by `filterId` — the stable, language-independent identity the icon
 *     picker stamps onto every icon it saves.
 *  2. by the translated icon `name` — the legacy fallback for nodes saved
 *     before `filterId` existed. Locale-dependent, so it only works while the
 *     user stays in the language they saved in; strategy 1 supersedes it.
 *
 * History (this regressed once already, hence the shared helper): the
 * filterId strategy shipped in Feb 2026, was silently dropped by the WebGL2
 * map migration — a branch cut BEFORE the fix that landed after it — and the
 * Apr 2026 follow-up restored only the name fallback, guarded by
 * `!icon.filterId`. That left the behaviour inverted: legacy nodes were
 * repaired while every node saved since Feb (all of which carry a filterId)
 * kept stale coordinates forever. Both render paths now call this one helper
 * so they cannot drift apart again.
 *
 * Returns the SAME icon reference when nothing needs to change — callers run
 * this per node per render, and the WebGL renderer keys marker recreation on
 * icon identity.
 *
 * @param icon        the node's stored icon
 * @param byFilterId  current coords keyed by filter value id
 * @param byName      current coords (plus the value's id) keyed by TRANSLATED
 *                    icon name, for legacy nodes without a filterId
 */
export function resolvePrivateIcon(
  icon: PrivateNode["icon"],
  byFilterId: ReadonlyMap<string, IconCoords>,
  byName: ReadonlyMap<string, IconCoords & { filterId: string }>,
): PrivateNode["icon"] {
  if (!icon) return icon;

  if (icon.filterId) {
    const current = byFilterId.get(icon.filterId);
    // A miss is normal and must be left alone: the value may be gone from this
    // game's filters, or its icon may be a plain URL rather than a sprite (the
    // picker stores those with zeroed coords and they are absent from the map).
    if (!current) return icon;
    return sameCoords(icon, current) ? icon : { ...icon, ...current };
  }

  // Legacy node: no identity stored, so fall back to the name. Restricted to
  // app sprite icons (`/icons/...`) — a user-supplied icon URL has no entry in
  // the sheet and its stored size is its own, not a sprite rect.
  if (icon.name && icon.url?.includes("/icons/")) {
    const current = byName.get(icon.name);
    if (!current) return icon;
    // Adopt the id too, so this node resolves by strategy 1 from now on.
    return { ...icon, ...current };
  }

  return icon;
}

export interface IconCoords {
  x: number;
  y: number;
  width: number;
  height: number;
}

// `a` is the stored icon, whose coords are optional — an icon missing any of
// them differs by definition and gets the current rect written in.
function sameCoords(a: Partial<IconCoords>, b: IconCoords): boolean {
  return (
    a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height
  );
}

/**
 * Build both lookups from a game's filter config in ONE pass.
 *
 * `translate` maps a filter value id to its displayed icon name — the key
 * legacy nodes stored. Values whose icon is a plain string (a URL, not a
 * sprite rect) are skipped: they have no coordinates to repair.
 */
export function buildPrivateIconLookups(
  filters: readonly {
    values: readonly { id: string; icon: string | IconCoords }[];
  }[],
  translate: (id: string) => string,
): {
  byFilterId: Map<string, IconCoords>;
  byName: Map<string, IconCoords & { filterId: string }>;
} {
  const byFilterId = new Map<string, IconCoords>();
  const byName = new Map<string, IconCoords & { filterId: string }>();
  for (const filter of filters) {
    for (const value of filter.values) {
      if (typeof value.icon === "string") continue;
      const { x, y, width, height } = value.icon;
      byFilterId.set(value.id, { x, y, width, height });
      const name = translate(value.id);
      // First writer wins: two values can share a display name, and the
      // legacy lookup has no way to tell them apart anyway.
      if (!byName.has(name)) {
        byName.set(name, { x, y, width, height, filterId: value.id });
      }
    }
  }
  return { byFilterId, byName };
}
