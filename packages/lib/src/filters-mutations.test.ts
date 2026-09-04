import { applyFilterPatch, removeFiltersMatching } from "./filters-mutations";
import type { DrawingsAndNodes } from "./settings";

const f = (over: Partial<DrawingsAndNodes> & { name: string }) =>
  ({ ...over }) as DrawingsAndNodes;

describe("applyFilterPatch", () => {
  it("returns the renamed filter so the caller can upload it (the regression)", () => {
    // The store used to re-find the result by the name it was CALLED with.
    // A rename moves that key, the lookup found nothing, and the upload was
    // silently skipped — the new name never left the device.
    const filters = [f({ name: "old", id: "A" })];
    const { filters: next, updated } = applyFilterPatch(filters, "old", {
      name: "new",
    });
    expect(next[0].name).toBe("new");
    expect(updated).toHaveLength(1);
    expect(updated[0].name).toBe("new");
    expect(updated[0].id).toBe("A"); // identity survives the rename
  });

  it("returns the updated filter for a patch that keeps the name", () => {
    const filters = [f({ name: "keep", id: "A" })];
    const { updated } = applyFilterPatch(filters, "keep", {
      visibility: "public",
    });
    expect(updated).toHaveLength(1);
    expect(updated[0].visibility).toBe("public");
  });

  it("merges rather than replaces", () => {
    const filters = [f({ name: "n", id: "A", nodes: [] })];
    const { updated } = applyFilterPatch(filters, "n", {
      visibility: "public",
    });
    expect(updated[0].id).toBe("A");
    expect(updated[0].nodes).toEqual([]);
  });

  it("updates EVERY filter sharing the name, not just the first", () => {
    // Duplicate names are reachable (same filter uploaded under two ids).
    // Patching two while uploading one leaves the other silently diverged.
    const filters = [f({ name: "dup", id: "A" }), f({ name: "dup", id: "B" })];
    const { updated } = applyFilterPatch(filters, "dup", { name: "renamed" });
    expect(updated.map((x) => x.id).sort()).toEqual(["A", "B"]);
  });

  it("leaves non-matching filters untouched by identity", () => {
    const other = f({ name: "other", id: "Z" });
    const filters = [f({ name: "target", id: "A" }), other];
    const { filters: next } = applyFilterPatch(filters, "target", {
      name: "x",
    });
    expect(next[1]).toBe(other);
  });

  it("returns the input array and no updates when the name is unknown", () => {
    const filters = [f({ name: "a" })];
    const res = applyFilterPatch(filters, "missing", { name: "b" });
    expect(res.filters).toBe(filters);
    expect(res.updated).toEqual([]);
  });

  it("does not mutate the input array or its filters", () => {
    const original = f({ name: "old", id: "A" });
    const filters = [original];
    applyFilterPatch(filters, "old", { name: "new" });
    expect(original.name).toBe("old");
    expect(filters[0]).toBe(original);
  });
});

describe("removeFiltersMatching", () => {
  it("returns what was removed so the caller can tombstone + server-delete", () => {
    // Dropping them from the array alone is NOT a delete: the server rows
    // survive and the next hydrate resurrects everything.
    const filters = [f({ name: "gone", id: "A" }), f({ name: "stays" })];
    const { filters: next, removed } = removeFiltersMatching(
      filters,
      (x) => x.name === "gone",
    );
    expect(next.map((x) => x.name)).toEqual(["stays"]);
    expect(removed.map((x) => x.id)).toEqual(["A"]);
  });

  it("removes EVERY filter with a duplicated name", () => {
    const filters = [
      f({ name: "dup", id: "A" }),
      f({ name: "dup", id: "B" }),
      f({ name: "other" }),
    ];
    const { filters: next, removed } = removeFiltersMatching(
      filters,
      (x) => x.name === "dup",
    );
    expect(removed).toHaveLength(2);
    expect(next).toHaveLength(1);
  });

  it("removes everything for a reset, reporting all rows to delete", () => {
    const filters = [f({ name: "a", id: "A" }), f({ name: "b", id: "B" })];
    const { filters: next, removed } = removeFiltersMatching(
      filters,
      () => true,
    );
    expect(next).toEqual([]);
    expect(removed.map((x) => x.id)).toEqual(["A", "B"]);
  });

  it("returns the input array unchanged when nothing matches", () => {
    const filters = [f({ name: "a" })];
    const res = removeFiltersMatching(filters, () => false);
    expect(res.filters).toBe(filters);
    expect(res.removed).toEqual([]);
  });

  it("handles an empty list", () => {
    const filters: DrawingsAndNodes[] = [];
    const res = removeFiltersMatching(filters, () => true);
    expect(res.filters).toBe(filters);
    expect(res.removed).toEqual([]);
  });
});
