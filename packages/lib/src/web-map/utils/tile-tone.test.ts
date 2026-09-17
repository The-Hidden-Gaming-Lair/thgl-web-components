import {
  DARK_MODE_DIM,
  DARK_MODE_INVERT,
  DARK_MODE_OFF,
  ToneEstimator,
  meanLumaOfRGBA,
} from "./tile-tone";

function rgba(pixels: [number, number, number, number][]) {
  return Uint8ClampedArray.from(pixels.flat());
}

describe("meanLumaOfRGBA", () => {
  it("returns the luma of opaque pixels", () => {
    expect(meanLumaOfRGBA(rgba([[255, 255, 255, 255]]))).toBeCloseTo(1);
    expect(meanLumaOfRGBA(rgba([[0, 0, 0, 255]]))).toBeCloseTo(0);
    expect(
      meanLumaOfRGBA(
        rgba([
          [255, 255, 255, 255],
          [0, 0, 0, 255],
        ]),
      ),
    ).toBeCloseTo(0.5);
  });

  it("weights by alpha and ignores fully transparent padding", () => {
    // Transparent white padding must not make a dark map look light.
    expect(
      meanLumaOfRGBA(
        rgba([
          [255, 255, 255, 0],
          [255, 255, 255, 0],
          [20, 20, 20, 255],
        ]),
      ),
    ).toBeCloseTo(20 / 255);
    expect(meanLumaOfRGBA(rgba([[255, 255, 255, 0]]))).toBeNull();
  });
});

describe("ToneEstimator", () => {
  it("is off at zero strength and treats an unknown map as light", () => {
    const t = new ToneEstimator();
    expect(t.mode(0)).toBe(DARK_MODE_OFF);
    expect(t.mode(1)).toBe(DARK_MODE_INVERT);
  });

  it("inverts light maps and dims dark maps", () => {
    const light = new ToneEstimator();
    light.add(0.85);
    expect(light.mode(0.5)).toBe(DARK_MODE_INVERT);
    const dark = new ToneEstimator();
    dark.add(0.2);
    expect(dark.mode(0.5)).toBe(DARK_MODE_DIM);
  });

  it("ignores null samples", () => {
    const t = new ToneEstimator();
    t.add(null);
    t.add(0.1);
    expect(t.isLight()).toBe(false);
  });

  it("locks the decision after enough samples", () => {
    const t = new ToneEstimator(2);
    t.add(0.9);
    t.add(0.9);
    expect(t.isLight()).toBe(true);
    // A run of dark ocean tiles after the lock must not flip the map.
    for (let i = 0; i < 20; i++) t.add(0.05);
    expect(t.isLight()).toBe(true);
  });
});
