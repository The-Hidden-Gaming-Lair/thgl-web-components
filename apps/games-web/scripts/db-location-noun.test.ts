// bun test apps/games-web/scripts/db-location-noun.test.ts
/**
 * data-forge writes the "Found at N …" noun as English text; the page shows it
 * in its own locale through the UI dict's `db.noun.*` keys (data-forge inbox
 * #958: Palia's /ja/db/critters/critter_rabbit_t3 read "353 SIGHTINGSで入手可能").
 */
import { describe, expect, test } from "bun:test";
import { locationNoun } from "../src/lib/db/seo";
import ja from "../../../packages/ui/src/dicts/ja.json";

describe("locationNoun", () => {
  test("English nouns resolve through the UI dict", () => {
    const loc = { total: 353, noun: "sighting", nounPlural: "sightings" };
    expect(locationNoun(ja, loc)).toBe("目撃地点");
    expect(
      locationNoun(ja, {
        total: 2,
        noun: "spawn point",
        nounPlural: "spawn points",
      }),
    ).toBe("出現ポイント");
  });

  test("the default location noun uses db.location(s)", () => {
    expect(
      locationNoun(ja, { total: 1, noun: "location", nounPlural: "locations" }),
    ).toBe("場所");
    expect(locationNoun(ja, { total: 5 })).toBe("場所");
    expect(locationNoun({}, { total: 5 })).toBe("locations");
  });

  test("a game dict key wins, an unknown noun stays as written", () => {
    const dict = { label_pickups: "Fundstücke" };
    expect(
      locationNoun(dict, {
        total: 3,
        noun: "label_pickup",
        nounPlural: "label_pickups",
      }),
    ).toBe("Fundstücke");
    expect(
      locationNoun({}, { total: 3, noun: "geyser", nounPlural: "geysers" }),
    ).toBe("geysers");
  });
});
