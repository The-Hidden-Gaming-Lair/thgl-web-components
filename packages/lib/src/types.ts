export interface MarkerOptions {
  radius: number;
  playerIcon: string;
  imageSprite?: boolean;
  zPos?: {
    xyMaxDistance: number;
    zDistance: number;
  };
  /**
   * Template string for coordinate copy format.
   * Placeholders: {x}, {y}, {z}
   * Example: "({x},{y})" produces "(123,456)"
   * Default: "[{x}, {y}]" or "[{x}, {y}, {z}]" for 3D
   */
  coordinateCopyFormat?: string;
  /**
   * Round coordinates to this precision when clustering spawns.
   * Spawns within this distance will be grouped into a single marker.
   * Default: 0 (exact coordinate match)
   */
  clusterPrecision?: number;
  /**
   * World-unit radius for position-based, type-agnostic live↔predicted dedup: a live actor hides
   * the nearest combined-muted predicted static spawn at its location, so combined mode shows one
   * marker (the live one) instead of the faded prediction beneath it. Use when the memory detector
   * emits COARSER types than the static data (e.g. Enshrouded live "chest" vs static gold_chest).
   * Default: 0 (off — other games unchanged). Keep small — just above live-vs-file coordinate
   * rounding — so it can't swallow a distinct neighbouring spawn.
   */
  liveConfirmRadius?: number;
}
