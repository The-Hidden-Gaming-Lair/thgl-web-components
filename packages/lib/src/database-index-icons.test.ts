import { expandIndexIcons, type DatabaseConfig } from "./config";

describe("expandIndexIcons", () => {
  test("derives db icons, drops null icons, keeps explicit ones", () => {
    const sprite = { url: "icons.webp", x: 5, y: 6, width: 64, height: 64 };
    const index = [
      {
        type: "creatures",
        dbIcon: { width: 64, height: 64 },
        items: [
          { id: "a" },
          { id: "b", icon: null },
          { id: "c", icon: sprite },
        ],
      },
      { type: "plain", items: [{ id: "d" }] },
    ] as unknown as DatabaseConfig;

    const out = expandIndexIcons(index);

    expect(out).toEqual([
      {
        type: "creatures",
        items: [
          {
            id: "a",
            icon: { url: "db/a.webp", x: 0, y: 0, width: 64, height: 64 },
          },
          { id: "b" },
          { id: "c", icon: sprite },
        ],
      },
      { type: "plain", items: [{ id: "d" }] },
    ]);
    // Idempotent on the memory-cached object.
    expect(expandIndexIcons(out)).toBe(out);
    expect(out[0]!.items[1]).toEqual({ id: "b" });
  });
});
