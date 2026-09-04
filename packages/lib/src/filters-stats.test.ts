import { countMyFilterSpawns } from "./filters-stats";

const node = (id: string) => ({
  id,
  icon: null,
  radius: 1,
  p: [1, 2] as [number, number],
  mapName: "Map",
});

describe("countMyFilterSpawns", () => {
  it("counts markers and how many are discovered", () => {
    const filter = {
      name: "my_1_HQ",
      nodes: [node("a"), node("b"), node("c")],
    };
    const discovered = new Set(["a", "c"]);
    expect(countMyFilterSpawns(filter, (id) => discovered.has(id))).toEqual({
      total: 3,
      discovered: 2,
    });
  });

  it("keys discovery by the node id, as the map does for private markers", () => {
    // A private spawn with an id is keyed by that id alone. If the id were
    // rebuilt from coordinates instead, nothing would ever match what the map
    // recorded when the user ticked a marker off.
    const filter = { name: "my_1_HQ", nodes: [node("node-1")] };
    const seen: string[] = [];
    countMyFilterSpawns(filter, (id) => {
      seen.push(id);
      return false;
    });
    expect(seen).toEqual(["node-1"]);
  });

  it("reports zero discovered when none are ticked off", () => {
    const filter = { name: "f", nodes: [node("a"), node("b")] };
    expect(countMyFilterSpawns(filter, () => false)).toEqual({
      total: 2,
      discovered: 0,
    });
  });

  it("handles a filter with no nodes (drawing-only)", () => {
    expect(countMyFilterSpawns({ name: "d" }, () => true)).toEqual({
      total: 0,
      discovered: 0,
    });
    expect(countMyFilterSpawns({ name: "d", nodes: [] }, () => true)).toEqual({
      total: 0,
      discovered: 0,
    });
  });

  it("never reports more discovered than total", () => {
    const filter = { name: "f", nodes: [node("a")] };
    const { total, discovered } = countMyFilterSpawns(filter, () => true);
    expect(discovered).toBeLessThanOrEqual(total);
  });
});
