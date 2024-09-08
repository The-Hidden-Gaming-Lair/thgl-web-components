import type { Node } from "./nodes";

type SpawnNodes = {
  [type: string]: [number, number, number, string][];
};
const db: Record<string, SpawnNodes> = {};

export function getSpawnNodes(app: string) {
  return db[app] || {};
}

export function insertNode(app: string, node: Node) {
  if (!db[app]) {
    db[app] = {};
  }
  if (!db[app][node.type]) {
    db[app][node.type] = [];
  }
  db[app][node.type].push([node.x, node.y, node.z, node.path]);
}

export function resetNodes(app: string) {
  if (!db[app]) {
    return;
  }
  db[app] = {};
}

export function getMinDistance(type: string) {
  return 1;
}

export function calculateDistance(
  node1: Node,
  coords: [number, number, number, string],
) {
  const dx = node1.x - coords[0];
  const dy = node1.y - coords[1];
  return Math.sqrt(dx * dx + dy * dy);
}
