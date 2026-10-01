// Regression: the texture atlas packs any image <= 512 px as ONE icon. A game's whole
// marker sprite sheet small enough to qualify (AION 2: 430x500) was packed, and every
// marker in the codex location maps drew the entire sheet instead of its own cell.
// Sprite sheets are registered with { atlas: false } and must never reach the atlas.

class FakeCanvas {
  width = 430;
  height = 500;
}
// The suite runs in Node: give the layer's `instanceof` checks something to test against.
(globalThis as Record<string, unknown>).HTMLCanvasElement = FakeCanvas;
(globalThis as Record<string, unknown>).HTMLImageElement = class {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { IconMarkerLayer } =
  require("./icon-markers") as typeof import("./icon-markers");

function layerWithSpy() {
  const layer = new IconMarkerLayer();
  const add = jest.fn(() => null);
  (layer as unknown as { atlas: { add: typeof add } }).atlas.add = add;
  return { layer, add };
}

describe("IconMarkerLayer sprite sheets and the texture atlas", () => {
  it("never atlas-packs a sheet registered with { atlas: false }", () => {
    const { layer, add } = layerWithSpy();
    layer.addSheet("icons", new FakeCanvas() as unknown as HTMLCanvasElement, {
      atlas: false,
    });
    expect(add).not.toHaveBeenCalled();
  });

  it("still atlas-packs single icons by default", () => {
    const { layer, add } = layerWithSpy();
    layer.addSheet(
      "single.webp",
      new FakeCanvas() as unknown as HTMLCanvasElement,
    );
    expect(add).toHaveBeenCalledTimes(1);
  });

  it("keeps the opt-out when sheets are copied to another layer", () => {
    const { layer } = layerWithSpy();
    layer.addSheet("icons", new FakeCanvas() as unknown as HTMLCanvasElement, {
      atlas: false,
    });
    const { layer: target, add } = layerWithSpy();
    layer.copySheets(target);
    expect(add).not.toHaveBeenCalled();
  });
});
