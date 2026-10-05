import {
  buildCraftingGraph,
  chosenRecipe,
  craftableIds,
  craftDepth,
  RAW_CHOICE,
  craftStep,
  formatCraftItems,
  formatRecipeChoice,
  parseCraftItems,
  parseRecipeChoice,
  planCrafting,
  readStations,
  recipesFor,
  slotKey,
  type CraftDbCategory,
} from "./crafting";
import { parsePrice } from "./crafting-data";

const ref = (id: string, count?: number, section = "items") => ({
  id,
  section,
  ...(count ? { count } : {}),
});

// Item-level recipes (Grounded 2 / Albion style) + a recipe section with
// yields (Palworld / Dragonwilds style) + alternates (Satisfactory style).
const DB: CraftDbCategory[] = [
  {
    type: "items",
    items: [
      { id: "wood" },
      { id: "stone" },
      {
        id: "plank",
        props: {
          ingredients: [ref("wood", 2)],
          craftable: { station: "Sawbench" },
        },
      },
      {
        id: "arrow",
        // Mirror of recipe_arrow — must be ignored (explicit recipe wins).
        props: { ingredients: [ref("plank"), ref("stone")] },
      },
      {
        id: "bow",
        props: {
          ingredients: [ref("plank", 3), ref("string", 2)],
          craftedIn: [ref("workbench", undefined, "stations")],
        },
      },
      {
        id: "string",
        props: { ingredients: [ref("fiber", 3)], products: [ref("string", 2)] },
      },
      { id: "fiber" },
      // Empty ingredients (GK2) is not a recipe.
      { id: "nothing", props: { ingredients: [] } },
      // Cycle: seed ↔ crop.
      { id: "seed", props: { ingredients: [ref("crop")] } },
      {
        id: "crop",
        props: { ingredients: [ref("seed")], products: [ref("crop", 1)] },
      },
    ],
  },
  {
    type: "recipes",
    items: [
      {
        id: "recipe_arrow",
        props: {
          ingredients: [ref("plank"), ref("stone")],
          products: [ref("arrow", 10)],
          craftable: { station: "Workbench" },
        },
      },
      {
        // A recipe entry without products in a recipe section is skipped.
        id: "recipe_broken",
        props: { ingredients: [ref("wood", 1)] },
      },
      {
        // Only an alternate → the item-level recipe stays (and stays default).
        id: "recipe_plank_sawmill",
        props: {
          Alternate: "Yes",
          ingredients: [ref("wood", 1)],
          products: [ref("plank", 1)],
        },
      },
      {
        id: "recipe_alt_ingot",
        props: {
          Alternate: "Yes",
          ingredients: [ref("ore", 3)],
          products: [ref("ingot", 2)],
          producedIn: [ref("smelter", undefined, "stations")],
        },
      },
      {
        id: "recipe_slag",
        props: {
          ingredients: [ref("ore", 5)],
          products: [ref("slag", 1), ref("ingot", 1)],
        },
      },
      {
        id: "recipe_ingot",
        props: {
          ingredients: [ref("ore", 1)],
          products: [ref("ingot", 1)],
          producedIn: [ref("smelter", undefined, "stations")],
        },
      },
    ],
  },
];

describe("crafting", () => {
  const graph = buildCraftingGraph(DB);
  const key = (id: string) =>
    recipesFor(graph, id).map((i) => graph.recipes[i].key);

  it("reads item-level and section recipes, skipping mirrors and empty lists", () => {
    expect(key("plank")).toEqual(["plank", "recipe_plank_sawmill"]);
    expect(graph.recipes[graph.defaults.plank!].key).toBe("plank");
    expect(key("arrow")).toEqual(["recipe_arrow"]);
    expect(key("nothing")).toEqual([]);
    expect(key("wood")).toEqual([]);
    expect(key("recipe_broken")).toEqual([]);
    expect(key("string")).toEqual(["string"]); // self-ref yield, items stay items
    expect(graph.sectionOf.arrow).toBe("items");
    expect(graph.sectionOf.workbench).toBe("stations");
  });

  it("orders alternates: main output + standard + named recipe first", () => {
    expect(key("ingot")).toEqual([
      "recipe_ingot",
      "recipe_alt_ingot",
      "recipe_slag",
    ]);
    expect(graph.recipes[graph.defaults.ingot!].key).toBe("recipe_ingot");
  });

  it("defaults: gatherable, reverse, byproduct-only and purchases", () => {
    const g = buildCraftingGraph(
      [
        {
          type: "items",
          items: [
            {
              id: "packaged_oil",
              props: { ingredients: [ref("oil"), ref("canister")] },
            },
            { id: "ore", props: { ingredients: [ref("rock", 5)] } },
            { id: "coal", props: { _gather: true } },
            {
              id: "seed",
              props: {
                ingredients: [ref("coin", 5)],
                craftable: { station: "Shop" },
              },
            },
          ],
        },
        {
          type: "recipes",
          items: [
            {
              id: "recipe_unpackage_oil",
              props: {
                ingredients: [ref("packaged_oil")],
                products: [ref("oil"), ref("canister")],
              },
            },
            {
              id: "recipe_plastic",
              props: {
                ingredients: [ref("oil")],
                products: [ref("plastic"), ref("residue")],
              },
            },
            {
              id: "recipe_coal_iron",
              props: {
                ingredients: [ref("ore", 2)],
                products: [ref("coal", 1)],
              },
            },
            {
              id: "recipe_shop_seed",
              props: {
                ingredients: [ref("coin", 9)],
                products: [ref("seed", 1)],
              },
            },
          ],
        },
      ],
      { gatherable: ["ore"] },
    );
    expect(g.defaults.oil).toBeNull(); // only an unpackage recipe
    expect(g.defaults.canister).toBeNull(); // only as a byproduct
    expect(g.defaults.residue).toBeNull();
    expect(g.defaults.ore).toBeNull(); // gatherable option → gather
    expect(g.defaults.coal).toBeNull(); // `_gather` prop → gather
    expect(chosenRecipe(g, "ore", { ore: "ore" })).toBeDefined(); // still pickable
    expect(g.recipes[g.defaults.seed!].key).toBe("recipe_shop_seed"); // purchase as last resort
    expect(g.recipes[g.defaults.plastic!].key).toBe("recipe_plastic");
    expect(craftableIds(g).sort()).toEqual(["packaged_oil", "plastic", "seed"]);
  });

  it("a 2-recipe loop: the breakdown direction is never the default", () => {
    const g = buildCraftingGraph([
      {
        type: "recipes",
        items: [
          {
            id: "recipe_up",
            props: {
              ingredients: [ref("small", 2)],
              products: [ref("medium", 1)],
            },
          },
          {
            id: "recipe_down",
            props: {
              ingredients: [ref("medium", 1)],
              products: [ref("small", 2)],
            },
          },
        ],
      },
    ]);
    expect(g.recipes[g.defaults.medium!].key).toBe("recipe_up");
    expect(g.defaults.small).toBeNull();
    expect(planCrafting(g, [{ id: "medium", qty: 1 }]).raw).toEqual([
      { id: "small", section: "items", qty: 2 },
    ]);
  });

  it("RAW_CHOICE gathers instead of crafting", () => {
    const plan = planCrafting(graph, [{ id: "bow", qty: 1 }], {
      plank: RAW_CHOICE,
    });
    expect(plan.raw).toEqual([
      { id: "fiber", section: "items", qty: 3 },
      { id: "plank", section: "items", qty: 3 },
    ]);
  });

  it("uses the stock first: an intermediate in stock is not crafted", () => {
    // 2 bows = 6 planks (12 wood) + 4 string (2 crafts, 6 fiber).
    const plan = planCrafting(graph, [{ id: "bow", qty: 2 }], {}, { plank: 4 });
    expect(plan.raw).toEqual([
      { id: "fiber", section: "items", qty: 6 },
      { id: "wood", section: "items", qty: 4 },
    ]);
    expect(plan.crafted.find((c) => c.id === "plank")).toMatchObject({
      qty: 2,
      crafts: 2,
    });
    expect(plan.fromStock).toEqual([{ id: "plank", section: "items", qty: 4 }]);
  });

  it("stock covers a whole item and raw materials, never more than needed", () => {
    const plan = planCrafting(
      graph,
      [{ id: "bow", qty: 1 }],
      {},
      { plank: 10, fiber: 1 },
    );
    expect(plan.crafted.some((c) => c.id === "plank")).toBe(false);
    expect(plan.raw).toEqual([{ id: "fiber", section: "items", qty: 2 }]);
    expect(plan.fromStock).toEqual([
      { id: "plank", section: "items", qty: 3 },
      { id: "fiber", section: "items", qty: 1 },
    ]);
    // A stocked target is only crafted for the rest.
    expect(
      planCrafting(graph, [{ id: "bow", qty: 3 }], {}, { bow: 2 }).crafted.find(
        (c) => c.id === "bow",
      ),
    ).toMatchObject({ qty: 1, crafts: 1 });
  });

  it("normalizes the station shapes", () => {
    expect(readStations({ craftable: { station: "Forge" } })).toEqual([
      { label: "Forge" },
    ]);
    expect(readStations({ Station: "Utility" })).toEqual([
      { label: "Utility" },
    ]);
    expect(
      readStations({
        craftable: { station: "ignored when a ref exists" },
        craftedAt: { list: [ref("anvil", undefined, "building")] },
      }),
    ).toEqual([{ id: "anvil", section: "building" }]);
  });

  it("applies the yield with whole crafts", () => {
    const step = craftStep(graph, "arrow", 33);
    expect(step.crafts).toBe(4);
    expect(step.children).toEqual([
      { id: "plank", section: "items", qty: 4 },
      { id: "stone", section: "items", qty: 4 },
    ]);
  });

  it("aggregates shared intermediates before rounding", () => {
    // bow needs 2 string (1 craft of 2); a second bow adds 2 more → 2 crafts, 6 fiber.
    const plan = planCrafting(graph, [
      { id: "bow", qty: 2 },
      { id: "arrow", qty: 10 },
    ]);
    const raw = Object.fromEntries(plan.raw.map((l) => [l.id, l.qty]));
    // planks: 6 (bows) + 1 (arrow craft) = 7 → 14 wood
    expect(raw).toEqual({ wood: 14, fiber: 6, stone: 1 });
    const crafted = Object.fromEntries(
      plan.crafted.map((c) => [c.id, c.crafts]),
    );
    expect(crafted).toEqual({ bow: 2, arrow: 1, plank: 7, string: 2 });
    expect(plan.surplus).toEqual([]);
    expect(plan.stations).toEqual(
      expect.arrayContaining([
        { station: { label: "Sawbench" }, crafts: 7 },
        { station: { id: "workbench", section: "stations" }, crafts: 2 },
        { station: { label: "Workbench" }, crafts: 1 },
      ]),
    );
    // build order: products before their inputs are consumed
    expect(plan.crafted[0].id).toBe("arrow");
  });

  it("reports rounding surplus and byproducts", () => {
    const plan = planCrafting(graph, [{ id: "arrow", qty: 11 }]);
    expect(plan.surplus).toEqual([{ id: "arrow", section: "items", qty: 9 }]);
    const slag = planCrafting(graph, [{ id: "ingot", qty: 2 }], {
      ingot: "recipe_slag",
    });
    expect(slag.raw).toEqual([{ id: "ore", section: "items", qty: 10 }]);
    expect(slag.surplus).toEqual([{ id: "slag", section: "items", qty: 2 }]);
  });

  it("honours a recipe choice and ignores unknown keys", () => {
    expect(
      graph.recipes[
        chosenRecipe(graph, "ingot", { ingot: "recipe_alt_ingot" })!
      ].key,
    ).toBe("recipe_alt_ingot");
    expect(
      graph.recipes[chosenRecipe(graph, "ingot", { ingot: "nope" })!].key,
    ).toBe("recipe_ingot");
    const alt = planCrafting(graph, [{ id: "ingot", qty: 3 }], {
      ingot: "recipe_alt_ingot",
    });
    expect(alt.raw).toEqual([{ id: "ore", section: "items", qty: 6 }]);
  });

  it("stops at cycles and counts the loop input as raw", () => {
    const plan = planCrafting(graph, [{ id: "crop", qty: 3 }]);
    expect(plan.cycles).toEqual(["crop"]);
    expect(plan.raw).toEqual([{ id: "crop", section: "items", qty: 3 }]);
    expect(craftDepth(graph, "crop")).toBe(2);
    expect(craftDepth(graph, "bow")).toBe(2);
    expect(craftDepth(graph, "wood")).toBe(0);
  });

  it("handles deep chains without recursion limits", () => {
    const n = 5000;
    const items = Array.from({ length: n }, (_, i) => ({
      id: `i${i}`,
      props: i ? { ingredients: [ref(`i${i - 1}`)] } : undefined,
    }));
    const g = buildCraftingGraph([{ type: "items", items }]);
    const plan = planCrafting(g, [{ id: `i${n - 1}`, qty: 1 }]);
    expect(plan.raw).toEqual([{ id: "i0", section: "items", qty: 1 }]);
    expect(plan.crafted).toHaveLength(n - 1);
  });

  it("round-trips the share params", () => {
    const targets = parseCraftItems(
      "bow:2,arrow:33,weird%3Aid:1,bad:x,bow:1,:3",
    );
    expect(targets).toEqual([
      { id: "bow", qty: 3 },
      { id: "arrow", qty: 33 },
      { id: "weird:id", qty: 1 },
      { id: "bad", qty: 1 },
    ]);
    expect(parseCraftItems(formatCraftItems(targets))).toEqual(targets);
    expect(parseCraftItems("a:99999999")).toEqual([{ id: "a", qty: 1000000 }]);

    const choice = parseRecipeChoice("ingot:recipe_slag,arrow:nope", graph);
    expect(choice).toEqual({ ingot: "recipe_slag" });
    expect(formatRecipeChoice({ ...choice, plank: "plank" }, graph)).toBe(
      "ingot:recipe_slag",
    );
  });

  // Palia "Any Catfish": refs sharing a `group` are ONE slot, not all needed.
  describe("any-of slots", () => {
    const slotDb: CraftDbCategory[] = [
      {
        type: "recipes",
        items: [
          {
            id: "recipe_dinner",
            props: {
              ingredients: [
                { ...ref("catfish_a", 2, "fish"), group: "Any Catfish" },
                { ...ref("catfish_b", 2, "fish"), group: "Any Catfish" },
                ref("flour", undefined, "inventory"),
              ],
              products: [ref("dinner", 3, "inventory")],
            },
          },
          {
            id: "recipe_soup",
            props: {
              ingredients: [
                {
                  ...ref("catfish_a", undefined, "fish"),
                  group: "Any Catfish",
                },
                {
                  ...ref("catfish_c", undefined, "fish"),
                  group: "Any Catfish",
                },
              ],
              products: [ref("soup", undefined, "inventory")],
            },
          },
        ],
      },
    ];
    const g = buildCraftingGraph(slotDb);

    it("merges a group into one slot with the first member as default", () => {
      const r = g.recipes.find((x) => x.key === "recipe_dinner")!;
      expect(r.ingredients).toHaveLength(2);
      expect(r.ingredients[0]).toMatchObject({ id: "catfish_a", count: 2 });
      expect(r.ingredients[0].any?.options.map((o) => o.id)).toEqual([
        "catfish_a",
        "catfish_b",
      ]);
      expect(g.slots["Any Catfish"]).toEqual([
        "catfish_a",
        "catfish_b",
        "catfish_c",
      ]);
      expect(g.sectionOf.catfish_b).toBe("fish");
      expect(g.usedIn.catfish_b).toHaveLength(1);
      expect(g.usedIn.catfish_a).toHaveLength(2);
    });

    it("plans one slot amount and honours the pick", () => {
      const plan = planCrafting(g, [
        { id: "dinner", qty: 10 },
        { id: "soup", qty: 1 },
      ]);
      // 4 crafts × 2 + 1 = 9 of the default member, nothing of the others.
      expect(plan.raw).toEqual([
        { id: "catfish_a", section: "fish", qty: 9 },
        { id: "flour", section: "inventory", qty: 4 },
      ]);
      expect(plan.slots).toEqual([
        { group: "Any Catfish", id: "catfish_a", qty: 9 },
      ]);
      // catfish_c is not an option for the dinner: the dinner keeps its default.
      const picked = planCrafting(
        g,
        [
          { id: "dinner", qty: 3 },
          { id: "soup", qty: 1 },
        ],
        {
          [slotKey("Any Catfish")]: "catfish_b",
        },
      );
      expect(picked.raw).toEqual([
        { id: "catfish_b", section: "fish", qty: 2 },
        { id: "catfish_a", section: "fish", qty: 1 },
        { id: "flour", section: "inventory", qty: 1 },
      ]);
      expect(
        craftStep(g, "dinner", 3, { "~Any Catfish": "catfish_b" }).children[0],
      ).toEqual({
        id: "catfish_b",
        section: "fish",
        qty: 2,
        group: "Any Catfish",
      });
    });

    it("round-trips slot picks in the share param", () => {
      const choice = parseRecipeChoice(
        "~Any%20Catfish:catfish_c,~Any%20Catfish:nope",
        g,
      );
      expect(choice).toEqual({ "~Any Catfish": "catfish_c" });
      expect(formatRecipeChoice(choice, g)).toBe("~Any%20Catfish:catfish_c");
      expect(formatRecipeChoice({ "~Any Catfish": "catfish_a" }, g)).toBe("");
    });
  });

  it("parses price labels", () => {
    expect(parsePrice("190 gold")).toEqual({ amount: 190, currency: "gold" });
    expect(parsePrice("1,200 Fishing Medals")).toEqual({
      amount: 1200,
      currency: "Fishing Medals",
    });
    expect(parsePrice("free")).toBeNull();
    expect(parsePrice(undefined)).toBeNull();
  });
});
