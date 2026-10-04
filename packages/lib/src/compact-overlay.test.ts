import { findPlayerRegion, gridCellAt } from "./compact-overlay";
import type { Region } from "./coordinates";

describe("gridCellAt", () => {
  const bounds: [[number, number], [number, number]] = [
    [0, 0],
    [100, 100],
  ];

  it("letters count along lng, numbers along lat (GridLayer labels)", () => {
    expect(gridCellAt(bounds, 10, [5, 5])).toBe("A1");
    expect(gridCellAt(bounds, 10, [5, 95])).toBe("J1");
    expect(gridCellAt(bounds, 10, [95, 5])).toBe("A10");
    expect(gridCellAt(bounds, 10, [62, 51])).toBe("F7");
  });

  it("is null outside the grid", () => {
    expect(gridCellAt(bounds, 10, [-1, 50])).toBeNull();
    expect(gridCellAt(bounds, 10, [50, 100])).toBeNull();
  });

  it("supports other division counts", () => {
    expect(gridCellAt(bounds, 11, [99, 99])).toBe("K11");
  });
});

describe("findPlayerRegion", () => {
  const square: Region = {
    id: "square",
    center: [5, 5],
    border: [
      [0, 0],
      [0, 10],
      [10, 10],
      [10, 0],
    ],
    mapName: "A",
  };
  const labelNear: Region = {
    id: "near",
    center: [20, 20],
    border: [],
    mapName: "A",
  };
  const labelFar: Region = {
    id: "far",
    center: [80, 80],
    border: [],
    mapName: "A",
  };
  const otherMap: Region = {
    id: "other",
    center: [21, 21],
    border: [],
    mapName: "B",
  };
  const regions = [square, labelNear, labelFar, otherMap];

  it("returns the region whose border contains the point", () => {
    expect(findPlayerRegion(regions, "A", [5, 5])).toEqual({
      region: square,
      inside: true,
    });
  });

  it("falls back to the nearest label on the same map", () => {
    expect(findPlayerRegion(regions, "A", [25, 25])).toEqual({
      region: labelNear,
      inside: false,
    });
    expect(findPlayerRegion(regions, "B", [70, 70])).toEqual({
      region: otherMap,
      inside: false,
    });
  });

  it("is null without regions on the map", () => {
    expect(findPlayerRegion(regions, "C", [5, 5])).toBeNull();
  });
});
