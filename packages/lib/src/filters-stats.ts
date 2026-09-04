import { getSpawnDiscoveryId } from "./coordinates";
import type { DrawingsAndNodes } from "./settings";

/**
 * Marker counts for a custom ("My Filters") filter, matching what the
 * predefined-filter popover shows for a built-in type.
 *
 * Discovery ids are derived through {@link getSpawnDiscoveryId} rather than
 * read off the node, so this can't drift from the rule the map itself uses.
 * Custom markers are always private, and a private spawn with an id is keyed
 * by that id alone — passing `isPrivate` is what selects that branch; without
 * it the id would be rebuilt from coordinates and never match what the map
 * recorded when the user ticked the marker off.
 */
export function countMyFilterSpawns(
  filter: Pick<DrawingsAndNodes, "name" | "nodes">,
  isDiscovered: (id: string) => boolean,
): { total: number; discovered: number } {
  const nodes = filter.nodes ?? [];
  let discovered = 0;
  for (const node of nodes) {
    const id = getSpawnDiscoveryId(filter.name, {
      id: node.id,
      isPrivate: true,
      p: node.p,
    });
    if (isDiscovered(id)) discovered++;
  }
  return { total: nodes.length, discovered };
}
