// bun test apps/games-web/scripts/db-singularize.test.ts
/**
 * DB page titles singularize the tenant's plural `typeLabels`. The "-oes" rule
 * used to strip "es" after any "o", so Soulframe's "Foes" became "Fo"
 * (data-forge inbox #519).
 */
import { describe, expect, test } from "bun:test";
import { singularize } from "../src/lib/db/seo";

describe("singularize", () => {
  test("-oes keeps the e unless the singular ends in o", () => {
    expect(singularize("Foes")).toBe("Foe");
    expect(singularize("Shoes")).toBe("Shoe");
    expect(singularize("Toes")).toBe("Toe");
    expect(singularize("Heroes")).toBe("Hero");
    expect(singularize("Echoes")).toBe("Echo");
    expect(singularize("Potatoes")).toBe("Potato");
  });

  test("the other rules are unchanged", () => {
    expect(singularize("Resonators")).toBe("Resonator");
    expect(singularize("Status Effects")).toBe("Status Effect");
    expect(singularize("Abilities")).toBe("Ability");
    expect(singularize("Torches")).toBe("Torch");
    expect(singularize("Boxes")).toBe("Box");
    expect(singularize("Bosses")).toBe("Boss");
    expect(singularize("Status")).toBe("Status");
    expect(singularize("Weapons & Tools")).toBe("Weapons & Tools");
    expect(singularize("Equipment")).toBe("Equipment");
  });
});
