import type { FiltersConfig } from "./config";
import {
  findMixedDbEntries,
  hasGuideTracker,
  isSightingGuide,
  narrowMixedDbEntries,
} from "./db-map-links";

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

describe("narrowMixedDbEntries", () => {
  const refs = [
    { section: "inventory", id: "item_recipe_cooking_fish_stew" },
    { section: "inventory", id: "item_recipe_cooking_sashimi" },
  ];

  test("a guide about one of the entries keeps only that one", () => {
    expect(
      narrowMixedDbEntries(refs, [
        "fish/fish_gillyfin",
        "inventory/item_recipe_cooking_fish_stew",
      ]),
    ).toEqual([refs[0]]);
  });

  test("a guide about none of them keeps all", () => {
    expect(narrowMixedDbEntries(refs, ["fish/fish_gillyfin"])).toEqual(refs);
  });
});

describe("isSightingGuide", () => {
  const sightingFilters: FiltersConfig = [
    {
      group: "fishing_common",
      category: "cat_fishing",
      values: [{ id: "Fish_Gillyfin", icon: "x" }],
    },
    {
      group: "treasures",
      values: [{ id: "Chest", icon: "x" }],
    },
  ];

  test("a type in a sighting category has no tracker", () => {
    expect(
      isSightingGuide(["Fish_Gillyfin"], sightingFilters, ["cat_fishing"]),
    ).toBe(true);
  });

  test("a sighting group matches by group id too", () => {
    expect(
      isSightingGuide(["Fish_Gillyfin"], sightingFilters, ["fishing_common"]),
    ).toBe(true);
  });

  test("fixed spawns keep the tracker, also when mixed with sightings", () => {
    expect(isSightingGuide(["Chest"], sightingFilters, ["cat_fishing"])).toBe(
      false,
    );
    expect(
      isSightingGuide(["Fish_Gillyfin", "Chest"], sightingFilters, [
        "cat_fishing",
      ]),
    ).toBe(false);
  });

  test("games without sightingFilters keep the tracker", () => {
    expect(isSightingGuide(["Fish_Gillyfin"], sightingFilters, undefined)).toBe(
      false,
    );
  });
});

describe("hasGuideTracker", () => {
  const filters: FiltersConfig = [
    {
      group: "mining",
      category: "cat_mining",
      values: [{ id: "Clay", icon: "x" }],
    },
    {
      group: "treasures",
      values: [{ id: "Chest", icon: "x" }],
    },
    {
      group: "foraging_special",
      values: [
        { id: "QuestItem", icon: "x" },
        { id: "FlowSpark", icon: "x" },
      ],
    },
  ];
  const tracked = ["treasures", "QuestItem"];

  test("games without trackerFilters track every guide", () => {
    expect(hasGuideTracker(["Clay"], filters, undefined)).toBe(true);
  });

  test("one-time spots keep the tracker, by group or type id", () => {
    expect(hasGuideTracker(["Chest"], filters, tracked)).toBe(true);
    expect(hasGuideTracker(["QuestItem"], filters, tracked)).toBe(true);
  });

  test("respawning nodes have no tracker, also when mixed with one-time spots", () => {
    expect(hasGuideTracker(["Clay"], filters, tracked)).toBe(false);
    expect(hasGuideTracker(["FlowSpark"], filters, tracked)).toBe(false);
    expect(hasGuideTracker(["Chest", "Clay"], filters, tracked)).toBe(false);
  });
});
