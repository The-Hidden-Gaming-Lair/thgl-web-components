import { mergeHydratedFilters } from "./filters-sync";
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
});
