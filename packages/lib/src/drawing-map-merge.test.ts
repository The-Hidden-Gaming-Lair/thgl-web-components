import { mergeDrawingForMap } from "./drawing-map-merge";
import type { Drawing } from "./settings";

const line = (mapName: string, x = 0) => ({
  positions: [
    [x, 0],
    [x, 1],
  ] as [number, number][],
  size: 2,
  color: "#fff",
  mapName,
});

describe("mergeDrawingForMap", () => {
  it("keeps shapes on other maps when the open map's shapes are rebuilt", () => {
    const current: Partial<Drawing> = {
      name: "Route",
      polylines: [line("a", 1), line("b", 2), line("a", 3)],
      texts: [
        {
          position: [0, 0],
          text: "other",
          size: 12,
          color: "#fff",
          mapName: "b",
        },
      ],
    } as Partial<Drawing>;
    // Erased the second line on map "a"
    const merged = mergeDrawingForMap(
      current,
      { polylines: [line("a", 1)] },
      "a",
    );
    expect(merged.polylines).toEqual([line("b", 2), line("a", 1)]);
    expect(merged.texts).toHaveLength(1);
    expect(merged.texts?.[0]?.mapName).toBe("b");
    expect((merged as { name?: string }).name).toBe("Route");
  });

  it("removes the open map's shapes when all of them were erased", () => {
    const current: Partial<Drawing> = {
      circles: [
        { center: [0, 0], radius: 1, size: 1, color: "#fff", mapName: "a" },
        { center: [1, 1], radius: 1, size: 1, color: "#fff", mapName: "b" },
      ],
    };
    const merged = mergeDrawingForMap(current, {}, "a");
    expect(merged.circles?.map((c) => c.mapName)).toEqual(["b"]);
    expect(merged.polylines).toEqual([]);
  });

  it("keeps legacy shapes without a mapName (the editor never loads them)", () => {
    const current: Partial<Drawing> = { polylines: [line(""), line("a")] };
    const merged = mergeDrawingForMap(current, { polylines: [] }, "a");
    expect(merged.polylines).toEqual([line("")]);
  });
});
