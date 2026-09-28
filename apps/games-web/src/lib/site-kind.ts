import { type AppConfig, fetchVersion } from "@repo/lib";

export type SiteKind = { hasMap: boolean; hasDb: boolean };

/**
 * What a game tenant offers. A map-shipped game always publishes filters;
 * a DB-only deployment (homm) publishes an empty filters array. `db` in the
 * tenant config means it has database pages (map sites like Palworld and
 * BPSR have both).
 */
export async function getSiteKind(config: AppConfig): Promise<SiteKind> {
  const hasDb = Boolean(config.db);
  const version = await fetchVersion(config.name).catch(() => null);
  // Unknown (CDN hiccup): assume a map, which is what most tenants are.
  const hasMap = version ? version.data.filters.length > 0 : true;
  return { hasMap, hasDb };
}

/** Call-to-action label for a tenant site, e.g. "Open the interactive map". */
export function siteLinkLabel({ hasMap, hasDb }: SiteKind): string {
  if (hasMap && hasDb) return "Open the map & database";
  if (hasDb) return "Open the game database";
  if (hasMap) return "Open the interactive map";
  return "Open the website";
}
