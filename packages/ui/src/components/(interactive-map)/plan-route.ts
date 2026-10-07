import {
  buildDiscoveryLookup,
  checkNodeDiscovered,
  getNodeId,
  MAX_ROUTE_STOPS,
  planRoute,
  type Drawing,
  type RoutePoint,
} from "@repo/lib";
import type { Spawns } from "../(providers)";
import { inverseRotateCoordinate, rotateCoordinate } from "./rotation";
import type { GameMap } from "./store";

export type RoutePlan =
  | { ok: true; drawing: Omit<Drawing, "id">; stops: number }
  | { ok: false; reason: "empty" | "tooMany"; stops: number };

/**
 * Route from the right-clicked point through every marker currently on
 * screen that is not found yet. Stored as a drawing in map coordinates (the
 * unrotated space spawns and saved drawings use), so it saves, shares and
 * edits like a hand-drawn line.
 */
export function planRouteFromHere({
  map,
  mapName,
  clickLatLng,
  spawns,
  discoveredNodes,
  color,
  size,
  startLabel,
  textColor,
  textSize,
}: {
  map: GameMap;
  mapName: string;
  clickLatLng: [number, number];
  spawns: Spawns;
  discoveredNodes: string[];
  color: string;
  size: number;
  startLabel: string;
  textColor: string;
  textSize: number;
}): RoutePlan {
  const rotationDegrees = map.rotationDegrees ?? map._rotationDegrees;
  const rotationCenter = map.rotationCenter ?? map._rotationCenter;
  const rotated = Boolean(rotationDegrees && rotationCenter);
  const toScreenSpace = (p: [number, number]) =>
    rotated ? rotateCoordinate(p, rotationDegrees!, rotationCenter!) : p;
  const start: RoutePoint = rotated
    ? inverseRotateCoordinate(clickLatLng, rotationDegrees!, rotationCenter!)
    : clickLatLng;

  const view = map.getViewBounds();
  const lookup = buildDiscoveryLookup(discoveredNodes);
  const memberId = (a: NonNullable<Spawns[number]["cluster"]>[number]) =>
    a.id?.includes("@") ? a.id : `${a.id || a.type}@${a.p[0]}:${a.p[1]}`;

  const points: RoutePoint[] = [];
  for (const spawn of spawns) {
    if (spawn.mapName && spawn.mapName !== mapName) continue;
    if (spawn.muted) continue;
    const [lat, lng] = toScreenSpace([spawn.p[0], spawn.p[1]]);
    if (
      lat < view.min[0] ||
      lat > view.max[0] ||
      lng < view.min[1] ||
      lng > view.max[1]
    ) {
      continue;
    }
    // A stack counts as found only when every marker in it is found.
    const found =
      checkNodeDiscovered(getNodeId(spawn), lookup) &&
      (spawn.cluster ?? []).every((a) =>
        checkNodeDiscovered(memberId(a), lookup),
      );
    if (found) continue;
    points.push([spawn.p[0], spawn.p[1]]);
  }

  if (points.length === 0) return { ok: false, reason: "empty", stops: 0 };
  if (points.length > MAX_ROUTE_STOPS) {
    return { ok: false, reason: "tooMany", stops: points.length };
  }

  const order = planRoute(points, start);
  return {
    ok: true,
    stops: points.length,
    drawing: {
      polylines: [
        {
          positions: [start, ...order.map((i) => points[i])],
          size,
          color,
          mapName,
        },
      ],
      texts: [
        {
          position: start,
          text: startLabel,
          size: textSize,
          color: textColor,
          mapName,
        },
      ],
    },
  };
}
