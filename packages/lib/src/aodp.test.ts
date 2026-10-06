import { aodpItemId, aodpPrices, aodpPriceUrls, type AodpRow } from "./aodp";

const row = (over: Partial<AodpRow>): AodpRow => ({
  item_id: "T4_PLANKS",
  city: "Martlock",
  quality: 1,
  sell_price_min: 0,
  sell_price_min_date: "0001-01-01T00:00:00",
  buy_price_max: 0,
  buy_price_max_date: "0001-01-01T00:00:00",
  ...over,
});

describe("aodp", () => {
  it("maps codex ids to market ids", () => {
    expect(aodpItemId("t4_2h_bow")).toBe("T4_2H_BOW");
    expect(aodpItemId("t4_wood_level1")).toBe("T4_WOOD_LEVEL1@1");
    expect(aodpItemId("t6_planks_level3")).toBe("T6_PLANKS_LEVEL3@3");
    // Not enchanted resources: the level is part of the id.
    expect(aodpItemId("t1_fishsauce_level2")).toBe("T1_FISHSAUCE_LEVEL2");
    expect(aodpItemId("t1_alchemy_extract_level1")).toBe(
      "T1_ALCHEMY_EXTRACT_LEVEL1",
    );
  });

  it("builds deduplicated, length-capped urls", () => {
    const [url] = aodpPriceUrls(
      "europe",
      ["t4_planks", "t4_planks", "t4_wood_level1"],
      ["Fort Sterling"],
    );
    expect(url).toBe(
      "https://europe.albion-online-data.com/api/v2/stats/prices/T4_PLANKS,T4_WOOD_LEVEL1%401.json?locations=Fort%20Sterling&qualities=1",
    );
    const many = Array.from({ length: 600 }, (_, i) => `t4_item_${i}`);
    const urls = aodpPriceUrls("americas", many, ["Caerleon"]);
    expect(urls.length).toBeGreaterThan(1);
    for (const u of urls) {
      expect(u.startsWith("https://west.")).toBe(true);
      expect(u.length).toBeLessThanOrEqual(3800);
    }
    expect(urls.join(",").match(/T4_ITEM_\d+/g)).toHaveLength(600);
  });

  it("reads the cheapest sell order of the city, skipping unseen prices", () => {
    const prices = aodpPrices(
      [
        row({
          sell_price_min: 342,
          sell_price_min_date: "2026-10-06T10:45:00",
        }),
        row({ item_id: "T4_WOOD" }),
        row({ city: "Caerleon", sell_price_min: 496 }),
      ],
      "Martlock",
    );
    expect(prices).toEqual({
      T4_PLANKS: { amount: 342, seenAt: Date.UTC(2026, 9, 6, 10, 45) },
    });
  });

  it("reads the best buy order at the Black Market", () => {
    const prices = aodpPrices(
      [
        row({
          item_id: "T4_2H_BOW",
          city: "Black Market",
          sell_price_min: 1,
          sell_price_min_date: "2026-10-06T10:45:00",
          buy_price_max: 9000,
          buy_price_max_date: "2026-10-06T11:00:00Z",
        }),
      ],
      "Black Market",
    );
    expect(prices.T4_2H_BOW).toEqual({
      amount: 9000,
      seenAt: Date.UTC(2026, 9, 6, 11),
    });
  });
});
