/**
 * Decides whether a map image is "light" (parchment, paper, daylight) or
 * "dark" (night, cave, space) so the Dark Map slider can pick the right
 * transform: light maps get their lightness inverted, dark maps are only
 * dimmed (inverting them would make them glare).
 *
 * The estimate is the alpha-weighted mean luma of the pixels sampled from the
 * loaded images. A tile layer accumulates tiles as they load and locks the
 * decision once enough have been seen, so it never flips later on a pan.
 */

/** Dark-map shader modes (see `darkMapGLSL` in shaders.ts). */
export const DARK_MODE_OFF = 0;
export const DARK_MODE_INVERT = 1;
export const DARK_MODE_DIM = 2;

/** Luma (0..1) at or above which a map counts as light. */
export const LIGHT_MAP_LUMA = 0.5;

/** Tiles to sample before the light/dark decision is locked. */
export const TONE_LOCK_SAMPLES = 6;

const SAMPLE_SIZE = 8;

/**
 * Alpha-weighted mean luma (0..1) of an RGBA byte buffer, or null when every
 * pixel is transparent (map padding tiles carry no tone information).
 */
export function meanLumaOfRGBA(data: ArrayLike<number>): number | null {
  let lumaSum = 0;
  let alphaSum = 0;
  for (let i = 0; i + 3 < data.length; i += 4) {
    const a = data[i + 3] / 255;
    if (a === 0) continue;
    const luma =
      (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
    lumaSum += luma * a;
    alphaSum += a;
  }
  return alphaSum > 0 ? lumaSum / alphaSum : null;
}

/**
 * Running estimate of a map's tone. Feed it each loaded image's mean luma;
 * `mode(strength)` yields the shader mode to use right now. The decision locks
 * after `TONE_LOCK_SAMPLES` samples so a map does not flip between inverted
 * and dimmed once the user starts panning.
 */
export class ToneEstimator {
  private lumaSum = 0;
  private samples = 0;
  private locked: boolean | null = null;

  constructor(private readonly lockAfter = TONE_LOCK_SAMPLES) {}

  /** Record one image's mean luma (ignored once the decision is locked). */
  add(luma: number | null) {
    if (luma === null || this.locked !== null) return;
    this.lumaSum += luma;
    this.samples += 1;
    if (this.samples >= this.lockAfter) this.locked = this.isLight();
  }

  /** Whether the map reads as light. Unknown (no samples yet) counts as light. */
  isLight(): boolean {
    if (this.locked !== null) return this.locked;
    if (this.samples === 0) return true;
    return this.lumaSum / this.samples >= LIGHT_MAP_LUMA;
  }

  /** Shader mode for the given Dark Map strength. */
  mode(strength: number): number {
    if (!(strength > 0)) return DARK_MODE_OFF;
    return this.isLight() ? DARK_MODE_INVERT : DARK_MODE_DIM;
  }
}

let sampler: {
  canvas: HTMLCanvasElement | OffscreenCanvas;
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
} | null = null;

function getSampler() {
  if (sampler) return sampler;
  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(SAMPLE_SIZE, SAMPLE_SIZE);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (ctx) sampler = { canvas, ctx };
  } else if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    canvas.width = SAMPLE_SIZE;
    canvas.height = SAMPLE_SIZE;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (ctx) sampler = { canvas, ctx };
  }
  return sampler;
}

/**
 * Mean luma of an image, sampled through an 8x8 downscale (one tiny draw per
 * tile - negligible next to the texture upload). Null when it cannot be read
 * (no canvas, tainted image, fully transparent).
 */
export function sampleImageLuma(
  img: HTMLImageElement | ImageBitmap,
): number | null {
  const s = getSampler();
  if (!s) return null;
  try {
    s.ctx.clearRect(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
    s.ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
    const { data } = s.ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
    return meanLumaOfRGBA(data);
  } catch {
    return null;
  }
}
