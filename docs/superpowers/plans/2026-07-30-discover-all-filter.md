# Discover All per Filter Type — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A "Discover all" / "Undiscover all" bulk toggle per filter type and per filter group, in the gear-icon filter settings popover.

**Architecture:** Pure helpers in `packages/lib/src/coordinates.ts` (spawn→discovery-id derivation, tolerant bulk removal) + one bulk store action in `packages/lib/src/settings.ts` + a `DiscoverAllButton` component wired into both variants of `FilterSettingsPopover` in `packages/ui`. Spec: `docs/superpowers/specs/2026-07-30-discover-all-filter-design.md`.

**Tech Stack:** TypeScript, Zustand (persisted settings store), React, Radix UI, jest/ts-jest (`bun run test (in packages\lib)`).

**Repo conventions (OVERRIDE the default skill flow):**

- **NO commits.** The user commits manually; finish with a clean working-tree change set and STOP.
- **NO builds.** Dev servers/watchers are always running and own `packages/lib/dist`. Verify types with `bun run typecheck` (`tsc --noEmit`) in the package dir only.
- Manual verification happens on the running dev server (`<game>.localhost:3100`) via browser MCP.

---

### Task 1: Pure helpers in coordinates.ts (TDD)

**Files:**

- Modify: `D:\dev\the-hidden-gaming-lair\packages\lib\src\coordinates.ts` (append after `checkNodeDiscovered`)
- Test (create): `D:\dev\the-hidden-gaming-lair\packages\lib\src\coordinates.test.ts`

Two pure functions:

- `getSpawnDiscoveryId(nodeType, spawn)` — the exact id derivation `FilterTooltip` uses today (`filter-tooltip.tsx:20-22`), extracted so the tooltip count, the button badge, and the bulk action can never disagree.
- `removeDiscoveredMatches(discoveredNodes, targetIds)` — one-pass tolerant bulk removal. Reuses `buildDiscoveryLookup`/`checkNodeDiscovered` (lookup built from the TARGET ids, existing entries checked against it) **plus** an explicit base-id set: a stored bare `iron_ore` entry marks every iron_ore discovered, and `checkNodeDiscovered("iron_ore", lookupFromTargets)` would NOT match it (the target set only contains `type@x:y` ids) — the per-id removal path handles this at `settings.ts:1130`, so the bulk path must too.

- [ ] **Step 1: Write the failing test**

Create `packages/lib/src/coordinates.test.ts`:

```ts
import { getSpawnDiscoveryId, removeDiscoveredMatches } from "./coordinates";

describe("getSpawnDiscoveryId", () => {
  it("uses spawn.id for private spawns", () => {
    expect(
      getSpawnDiscoveryId("iron_ore", {
        id: "my_private_node",
        isPrivate: true,
        p: [1, 2],
      }),
    ).toBe("my_private_node");
  });

  it("builds id@x:y from spawn.id and position", () => {
    expect(
      getSpawnDiscoveryId("iron_ore", { id: "iron_ore_1", p: [10.5, -3] }),
    ).toBe("iron_ore_1@10.5:-3");
  });

  it("falls back to the node type when spawn has no id", () => {
    expect(getSpawnDiscoveryId("iron_ore", { p: [10.5, -3] })).toBe(
      "iron_ore@10.5:-3",
    );
  });
});

describe("removeDiscoveredMatches", () => {
  it("removes exact matches and keeps everything else", () => {
    expect(
      removeDiscoveredMatches(
        ["iron_ore@1:2", "chest@100:200", "iron_ore@50:60"],
        ["iron_ore@1:2", "iron_ore@50:60"],
      ),
    ).toEqual(["chest@100:200"]);
  });

  it("removes bare base-id entries for targeted types", () => {
    // A stored bare "iron_ore" marks ALL iron_ore discovered; undiscover-all
    // for the type must drop it (mirrors settings.ts per-id removal).
    expect(
      removeDiscoveredMatches(["iron_ore", "chest@1:2"], ["iron_ore@5:6"]),
    ).toEqual(["chest@1:2"]);
  });

  it("removes coordinate matches within tolerance (legacy/precision drift)", () => {
    // Stored at live-read precision, targeted at full extracted precision.
    expect(
      removeDiscoveredMatches(["iron_ore@10.50:20.00"], ["iron_ore@10.5:20"]),
    ).toEqual([]);
    // Within COORD_MATCH_TOLERANCE (1 unit).
    expect(
      removeDiscoveredMatches(["iron_ore@10.9:20"], ["iron_ore@10.5:20"]),
    ).toEqual([]);
  });

  it("keeps entries of the same type outside tolerance", () => {
    expect(
      removeDiscoveredMatches(["iron_ore@500:500"], ["iron_ore@10.5:20"]),
    ).toEqual(["iron_ore@500:500"]);
  });

  it("returns the same array reference when nothing matches", () => {
    const existing = ["chest@1:2"];
    expect(removeDiscoveredMatches(existing, ["iron_ore@5:6"])).toBe(existing);
  });
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `bun run test (in packages\lib)`
Expected: FAIL — `getSpawnDiscoveryId` / `removeDiscoveredMatches` are not exported.

- [ ] **Step 3: Implement in coordinates.ts**

Append after `checkNodeDiscovered` (structural param type on purpose — the UI's spawn type is `Omit<Spawn, "type" | "id"> & { id?: string }`, keep this decoupled):

```ts
/**
 * Discovery id for one spawn of a filter-type node — the SAME derivation the
 * FilterTooltip discovered-count uses, extracted so counts and bulk
 * discover/undiscover actions can never disagree.
 */
export const getSpawnDiscoveryId = (
  nodeType: string,
  spawn: {
    id?: string;
    isPrivate?: boolean;
    p: [number, number] | [number, number, number];
  },
): string =>
  spawn.isPrivate && spawn.id
    ? spawn.id
    : `${spawn.id ?? nodeType}@${spawn.p[0]}:${spawn.p[1]}`;

/**
 * One-pass bulk removal for "Undiscover all": drops every discovered entry that
 * addresses one of the target ids — exact, legacy-format, or within
 * {@link COORD_MATCH_TOLERANCE} — plus bare base-id entries of the targeted
 * types (a stored bare `iron_ore` marks all iron_ore discovered). Mirrors the
 * per-id removal in settings.ts setDiscoverNode, but O(existing + targets)
 * instead of one filter pass per target. Returns the input array unchanged if
 * nothing matches.
 */
export const removeDiscoveredMatches = (
  discoveredNodes: string[],
  targetIds: string[],
): string[] => {
  const lookup = buildDiscoveryLookup(targetIds);
  const baseIds = new Set<string>();
  for (const id of targetIds) {
    const atIndex = id.indexOf("@");
    if (atIndex !== -1) baseIds.add(id.slice(0, atIndex));
  }
  const kept = discoveredNodes.filter(
    (id) => !baseIds.has(id) && !checkNodeDiscovered(id, lookup),
  );
  return kept.length === discoveredNodes.length ? discoveredNodes : kept;
};
```

- [ ] **Step 4: Run the test, verify it passes**

Run: `bun run test (in packages\lib)`
Expected: PASS (all 9 assertions).

- [ ] **Step 5: Typecheck**

Run: `bun run typecheck (in packages\lib)`
Expected: clean. (No commit — repo convention.)

---

### Task 2: Bulk store action `setDiscoveredNodesBulk`

**Files:**

- Modify: `D:\dev\the-hidden-gaming-lair\packages\lib\src\settings.ts`
  - Interface: after the `setDiscoveredNodes` declaration (~line 437)
  - Implementation: after the `setDiscoveredNodes` action (~line 1156)

`removeDiscoveredMatches` is already imported-adjacent: settings.ts imports `buildDiscoveryLookup`, `checkNodeDiscovered`, `coordsMatch` from `./coordinates` — extend that import.

- [ ] **Step 1: Add to the actions interface** (next to `setDiscoveredNodes: (discoveredNodes: string[]) => void;`):

```ts
// Bulk discover/undiscover (the per-filter "Discover all" button). One store
// update + persist regardless of count; undiscover uses tolerant matching so
// legacy-format entries are removed too, and prunes autoDiscoveredNodes to
// keep it a subset of discoveredNodes.
setDiscoveredNodesBulk: (nodeIds: string[], discovered: boolean) => void;
```

- [ ] **Step 2: Add the implementation** (after the `setDiscoveredNodes` action, mirroring `markAutoDiscovered`'s shape):

```ts
setDiscoveredNodesBulk: (nodeIds: string[], discovered: boolean) => {
  const state = get();
  if (discovered) {
    updateSettings({
      discoveredNodes: [...new Set([...state.discoveredNodes, ...nodeIds])],
    });
    return;
  }
  updateSettings({
    discoveredNodes: removeDiscoveredMatches(state.discoveredNodes, nodeIds),
    autoDiscoveredNodes: removeDiscoveredMatches(
      state.autoDiscoveredNodes,
      nodeIds,
    ),
  });
},
```

Add `removeDiscoveredMatches` to the existing `./coordinates` import.

- [ ] **Step 3: Typecheck**

Run: `bun run typecheck (in packages\lib)`
Expected: clean.

---

### Task 3: Refactor FilterTooltip to the shared helper

**Files:**

- Modify: `D:\dev\the-hidden-gaming-lair\packages\ui\src\components\(controls)\filter-tooltip.tsx:17-27`

- [ ] **Step 1: Replace the inline id derivation**

```ts
import { getSpawnDiscoveryId, useSettingsStore } from "@repo/lib";
```

and in the `discoveredSpawns` memo:

```ts
const discoveredSpawns = useMemo(
  () =>
    filterNode?.spawns.filter((spawn) =>
      isDiscoveredNode(getSpawnDiscoveryId(filterNode.type, spawn)),
    ) || [],
  [discoveredNodes, filterNode],
);
```

(Behavior note: the old inline code used `spawn.id!` for private spawns even if undefined; `getSpawnDiscoveryId` falls back to `type@x:y` in that broken corner — strictly safer, no real-world change since private spawns always have ids.)

- [ ] **Step 2: Typecheck**

Run: `bun run typecheck (in packages\ui)`
Expected: clean.

---

### Task 4: `DiscoverAllButton` + wiring into both popover variants

**Files:**

- Create: `D:\dev\the-hidden-gaming-lair\packages\ui\src\components\(controls)\discover-all-button.tsx`
- Modify: `D:\dev\the-hidden-gaming-lair\packages\ui\src\components\(controls)\filter-settings-popover.tsx`

- [ ] **Step 1: Create the component**

One component serves both popover variants via `filterIds` (single = `[filterId]`). Styling copies the existing "Enable all variants" button (`filter-settings-popover.tsx:307-323`); popover UI strings are hardcoded English like the rest of the popover.

```tsx
"use client";

import { useMemo } from "react";
import { getSpawnDiscoveryId, useSettingsStore } from "@repo/lib";
import { useCoordinates } from "../(providers)";
import { Button } from "../ui/button";
import { Label } from "../ui/label";

/**
 * Bulk discover/undiscover for every plotted spawn of the given filter
 * type(s). Complete-then-toggle: while any spawn is undiscovered the button
 * completes the set; once all are discovered it clears them (same semantics
 * as the cluster tooltip's "Discover All"). Renders nothing when the types
 * have no plotted spawns (e.g. no_map_markers live-only filters).
 */
export function DiscoverAllButton({ filterIds }: { filterIds: string[] }) {
  const { nodes } = useCoordinates();
  // Subscribe so label + badge update reactively (mirrors ClusterTooltip).
  const discoveredNodes = useSettingsStore((s) => s.discoveredNodes);
  const isDiscoveredNode = useSettingsStore((s) => s.isDiscoveredNode);
  const setDiscoveredNodesBulk = useSettingsStore(
    (s) => s.setDiscoveredNodesBulk,
  );

  const spawnIds = useMemo(
    () =>
      nodes
        .filter((node) => filterIds.includes(node.type))
        .flatMap((node) =>
          node.spawns.map((spawn) => getSpawnDiscoveryId(node.type, spawn)),
        ),
    [nodes, filterIds],
  );

  const discoveredCount = useMemo(
    () => spawnIds.filter((id) => isDiscoveredNode(id)).length,
    [spawnIds, discoveredNodes, isDiscoveredNode],
  );

  if (spawnIds.length === 0) return null;

  const allDiscovered = discoveredCount === spawnIds.length;

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">Discovered</Label>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full justify-between text-xs h-7"
        onClick={() => setDiscoveredNodesBulk(spawnIds, !allDiscovered)}
      >
        <span>{allDiscovered ? "Undiscover all" : "Discover all"}</span>
        <span className="text-muted-foreground tabular-nums">
          {discoveredCount}/{spawnIds.length}
        </span>
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Wire into `FilterSettingsPopover`**

Import: `import { DiscoverAllButton } from "./discover-all-button";`

Single-filter variant — inside the existing `{!isGroup && (...)}` block, between `<FilterTooltip id={props.filterId} />` and `<Separator />`:

```tsx
<FilterTooltip id={props.filterId} />
<DiscoverAllButton filterIds={[props.filterId]} />
<Separator />
```

Group variant — directly after the group label div:

```tsx
{
  isGroup && (
    <>
      <div className="font-medium text-sm truncate">{filterLabel}</div>
      <DiscoverAllButton filterIds={props.filterIds} />
    </>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `bun run typecheck (in packages\ui)`
Expected: clean.

---

### Task 5: Manual verification on the dev server

No build, no commit. Dev server is already running; use browser MCP against a game with a large filter (e.g. `palworld.localhost:3100` or `palia.localhost:3100`).

- [ ] **Step 1:** Open a map, open a filter value's gear popover → button shows `n/total`, label "Discover all" (or "Undiscover all" if already complete).
- [ ] **Step 2:** Click "Discover all" → badge jumps to `total/total`, label flips to "Undiscover all"; markers on the map switch to the discovered style (or vanish if "Hide discovered" is on). Verify the `FilterTooltip` "Discovered" count in the same popover agrees.
- [ ] **Step 3:** Click "Undiscover all" → badge returns to the pre-existing manually-discovered baseline of OTHER types untouched; this type back to 0.
- [ ] **Step 4:** Pre-discover 1-2 markers manually via marker tooltip, reopen popover → partial count; "Discover all" completes the set.
- [ ] **Step 5:** Open a GROUP gear popover → aggregated count across all values; discover/undiscover all works.
- [ ] **Step 6:** Reload the page → state persisted (localStorage `thgl-settings-<game>`).
- [ ] **Step 7:** Confirm a filter with no plotted spawns (a `no_map_markers` live-only value, e.g. via a filter marked `liveOnly`) shows NO button.

---

## Self-review

- **Spec coverage:** UI single+group ✔ (Task 4), complete-then-toggle ✔ (Task 4), hidden at 0 spawns ✔ (Task 4 early return), shared id helper ✔ (Tasks 1+3), bulk store action with tolerant undiscover + autoDiscoveredNodes pruning ✔ (Tasks 1+2), no confirmation/toast ✔, testing ✔ (Tasks 1+5).
- **Placeholders:** none — all steps carry full code/commands.
- **Type consistency:** `getSpawnDiscoveryId(nodeType, spawn)` and `removeDiscoveredMatches(discoveredNodes, targetIds)` used with identical signatures in Tasks 1-4; `setDiscoveredNodesBulk(nodeIds, discovered)` matches interface and call site.
