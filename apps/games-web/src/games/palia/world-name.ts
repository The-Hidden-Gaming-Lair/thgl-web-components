// A Palia serverId encodes the ZONE the player is in, the region, and a unique
// instance id — e.g. "palia-adventure-2-x86cf-wmlxg". Palia streams each zone as
// its own server instance, so same-region rows are distinct worlds; this turns
// the id into a human label ("Elderwood · x86cf-wmlxg") so they're tellable apart.
const ZONE_NAMES: Record<string, string> = {
  village: "Kilima Valley",
  adventure: "Bahari Bay",
  "adventure-2": "Elderwood",
  "adventure-3": "Royal Highlands",
  blackmarket: "Black Market",
  housing: "Home Plot",
};

// Canonical display order for the zone filter (housing is excluded upstream).
export const ZONE_ORDER = [
  "village",
  "adventure",
  "adventure-2",
  "adventure-3",
  "blackmarket",
] as const;

export function zoneLabel(zoneKey: string): string {
  return ZONE_NAMES[zoneKey] ?? zoneKey;
}

export function worldName(serverId: string): {
  zone: string;
  zoneKey: string;
  id: string;
} {
  const m = serverId.match(/^palia-([a-z]+(?:-\d+)?)-(.+)$/);
  if (!m) return { zone: serverId, zoneKey: "", id: "" };
  return { zone: ZONE_NAMES[m[1]] ?? m[1], zoneKey: m[1], id: m[2] };
}
