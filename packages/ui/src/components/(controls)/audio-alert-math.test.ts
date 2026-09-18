import {
  ALERT_GAIN_FLOOR,
  ALERT_MAX_PAN,
  ALERT_REAR_GAIN,
  alertGain,
  alertPan,
  alertRepeatDelayMs,
  rearAttenuation,
  relativeBearing,
  resolveAlertSound,
  wrapAngle,
} from "./audio-alert-math";

describe("alertGain", () => {
  it("is the full volume at the player's position", () => {
    expect(alertGain(0, 5000, 0.5)).toBeCloseTo(0.5, 6);
  });

  it("falls to the floor at the range edge and never below it", () => {
    expect(alertGain(5000, 5000, 0.5)).toBeCloseTo(0.5 * ALERT_GAIN_FLOOR, 6);
    // Beyond the range the caller never fires, but the clamp must hold anyway.
    expect(alertGain(99999, 5000, 0.5)).toBeCloseTo(0.5 * ALERT_GAIN_FLOOR, 6);
  });

  it("is monotonically decreasing over the whole range", () => {
    let prev = Infinity;
    for (let d = 0; d <= 5000; d += 250) {
      const g = alertGain(d, 5000, 1);
      expect(g).toBeLessThanOrEqual(prev);
      prev = g;
    }
  });

  it("keeps the last third of the approach clearly louder than the middle", () => {
    // The point of the quadratic shape: closing in has to be audible.
    const far = alertGain(4000, 5000, 1);
    const mid = alertGain(2500, 5000, 1);
    const near = alertGain(500, 5000, 1);
    expect(mid - far).toBeGreaterThan(0.1);
    expect(near - mid).toBeGreaterThan(0.2);
  });

  it("degrades to the plain volume when the range is nonsense", () => {
    expect(alertGain(10, 0, 0.5)).toBe(0.5);
    expect(alertGain(10, Number.NaN, 0.5)).toBe(0.5);
  });

  it("scales with the user's volume slider", () => {
    expect(alertGain(2500, 5000, 0)).toBe(0);
    expect(alertGain(2500, 5000, 1)).toBeCloseTo(
      alertGain(2500, 5000, 0.5) * 2,
      6,
    );
  });
});

describe("alertRepeatDelayMs", () => {
  it("pings fast when close and slowly at the edge", () => {
    expect(alertRepeatDelayMs(0, 5000)).toBe(400);
    expect(alertRepeatDelayMs(5000, 5000)).toBe(3000);
    expect(alertRepeatDelayMs(2500, 5000)).toBeCloseTo(1700, 6);
  });

  it("is monotonically increasing and clamped past the range", () => {
    expect(alertRepeatDelayMs(99999, 5000)).toBe(3000);
    let prev = -Infinity;
    for (let d = 0; d <= 5000; d += 500) {
      const ms = alertRepeatDelayMs(d, 5000);
      expect(ms).toBeGreaterThanOrEqual(prev);
      prev = ms;
    }
  });

  it("falls back to the slowest cadence when the range is nonsense", () => {
    expect(alertRepeatDelayMs(10, 0)).toBe(3000);
  });
});

/** Degrees -> radians, for readable expectations. */
const D = (deg: number) => (deg * Math.PI) / 180;

describe("relativeBearing / alertPan", () => {
  // Screen basis: +x right, +y DOWN (WebMap.projectLatLng world pixels).
  it("puts a marker to the east on the right ear when facing north", () => {
    expect(alertPan(relativeBearing(100, 0, 0))).toBeCloseTo(ALERT_MAX_PAN, 6);
  });

  it("puts a marker to the west on the left ear when facing north", () => {
    expect(alertPan(relativeBearing(-100, 0, 0))).toBeCloseTo(
      -ALERT_MAX_PAN,
      6,
    );
  });

  it("centres a marker dead ahead and dead behind", () => {
    expect(alertPan(relativeBearing(0, -100, 0))).toBeCloseTo(0, 6);
    expect(alertPan(relativeBearing(0, 100, 0))).toBeCloseTo(0, 6);
  });

  it("follows the player's facing: facing east, a marker east is dead ahead", () => {
    expect(relativeBearing(100, 0, D(90))).toBeCloseTo(0, 6);
    expect(alertPan(relativeBearing(100, 0, D(90)))).toBeCloseTo(0, 6);
  });

  it("applies playerIconForward: Palia's icon points right, so r=0 faces east", () => {
    // The regression guard that matters. facing = r + tile rotation + forward;
    // "simplifying" it to `bearing - r` breaks exactly this case.
    const facing = D(0 /* r */ + 0 /* tile rotation */ + 90 /* forward */);
    expect(alertPan(relativeBearing(100, 0, facing))).toBeCloseTo(0, 6); // east = ahead
    expect(alertPan(relativeBearing(0, -100, facing))).toBeCloseTo(
      -ALERT_MAX_PAN,
      6,
    ); // north = to the left
  });

  it("applies a map's coordinate rotation the same way", () => {
    // A map rotated 180 degrees: the same heading faces the opposite way.
    const facing = D(0 /* r */ + 180 /* tile rotation */ + 0 /* forward */);
    expect(alertPan(relativeBearing(100, 0, facing))).toBeCloseTo(
      -ALERT_MAX_PAN,
      6,
    );
  });

  it("never pans fully to one ear", () => {
    for (let deg = -180; deg <= 180; deg += 5) {
      expect(Math.abs(alertPan(D(deg)))).toBeLessThanOrEqual(ALERT_MAX_PAN);
    }
  });

  it("wraps the seam instead of spinning the long way round", () => {
    expect(wrapAngle(D(190))).toBeCloseTo(D(-170), 6);
    expect(relativeBearing(100, 0, D(350))).toBeCloseTo(D(100), 6);
  });
});

describe("rearAttenuation", () => {
  it("is loudest ahead and quietest behind", () => {
    expect(rearAttenuation(0)).toBeCloseTo(1, 6);
    expect(rearAttenuation(Math.PI)).toBeCloseTo(ALERT_REAR_GAIN, 6);
    expect(rearAttenuation(Math.PI / 2)).toBeGreaterThan(ALERT_REAR_GAIN);
    expect(rearAttenuation(Math.PI / 2)).toBeLessThan(1);
  });

  it("leaves a marker behind you at the range edge audible, not silent", () => {
    const gain = alertGain(5000, 5000, 1) * rearAttenuation(Math.PI);
    expect(gain).toBeCloseTo(ALERT_GAIN_FLOOR * ALERT_REAR_GAIN, 6);
    expect(gain).toBeGreaterThan(0.1);
  });
});

describe("resolveAlertSound", () => {
  it("falls back to the global tone when a filter has no override", () => {
    expect(resolveAlertSound("Mining.Clay", {}, "chime")).toBe("chime");
    expect(resolveAlertSound("Mining.Clay", undefined, "soft")).toBe("soft");
  });

  it("uses the override when the filter has one", () => {
    expect(
      resolveAlertSound("Mining.Clay", { "Mining.Clay": "beacon" }, "chime"),
    ).toBe("beacon");
  });

  it("does not let another filter's tone leak", () => {
    expect(
      resolveAlertSound("Mining.Ore", { "Mining.Clay": "beacon" }, "chime"),
    ).toBe("chime");
  });
});
