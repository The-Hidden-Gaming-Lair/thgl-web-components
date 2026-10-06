import { buildCraftingGraph } from "./crafting";
import { craftingSellPrices, slimCraftingSource } from "./crafting-data";
import type { DatabaseConfig } from "./config";

describe("crafting sell prices", () => {
  const db = [
    {
      type: "inventory",
      items: [
        {
          id: "bar",
          props: {
            "Sell Price": 110,
            ingredients: [{ id: "ore", section: "inventory", count: 5 }],
          },
        },
        { id: "ore", props: { "Sell Value": 14 } },
        // Not a sell price: a bare "Price" is a shop price in some games.
        { id: "gem", props: { Price: 900 } },
        // Not in any recipe.
        { id: "hat", props: { "Sell Price": 50 } },
      ],
    },
  ] as unknown as DatabaseConfig;

  it("reads Sell Price / Sell Value of recipe items only", () => {
    const graph = buildCraftingGraph(slimCraftingSource(db));
    expect(craftingSellPrices(db, graph)).toEqual({ bar: 110, ore: 14 });
  });
});
