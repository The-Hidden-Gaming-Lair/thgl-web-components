import type { Layer, RenderState } from "../types";

/**
 * Invisible pick-only layer used on interior (layer) maps: a click anywhere that
 * is NOT on the interior's footprint — i.e. on the transparent, dimmed backdrop
 * around/through the plan — exits back to the surface.
 *
 * It renders nothing (the visible interior is a separate ImageOverlayLayer); it
 * only participates in hit-testing, sitting BELOW the markers so marker clicks
 * are handled first and only genuine backdrop clicks trigger the exit. "On the
 * footprint" is decided by the overlay image's alpha, so it matches exactly what
 * the user sees as the bright interior shape.
 */
export class BackdropExitLayer implements Layer {
  onTileLoad?: () => void;

  private gl: WebGL2RenderingContext | null = null;
  private bounds: [[number, number], [number, number]];
  private url: string;
  private onExit: () => void;
  private alpha: Uint8Array | null = null;
  private aw = 0;
  private ah = 0;
  private static readonly MASK_MAX = 256;
  private static readonly ALPHA_HIT = 24;

  constructor(opts: {
    bounds: [[number, number], [number, number]];
    url: string;
    onExit: () => void;
  }) {
    this.bounds = opts.bounds;
    this.url = opts.url;
    this.onExit = opts.onExit;
  }

  onAdd(gl: WebGL2RenderingContext): void {
    this.gl = gl;
    this.loadMask();
  }

  onRemove(): void {
    this.gl = null;
    this.alpha = null;
  }

  // Nothing to draw — the bright interior is a separate ImageOverlayLayer.
  render(): void {}

  private loadMask(): void {
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
      this.alpha = alpha;
      this.aw = w;
      this.ah = h;
    };
    img.src = this.url;
  }

  /** hit (→ exit) for any point NOT on the interior footprint. */
  pick(state: RenderState, screen: { x: number; y: number }): boolean | null {
    if (!this.alpha) return null; // mask not ready — don't intercept
    const view = state.viewMatrix;
    if (!view) return null;
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
    const [[minLat, minLng], [maxLat, maxLng]] = this.bounds;
    const tl = toScreen([maxLat, minLng]);
    const br = toScreen([minLat, maxLng]);
    const left = Math.min(tl.x, br.x),
      right = Math.max(tl.x, br.x);
    const top = Math.min(tl.y, br.y),
      bottom = Math.max(tl.y, br.y);
    // Outside the interior's bounds entirely → definitely backdrop → exit.
    if (
      screen.x < left ||
      screen.x > right ||
      screen.y < top ||
      screen.y > bottom
    ) {
      return true;
    }
    // Inside bounds: sample the footprint alpha (U by lng, V=0 at maxLat).
    const u = (screen.x - left) / Math.max(1e-6, right - left);
    const v = (screen.y - top) / Math.max(1e-6, bottom - top);
    const px = Math.min(this.aw - 1, Math.max(0, Math.floor(u * this.aw)));
    const py = Math.min(this.ah - 1, Math.max(0, Math.floor(v * this.ah)));
    // On the footprint → stay; transparent (a hole/edge) → backdrop → exit.
    return this.alpha[py * this.aw + px] >= BackdropExitLayer.ALPHA_HIT
      ? null
      : true;
  }

  handleClick(state: RenderState, screen: { x: number; y: number }): void {
    if (this.pick(state, screen)) this.onExit();
  }
}
