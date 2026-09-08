import type { TilesConfig } from "./config";

/**
 * The URL encoded into the Peer Link QR code / share link.
 *
 * Opens the receiver DIRECTLY on the sender's current map
 * (`/maps/<Map>?peer_code=…`) instead of the game homepage. On the homepage the
 * peer code is stored but nothing streams until the visitor picks a map by
 * hand, which reads as "the live map doesn't work on my phone". Landing on a map
 * page auto-joins the mesh and tracking starts at once.
 *
 * Mirrors the map-URL rules of the layer/map selectors: the path names the
 * SURFACE map by its English `defaultTitle` (the map page resolves English
 * titles and 308s to the localized canonical URL), and an interior floor is
 * carried as `?layer=<mapName>`. A `defaultTitle` equal to the map key is a
 * placeholder, not a real title — fall back to the translated key, then the
 * key itself. Without a usable map, fall back to the homepage.
 */
export function buildPeerLinkUrl({
  domain,
  peerCode,
  mapName,
  tiles,
  t,
}: {
  domain: string;
  peerCode: string;
  /** The map the sender is on (player map first, else the displayed map). */
  mapName?: string | null;
  tiles?: TilesConfig;
  /** Translates a map key; defaults to identity. */
  t?: (key: string) => string;
}): string {
  const origin = `https://${domain}.th.gl`;
  if (!peerCode) return origin;

  const params = new URLSearchParams();
  const map = mapName && tiles?.[mapName] ? mapName : null;
  if (!map) {
    params.set("peer_code", peerCode);
    return `${origin}?${params}`;
  }

  const layer = tiles?.[map]?.layer;
  const surface = layer?.parent && tiles?.[layer.parent] ? layer.parent : map;
  const dt = tiles?.[surface]?.defaultTitle;
  const translated = t ? t(surface) : "";
  const title = (dt && dt !== surface ? dt : translated) || surface;

  if (surface !== map) params.set("layer", map);
  params.set("peer_code", peerCode);
  return `${origin}/maps/${encodeURIComponent(title)}?${params}`;
}
