import type { Actor } from "./overwolf/plugin";

/**
 * Discovered nodes of RESPAWNING types that the live app just saw spawn again,
 * for the "Reset discovered nodes when they respawn" setting.
 *
 * Respawning type = a type with known positions that has no permanent
 * (`static: true`) node: ore, trees, forage. One-time finds like chests and
 * effigies are permanent and never reset. Generic: every game whose live
 * reader reports these actors gets it, no per-game config.
 *
 * Only a TRANSITION counts: an actor that is available now (not `hidden` =
 * depleted, not `discovered` = collected) but was not available in the
 * previous pass. So discovering a node before harvesting it doesn't undo the
 * discovery while the node is still standing there; once it is harvested
 * (removed or hidden) and comes back, it resets. `previouslyAvailable` starts
 * empty, so a node that is up when the app starts counts as respawned too —
 * it is there to be harvested again.
 */
export function findRespawnedDiscoveredNodes({
  actors,
  previouslyAvailable,
  typesIdMap,
  positionedTypes,
  permanentTypes,
  isDiscovered,
  resolveNodeId,
}: {
  actors: Actor[];
  previouslyAvailable: Set<number>;
  typesIdMap: Record<string, string>;
  positionedTypes: Set<string>;
  permanentTypes: Set<string>;
  isDiscovered: (nodeId: string) => boolean;
  /** Discovery id of the node an actor stands for; defaults to the live-marker id. */
  resolveNodeId?: (actor: Actor, displayType: string) => string | undefined;
}): { available: Set<number>; respawned: string[] } {
  const available = new Set<number>();
  const respawned: string[] = [];
  for (const actor of actors) {
    if (!actor.address || actor.hidden || actor.discovered) continue;
    const displayType =
      typesIdMap[actor.type] ?? typesIdMap[actor.type.split("_Variant.")[0]];
    if (!displayType) continue;
    if (!positionedTypes.has(displayType) || permanentTypes.has(displayType)) {
      continue;
    }
    available.add(actor.address);
    if (previouslyAvailable.has(actor.address)) continue;
    const nodeId = resolveNodeId
      ? resolveNodeId(actor, displayType)
      : `${displayType}@${actor.x.toFixed(2)}:${actor.y.toFixed(2)}`;
    if (nodeId && isDiscovered(nodeId)) respawned.push(nodeId);
  }
  return { available, respawned };
}
