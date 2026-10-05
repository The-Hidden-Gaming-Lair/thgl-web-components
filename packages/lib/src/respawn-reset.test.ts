import { findRespawnedDiscoveredNodes } from "./respawn-reset";
import type { Actor } from "./overwolf/plugin";

const actor = (address: number, type: string, extra: Partial<Actor> = {}) =>
  ({ address, type, x: 10, y: 20, z: 0, r: 0, ...extra }) as Actor;

const base = {
  typesIdMap: { BP_Ore_C: "ore", BP_Chest_C: "chest", BP_Player_C: "player" },
  positionedTypes: new Set(["ore", "chest"]),
  permanentTypes: new Set(["chest"]),
  isDiscovered: () => true,
};

describe("findRespawnedDiscoveredNodes", () => {
  it("resets a discovered respawning node that becomes available", () => {
    const { available, respawned } = findRespawnedDiscoveredNodes({
      ...base,
      actors: [actor(1, "BP_Ore_C")],
      previouslyAvailable: new Set(),
    });
    expect(respawned).toEqual(["ore@10.00:20.00"]);
    expect([...available]).toEqual([1]);
  });

  it("ignores a node that was already available (discovered before harvest)", () => {
    const { respawned } = findRespawnedDiscoveredNodes({
      ...base,
      actors: [actor(1, "BP_Ore_C")],
      previouslyAvailable: new Set([1]),
    });
    expect(respawned).toEqual([]);
  });

  it("treats hidden (depleted) and collected actors as not available", () => {
    const { available, respawned } = findRespawnedDiscoveredNodes({
      ...base,
      actors: [
        actor(1, "BP_Ore_C", { hidden: true }),
        actor(2, "BP_Ore_C", { discovered: true }),
      ],
      previouslyAvailable: new Set(),
    });
    expect(respawned).toEqual([]);
    expect(available.size).toBe(0);
  });

  it("never resets permanent or non-positioned types", () => {
    const { respawned } = findRespawnedDiscoveredNodes({
      ...base,
      actors: [actor(1, "BP_Chest_C"), actor(2, "BP_Player_C")],
      previouslyAvailable: new Set(),
    });
    expect(respawned).toEqual([]);
  });

  it("skips undiscovered nodes and uses the resolver id", () => {
    const { respawned } = findRespawnedDiscoveredNodes({
      ...base,
      actors: [actor(1, "BP_Ore_C"), actor(2, "BP_Ore_C", { x: 99 })],
      previouslyAvailable: new Set(),
      isDiscovered: (id) => id === "static_ore@99:20",
      resolveNodeId: (a) => `static_ore@${a.x}:${a.y}`,
    });
    expect(respawned).toEqual(["static_ore@99:20"]);
  });
});
