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

  it("probes BOTH id forms, because the two code paths disagree", () => {
    // getSpawnDiscoveryId returns the bare id for a private spawn, but the
    // map's marker tooltip stores `${id}@${lat}:${lng}`. Checking only one
    // reports 0 discovered forever — the bug this replaced.
    const filter = { name: "my_1_HQ", nodes: [node("node-1")] };
    const seen: string[] = [];
    countMyFilterSpawns(filter, (id) => {
      seen.push(id);
      return false;
    });
    expect(seen).toEqual(["node-1", "node-1@1:2"]);
  });

  it("counts a marker ticked off ON THE MAP, which stores id@lat:lng", () => {
    // The map's marker tooltip has no private-spawn branch: it records
    // `${id}@${lat}:${lng}`. Counting only the bare id reported 0 discovered
    // forever even as the user ticked markers off.
    const filter = { name: "my_1_HQ", nodes: [node("a"), node("b")] };
    const stored = new Set(["a@1:2"]); // node() sits at p [1, 2]
    expect(countMyFilterSpawns(filter, (id) => stored.has(id))).toEqual({
      total: 2,
      discovered: 1,
    });
  });

  it("counts either id form, and never double-counts one marker", () => {
    const filter = { name: "my_1_HQ", nodes: [node("a")] };
    const both = new Set(["a", "a@1:2"]);
    expect(countMyFilterSpawns(filter, (id) => both.has(id))).toEqual({
      total: 1,
      discovered: 1,
    });
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
