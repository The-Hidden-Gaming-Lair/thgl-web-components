import type { Node } from "./nodes";

type SpawnNodes = {
  [type: string]: [number, number, number][];
};
const db: SpawnNodes = {};

export function getSpawnNodes() {
  return db;
}

export function insertNode(node: Node) {
  if (!db[node.type]) {
    db[node.type] = [];
  }
  db[node.type].push([node.x, node.y, node.z]);
}

export function resetNodes() {
  Object.keys(db).forEach((type) => {
    db[type] = [];
  });
}
