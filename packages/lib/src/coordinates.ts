export type Region = {
  id: string;
  center: [number, number];
  border: [number, number][];
  mapName?: string;
};

export const isPointInsidePolygon = (
  point: [number, number],
  polygon: [number, number][],
) => {
  const x = point[0];
  const y = point[1];

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0],
      yi = polygon[i][1];
    const xj = polygon[j][0],
      yj = polygon[j][1];

    const intersect =
      yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
};

export type Spawn = {
  id: string;
  name?: string | undefined;
  description?: string | undefined;
  address?: number;
  p: [number, number] | [number, number, number];
  type: string;
  cluster?: Omit<Spawn, "cluster">[];
  mapName?: string;
  color?: string;
  icon?: {
    name: string;
    url: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  } | null;
  radius?: number;
  isPrivate?: boolean;
  data?: Record<string, string[]>;
};

export type SimpleSpawn = {
  id: string;
  p: [number, number] | [number, number, number];
  icon?:
    | string
    | {
        name: string;
        url: string;
        x?: number;
        y?: number;
        width?: number;
        height?: number;
      }
    | null;
  name: string;
  color?: string;
  description?: string;
};

export const getNodeId = (spawn: Spawn | SimpleSpawn) => {
  if (spawn.id?.includes("@")) {
    return spawn.id;
  }
  if ("type" in spawn) {
    return `${spawn.id || spawn.type}@${spawn.p[0]}:${spawn.p[1]}`;
  }
  return `${spawn.id}@${spawn.p[0]}:${spawn.p[1]}`;
};
