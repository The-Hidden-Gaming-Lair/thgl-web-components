// Regression (inbox #849, Palia Overwolf app): after a GPU reset the map icons stayed
// invisible until the app restarted, only the shader-drawn above/below arrows remained.
// A reset clears the accelerated 2D canvases the texture atlas packs icons into, and the
// WebGL re-upload copied those blank pages. The atlas must repaint its pages from the
// source images, on the canvas' `contextrestored` and when the layer is re-added.

class FakeCanvas {
  width = 64;
  height = 64;
  listeners: Record<string, () => void> = {};
  ctx = { clearRect: jest.fn(), drawImage: jest.fn() };
  getContext() {
    return this.ctx;
  }
  addEventListener(type: string, fn: () => void) {
    this.listeners[type] = fn;
  }
}
// The suite runs in Node: give the layer's `instanceof` checks and the atlas pages a canvas.
(globalThis as Record<string, unknown>).HTMLCanvasElement = FakeCanvas;
(globalThis as Record<string, unknown>).HTMLImageElement = class {};
const pages: FakeCanvas[] = [];
(globalThis as Record<string, unknown>).document = {
  createElement: () => {
    const page = new FakeCanvas();
    pages.push(page);
    return page;
  },
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { IconMarkerLayer } =
  require("./icon-markers") as typeof import("./icon-markers");

type Atlas = { dirtyPages: Set<string>; repaint(page?: string): void };

describe("IconMarkerLayer texture atlas after a GPU reset", () => {
  it("repaints a page from its source images when the canvas is restored", () => {
    const layer = new IconMarkerLayer();
    const onSheetLoad = jest.fn();
    layer.onSheetLoad = onSheetLoad;
    const icon = new FakeCanvas();
    layer.addSheet("a.webp", icon as unknown as HTMLCanvasElement);
    const atlas = (layer as unknown as { atlas: Atlas }).atlas;
    const page = pages[pages.length - 1];
    atlas.dirtyPages.clear();
    page.ctx.drawImage.mockClear();

    page.listeners["contextrestored"]();

    expect(page.ctx.drawImage).toHaveBeenCalledWith(icon, 0, 0, 64, 64);
    expect(atlas.dirtyPages.has("__atlas_0__")).toBe(true);
    expect(onSheetLoad).toHaveBeenCalled();
  });

  it("repaint() without a page name (onAdd after a WebGL context loss) redraws every page", () => {
    const layer = new IconMarkerLayer();
    const icon = new FakeCanvas();
    layer.addSheet("b.webp", icon as unknown as HTMLCanvasElement);
    const atlas = (layer as unknown as { atlas: Atlas }).atlas;
    const page = pages[pages.length - 1];
    page.ctx.drawImage.mockClear();

    atlas.repaint();

    expect(page.ctx.drawImage).toHaveBeenCalledWith(icon, 0, 0, 64, 64);
  });
});
