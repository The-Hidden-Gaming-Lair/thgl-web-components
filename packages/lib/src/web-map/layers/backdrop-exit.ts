import type { Layer, RenderState } from "../types";

type Area = { bounds: [[number, number], [number, number]]; url: string };

type LoadedArea = Area & {
  alpha: Uint8Array | null;
  aw: number;
  ah: number;
};

/**
 * Invisible pick-only layer used on interior (layer) maps: a click anywhere that
 * is NOT on ANY interior footprint — i.e. on the transparent, dimmed backdrop
 * around/through the plans — exits back to the surface.
 *
 * The single "Underground" map stacks EVERY interior overlay at once, so this
 * layer holds all of their footprints and only exits when the click misses all
 * of them. It renders nothing (the visible interiors are separate
 * ImageOverlayLayers); it only participates in hit-testing, sitting BELOW the
 * markers so marker clicks are handled first and only genuine backdrop clicks
 * trigger the exit. "On a footprint" is decided by the overlay image's alpha, so
 * it matches exactly what the user sees as a bright interior shape.
 */
export class BackdropExitLayer implements Layer {
  onTileLoad?: () => void;

  private gl: WebGL2RenderingContext | null = null;
  private areas: LoadedArea[];
  private onExit: () => void;
  private loadedCount = 0;
  private static readonly MASK_MAX = 256;
  private static readonly ALPHA_HIT = 24;

  constructor(opts: { areas: Area[]; onExit: () => void }) {
    this.areas = opts.areas.map((a) => ({
      ...a,
      alpha: null,
      aw: 0,
      ah: 0,
    }));
    this.onExit = opts.onExit;
  }

  onAdd(gl: WebGL2RenderingContext): void {
    this.gl = gl;
    for (const area of this.areas) this.loadMask(area);
  }

  onRemove(): void {
    this.gl = null;
    for (const area of this.areas) area.alpha = null;
    this.loadedCount = 0;
  }

  // Nothing to draw — the bright interiors are separate ImageOverlayLayers.
  render(): void {}

  private loadMask(area: LoadedArea): void {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const scale = Math.min(
        1,
        BackdropExitLayer.MASK_MAX / Math.max(img.width, img.height),
      );
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const cv = document.createElement("canvas");
      cv.width = w;
      cv.height = h;
      const ctx = cv.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;
      const alpha = new Uint8Array(w * h);
      for (let i = 0; i < w * h; i++) alpha[i] = data[i * 4 + 3];
      area.alpha = alpha;
      area.aw = w;
      area.ah = h;
      this.loadedCount++;
    };
    img.src = area.url;
  }

  /** True if `screen` lies on this area's bright footprint. */
  private onFootprint(
    state: RenderState,
    screen: { x: number; y: number },
    area: LoadedArea,
  ): boolean {
    if (!area.alpha) return false;
    const view = state.viewMatrix;
    if (!view) return false;
    const a0 = view[0],
      b0 = view[1],
      c0 = view[3],
      d0 = view[4],
      tx = view[6],
      ty = view[7];
    const toScreen = (ll: [number, number]) => {
      const p = state.projection(ll);
      const cx = a0 * p.x + c0 * p.y + tx;
      const cy = b0 * p.x + d0 * p.y + ty;
      return {
        x: (cx * 0.5 + 0.5) * state.width,
        y: (1 - (cy * 0.5 + 0.5)) * state.height,
      };
    };
    const [[minLat, minLng], [maxLat, maxLng]] = area.bounds;
    const tl = toScreen([maxLat, minLng]);
    const br = toScreen([minLat, maxLng]);
    const left = Math.min(tl.x, br.x),
      right = Math.max(tl.x, br.x);
    const top = Math.min(tl.y, br.y),
      bottom = Math.max(tl.y, br.y);
    if (
      screen.x < left ||
      screen.x > right ||
      screen.y < top ||
      screen.y > bottom
    ) {
      return false;
    }
    // Inside bounds: sample the footprint alpha (U by lng, V=0 at maxLat).
    const u = (screen.x - left) / Math.max(1e-6, right - left);
    const v = (screen.y - top) / Math.max(1e-6, bottom - top);
    const px = Math.min(area.aw - 1, Math.max(0, Math.floor(u * area.aw)));
    const py = Math.min(area.ah - 1, Math.max(0, Math.floor(v * area.ah)));
    return area.alpha[py * area.aw + px] >= BackdropExitLayer.ALPHA_HIT;
  }

  /** hit (→ exit) for any point NOT on any interior footprint. */
  pick(state: RenderState, screen: { x: number; y: number }): boolean | null {
    // No masks decoded yet — don't intercept, let the click fall through.
    if (this.loadedCount === 0) return null;
    for (const area of this.areas) {
      if (this.onFootprint(state, screen, area)) return null; // stay
    }
    return true; // off every footprint → backdrop → exit
  }

  handleClick(state: RenderState, screen: { x: number; y: number }): void {
    if (this.pick(state, screen)) this.onExit();
  }
}
