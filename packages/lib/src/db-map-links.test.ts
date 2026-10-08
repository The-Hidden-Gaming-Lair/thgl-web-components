import type { FiltersConfig } from "./config";
import { findMixedDbEntries } from "./db-map-links";

const filters: FiltersConfig = [
  {
    group: "fishing_misc",
    values: [
      {
        id: "Fish_Jackpot_Recipe_Cooking_FishStew",
        icon: "x",
        mixedDbEntries: [
          { section: "inventory", id: "item_recipe_cooking_fish_stew" },
          { section: "inventory", id: "item_recipe_cooking_sashimi" },
        ],
      },
      { id: "Fish_Gillyfin", icon: "x", dbSection: "fish" },
    ],
  },
  {
    group: "fishing_misc_star",
    values: [
      {
        id: "Fish_Jackpot_Recipe_Cooking_FishStew_star",
        icon: "x",
        mixedDbEntries: [
          { section: "inventory", id: "item_recipe_cooking_sashimi" },
        ],
      },
    ],
  },
];

describe("findMixedDbEntries", () => {
  test("a mixed type names each entry once, in filter order", () => {
    expect(
      findMixedDbEntries(
        [
          "Fish_Jackpot_Recipe_Cooking_FishStew",
          "Fish_Jackpot_Recipe_Cooking_FishStew_star",
        ],
        filters,
      ),
    ).toEqual([
      { section: "inventory", id: "item_recipe_cooking_fish_stew" },
      { section: "inventory", id: "item_recipe_cooking_sashimi" },
    ]);
  });

  test("a plain type keeps its map (no mixed entries)", () => {
    expect(findMixedDbEntries(["Fish_Gillyfin"], filters)).toEqual([]);
  });
});
