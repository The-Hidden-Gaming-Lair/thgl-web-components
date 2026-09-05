import {
  buildPrivateIconLookups,
  resolvePrivateIcon,
  type IconCoords,
} from "./private-icons";

const coords = (x: number, y: number): IconCoords => ({
  x,
  y,
  width: 32,
  height: 32,
});

const spriteIcon = (over: Partial<Record<string, unknown>> = {}) => ({
  name: "Campsite",
  url: "/icons/game.webp",
  x: 10,
  y: 10,
  width: 32,
  height: 32,
  ...over,
});

describe("resolvePrivateIcon", () => {
  const byFilterId = new Map([["campsite", coords(99, 64)]]);
  const byName = new Map([
    ["Campsite", { ...coords(99, 64), filterId: "campsite" }],
  ]);

  it("refreshes stale sprite coords for a node that carries a filterId", () => {
    // THE regression this file exists for: the sprite sheet was repacked, so
    // the coords saved with the node point at the wrong rectangle. Nodes with
    // a filterId are every node saved since the icon picker started stamping
    // it — before this, they were trusted forever and rendered the wrong icon.
    const icon = spriteIcon({ filterId: "campsite" });
    const out = resolvePrivateIcon(icon, byFilterId, byName)!;
    expect(out.x).toBe(99);
    expect(out.y).toBe(64);
    expect(out.filterId).toBe("campsite");
    expect(out.name).toBe("Campsite"); // identity fields untouched
  });

  it("returns the SAME reference when the coords already match", () => {
    // Hot path: runs per node per render, and the WebGL renderer keys marker
    // recreation on icon identity — a fresh object every frame would churn.
    const icon = spriteIcon({ filterId: "campsite", x: 99, y: 64 });
    expect(resolvePrivateIcon(icon, byFilterId, byName)).toBe(icon);
  });

  it("leaves a filterId that is no longer in this game's filters alone", () => {
    // Value removed by a regen, or a non-sprite (plain URL) icon the picker
    // stored with zeroed coords: no entry to resolve, so don't touch it.
    const icon = spriteIcon({ filterId: "removed_type" });
    expect(resolvePrivateIcon(icon, byFilterId, byName)).toBe(icon);
  });

  it("falls back to the translated name for legacy nodes without a filterId", () => {
    const icon = spriteIcon(); // no filterId
    const out = resolvePrivateIcon(icon, byFilterId, byName)!;
    expect(out.x).toBe(99);
    expect(out.y).toBe(64);
    // Adopts the id so it resolves by the stable strategy from now on.
    expect(out.filterId).toBe("campsite");
  });

  it("does not name-resolve a user-supplied icon URL", () => {
    // Not a slice of the app sprite sheet — its stored size is its own.
    const icon = spriteIcon({ url: "https://example.com/my-icon.png" });
    expect(resolvePrivateIcon(icon, byFilterId, byName)).toBe(icon);
  });

  it("leaves a legacy node whose icon name is unknown alone", () => {
    const icon = spriteIcon({ name: "Renamed Away" });
    expect(resolvePrivateIcon(icon, byFilterId, byName)).toBe(icon);
  });

  it("passes a null icon through untouched", () => {
    expect(resolvePrivateIcon(null, byFilterId, byName)).toBeNull();
  });

  it("prefers filterId over the name when the two disagree", () => {
    // The node was saved in another language, or the display name moved to a
    // different type. The stable id must win.
    const ids = new Map([["campsite", coords(1, 1)]]);
    const names = new Map([
      ["Campsite", { ...coords(500, 500), filterId: "other" }],
    ]);
    const icon = spriteIcon({ filterId: "campsite" });
    const out = resolvePrivateIcon(icon, ids, names)!;
    expect(out.x).toBe(1);
    expect(out.filterId).toBe("campsite");
  });
});

describe("buildPrivateIconLookups", () => {
  const t = (id: string) => (id === "campsite" ? "Campsite" : `T:${id}`);

  it("indexes sprite values by id and by translated name", () => {
    const filters = [
      {
        values: [
          { id: "campsite", icon: coords(99, 64) },
          { id: "chest", icon: coords(0, 32) },
        ],
      },
    ];
    const { byFilterId, byName } = buildPrivateIconLookups(filters, t);
    expect(byFilterId.get("campsite")).toEqual(coords(99, 64));
    expect(byName.get("Campsite")).toEqual({
      ...coords(99, 64),
      filterId: "campsite",
    });
    expect(byName.get("T:chest")?.filterId).toBe("chest");
  });

  it("skips string icons (a URL, not a sprite rect)", () => {
    const filters = [{ values: [{ id: "url_icon", icon: "/some/icon.webp" }] }];
    const { byFilterId, byName } = buildPrivateIconLookups(filters, t);
    expect(byFilterId.size).toBe(0);
    expect(byName.size).toBe(0);
  });

  it("keeps the first value when two share a display name", () => {
    const filters = [
      {
        values: [
          { id: "a", icon: coords(1, 1) },
          { id: "b", icon: coords(2, 2) },
        ],
      },
    ];
    const { byFilterId, byName } = buildPrivateIconLookups(
      filters,
      () => "Dup",
    );
    // Ambiguous by name — but both stay individually addressable by id.
    expect(byName.get("Dup")?.filterId).toBe("a");
    expect(byFilterId.get("b")).toEqual(coords(2, 2));
  });
});
