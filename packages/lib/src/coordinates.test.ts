import { getSpawnDiscoveryId, removeDiscoveredMatches } from "./coordinates";

describe("getSpawnDiscoveryId", () => {
  it("uses spawn.id for private spawns", () => {
    expect(
      getSpawnDiscoveryId("iron_ore", {
        id: "my_private_node",
        isPrivate: true,
        p: [1, 2],
      }),
    ).toBe("my_private_node");
  });

  it("builds id@x:y from spawn.id and position", () => {
    expect(
      getSpawnDiscoveryId("iron_ore", { id: "iron_ore_1", p: [10.5, -3] }),
    ).toBe("iron_ore_1@10.5:-3");
  });

  it("falls back to the node type when spawn has no id", () => {
    expect(getSpawnDiscoveryId("iron_ore", { p: [10.5, -3] })).toBe(
      "iron_ore@10.5:-3",
    );
  });
});

describe("removeDiscoveredMatches", () => {
  it("removes exact matches and keeps everything else", () => {
    expect(
      removeDiscoveredMatches(
        ["iron_ore@1:2", "chest@100:200", "iron_ore@50:60"],
        ["iron_ore@1:2", "iron_ore@50:60"],
      ),
    ).toEqual(["chest@100:200"]);
  });

  it("removes bare base-id entries for targeted types", () => {
    // A stored bare "iron_ore" marks ALL iron_ore discovered; undiscover-all
    // for the type must drop it (mirrors settings.ts per-id removal).
    expect(
      removeDiscoveredMatches(["iron_ore", "chest@1:2"], ["iron_ore@5:6"]),
    ).toEqual(["chest@1:2"]);
  });

  it("removes coordinate matches within tolerance (legacy/precision drift)", () => {
    // Stored at live-read precision, targeted at full extracted precision.
    expect(
      removeDiscoveredMatches(["iron_ore@10.50:20.00"], ["iron_ore@10.5:20"]),
    ).toEqual([]);
    // Within COORD_MATCH_TOLERANCE (1 unit).
    expect(
      removeDiscoveredMatches(["iron_ore@10.9:20"], ["iron_ore@10.5:20"]),
    ).toEqual([]);
  });

  it("keeps entries of the same type outside tolerance", () => {
    expect(
      removeDiscoveredMatches(["iron_ore@500:500"], ["iron_ore@10.5:20"]),
    ).toEqual(["iron_ore@500:500"]);
  });

  it("returns the same array reference when nothing matches", () => {
    const existing = ["chest@1:2"];
    expect(removeDiscoveredMatches(existing, ["iron_ore@5:6"])).toBe(existing);
  });
});
