# Discover All per Filter Type — Design

**Date:** 2026-07-30
**Origin:** Discord suggestion thread "Discover all points of interest at once"
(`❕・suggestions-issues`, thread id 1532331625621356594): users who already
completed content in-game (or lost browser data) must currently right-click
hundreds of markers one by one to mark them discovered.

## Summary

Add a "Discover all" / "Undiscover all" bulk toggle for a whole filter type —
and for a whole filter group — placed in the gear-icon settings popover
(`FilterSettingsPopover`), directly under the existing `FilterTooltip`
Total/Discovered counts. Backed by a new single-update bulk store action.

## UI

Component: `packages/ui/src/components/(controls)/filter-settings-popover.tsx`
(shared by the interactive web map, the simple web map, and the overlay — one
change covers all surfaces).

- **Single-filter popover** (`!isGroup`): a full-width outline `Button` under
  the `FilterTooltip` block, styled like the existing "Enable all variants"
  button: action label on the left, `discovered/total` count in
  `text-muted-foreground tabular-nums` on the right.
- **Group popover** (`isGroup`): the same button, aggregating spawns across all
  `props.filterIds`.
- **Label / toggle semantics** (complete-then-toggle, matching the cluster
  tooltip's "Discover All"):
  - Not all spawns discovered → label **"Discover all"**; clicking adds the
    missing ones.
  - All spawns discovered → label **"Undiscover all"**; clicking removes them
    all.
- **Always visible, disabled at `0/0`** when there are no plotted spawns for
  the type(s) on the current map (live-only filters, or the filter's spawns
  live on another map). Originally hidden; changed 2026-07-31 because hiding
  made the feature look absent on spawn-sparse maps.
- **Approval dialog (superseding "no confirmation"; was briefly a sonner
  toast):** when the action would touch existing discovered state
  (`discoveredCount > 0` — both "Undiscover all" and a partial-merge
  "Discover all"), clicking opens an **AlertDialog** with the affected counts,
  a **Cancel** button, and the action button; nothing changes until confirmed.
  With zero discovered spots the action applies directly. Mounting the modal
  dialog inside the popover is safe: a radix modal layer disables
  outside-pointerdown dismissal for layers below it, so the popover stays open
  (and the component mounted) while the dialog is shown — the vanish-on-open
  bug is specific to auto-closing menus (DropdownMenu items), not popovers.
- **Elite Supporter gate (added same day):** the feature requires
  `perks.previewReleaseAccess`. The button stays visible for discoverability;
  locked accounts see a Lock icon, muted styling, a no-op click, and an
  "Elite supporter feature" tooltip (same pattern as the Combined live mode
  and the DragonSword save import). Dev mode (`NODE_ENV === "development"`)
  bypasses the gate for local testing.

## Node-id derivation (shared helper)

`FilterTooltip` already derives per-spawn discovery ids for its count:

```ts
spawn.isPrivate
  ? spawn.id!
  : `${spawn.id ?? node.type}@${spawn.p[0]}:${spawn.p[1]}`;
```

Extract this into a small exported helper (e.g. `getSpawnDiscoveryId(node,
spawn)` next to `FilterTooltip` or in `@repo/lib` coordinates helpers) and use
it in three places: the tooltip count, the popover button badge, and the bulk
action's id list. This guarantees the displayed count and the bulk action can
never disagree.

Spawn source: `useCoordinates().nodes` filtered by `node.type === filterId`
(single) or `filterIds.includes(node.type)` (group). Private nodes are included,
same as the tooltip count today.

## Store — bulk action

File: `packages/lib/src/settings.ts`. New action:

```ts
setDiscoveredNodesBulk: (nodeIds: string[], discovered: boolean) => void
```

- **Discover:** one update, one persist:
  `discoveredNodes: [...new Set([...state.discoveredNodes, ...nodeIds])]`.
- **Undiscover:** build a discovery lookup from the _target_ ids via the
  existing `buildDiscoveryLookup(nodeIds)` (coordinates.ts), then filter the
  existing `discoveredNodes` once, dropping every entry the lookup matches.
  This preserves the coordinate-tolerance / legacy-format matching that per-id
  removal (`setDiscoverNode`) already applies, in O(n) instead of O(n²).
  Apply the same filter to `autoDiscoveredNodes` to preserve the invariant
  that it is a subset of `discoveredNodes`.

Why not loop the existing `setDiscoverNode`: a filter type can have thousands
of spawns; per-id calls mean N array rewrites, N tolerant-match filter passes,
and N localStorage persists.

## Behavior notes

- Button state (label + badge) subscribes to `discoveredNodes` so it updates
  reactively, mirroring how `ClusterTooltip` computes `discoveredCount`.
- With "Hide discovered" enabled, discovering all makes the markers disappear
  immediately — expected; the popover badge still shows the state.
- Manual bulk discover does NOT touch `autoDiscoveredNodes` on the discover
  path (it's not a live-memory discovery); undiscover removes matches from
  both arrays.

## Testing

- Manual verification on the dev server (`*.localhost:3100`) on a game with a
  large filter (hundreds of spawns): discover all → count completes and
  markers show the discovered style; undiscover all → count returns to the
  manual-only baseline; partial pre-discovery → button completes the set.
- Verify group popover aggregates across all values in the group.
- Verify legacy-format discovered entries (coordinate drift) are removed by
  undiscover-all (covered by reusing `buildDiscoveryLookup`).

## Rejected alternatives

- **Loop `setDiscoverNode` per id** — O(n²) removal and N persists on large
  filters.
- **Action in the hover tooltip on filter values** — that tooltip
  (`collapsible-filter.tsx`) is non-interactive and label-only; the gear
  popover is where the rich `FilterTooltip` content already renders.
