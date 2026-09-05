import { getSpawnDiscoveryId } from "./coordinates";
import type { DrawingsAndNodes } from "./settings";

/**
 * Marker counts for a custom ("My Filters") filter, matching what the
 * predefined-filter popover shows for a built-in type.
 *
 * A custom marker can be recorded as discovered under EITHER of two keys,
 * because two code paths disagree about how to address a private spawn:
 *
 *   - `getSpawnDiscoveryId` returns the bare `spawn.id` for a private spawn.
 *     The filter tooltip and "discover all" use it.
 *   - the map's own marker tooltip builds `${id}@${lat}:${lng}` and has no
 *     private-spawn branch at all, so ticking a marker off ON THE MAP — the
 *     way users actually do it — stores the coordinate form.
 *
 * Counting only one form silently reports 0 discovered forever, which is
 * exactly what happened. Both are checked here so the count reflects reality
 * whichever path recorded it; unifying the two id rules is a separate change,
 * and a riskier one, since it would orphan discoveries already stored.
 */
export function countMyFilterSpawns(
  filter: Pick<DrawingsAndNodes, "name" | "nodes">,
  isDiscovered: (id: string) => boolean,
): { total: number; discovered: number } {
  const nodes = filter.nodes ?? [];
  let discovered = 0;
  for (const node of nodes) {
    const bareId = getSpawnDiscoveryId(filter.name, {
      id: node.id,
      isPrivate: true,
      p: node.p,
    });
    const coordId = `${node.id}@${node.p[0]}:${node.p[1]}`;
    if (isDiscovered(bareId) || isDiscovered(coordId)) discovered++;
  }
  return { total: nodes.length, discovered };
}
