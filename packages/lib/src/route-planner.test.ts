import { planRoute, routeLength, type RoutePoint } from "./route-planner";

const isPermutation = (order: number[], n: number) =>
  order.length === n &&
  new Set(order).size === n &&
  order.every((i) => i >= 0 && i < n);

describe("planRoute", () => {
  it("returns an empty route for no points", () => {
    expect(planRoute([])).toEqual([]);
    expect(planRoute([], [0, 0])).toEqual([]);
  });

  it("walks a line in order from the start", () => {
    const points: RoutePoint[] = [
      [0, 3],
      [0, 1],
      [0, 4],
      [0, 2],
    ];
    expect(planRoute(points, [0, 0])).toEqual([1, 3, 0, 2]);
    // Start on the far end: walk back.
    expect(planRoute(points, [0, 5])).toEqual([2, 0, 3, 1]);
  });

  it("removes crossings nearest neighbour leaves (2-opt)", () => {
    // Nearest neighbour from the origin zig-zags across the square grid.
    const points: RoutePoint[] = [];
    for (let x = 0; x < 6; x++) {
      for (let y = 0; y < 6; y++) points.push([x * 10 + (y % 2), y * 10]);
    }
    const start: RoutePoint = [0, 0];
    const order = planRoute(points, start);
    expect(isPermutation(order, points.length)).toBe(true);
    const nnOnly = planRoute(points, start, 0);
    expect(routeLength(points, order, start)).toBeLessThanOrEqual(
      routeLength(points, nnOnly, start),
    );
    // 36 points on a ~10 grid: an optimal open path is ~35 steps of ~10.
    expect(routeLength(points, order, start)).toBeLessThan(35 * 10 * 1.15);
  });

  it("visits every point exactly once and is deterministic", () => {
    let seed = 7;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const points: RoutePoint[] = Array.from({ length: 300 }, () => [
      rand() * 1000,
      rand() * 1000,
    ]);
    const a = planRoute(points, [500, 500]);
    const b = planRoute(points, [500, 500]);
    expect(isPermutation(a, 300)).toBe(true);
    expect(a).toEqual(b);
    expect(routeLength(points, a, [500, 500])).toBeLessThanOrEqual(
      routeLength(points, planRoute(points, [500, 500], 0), [500, 500]),
    );
  });

  it("works without a start point", () => {
    const points: RoutePoint[] = [
      [0, 0],
      [0, 2],
      [0, 1],
    ];
    const order = planRoute(points);
    expect(routeLength(points, order)).toBe(2);
  });
});
