/**
 * Pure maths behind the positional audio alerts (Settings > Accessibility >
 * "Positional audio alerts"). No Web Audio, no React, no DOM — so it is unit
 * testable and the caller stays a thin wiring layer.
 *
 * Everything here is cheap: the marker loop must only call it for the handful
 * of types that are actually about to ping, never per spawn.
 */

/** Far-end gain as a fraction of the user's volume: the range edge is quiet, never silent. */
export const ALERT_GAIN_FLOOR = 0.25;
/** How much a marker directly behind the player is attenuated (1 = ahead, this value = behind). */
export const ALERT_REAR_GAIN = 0.6;
/** Never pan fully to one ear - one earbud / one-sided hearing must still get the alert. */
export const ALERT_MAX_PAN = 0.9;
/** Ping interval at the player's feet, milliseconds. */
export const ALERT_MIN_REPEAT_MS = 400;
/** Extra ping interval at the range edge, milliseconds (so the edge is MIN + this). */
export const ALERT_REPEAT_SPAN_MS = 2600;

/**
 * Volume for a marker `distance` away, given the user's `range` and `volume` (0..1).
 *
 * Quadratic falloff onto a floor rather than a true inverse square: the range
 * is a user-typed number that is often a large share of the map, and 1/d²
 * would make everything past ~10% of it inaudible. The floor is what keeps
 * "something is out there at the edge" distinguishable from "the feature is
 * broken".
 */
export function alertGain(
  distance: number,
  range: number,
  volume: number,
): number {
  if (!(range > 0)) return volume;
  const t = Math.min(1, Math.max(0, distance / range));
  const falloff = (1 - t) * (1 - t);
  return volume * (ALERT_GAIN_FLOOR + (1 - ALERT_GAIN_FLOOR) * falloff);
}

/** Wrap an angle into (-PI, PI]. */
export function wrapAngle(rad: number): number {
  return Math.atan2(Math.sin(rad), Math.cos(rad));
}

/**
 * Bearing of a marker relative to where the player is facing, in radians.
 * 0 = dead ahead, +PI/2 = to the player's right, +-PI = behind.
 *
 * `dxRight` / `dyDown` are SCREEN-pixel deltas (WebMap.projectLatLng), because
 * the lat/lng -> screen mapping is a per-game affine transform and the sign of
 * its lat coefficient flips on some maps. `facingRad` must already include the
 * map's tile rotation AND `markerOptions.playerIconForward` — the exact sum
 * heading-up mode uses in player.tsx.
 */
export function relativeBearing(
  dxRight: number,
  dyDown: number,
  facingRad: number,
): number {
  return wrapAngle(Math.atan2(dxRight, -dyDown) - facingRad);
}

/** Stereo pan for a relative bearing: 0 ahead and behind, +-ALERT_MAX_PAN to the sides. */
export function alertPan(relBearingRad: number): number {
  const pan = Math.sin(relBearingRad);
  return Math.max(-ALERT_MAX_PAN, Math.min(ALERT_MAX_PAN, pan));
}

/**
 * 1.0 dead ahead falling to ALERT_REAR_GAIN dead behind.
 *
 * `sin` is 0 both ahead and behind, so something has to disambiguate the two.
 * It is deliberately a gain dip and not a pitch shift: pitch is what identifies
 * WHICH filter is pinging once per-filter tones are in play.
 */
export function rearAttenuation(relBearingRad: number): number {
  const front = (Math.cos(relBearingRad) + 1) / 2; // 1 ahead .. 0 behind
  return ALERT_REAR_GAIN + (1 - ALERT_REAR_GAIN) * front;
}

/** Ping interval: fast when close, slow at the range edge (the parking-sensor idiom). */
export function alertRepeatDelayMs(distance: number, range: number): number {
  if (!(range > 0)) return ALERT_MIN_REPEAT_MS + ALERT_REPEAT_SPAN_MS;
  const t = Math.min(1, Math.max(0, distance / range));
  return ALERT_MIN_REPEAT_MS + ALERT_REPEAT_SPAN_MS * t;
}

/** Per-filter tone override, falling back to the global alert sound. */
export function resolveAlertSound<T extends string>(
  type: string,
  byFilter: Record<string, T> | undefined,
  fallback: T,
): T {
  return byFilter?.[type] ?? fallback;
}
