import {
  buildDiscoveryLookup,
  checkLiveActorDiscovered,
  checkNodeDiscovered,
  clearKnownNodeIds,
  collectDoneWhenAllRules,
  collectKnownNodeIds,
  collectPrivateNodeIds,
  dbEntryIdOf,
  getDoneWhenAllVersion,
  getNodeId,
  getPositionedDiscoverTypes,
  getSpawnDiscoveryId,
  isDoneWhenAll,
  removeDiscoveredMatches,
  setDoneWhenAllRules,
  setKnownNodeIds,
  setPrivateNodeIds,
} from "./coordinates";

describe("done when all", () => {
  // One quest giver marker standing for two quests; objective markers of a
  // quest carry ids like q_1101010@s2g1 and are done through the base-id rule.
  const nodes = [
    {
      type: "quest_giver",
      spawns: [
        {
          id: "quest_giver@npc_100",
          p: [1, 2] as [number, number],
          data: { doneWhenAll: ["q_1101010", "q_1101020"] },
        },
        {
          // id-less spawn: addressed by type + position
          p: [5, 6] as [number, number],
          data: { doneWhenAll: ["q_1101030"] },
        },
        { id: "quest_giver@npc_200", p: [3, 4] as [number, number] },
      ],
    },
  ];
  const rules = collectDoneWhenAllRules(nodes);

  afterEach(() => setDoneWhenAllRules(new Map()));

  it("collects rules under the node id and the discovery id", () => {
    expect(rules.get("quest_giver@npc_100")).toEqual([
      "q_1101010",
      "q_1101020",
    ]);
    // getSpawnDiscoveryId (the filter counts) keeps an "@" id unchanged, so
    // it addresses the marker by the same key.
    expect(
      getSpawnDiscoveryId("quest_giver", {
        id: "quest_giver@npc_100",
        p: [1, 2],
      }),
    ).toBe("quest_giver@npc_100");
    expect(rules.has("quest_giver@npc_100@1:2")).toBe(false);
    expect(rules.get("quest_giver@5:6")).toEqual(["q_1101030"]);
    expect(rules.has("quest_giver@npc_200")).toBe(false);
  });

  it("ignores empty or malformed lists", () => {
    expect(
      collectDoneWhenAllRules([
        {
          type: "t",
          spawns: [
            { id: "t@a", p: [0, 0], data: { doneWhenAll: [] } },
            { id: "t@b", p: [0, 0], data: { doneWhenAll: [""] } },
            { id: "t@c", p: [0, 0], data: { level: ["5"] } },
          ],
        },
      ]).size,
    ).toBe(0);
  });

  it("is done only when every listed id is discovered", () => {
    const one = buildDiscoveryLookup(["q_1101010"]);
    const both = buildDiscoveryLookup(["q_1101010", "q_1101020"]);
    expect(isDoneWhenAll("quest_giver@npc_100", rules, one)).toBe(false);
    expect(isDoneWhenAll("quest_giver@npc_100", rules, both)).toBe(true);
    expect(isDoneWhenAll("quest_giver@npc_200", rules, both)).toBe(false);
  });

  it("matches listed ids with the normal rules (base id before @)", () => {
    const r = new Map([["giver@x", ["q_1@s1g1", "q_2"]]]);
    // q_1 discovered as a bare quest id marks q_1@s1g1 through its base id.
    expect(
      isDoneWhenAll("giver@x", r, buildDiscoveryLookup(["q_1", "q_2"])),
    ).toBe(true);
  });

  it("feeds checkNodeDiscovered once the rules are set", () => {
    const lookup = buildDiscoveryLookup(["q_1101010", "q_1101020"]);
    expect(checkNodeDiscovered("quest_giver@npc_100", lookup)).toBe(false);
    const before = getDoneWhenAllVersion();
    setDoneWhenAllRules(rules);
    expect(getDoneWhenAllVersion()).toBe(before + 1);
    expect(checkNodeDiscovered("quest_giver@npc_100", lookup)).toBe(true);
    expect(
      checkNodeDiscovered(
        getSpawnDiscoveryId("quest_giver", {
          id: "quest_giver@npc_100",
          p: [1, 2],
        }),
        lookup,
      ),
    ).toBe(true);
    // Unrelated markers keep their own rules.
    expect(checkNodeDiscovered("quest_giver@npc_200", lookup)).toBe(false);
    // A manual mark of the marker itself still counts.
    expect(
      checkNodeDiscovered(
        "quest_giver@npc_100",
        buildDiscoveryLookup(["quest_giver@npc_100"]),
      ),
    ).toBe(true);
  });

  it("does not bump the version for identical rules", () => {
    setDoneWhenAllRules(rules);
    const v = getDoneWhenAllVersion();
    setDoneWhenAllRules(collectDoneWhenAllRules(nodes));
    expect(getDoneWhenAllVersion()).toBe(v);
  });

  it("does not widen Undiscover all", () => {
    setDoneWhenAllRules(rules);
    // A manual mark of the giver stays when only its quests are targeted.
    expect(
      removeDiscoveredMatches(
        ["quest_giver@npc_100"],
        ["q_1101010", "q_1101020"],
      ),
    ).toEqual(["quest_giver@npc_100"]);
  });
});

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

  it("keeps a non-coordinate @ id unchanged", () => {
    expect(
      getSpawnDiscoveryId("quest_episode_objective", {
        id: "q_1101010@1101010s1g1",
        p: [10.5, -3],
      }),
    ).toBe("q_1101010@1101010s1g1");
  });

  it("keeps a coordinate @ id unchanged", () => {
    expect(
      getSpawnDiscoveryId("crafting_anvil", {
        id: "crafting_anvil@123.00:456.00",
        p: [123, 456],
      }),
    ).toBe("crafting_anvil@123.00:456.00");
  });

  describe("round trip with getNodeId", () => {
    const type = "quest_episode_objective";
    const spawns = [
      { id: "q_1101010@1101010s1g1", p: [10.5, -3] as [number, number] },
      {
        id: "crafting_anvil@123.00:456.00",
        p: [123, 456] as [number, number],
      },
      { id: "iron_ore_1", p: [10.5, -3] as [number, number] },
    ];

    it.each(spawns)("marker id finds the discovery id ($id)", (spawn) => {
      expect(
        checkNodeDiscovered(
          getNodeId({ ...spawn, type }),
          buildDiscoveryLookup([getSpawnDiscoveryId(type, spawn)]),
        ),
      ).toBe(true);
    });

    it.each(spawns)("discovery id finds the marker id ($id)", (spawn) => {
      expect(
        checkNodeDiscovered(
          getSpawnDiscoveryId(type, spawn),
          buildDiscoveryLookup([getNodeId({ ...spawn, type })]),
        ),
      ).toBe(true);
    });
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

  it("gives the same result with a lookup built from the same array", () => {
    const marks = ["iron_ore@10.50:20.00", "iron_ore", "chest@1:2"];
    const lookup = buildDiscoveryLookup(marks);
    expect(
      removeDiscoveredMatches(marks, ["iron_ore@10.5:20"], lookup),
    ).toEqual(removeDiscoveredMatches(marks, ["iron_ore@10.5:20"]));
    // the lookup stays usable for the next call on the same array
    expect(removeDiscoveredMatches(marks, ["chest@1:2"], lookup)).toEqual([
      "iron_ore@10.50:20.00",
      "iron_ore",
    ]);
  });

  it("returns the same array reference when nothing matches", () => {
    const existing = ["chest@1:2"];
    expect(removeDiscoveredMatches(existing, ["iron_ore@5:6"])).toBe(existing);
  });
});

describe("discovered marks", () => {
  const discovered = (nodeId: string, marks: string[]) =>
    checkNodeDiscovered(nodeId, buildDiscoveryLookup(marks));

  /** Registers the static markers of a test map: [type, id | undefined, p]. */
  const knownMap = (
    spawns: [string, string | undefined, [number, number]][],
  ) => {
    const byType = new Map<string, { id?: string; p: [number, number] }[]>();
    for (const [type, id, p] of spawns) {
      const list = byType.get(type) ?? [];
      list.push(id === undefined ? { p } : { id, p });
      byType.set(type, list);
    }
    setKnownNodeIds(
      collectKnownNodeIds(
        [...byType].map(([type, spawns]) => ({ type, spawns })),
      ),
    );
  };

  afterEach(() => setKnownNodeIds({ ids: new Map(), types: new Set() }));

  describe("coordinates after @ must be real numbers", () => {
    // parseFloat read "1_74" as 1: (1, 0) vs (1, 1) / (1, 0).
    it("an event id like 1_74:0 is not a position", () => {
      expect(discovered("forage@1_26:1", ["monster@1_74:0"])).toBe(false);
      expect(discovered("equipment@1_40:0", ["monster@1_74:0"])).toBe(false);
      expect(discovered("monster@1_74:0", ["monster@1_74:0"])).toBe(true);
    });

    // The third component is part of the identity (Crimson Desert).
    it("x:y:0, x:y:1, x:y:2 are three nodes", () => {
      const mark = "faction_quest@-10606.27:-1748.08:0";
      expect(discovered("faction_quest@-10606.27:-1748.08:1", [mark])).toBe(
        false,
      );
      expect(discovered("faction_quest@-10606.27:-1748.08:2", [mark])).toBe(
        false,
      );
      expect(discovered(mark, [mark])).toBe(true);
    });

    it("an exponent is a number (Infinity Nikki)", () => {
      // live read of the same node at toFixed(2)
      expect(
        discovered("Floral Cloth@12250.00:0.00", [
          "Floral Cloth@12250:9.999999974752427e-7",
        ]),
      ).toBe(true);
    });
  });

  describe("marks of current static markers stay on their marker", () => {
    // Discover all / a tick of one filter greyed another filter's marker
    // within 1 unit.
    it("does not mark another filter's marker within 1 unit", () => {
      knownMap([
        ["iron_ore", "iron_ore@10.5:20", [10.5, 20]],
        ["copper_ore", "copper_ore@10.9:20", [10.9, 20]],
      ]);
      expect(discovered("copper_ore@10.9:20", ["iron_ore@10.5:20"])).toBe(
        false,
      );
    });

    // The same for the swapped legacy reading (Graveyard Keeper 2:
    // locked_door@-0.175:-10.92 marked tree@-11.40:0.04).
    it("does not mark through the swapped reading of a current id", () => {
      knownMap([
        ["locked_door", "locked_door@-0.175:-10.92", [-0.175, -10.92]],
        ["tree", "tree@-11.40:0.04", [-11.4, 0.04]],
      ]);
      expect(
        discovered("tree@-11.40:0.04", ["locked_door@-0.175:-10.92"]),
      ).toBe(false);
    });

    // Albion: same tile text, different filters.
    it("does not mark another filter's marker with the same tail text", () => {
      knownMap([
        ["castle", "castle@z4314:132:-122", [132, -122]],
        ["territory", "territory@z4314:132:-122", [132, -122]],
      ]);
      expect(
        discovered("territory@z4314:132:-122", ["castle@z4314:132:-122"]),
      ).toBe(false);
    });

    // Two spawns of one filter 0.4 apart are two markers (CHOICE 1).
    it("does not mark a neighbour of the same filter", () => {
      knownMap([
        ["iron_ore", "iron_ore@10.5:20", [10.5, 20]],
        ["iron_ore", "iron_ore@10.9:20", [10.9, 20]],
      ]);
      expect(discovered("iron_ore@10.9:20", ["iron_ore@10.5:20"])).toBe(false);
    });

    it("bumps the rules version when the known ids change", () => {
      const before = getDoneWhenAllVersion();
      knownMap([["iron_ore", undefined, [1, 2]]]);
      expect(getDoneWhenAllVersion()).toBe(before + 1);
    });

    // No CoordinatesProvider (guide page) or the map's nodes are not loaded
    // yet: only ids with the same base match by position.
    describe("with no markers registered", () => {
      it("does not mark another filter's marker", () => {
        expect(discovered("copper_ore@10.9:20", ["iron_ore@10.5:20"])).toBe(
          false,
        );
        expect(discovered("tree@1.00:2.00", ["ore@1.00:2.00@1:2"])).toBe(false);
      });

      it("still links a live mark to the static id of the same type", () => {
        expect(
          discovered("pal@-92745:361345", ["pal@-92744.91:361344.72"]),
        ).toBe(true);
      });

      it("does not delete another filter's mark", () => {
        expect(
          removeDiscoveredMatches(
            ["iron_ore@10.5:20", "copper_ore@10.9:20"],
            ["iron_ore@10.5:20"],
          ),
        ).toEqual(["copper_ore@10.9:20"]);
      });
    });

    it("empties the known ids only for the provider that set them", () => {
      const map = () =>
        collectKnownNodeIds([
          {
            type: "iron_ore",
            spawns: [{ id: "iron_ore@10.5:20", p: [10.5, 20] }],
          },
          {
            type: "copper_ore",
            spawns: [{ id: "copper_ore@10.9:20", p: [10.9, 20] }],
          },
        ]);
      const first = map();
      const second = map();
      setKnownNodeIds(first);
      setKnownNodeIds(second);
      // The old provider unmounts after the new one rendered: second stays.
      clearKnownNodeIds(first);
      expect(discovered("iron_ore@10.5:20", ["copper_ore@10.60:20.00"])).toBe(
        false,
      );
      // An id from before a type rename marks it.
      expect(discovered("copper_ore@10.9:20", ["old_ore@10.9:20"])).toBe(true);
      clearKnownNodeIds(second);
      // Empty now: a renamed type no longer matches, the same base does.
      expect(discovered("copper_ore@10.9:20", ["old_ore@10.9:20"])).toBe(false);
      expect(discovered("copper_ore@10.9:20", ["copper_ore@10.60:20.00"])).toBe(
        true,
      );
    });

    // A live actor and a live mark (neither a static id) of two filters.
    it("does not mark a live marker of another filter with a live mark", () => {
      knownMap([
        ["iron_ore", "iron_ore@10.5:20", [10.5, 20]],
        ["copper_ore", "copper_ore@10.9:20", [10.9, 20]],
      ]);
      expect(
        discovered("copper_ore@30.20:40.00", ["iron_ore@30.00:40.00"]),
      ).toBe(false);
      expect(discovered("iron_ore@30.20:40.00", ["iron_ore@30.00:40.00"])).toBe(
        true,
      );
      // a live actor of a type with no static spawns here still links
      expect(discovered("pal@30.20:40.00", ["renamed_pal@30.00:40.00"])).toBe(
        true,
      );
    });
  });

  describe("one node addressed by two ids still matches", () => {
    beforeEach(() =>
      knownMap([
        ["iron_ore", "iron_ore@10.5:20", [10.5, 20]],
        // own spawn id, marker id chest_123@<p>
        ["chest", "chest_123", [5.123456, 6.456789]],
        // Palworld-style rounded static id, live reads are ~0.3 off
        ["pal", "pal@-92745:361345", [-92744.91, 361344.72]],
      ]),
    );

    it("live mark (toFixed(2), float noise) marks the static marker", () => {
      expect(discovered("iron_ore@10.5:20", ["iron_ore@10.90:20.00"])).toBe(
        true,
      );
      expect(discovered("pal@-92745:361345", ["pal@-92744.91:361344.72"])).toBe(
        true,
      );
    });

    it("static tick marks the live marker", () => {
      expect(discovered("iron_ore@10.90:20.00", ["iron_ore@10.5:20"])).toBe(
        true,
      );
      expect(discovered("pal@-92744.91:361344.72", ["pal@-92745:361345"])).toBe(
        true,
      );
    });

    it("live id with the filter type matches a spawn with its own id", () => {
      expect(
        discovered("chest_123@5.123456:6.456789", ["chest@5.12:6.46"]),
      ).toBe(true);
      expect(
        discovered("chest@5.12:6.46", ["chest_123@5.123456:6.456789"]),
      ).toBe(true);
    });

    it("an id from before a type rename marks the renamed marker", () => {
      expect(discovered("iron_ore@10.5:20", ["old_ore@10.5:20"])).toBe(true);
    });

    it("an old raw z:x id marks the current x:z id", () => {
      knownMap([["ore", "ore@-45.68:123.46", [123.456789, -45.678901]]]);
      expect(
        discovered("ore@-45.68:123.46", ["ore@123.456789:-45.678901"]),
      ).toBe(true);
    });

    it("Aniimo bare spawn ids and AION 2 base ids still match", () => {
      expect(discovered("q_1102150@1102150s2g1", ["q_1102150"])).toBe(true);
      expect(
        discovered("q_1102150@1102150s2g1", ["q_1102150@1102150s2g1"]),
      ).toBe(true);
      expect(
        discovered("q_1102150@1102150s3g1", ["q_1102150@1102150s2g1"]),
      ).toBe(false);
    });
  });

  describe("old <id>@x:y marks (Discover all before web PR #23)", () => {
    beforeEach(() =>
      knownMap([
        ["ore", "ore@1.00:2.00", [1, 2]],
        ["tree", "tree@1.00:2.00", [1, 2]],
        ["quest_episode_objective", "q_1@1s1g1", [10, 20]],
      ]),
    );

    it("marks its own marker", () => {
      expect(discovered("ore@1.00:2.00", ["ore@1.00:2.00@1:2"])).toBe(true);
    });

    // Matched every marker at the same spot.
    it("does not mark another filter at the same spot", () => {
      expect(discovered("tree@1.00:2.00", ["ore@1.00:2.00@1:2"])).toBe(false);
    });

    // Never matched since PR #23 (CHOICE 2).
    it("marks an addressed id (AION 2 objective)", () => {
      expect(discovered("q_1@1s1g1", ["q_1@1s1g1@10:20"])).toBe(true);
    });

    it("is removed by Undiscover all of its filter", () => {
      expect(
        removeDiscoveredMatches(["ore@1.00:2.00@1:2"], ["ore@1.00:2.00"]),
      ).toEqual([]);
    });
  });

  describe("Undiscover all removes only the selected filter's entries", () => {
    beforeEach(() =>
      knownMap([
        ["iron_ore", "iron_ore@10.5:20", [10.5, 20]],
        ["copper_ore", "copper_ore@10.9:20", [10.9, 20]],
        ["ore", "ore@-45.68:123.46", [123.456789, -45.678901]],
      ]),
    );

    // The neighbour's own tick was deleted.
    it("keeps another filter's tick within 1 unit", () => {
      expect(
        removeDiscoveredMatches(
          ["iron_ore@10.5:20", "copper_ore@10.9:20"],
          ["iron_ore@10.5:20"],
        ),
      ).toEqual(["copper_ore@10.9:20"]);
    });

    it("removes the live mark of the same node", () => {
      expect(
        removeDiscoveredMatches(["iron_ore@10.90:20.00"], ["iron_ore@10.5:20"]),
      ).toEqual([]);
    });

    // Another filter's live mark (CHOICE 3).
    it("keeps another filter's live mark", () => {
      expect(
        removeDiscoveredMatches(
          ["copper_ore@10.60:20.00"],
          ["iron_ore@10.5:20"],
        ),
      ).toEqual(["copper_ore@10.60:20.00"]);
    });

    // The swapped reading was only checked one way.
    it("removes an old raw z:x mark of the target", () => {
      expect(
        removeDiscoveredMatches(
          ["ore@123.456789:-45.678901"],
          ["ore@-45.68:123.46"],
        ),
      ).toEqual([]);
    });

    it("removes a map tick of a custom marker (bare target)", () => {
      expect(
        removeDiscoveredMatches(["my_node@1:2", "other@1:2"], ["my_node"]),
      ).toEqual(["other@1:2"]);
    });
  });

  // The gate knows every filter of the game, not only the loaded map's static
  // types, and counts a live-only variant filter as its base filter.
  describe("filter-type gate over the game's filters", () => {
    const register = (
      spawns: [string, string, [number, number]][],
      filterIds: string[],
      typesIdMap?: Record<string, string>,
    ) => {
      const byType = new Map<string, { id: string; p: [number, number] }[]>();
      for (const [type, id, p] of spawns) {
        const list = byType.get(type) ?? [];
        list.push({ id, p });
        byType.set(type, list);
      }
      setKnownNodeIds(
        collectKnownNodeIds(
          [...byType].map(([type, spawns]) => ({ type, spawns })),
          {
            filters: [{ values: filterIds.map((id) => ({ id })) }],
            typesIdMap,
          },
        ),
      );
    };

    // Albion: a chest_veteran mark made on map z3337 greyed the wildlife
    // marker 1 unit away on z3220, and Undiscover all of wildlife deleted it.
    describe("a mark made on another map", () => {
      beforeEach(() =>
        register(
          [["wildlife", "wildlife@-314:-314", [-314, -314]]],
          ["wildlife", "chest_veteran"],
        ),
      );
      const mark = "chest_veteran@-314:-315";

      it("does not grey another filter's marker", () => {
        expect(discovered("wildlife@-314:-314", [mark])).toBe(false);
      });

      it("is kept by Undiscover all of that marker's filter", () => {
        expect(removeDiscoveredMatches([mark], ["wildlife@-314:-314"])).toEqual(
          [mark],
        );
      });
    });

    // Palia: star-quality forage is a live-only filter with no static spawns.
    describe("a live-only variant filter", () => {
      const typesIdMap = {
        BP_Garlic_C: "garlic",
        "BP_Garlic_C_Variant.Star": "garlic_star",
        BP_Moth_C: "bug_moth",
      };
      beforeEach(() =>
        register(
          [
            ["garlic", "garlic@50:50", [50, 50]],
            ["bug_moth", "bug_moth@50:50", [50, 50]],
          ],
          ["garlic", "garlic_star", "bug_moth"],
          typesIdMap,
        ),
      );
      const star = "garlic_star@50.00:50.00";

      it("still greys its base filter's marker", () => {
        expect(discovered("garlic@50:50", [star])).toBe(true);
        expect(discovered(star, ["garlic@50:50"])).toBe(true);
      });

      it("does not grey another filter's marker", () => {
        expect(discovered("bug_moth@50:50", [star])).toBe(false);
      });

      // The respawn reset unticks the star actor's id: a manual tick of the
      // moth there was deleted without any user action.
      it("unticking the variant keeps another filter's tick", () => {
        expect(removeDiscoveredMatches(["bug_moth@50:50"], [star])).toEqual([
          "bug_moth@50:50",
        ]);
      });

      it("Undiscover all of another filter keeps the variant's mark", () => {
        expect(removeDiscoveredMatches([star], ["bug_moth@50:50"])).toEqual([
          star,
        ]);
      });

      // Neither id is a static marker: a live star actor and a live moth mark.
      it("a live variant actor and another filter's live mark do not match", () => {
        expect(
          discovered("garlic_star@60.00:60.00", ["bug_moth@60.20:60.00"]),
        ).toBe(false);
        expect(
          discovered("bug_moth@60.20:60.00", ["garlic_star@60.00:60.00"]),
        ).toBe(false);
        // the variant and its base do
        expect(
          discovered("garlic_star@60.00:60.00", ["garlic@60.20:60.00"]),
        ).toBe(true);
      });
    });

    describe("still links two ids of one node", () => {
      beforeEach(() =>
        register(
          [
            ["iron_ore", "iron_ore@10.5:20", [10.5, 20]],
            ["ore", "ore@-45.68:123.46", [123.456789, -45.678901]],
          ],
          ["iron_ore", "copper_ore", "ore"],
        ),
      );

      it("a renamed type (base no filter) at the same coordinates", () => {
        expect(discovered("iron_ore@10.5:20", ["old_ore@10.5:20"])).toBe(true);
      });

      it("a live id of the same type with float noise", () => {
        expect(discovered("iron_ore@10.5:20", ["iron_ore@10.90:20.30"])).toBe(
          true,
        );
        expect(discovered("iron_ore@10.90:20.30", ["iron_ore@10.5:20"])).toBe(
          true,
        );
      });

      it("an old raw z:x id (Crimson Desert)", () => {
        expect(
          discovered("ore@-45.68:123.46", ["ore@123.456789:-45.678901"]),
        ).toBe(true);
      });
    });
  });

  // My Filters markers: their ids are current markers too. The base of a
  // custom id (`<filter>_<Date.now()>`) is no filter, so before, a custom tick
  // matched any static marker within 1 unit both ways.
  describe("custom markers", () => {
    const custom = {
      type: "My Spots",
      spawns: [
        { id: "My Spots_1700000000000", isPrivate: true, p: [10.3, 20] },
      ] as { id: string; isPrivate: boolean; p: [number, number] }[],
    };
    const tick = getNodeId({ ...custom.spawns[0], type: custom.type });
    const bare = getSpawnDiscoveryId(custom.type, custom.spawns[0]);
    beforeEach(() => {
      knownMap([["iron_ore", undefined, [10, 20]]]);
      setPrivateNodeIds(collectPrivateNodeIds([custom]));
    });
    afterEach(() => setPrivateNodeIds(collectPrivateNodeIds([])));

    it("addresses the custom marker as the map and the counts do", () => {
      expect(tick).toBe("My Spots_1700000000000@10.3:20");
      expect(bare).toBe("My Spots_1700000000000");
    });

    it("a tick of the custom marker does not grey a static marker", () => {
      expect(discovered("iron_ore@10:20", [tick])).toBe(false);
    });

    it("Discover all on a static filter does not grey the custom marker", () => {
      expect(discovered(tick, ["iron_ore@10:20"])).toBe(false);
    });

    it("Undiscover all on a static filter keeps the custom tick", () => {
      expect(removeDiscoveredMatches([tick], ["iron_ore@10:20"])).toEqual([
        tick,
      ]);
    });

    it("a live mark of a static filter does not grey the custom marker", () => {
      expect(discovered(tick, ["iron_ore@10.40:20.00"])).toBe(false);
    });

    it("Discover all / Undiscover all on the custom filter (bare id)", () => {
      expect(discovered(tick, [bare])).toBe(true);
      expect(
        removeDiscoveredMatches([bare, tick, "iron_ore@10:20"], [bare]),
      ).toEqual(["iron_ore@10:20"]);
    });
  });

  // settings.ts setDiscoverNode(id, false) / toggleDiscoveredNode untick call
  // removeDiscoveredMatches(discoveredNodes, [nodeId]).
  describe("single untick", () => {
    beforeEach(() =>
      knownMap([
        ["iron_ore", "iron_ore@10.5:20", [10.5, 20]],
        ["copper_ore", "copper_ore@10.9:20", [10.9, 20]],
      ]),
    );

    it("removes the marker's own, base-id and live marks only", () => {
      expect(
        removeDiscoveredMatches(
          [
            "iron_ore@10.5:20",
            "iron_ore@10.70:20.10",
            "iron_ore",
            "copper_ore@10.9:20",
            "copper_ore@10.80:20.00",
            "chest@100:200",
          ],
          ["iron_ore@10.5:20"],
        ),
      ).toEqual([
        "copper_ore@10.9:20",
        "copper_ore@10.80:20.00",
        "chest@100:200",
      ]);
    });

    it("unticking a live marker removes the static tick of its node", () => {
      expect(
        removeDiscoveredMatches(
          ["iron_ore@10.5:20", "copper_ore@10.9:20"],
          ["iron_ore@10.60:20.00"],
        ),
      ).toEqual(["copper_ore@10.9:20"]);
    });
  });
});

describe("dbEntryIdOf", () => {
  test("explicit spawn dbEntryId wins", () => {
    expect(dbEntryIdOf({ dbEntryId: "e1", id: "x", type: "t" }, "d")).toBe(
      "e1",
    );
  });
  test('NO_DB_ENTRY ("") suppresses the link', () => {
    expect(dbEntryIdOf({ dbEntryId: "", type: "t" }, "d")).toBe("");
  });
  test("entry-like spawn id beats the type default", () => {
    expect(dbEntryIdOf({ id: "landmark_1", type: "t" }, "d")).toBe(
      "landmark_1",
    );
  });
  test("position-derived id falls back to the type-level default", () => {
    expect(dbEntryIdOf({ id: "coal@1:2", type: "coal" }, "item_coal")).toBe(
      "item_coal",
    );
  });
  test("provider-normalised id (= type) falls back to the type-level default", () => {
    expect(
      dbEntryIdOf(
        {
          id: "aristocrat_decor_makeuptable",
          type: "aristocrat_decor_makeuptable",
        },
        "decor_rococo_20_furniture_makeup_table",
      ),
    ).toBe("decor_rococo_20_furniture_makeup_table");
  });
  test("no default falls back to the type id", () => {
    expect(dbEntryIdOf({ id: "coal@1:2", type: "coal" })).toBe("coal");
  });
});

describe("getPositionedDiscoverTypes", () => {
  const typesIdMap = {
    BP_Beans_C: "beans",
    "BP_Beans_C_Variant.StarQuality": "beans_star",
    "BP_Beans_C_Variant.AmberEcho_Variant.EchoInfected": "beans_infected",
    BP_Player_C: "player",
    "BP_Player_C_Variant.Masked": "player_masked",
  };

  test("only types with static nodes without a typesIdMap", () => {
    expect([...getPositionedDiscoverTypes([{ type: "beans" }])]).toEqual([
      "beans",
    ]);
  });

  test("variant types inherit their base class's static position", () => {
    const positioned = getPositionedDiscoverTypes(
      [{ type: "beans" }],
      typesIdMap,
    );
    expect(positioned.has("beans_star")).toBe(true);
    expect(positioned.has("beans_infected")).toBe(true);
    expect(positioned.has("player")).toBe(false);
    expect(positioned.has("player_masked")).toBe(false);
  });
});

describe("checkLiveActorDiscovered", () => {
  // Aniimo: the game reports opened chests as bare spawn ids ("e<staticId>"),
  // while a live actor's marker id is position-based.
  const lookup = buildDiscoveryLookup(["e55542889", "chest_basic@10.00:20.00"]);

  it("matches a collected spawn id against the raw actor type", () => {
    expect(
      checkLiveActorDiscovered(
        "chest_superior@1234.56:-789.01",
        "e55542889",
        lookup,
      ),
    ).toBe(true);
  });

  it("still matches the position-based live id", () => {
    expect(
      checkLiveActorDiscovered("chest_basic@10.00:20.00", "e1", lookup),
    ).toBe(true);
  });

  it("is false for an uncollected actor", () => {
    expect(
      checkLiveActorDiscovered("chest_basic@50.00:60.00", "e88519886", lookup),
    ).toBe(false);
  });
});
