/**
 * Route planner: orders map points into a short walking route.
 *
 * An open path (no return to the start) through every point, starting at
 * `start` when given. Nearest neighbour builds the first route, 2-opt then
 * removes crossings until no swap shortens it (or the pass budget runs out).
 * Distances are straight lines in map coordinates - terrain is not known.
 */

export type RoutePoint = [number, number];

/** Above this many stops the planner refuses (the map would be unreadable). */
export const MAX_ROUTE_STOPS = 1000;

const dist = (a: RoutePoint, b: RoutePoint) =>
  Math.hypot(a[0] - b[0], a[1] - b[1]);

/** Total length of the path start → points[order[0]] → points[order[1]] → … */
export function routeLength(
  points: RoutePoint[],
  order: number[],
  start?: RoutePoint,
): number {
  let total = 0;
  let prev = start;
  for (const i of order) {
    if (prev) total += dist(prev, points[i]);
    prev = points[i];
  }
  return total;
}

/**
 * Returns the indices of `points` in visiting order. Deterministic: the same
 * input always gives the same route (ties keep the lower index).
 */
export function planRoute(
  points: RoutePoint[],
  start?: RoutePoint,
  maxPasses = 50,
): number[] {
  const n = points.length;
  if (n === 0) return [];

  // Nearest neighbour from the start (or from point 0 without one).
  const visited = new Uint8Array(n);
  const order: number[] = [];
  let current: RoutePoint;
  if (start) {
    current = start;
  } else {
    visited[0] = 1;
    order.push(0);
    current = points[0];
  }
  while (order.length < n) {
    let best = -1;
    let bestDist = Infinity;
    for (let i = 0; i < n; i++) {
      if (visited[i]) continue;
      const d = dist(current, points[i]);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    visited[best] = 1;
    order.push(best);
    current = points[best];
  }

  // 2-opt on the open path [start?, ...order]. Reversing order[i..j] replaces
  // edges (a,b) + (c,d) by (a,c) + (b,d); a missing end (no start before
  // order[0], nothing after the last stop) is an edge of length 0, so either
  // free end of the path may move too.
  const at = (k: number): RoutePoint | undefined =>
    k < 0 ? start : points[order[k]];
  const edge = (x: RoutePoint | undefined, y: RoutePoint | undefined) =>
    x && y ? dist(x, y) : 0;
  for (let pass = 0; pass < maxPasses; pass++) {
    let improved = false;
    for (let i = 0; i < n - 1; i++) {
      const a = at(i - 1);
      const b = at(i);
      for (let j = i + 1; j < n; j++) {
        const c = at(j);
        const d = at(j + 1);
        const before = edge(a, b) + edge(c, d);
        const after = edge(a, c) + edge(b, d);
        if (after < before - 1e-9) {
          reverse(order, i, j);
          improved = true;
          break;
        }
      }
    }
    if (!improved) break;
  }
  return order;
}

function reverse(arr: number[], i: number, j: number) {
  while (i < j) {
    const t = arr[i];
    arr[i] = arr[j];
    arr[j] = t;
    i++;
    j--;
  }
}
