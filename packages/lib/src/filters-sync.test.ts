import {
  adoptLocalFilters,
  dedupeMyFilters,
  mergeHydratedFilters,
  pendingIdsWithSyncGrace,
  unionMyFiltersOnRehydrate,
} from "./filters-sync";
import type { DrawingsAndNodes } from "./settings";

const withNodes = (
  over: Partial<DrawingsAndNodes> & { name: string },
): DrawingsAndNodes => ({
  nodes: [
    {
      id: "n1",
      icon: null,
      radius: 1,
      p: [0, 0],
      mapName: "Map",
    },
  ],
  ...over,
});

describe("mergeHydratedFilters", () => {
  it("drops a synced filter that the server no longer has (deleted on another device)", () => {
    // The resurrection bug: this filter was confirmed on the server before
    // (synced:true) but is now absent → it was deleted elsewhere. It must NOT
    // survive locally, or the next scheduleFilterSync would re-upsert it.
    const local = [withNodes({ name: "my_1_keep", id: "A", synced: true })];
    const { merged, resyncIds } = mergeHydratedFilters(local, []);
    expect(merged).toHaveLength(0);
    expect(resyncIds).toHaveLength(0);
  });

  it("keeps an id-bearing filter that was never confirmed on the server (first PUT never landed)", () => {
    // The data-loss guard: id assigned locally by addMyFilter but the upload
    // hasn't succeeded (synced falsy). Absent from server ≠ deleted here.
    const local = [
      withNodes({ name: "my_1_new", id: "B" /* synced undefined */ }),
    ];
    const { merged } = mergeHydratedFilters(local, []);
    expect(merged).toHaveLength(1);
    expect(merged[0].id).toBe("B");
  });

  it("keeps anonymous (no id) local filters untouched", () => {
    const local = [withNodes({ name: "my_1_anon" })];
    const { merged } = mergeHydratedFilters(local, []);
    expect(merged).toHaveLength(1);
    expect(merged[0].name).toBe("my_1_anon");
  });

  it("replaces a local copy with the server's view and marks it synced", () => {
    const local = [withNodes({ name: "my_1_old", id: "C", synced: true })];
    const server = [withNodes({ name: "my_1_renamed", id: "C" })];
    const { merged } = mergeHydratedFilters(local, server);
    expect(merged).toHaveLength(1);
    expect(merged[0].name).toBe("my_1_renamed");
    expect(merged[0].synced).toBe(true);
  });

  it("keeps local + schedules a resync when the server copy is empty but local has data", () => {
    const local = [withNodes({ name: "my_1_data", id: "D", synced: true })];
    const server: DrawingsAndNodes[] = [{ name: "my_1_data", id: "D" }]; // empty payload
    const { merged, resyncIds } = mergeHydratedFilters(local, server);
    expect(merged).toHaveLength(1);
    expect(merged[0].nodes).toHaveLength(1);
    expect(resyncIds).toEqual(["D"]);
  });

  it("keeps a pending local copy instead of clobbering it with the stale server copy", () => {
    // In-flight edit: local has fresh data, server still has the old copy.
    // A focus re-hydrate must not overwrite the edit that's still uploading.
    const local = [
      withNodes({
        name: "my_1_edit",
        id: "F",
        synced: true,
        drawing: { id: "d" },
      }),
    ];
    const server = [withNodes({ name: "my_1_edit", id: "F" })]; // pre-edit
    const { merged } = mergeHydratedFilters(local, server, new Set(["F"]));
    expect(merged).toHaveLength(1);
    expect(merged[0].drawing).toEqual({ id: "d" }); // local edit preserved
  });

  it("does not drop a pending (mid-upload) filter even if absent from the server", () => {
    // Brand-new filter whose first PUT is still in flight; server doesn't have
    // it yet. Must survive regardless of the synced flag.
    const local = [withNodes({ name: "my_1_new", id: "G", synced: true })];
    const { merged } = mergeHydratedFilters(local, [], new Set(["G"]));
    expect(merged).toHaveLength(1);
    expect(merged[0].id).toBe("G");
  });

  it("appends server-only filters (created on another device) as synced", () => {
    const local: DrawingsAndNodes[] = [];
    const server = [withNodes({ name: "my_1_remote", id: "E" })];
    const { merged } = mergeHydratedFilters(local, server);
    expect(merged).toHaveLength(1);
    expect(merged[0].id).toBe("E");
    expect(merged[0].synced).toBe(true);
  });

  it("does not resurrect a tombstoned server filter (hydrate racing a purge)", () => {
    // The purge-then-they-come-back bug: a hydrate whose fetch started before
    // the purge still contains the deleted rows. The tombstone predicate must
    // keep them out of the merged list.
    const local: DrawingsAndNodes[] = [];
    const server = [
      withNodes({ name: "my_1_deleted", id: "H" }),
      withNodes({ name: "my_1_alive", id: "I" }),
    ];
    const { merged } = mergeHydratedFilters(
      local,
      server,
      new Set(),
      (f) => f.id === "H",
    );
    expect(merged).toHaveLength(1);
    expect(merged[0].id).toBe("I");
  });

  it("drops a tombstoned local filter even when it has a pending PUT", () => {
    // Delete intent is newer than any in-flight edit.
    const local = [withNodes({ name: "my_1_deleted", id: "J", synced: true })];
    const { merged } = mergeHydratedFilters(
      local,
      [withNodes({ name: "my_1_deleted", id: "J" })],
      new Set(["J"]),
      (f) => f.id === "J",
    );
    expect(merged).toHaveLength(0);
  });

  it("drops a tombstoned anonymous (no id) local filter by name", () => {
    // Local-only filters (created signed-out) resurrected by a stale window
    // are matched by their name tombstone.
    const local = [withNodes({ name: "my_1_Campsite" })];
    const { merged } = mergeHydratedFilters(
      local,
      [],
      new Set(),
      (f) => f.name === "my_1_Campsite",
    );
    expect(merged).toHaveLength(0);
  });

  it("reports deleted-elsewhere drops in droppedIds (the cross-window drop broadcast)", () => {
    // The caller records these as hydrate-drop echoes so sibling windows don't
    // union the filter right back in (remote deletes have no local tombstone).
    const local = [
      withNodes({ name: "my_1_gone", id: "A", synced: true }),
      withNodes({ name: "my_1_stays", id: "B", synced: true }),
    ];
    const server = [withNodes({ name: "my_1_stays", id: "B" })];
    const { droppedIds } = mergeHydratedFilters(local, server);
    expect(droppedIds).toEqual(["A"]);
  });

  it("does not report pending/grace-protected or tombstoned filters as dropped", () => {
    const local = [
      withNodes({ name: "my_1_pending", id: "P", synced: true }),
      withNodes({ name: "my_1_deleted_here", id: "T", synced: true }),
    ];
    const { droppedIds } = mergeHydratedFilters(
      local,
      [],
      new Set(["P"]), // pending → kept, not a delete
      (f) => f.id === "T", // tombstoned → dropped by LOCAL intent, no echo needed
    );
    expect(droppedIds).toEqual([]);
  });
});

describe("unionMyFiltersOnRehydrate", () => {
  it("keeps an in-memory local add the persisted (stale) blob doesn't know about", () => {
    // billy's bug: a second webview holding a pre-add snapshot persists its
    // whole settings blob (without the new filter) on any settings change. The
    // storage event rehydrates THIS webview from that stale blob. Without the
    // union the just-added filter is clobbered out of the live view (and, on
    // the next persist, off disk). It must survive.
    const inMemory = [
      withNodes({ name: "my_1_Lodestone" }),
      withNodes({ name: "my_2_Nodestone" }), // just added here
    ];
    const persisted = [withNodes({ name: "my_1_Lodestone" })]; // stale writer
    const union = unionMyFiltersOnRehydrate(inMemory, persisted);
    expect(union.map((f) => f.name).sort()).toEqual([
      "my_1_Lodestone",
      "my_2_Nodestone",
    ]);
  });

  it("does NOT re-add an in-memory filter that was deleted elsewhere (tombstoned)", () => {
    // A delete in another webview persists without the filter AND records a
    // tombstone. This webview still has it in memory; the union must not
    // resurrect it — mirror of the deletion-monotonicity guarantee.
    const inMemory = [withNodes({ name: "my_1_deleted", id: "X" })];
    const persisted: DrawingsAndNodes[] = [];
    const union = unionMyFiltersOnRehydrate(
      inMemory,
      persisted,
      (f) => f.id === "X",
    );
    expect(union).toHaveLength(0);
  });

  it("lets a persisted edit win over the in-memory copy of the same filter (last-writer-wins)", () => {
    // Another surface edited the filter and just wrote it. The persisted copy
    // is newest; the stale in-memory copy must not shadow it.
    const inMemory = [
      withNodes({ name: "my_1_old", id: "E", drawing: { id: "old" } }),
    ];
    const persisted = [
      withNodes({ name: "my_1_new", id: "E", drawing: { id: "new" } }),
    ];
    const union = unionMyFiltersOnRehydrate(inMemory, persisted);
    expect(union).toHaveLength(1);
    expect(union[0].name).toBe("my_1_new");
    expect(union[0].drawing).toEqual({ id: "new" });
  });

  it("matches identity by id — the persisted copy wins", () => {
    const inMemory = [withNodes({ name: "renamed_locally", id: "A" })];
    const persisted = [withNodes({ name: "canonical", id: "A" })];
    const union = unionMyFiltersOnRehydrate(inMemory, persisted);
    expect(union).toHaveLength(1);
    expect(union[0].name).toBe("canonical");
  });

  it("collapses a name match instead of minting twins (id-vs-name identity split)", () => {
    // The first union version keyed id-ELSE-name, so the same logical filter —
    // in memory as the stale pre-id snapshot, persisted with its freshly
    // assigned server id — had different keys and BOTH were kept. Users ended
    // up with duplicate twins ("one is broken / one doesn't show"). A name
    // match now means "known": the persisted copy is authoritative.
    const inMemory = [withNodes({ name: "my_1_Campsite" })]; // pre-id snapshot
    const persisted = [withNodes({ name: "my_1_Campsite", id: "S" })];
    const union = unionMyFiltersOnRehydrate(inMemory, persisted);
    expect(union).toBe(persisted); // nothing to add back, same ref
  });

  it("grafts the server id onto an id-less persisted name match (sign-in transition)", () => {
    // Reverse direction: THIS window just assigned the id (first PUT), a stale
    // window then wrote its pre-id blob. Persisted content wins (last-writer-
    // wins) but the identity must survive — otherwise the filter stops syncing
    // and the next hydrate re-appends the server row as a twin.
    const inMemory = [
      withNodes({ name: "my_1_Campsite", id: "S", synced: true }),
    ];
    const persisted = [
      withNodes({ name: "my_1_Campsite", drawing: { id: "newer-edit" } }),
    ];
    const union = unionMyFiltersOnRehydrate(inMemory, persisted);
    expect(union).toHaveLength(1);
    expect(union[0].id).toBe("S");
    expect(union[0].synced).toBe(true);
    expect(union[0].drawing).toEqual({ id: "newer-edit" }); // persisted content
  });

  it("collapses same-name filters with two different ids to the persisted copy", () => {
    // Two surfaces minted separate server rows for the same name. Keeping both
    // locally shows twins; the persisted copy wins here and the next hydrate
    // re-appends whatever the server really has — the server view is the
    // authority for id-bearing rows either way.
    const inMemory = [withNodes({ name: "dup", id: "B" })];
    const persisted = [withNodes({ name: "dup", id: "C" })];
    const union = unionMyFiltersOnRehydrate(inMemory, persisted);
    expect(union).toBe(persisted);
  });

  it("returns the persisted array unchanged (same ref) when nothing to add back", () => {
    // Hot path: mount and same-state rehydrates must not re-allocate.
    const persisted = [withNodes({ name: "my_1_keep", id: "K" })];
    const inMemory = [withNodes({ name: "my_1_keep", id: "K" })];
    expect(unionMyFiltersOnRehydrate(inMemory, persisted)).toBe(persisted);
  });

  it("returns persisted (all of it) at mount when in-memory is the empty default", () => {
    const persisted = [
      withNodes({ name: "a", id: "1" }),
      withNodes({ name: "b", id: "2" }),
    ];
    expect(unionMyFiltersOnRehydrate([], persisted)).toBe(persisted);
  });
});

describe("dedupeMyFilters", () => {
  // Heals twins the id-else-name union minted before name-matching landed:
  // same name, one copy with a server id + one stale id-less snapshot.
  it("removes an id-less twin whose nodes are a subset of the id-carrying copy", () => {
    const keeper: DrawingsAndNodes = {
      name: "my_1_Campsite",
      id: "S",
      synced: true,
      nodes: [
        { id: "n1", icon: null, radius: 1, p: [0, 0], mapName: "Map" },
        { id: "n2", icon: null, radius: 1, p: [1, 1], mapName: "Map" },
      ],
    };
    const staleTwin: DrawingsAndNodes = {
      name: "my_1_Campsite",
      nodes: [{ id: "n1", icon: null, radius: 1, p: [0, 0], mapName: "Map" }],
    };
    const out = dedupeMyFilters([keeper, staleTwin]);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("S");
  });

  it("removes an id-less twin with no content at all (the 'doesn't show' shell)", () => {
    const keeper = withNodes({ name: "my_1_Campsite", id: "S" });
    const emptyTwin: DrawingsAndNodes = { name: "my_1_Campsite" };
    const out = dedupeMyFilters([emptyTwin, keeper]);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("S");
  });

  it("keeps an id-less twin that has nodes the id-carrying copy lacks (no data loss)", () => {
    const keeper = withNodes({ name: "my_1_Campsite", id: "S" }); // has n1
    const divergedTwin: DrawingsAndNodes = {
      name: "my_1_Campsite",
      nodes: [{ id: "n9", icon: null, radius: 1, p: [2, 2], mapName: "Map" }],
    };
    const out = dedupeMyFilters([keeper, divergedTwin]);
    expect(out).toHaveLength(2);
  });

  it("keeps an id-less twin that carries a drawing", () => {
    const keeper = withNodes({ name: "my_1_Campsite", id: "S" });
    const drawingTwin: DrawingsAndNodes = {
      name: "my_1_Campsite",
      drawing: { id: "d1" },
    };
    expect(dedupeMyFilters([keeper, drawingTwin])).toHaveLength(2);
  });

  it("leaves same-name pairs that BOTH carry ids alone (two real server rows)", () => {
    const a = withNodes({ name: "dup", id: "A" });
    const b = withNodes({ name: "dup", id: "B" });
    expect(dedupeMyFilters([a, b])).toHaveLength(2);
  });

  it("returns the input unchanged (same ref) when there is nothing to heal", () => {
    const clean = [withNodes({ name: "a", id: "1" }), withNodes({ name: "b" })];
    expect(dedupeMyFilters(clean)).toBe(clean);
  });
});

describe("adoptLocalFilters", () => {
  let n = 0;
  const newId = () => `minted-${++n}`;
  beforeEach(() => {
    n = 0;
  });

  it("mints an id for a restored/healed filter that has content but none", () => {
    // The gap: scheduleFilterSync is a no-op without an id, and only
    // addMyFilter ever minted one — so a filter restored from a backup
    // (setMyFilters is local-only) or healed from a botched import stayed
    // invisible to every other device and couldn't be shared.
    const filters = [withNodes({ name: "my_1_Bases" })];
    const { filters: out, adoptedIds } = adoptLocalFilters(
      filters,
      newId,
      "dune-awakening",
    );
    expect(adoptedIds).toEqual(["minted-1"]);
    expect(out[0].id).toBe("minted-1");
    expect(out[0].game).toBe("dune-awakening");
  });

  it("leaves the adopted filter unsynced so a racing hydrate can't drop it", () => {
    const { filters: out } = adoptLocalFilters(
      [withNodes({ name: "my_1_Bases" })],
      newId,
    );
    expect(out[0].synced).toBeFalsy();
  });

  it("never touches a filter that already has a server id", () => {
    const filters = [withNodes({ name: "my_1_Bases", id: "existing" })];
    const { filters: out, adoptedIds } = adoptLocalFilters(filters, newId);
    expect(adoptedIds).toEqual([]);
    expect(out).toBe(filters); // same ref, hot path
  });

  it("skips empty filters — an id is only worth minting for real content", () => {
    const filters = [{ name: "my_1_empty" }];
    const { filters: out, adoptedIds } = adoptLocalFilters(filters, newId);
    expect(adoptedIds).toEqual([]);
    expect(out).toBe(filters);
  });

  it("adopts a drawing-only filter", () => {
    const { adoptedIds } = adoptLocalFilters(
      [{ name: "my_1_route", drawing: { id: "d1" } }],
      newId,
    );
    expect(adoptedIds).toEqual(["minted-1"]);
  });

  it("keeps a filter's own game over the fallback", () => {
    const { filters: out } = adoptLocalFilters(
      [withNodes({ name: "a", game: "palia" })],
      newId,
      "dune-awakening",
    );
    expect(out[0].game).toBe("palia");
  });

  it("adopts only what needs it in a mixed list", () => {
    const filters = [
      withNodes({ name: "synced", id: "s1" }),
      withNodes({ name: "restored" }),
      { name: "empty" },
    ];
    const { filters: out, adoptedIds } = adoptLocalFilters(filters, newId);
    expect(adoptedIds).toEqual(["minted-1"]);
    expect(out[0].id).toBe("s1");
    expect(out[1].id).toBe("minted-1");
    expect(out[2].id).toBeUndefined();
  });
});

describe("pendingIdsWithSyncGrace", () => {
  const NOW = 1_000_000;
  const GRACE = 15_000;

  it("keeps queued/in-flight pending ids", () => {
    const out = pendingIdsWithSyncGrace(
      new Set(["A", "B"]),
      new Map(),
      NOW,
      GRACE,
    );
    expect([...out].sort()).toEqual(["A", "B"]);
  });

  it("adds an id whose PUT succeeded within the grace window (the save-then-hydrate race)", () => {
    // C's PUT just landed (synced:true, no longer queued) but a racing server
    // fetch predates it → without the grace, hydrate would drop C.
    const recent = new Map([["C", NOW - 5_000]]);
    const out = pendingIdsWithSyncGrace(new Set(["A"]), recent, NOW, GRACE);
    expect(out.has("C")).toBe(true);
    expect(out.has("A")).toBe(true);
  });

  it("does NOT protect an id whose PUT is older than the grace window (real deletes still propagate)", () => {
    const recent = new Map([["C", NOW - 20_000]]);
    const out = pendingIdsWithSyncGrace(new Set(), recent, NOW, GRACE);
    expect(out.has("C")).toBe(false);
  });

  it("prunes expired entries from the recent map", () => {
    const recent = new Map([
      ["fresh", NOW - 1_000],
      ["stale", NOW - 99_000],
    ]);
    pendingIdsWithSyncGrace(new Set(), recent, NOW, GRACE);
    expect(recent.has("fresh")).toBe(true);
    expect(recent.has("stale")).toBe(false);
  });
});
