import {
  prismanaRotation,
  prismanaSpotPath,
  sortPrismanaSources,
  type PrismanaData,
} from "./aniimo-prismana";

// Two rotation weeks; Europe opens 8 h after Asia (Mon 04:00 UTC+8 vs UTC+0).
const WEEK = 7 * 86400;
const A1 = 1_789_934_400; // Mon 2026-09-21 04:00 UTC+8
const E1 = A1 + 8 * 3600;
const DATA: Pick<PrismanaData, "hidden"> = {
  hidden: {
    regions: ["asia", "europe"],
    weeks: [
      {
        week: 2,
        start: { asia: A1 + WEEK, europe: E1 + WEEK },
        end: { asia: A1 + 2 * WEEK, europe: E1 + 2 * WEEK },
        species: [{ id: "melloblum", node: "m2@0:0", map: "idyll" }],
      },
      {
        week: 1,
        start: { asia: A1, europe: E1 },
        end: { asia: A1 + WEEK, europe: E1 + WEEK },
        species: [{ id: "glynsera", node: "m1@0:0", map: "idyll" }],
      },
    ],
  },
};

describe("prismanaRotation", () => {
  it("finds the open week and the time until it closes", () => {
    const now = (A1 + 3600) * 1000;
    const r = prismanaRotation(DATA.hidden.weeks, "asia", now);
    expect(r.current?.week).toBe(1);
    expect(r.next?.week).toBe(2);
    expect(r.msLeft).toBe((WEEK - 3600) * 1000);
  });

  it("uses each region's own clock", () => {
    // Asia's week 1 is open, Europe's has not started yet.
    const now = (A1 + 3600) * 1000;
    const r = prismanaRotation(DATA.hidden.weeks, "europe", now);
    expect(r.current).toBeUndefined();
    expect(r.next?.week).toBe(1);
    expect(r.msLeft).toBe(7 * 3600 * 1000);
  });

  it("switches exactly at the window boundary", () => {
    const r = prismanaRotation(DATA.hidden.weeks, "asia", (A1 + WEEK) * 1000);
    expect(r.current?.week).toBe(2);
    expect(r.next).toBeUndefined();
  });

  it("is empty after the last scheduled week", () => {
    const r = prismanaRotation(
      DATA.hidden.weeks,
      "asia",
      (A1 + 3 * WEEK) * 1000,
    );
    expect(r).toEqual({
      current: undefined,
      next: undefined,
      msLeft: undefined,
    });
  });
});

describe("helpers", () => {
  it("orders sources map spots first", () => {
    const sorted = sortPrismanaSources([
      { kind: "evolve", from: "iris" },
      { kind: "egg", item: "item_1", source: "s" },
      { kind: "flow", node: "m1@1:2", map: "idyll" },
    ]);
    expect(sorted.map((s) => s.kind)).toEqual(["flow", "egg", "evolve"]);
  });

  it("builds the marker deep link", () => {
    expect(
      prismanaSpotPath({ node: "m91072325@451.35:-1281.63", map: "idyll" }),
    ).toBe(
      "/maps/idyll/rainbow_spawn/m91072325%40451.35%3A-1281.63?id=m91072325%40451.35%3A-1281.63",
    );
  });
});
