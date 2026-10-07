import {
  buildDiscoveryLookup,
  checkLiveActorDiscovered,
  checkNodeDiscovered,
  collectDoneWhenAllRules,
  dbEntryIdOf,
  getDoneWhenAllVersion,
  getNodeId,
  getPositionedDiscoverTypes,
  getSpawnDiscoveryId,
  getFocusMode,
  isDoneWhenAll,
  isSpawnFocused,
  isSpawnShownByFocus,
  removeDiscoveredMatches,
  setDoneWhenAllRules,
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

  it("returns the same array reference when nothing matches", () => {
    const existing = ["chest@1:2"];
    expect(removeDiscoveredMatches(existing, ["iron_ore@5:6"])).toBe(existing);
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

describe("focus-gated spawns (data.focusMode / focusWhenAny)", () => {
  // AION 2 quests: objective / turn-in markers are `only`, quest givers `live`
  // and list the quests they hand out.
  const objective = {
    nodeId: "q_1102080@1102080s3g1",
    data: { focusMode: ["only"] },
  };
  const giver = {
    nodeId: "quest_regional@spawner_7.regional",
    data: { focusMode: ["live"], focusWhenAny: ["q_1202051", "q_1202052"] },
  };
  const plain = { nodeId: "chest@1:2", data: { tier: ["gold"] } };

  const show = (
    spawn: { nodeId: string; data?: Record<string, string[]> },
    {
      filterOn = true,
      selectedNodeId = null as string | null,
      focus = [] as string[],
      liveFocusActive = false,
    } = {},
  ) =>
    isSpawnShownByFocus(spawn.nodeId, spawn.data, {
      filterOn,
      selectedNodeId,
      focused: focus.length ? new Set(focus) : null,
      liveFocusActive,
    });

  it("reads only the known focus modes", () => {
    expect(getFocusMode(objective.data)).toBe("only");
    expect(getFocusMode(giver.data)).toBe("live");
    expect(getFocusMode(plain.data)).toBeUndefined();
    expect(getFocusMode({ focusMode: ["sometimes"] })).toBeUndefined();
    expect(getFocusMode(undefined)).toBeUndefined();
  });

  it("matches the node id or any focusWhenAny id", () => {
    const set = new Set(["q_1202052", "q_1102080@1102080s3g1"]);
    expect(isSpawnFocused(objective.nodeId, objective.data, set)).toBe(true);
    expect(isSpawnFocused(giver.nodeId, giver.data, set)).toBe(true);
    expect(isSpawnFocused(plain.nodeId, plain.data, set)).toBe(false);
    expect(isSpawnFocused(giver.nodeId, giver.data, null)).toBe(false);
    expect(isSpawnFocused(giver.nodeId, giver.data, new Set())).toBe(false);
  });

  it("leaves spawns without focusMode as before", () => {
    expect(show(plain)).toBe(true);
    expect(show(plain, { liveFocusActive: true })).toBe(true);
    expect(show({ nodeId: "x@1:2" }, { liveFocusActive: true })).toBe(true);
    expect(show(plain, { filterOn: false })).toBe(false);
  });

  it("shows `only` spawns only while focused", () => {
    expect(show(objective)).toBe(false);
    expect(show(objective, { liveFocusActive: true })).toBe(false);
    expect(
      show(objective, { liveFocusActive: true, focus: ["q_other@x"] }),
    ).toBe(false);
    expect(
      show(objective, { liveFocusActive: true, focus: [objective.nodeId] }),
    ).toBe(true);
  });

  it("shows `live` spawns without live focus, else only when focused", () => {
    expect(show(giver)).toBe(true); // web / no app / game closed
    expect(show(giver, { liveFocusActive: true })).toBe(false); // focus = []
    expect(show(giver, { liveFocusActive: true, focus: ["q_9999999"] })).toBe(
      false,
    );
    expect(show(giver, { liveFocusActive: true, focus: [giver.nodeId] })).toBe(
      true,
    );
    expect(show(giver, { liveFocusActive: true, focus: ["q_1202051"] })).toBe(
      true,
    );
  });

  it("hides a focused spawn when its filter is off", () => {
    expect(
      show(objective, {
        filterOn: false,
        liveFocusActive: true,
        focus: [objective.nodeId],
      }),
    ).toBe(false);
    expect(
      show(giver, {
        filterOn: false,
        liveFocusActive: true,
        focus: ["q_1202051"],
      }),
    ).toBe(false);
  });

  it("always shows the selected marker", () => {
    expect(show(objective, { selectedNodeId: objective.nodeId })).toBe(true);
    expect(
      show(giver, { selectedNodeId: giver.nodeId, liveFocusActive: true }),
    ).toBe(true);
    expect(
      show(objective, { filterOn: false, selectedNodeId: objective.nodeId }),
    ).toBe(true);
    expect(show(objective, { selectedNodeId: "other@1:2" })).toBe(false);
  });
});
