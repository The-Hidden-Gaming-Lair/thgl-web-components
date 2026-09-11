import { SpatialGrid } from "./spatial-grid";

/** Brute-force reference: every item whose CELL is within cellRadius of the query cell. */
function expectedCandidates(
  items: { id: string; x: number; y: number }[],
  cellSize: number,
  x: number,
  y: number,
  maxDistance: number,
): Set<string> {
  const cellRadius = Math.ceil(maxDistance / cellSize);
  const cx = Math.floor(x / cellSize);
  const cy = Math.floor(y / cellSize);
  const out = new Set<string>();
  for (const it of items) {
    const ix = Math.floor(it.x / cellSize);
    const iy = Math.floor(it.y / cellSize);
    if (Math.abs(ix - cx) <= cellRadius && Math.abs(iy - cy) <= cellRadius) {
      out.add(it.id);
    }
  }
  return out;
}

function buildGrid(
  items: { id: string; x: number; y: number }[],
  cellSize = 100,
) {
  const grid = new SpatialGrid<string>(cellSize);
  for (const it of items) grid.add(it.id, it.x, it.y);
  return grid;
}

describe("SpatialGrid.getNearby", () => {
  it("returns items in nearby cells and excludes far ones", () => {
    const grid = buildGrid([
      { id: "near", x: 1050, y: 1050 },
      { id: "far", x: 90000, y: 90000 },
    ]);
    const got = grid.getNearby(1000, 1000, 500);
    expect(got).toContain("near");
    expect(got).not.toContain("far");
  });

  it("gives the same candidates whether it probes cells or walks them", () => {
    // A sparse grid: any radius over ~1 cell makes the square bigger than the
    // populated-cell count, which is what switches the internal strategy.
    const items = [
      { id: "a", x: 0, y: 0 },
      { id: "b", x: 250, y: 250 },
      { id: "c", x: 10_000, y: 10_000 },
      { id: "d", x: 50_000, y: 3_000 },
    ];
    const grid = buildGrid(items);
    for (const range of [50, 100, 300, 1000, 20_000, 99_999]) {
      const got = new Set(grid.getNearby(200, 200, range));
      expect(got).toEqual(expectedCandidates(items, 100, 200, 200, range));
    }
  });

  it("handles negative coordinates (negative cell keys)", () => {
    const items = [
      { id: "nw", x: -5_000, y: -5_000 },
      { id: "origin", x: 0, y: 0 },
      { id: "se", x: 5_000, y: 5_000 },
    ];
    const grid = buildGrid(items);
    // Large range from a negative position — exercises the walk path with
    // negative cell keys on both sides of the parse.
    expect(new Set(grid.getNearby(-4_900, -4_900, 99_999))).toEqual(
      new Set(["nw", "origin", "se"]),
    );
    // Small range from the same spot keeps only the local item.
    expect(new Set(grid.getNearby(-4_900, -4_900, 150))).toEqual(
      new Set(["nw"]),
    );
  });

  it("stays cheap when the range dwarfs the populated area", () => {
    // Royal-Highlands-scale: ~5k spawns over ~190k map units, queried with the
    // proximity range a user can type into settings. The old implementation
    // probed (2*999+1)^2 = ~4M cells per call (~230ms) and froze the map.
    const items = Array.from({ length: 5_000 }, (_, i) => ({
      id: `s${i}`,
      x: (i * 7_919) % 190_000,
      y: (i * 104_729) % 190_000,
    }));
    const grid = buildGrid(items);
    const started = Date.now();
    for (let i = 0; i < 20; i++) grid.getNearby(84_524, 181_710, 99_999);
    const perCall = (Date.now() - started) / 20;
    // Generous bound: the walk path is well under a millisecond here, the old
    // probe path was ~230ms, so this catches the regression without flaking.
    expect(perCall).toBeLessThan(25);
  });

  it("still returns everything a full-map range should reach", () => {
    const items = Array.from({ length: 300 }, (_, i) => ({
      id: `s${i}`,
      x: (i * 613) % 150_000,
      y: (i * 1_117) % 150_000,
    }));
    const grid = buildGrid(items);
    expect(new Set(grid.getNearby(75_000, 75_000, 999_999))).toEqual(
      new Set(items.map((i) => i.id)),
    );
  });
});
