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
