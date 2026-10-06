import {
  GAME_REPORTED_REMOVE_AFTER_MISSES,
  LEGACY_MIGRATION_ID_PREFIXES,
  diffGameReportedSet,
  type GameReportedNodes,
} from "./game-reported-nodes";

type State = {
  discoveredNodes: string[];
  autoDiscoveredNodes: string[];
  gameReportedNodes: GameReportedNodes | undefined;
  misses: Map<string, Map<string, number>>;
};

const state = (partial: Partial<State> = {}): State => ({
  discoveredNodes: [],
  autoDiscoveredNodes: [],
  gameReportedNodes: {},
  misses: new Map(),
  ...partial,
});

/** Apply one report the way the settings action does; returns the diff. */
const report = (s: State, setName: string, reportedIds: string[]) => {
  const result = diffGameReportedSet({
    setName,
    reportedIds,
    discoveredNodes: s.discoveredNodes,
    autoDiscoveredNodes: s.autoDiscoveredNodes,
    gameReportedNodes: s.gameReportedNodes,
    misses: s.misses.get(setName),
  });
  s.misses.set(setName, result.misses);
  if (result.update) Object.assign(s, result.update);
  return result;
};

const SET = "empyrean_traces";

describe("diffGameReportedSet", () => {
  it("removes only after the configured number of misses", () => {
    expect(GAME_REPORTED_REMOVE_AFTER_MISSES).toBe(2);
  });

  it("adds reported ids to discovered + auto and owns them", () => {
    const s = state();
    const r = report(s, SET, ["t1", "t2"]);
    expect(r.added).toEqual(["t1", "t2"]);
    expect(s.discoveredNodes).toEqual(["t1", "t2"]);
    expect(s.autoDiscoveredNodes).toEqual(["t1", "t2"]);
    expect(s.gameReportedNodes).toEqual({ [SET]: ["t1", "t2"] });
  });

  it("does not claim an id that is already discovered from another source", () => {
    const s = state({ discoveredNodes: ["t1"] });
    const r = report(s, SET, ["t1", "t2"]);
    expect(r.added).toEqual(["t2"]);
    expect(s.discoveredNodes).toEqual(["t1", "t2"]);
    expect(s.autoDiscoveredNodes).toEqual(["t2"]);
    expect(s.gameReportedNodes).toEqual({ [SET]: ["t2"] });
    // Later reports without t1 never remove it: it is not owned.
    report(s, SET, ["t2"]);
    report(s, SET, ["t2"]);
    expect(s.discoveredNodes).toEqual(["t1", "t2"]);
  });

  it("removes an owned id only when two consecutive reports miss it", () => {
    const s = state();
    report(s, SET, ["t1", "t2"]);
    const first = report(s, SET, ["t2"]);
    expect(first.removed).toEqual([]);
    expect(first.update).toBeNull();
    expect(s.discoveredNodes).toEqual(["t1", "t2"]);
    const second = report(s, SET, ["t2"]);
    expect(second.removed).toEqual(["t1"]);
    expect(s.discoveredNodes).toEqual(["t2"]);
    expect(s.autoDiscoveredNodes).toEqual(["t2"]);
    expect(s.gameReportedNodes).toEqual({ [SET]: ["t2"] });
    expect(s.misses.get(SET)?.size).toBe(0);
  });

  it("resets the miss counter when the id reappears", () => {
    const s = state();
    report(s, SET, ["t1"]);
    report(s, SET, []); // miss 1
    report(s, SET, ["t1"]); // back: counter reset
    const r = report(s, SET, []); // miss 1 again, not 2
    expect(r.removed).toEqual([]);
    expect(s.discoveredNodes).toEqual(["t1"]);
    report(s, SET, []); // miss 2
    expect(s.discoveredNodes).toEqual([]);
  });

  it("treats a present empty list as authoritative (two-report removal)", () => {
    const s = state({ discoveredNodes: ["manual@1:2"] });
    report(s, SET, ["t1", "t2"]);
    expect(report(s, SET, []).removed).toEqual([]);
    expect(report(s, SET, []).removed).toEqual(["t1", "t2"]);
    expect(s.discoveredNodes).toEqual(["manual@1:2"]);
    expect(s.autoDiscoveredNodes).toEqual([]);
    expect(s.gameReportedNodes).toEqual({ [SET]: [] });
  });

  it("migrates the add-only leftovers: adopts bare auto ids, never '@' ids", () => {
    const T1 = "empyrean_trace_1";
    const T9 = "empyrean_trace_9";
    const s = state({
      discoveredNodes: [T1, T9, "effigy@3:4", `${T1}@5:6`],
      autoDiscoveredNodes: [T1, T9, "effigy@3:4", `${T9}@7:8`],
      gameReportedNodes: undefined,
    });
    const first = report(s, SET, [T1]);
    // Record created (adoption), nothing added or removed yet.
    expect(first.added).toEqual([]);
    expect(first.removed).toEqual([]);
    expect(first.update).toEqual({
      gameReportedNodes: { [SET]: [T1, T9] },
    });
    // T9 (the other character's leftover) goes after the second miss.
    report(s, SET, [T1]);
    expect(s.discoveredNodes).toEqual([T1, "effigy@3:4", `${T1}@5:6`]);
    expect(s.autoDiscoveredNodes).toEqual([T1, "effigy@3:4", `${T9}@7:8`]);
    expect(s.gameReportedNodes).toEqual({ [SET]: [T1] });
  });

  it("migration does not adopt ids another set owns", () => {
    const T1 = "empyrean_trace_1";
    const T2 = "empyrean_trace_2";
    const s = state({
      discoveredNodes: ["q1", T1, T2],
      autoDiscoveredNodes: ["q1", T1, T2],
      // Malformed but possible: another set already owns a trace id.
      gameReportedNodes: { quests: ["q1", T2] },
    });
    report(s, SET, [T1]);
    expect(s.gameReportedNodes).toEqual({
      quests: ["q1", T2],
      [SET]: [T1],
    });
  });

  it("an existing empty record is not re-migrated", () => {
    const T9 = "empyrean_trace_9";
    const s = state({
      discoveredNodes: [T9],
      autoDiscoveredNodes: [T9],
      gameReportedNodes: { [SET]: [] },
    });
    const r = report(s, SET, []);
    expect(r.update).toBeNull();
    report(s, SET, []);
    expect(s.discoveredNodes).toEqual([T9]);
  });

  describe("legacy migration is limited to the set that owns the prefix", () => {
    const LEGACY = ["empyrean_trace_1", "empyrean_trace_2", "empyrean_trace_3"];
    const legacyState = () =>
      state({
        discoveredNodes: [...LEGACY, "e123", "manual@1:2"],
        autoDiscoveredNodes: [...LEGACY, "e123", "boss@3:4"],
        gameReportedNodes: undefined,
      });

    it("maps empyrean_traces, quests and strongholds to their own prefixes", () => {
      expect(LEGACY_MIGRATION_ID_PREFIXES).toEqual({
        empyrean_traces: "empyrean_trace_",
        quests: "q_",
        strongholds: "stronghold_done_",
      });
    });

    it("(a) a set without a legacy prefix adopts nothing and leaves legacy marks alone", () => {
      const s = legacyState();
      const first = report(s, "unlisted_set", ["q_1"]);
      expect(first.removed).toEqual([]);
      expect(s.gameReportedNodes).toEqual({ unlisted_set: ["q_1"] });
      const second = report(s, "unlisted_set", ["q_1"]);
      expect(second.removed).toEqual([]);
      expect(second.update).toBeNull();
      // A third report too: nothing of the legacy set is ever counted.
      expect(report(s, "unlisted_set", ["q_1"]).removed).toEqual([]);
      expect(s.discoveredNodes).toEqual([
        ...LEGACY,
        "e123",
        "manual@1:2",
        "q_1",
      ]);
      expect(s.autoDiscoveredNodes).toEqual([
        ...LEGACY,
        "e123",
        "boss@3:4",
        "q_1",
      ]);
    });

    it("a set without a legacy prefix and an empty first report writes an empty record", () => {
      const s = legacyState();
      const r = report(s, "unlisted_set", []);
      expect(r.update).toEqual({ gameReportedNodes: { unlisted_set: [] } });
      expect(r.removed).toEqual([]);
    });

    it("(b) the first trace report after quests adopts the legacy trace marks and removes only the unreported ones after two misses", () => {
      const s = legacyState();
      report(s, "quests", ["q_1"]);
      report(s, "quests", ["q_1"]);
      const first = report(s, SET, ["empyrean_trace_1", "empyrean_trace_2"]);
      expect(first.added).toEqual([]);
      expect(first.removed).toEqual([]);
      expect(s.gameReportedNodes).toEqual({
        quests: ["q_1"],
        [SET]: LEGACY,
      });
      const second = report(s, SET, ["empyrean_trace_1", "empyrean_trace_2"]);
      expect(second.removed).toEqual(["empyrean_trace_3"]);
      expect(s.discoveredNodes).toEqual([
        "empyrean_trace_1",
        "empyrean_trace_2",
        "e123",
        "manual@1:2",
        "q_1",
      ]);
      expect(s.autoDiscoveredNodes).toEqual([
        "empyrean_trace_1",
        "empyrean_trace_2",
        "e123",
        "boss@3:4",
        "q_1",
      ]);
      expect(s.gameReportedNodes).toEqual({
        quests: ["q_1"],
        [SET]: ["empyrean_trace_1", "empyrean_trace_2"],
      });
    });

    it("(c) empyrean_traces never adopts a bare non-trace legacy id", () => {
      const s = legacyState();
      report(s, SET, []);
      expect(s.gameReportedNodes).toEqual({ [SET]: LEGACY });
      report(s, SET, []);
      expect(s.gameReportedNodes).toEqual({ [SET]: [] });
      expect(s.discoveredNodes).toEqual(["e123", "manual@1:2"]);
      expect(s.autoDiscoveredNodes).toEqual(["e123", "boss@3:4"]);
      report(s, SET, []);
      report(s, SET, []);
      expect(s.discoveredNodes).toContain("e123");
      expect(s.autoDiscoveredNodes).toContain("e123");
    });

    it("(d) quests arriving before traces never blinks a trace mark", () => {
      const s = legacyState();
      const results = [
        report(s, "quests", ["q_1"]),
        report(s, "quests", ["q_1"]),
        report(s, SET, LEGACY),
        report(s, SET, LEGACY),
      ];
      for (const r of results) {
        expect(r.removed).toEqual([]);
        expect(
          r.added.filter((id) => id.startsWith("empyrean_trace_")),
        ).toEqual([]);
      }
      for (const id of LEGACY) {
        expect(s.discoveredNodes).toContain(id);
        expect(s.autoDiscoveredNodes).toContain(id);
      }
      expect(s.gameReportedNodes).toEqual({ quests: ["q_1"], [SET]: LEGACY });
    });

    it("(e) quests, strongholds and traces each take over only their own legacy marks", () => {
      const legacy = [
        "empyrean_trace_1",
        "empyrean_trace_2",
        "stronghold_done_1",
        "stronghold_done_2",
        "q_1",
        "q_2",
        "e123",
      ];
      const s = state({
        discoveredNodes: [...legacy, "manual@1:2"],
        autoDiscoveredNodes: [...legacy, "boss@3:4"],
        gameReportedNodes: undefined,
      });
      // [set, id the game still reports, legacy id it must remove]
      const steps: [string, string, string][] = [
        ["quests", "q_1", "q_2"],
        ["strongholds", "stronghold_done_1", "stronghold_done_2"],
        ["empyrean_traces", "empyrean_trace_1", "empyrean_trace_2"],
      ];
      for (const [setName, kept, gone] of steps) {
        const first = report(s, setName, [kept]);
        expect(first.added).toEqual([]);
        expect(first.removed).toEqual([]);
        expect(s.gameReportedNodes?.[setName]).toEqual([kept, gone]);
        const second = report(s, setName, [kept]);
        expect(second.added).toEqual([]);
        expect(second.removed).toEqual([gone]);
      }
      expect(s.gameReportedNodes).toEqual({
        quests: ["q_1"],
        strongholds: ["stronghold_done_1"],
        empyrean_traces: ["empyrean_trace_1"],
      });
      expect(s.discoveredNodes).toContain("e123");
      expect(s.discoveredNodes).toContain("manual@1:2");
      expect(s.autoDiscoveredNodes).toContain("e123");
      expect(s.autoDiscoveredNodes).toContain("boss@3:4");
    });
  });

  it("removes by exact string and leaves 'id@x:y' marks alone", () => {
    const s = state({
      discoveredNodes: ["empyrean_trace_5@10:20", "other@1:1"],
      autoDiscoveredNodes: ["empyrean_trace_5@10:20"],
    });
    report(s, SET, ["empyrean_trace_5"]);
    expect(s.discoveredNodes).toEqual([
      "empyrean_trace_5@10:20",
      "other@1:1",
      "empyrean_trace_5",
    ]);
    report(s, SET, []);
    report(s, SET, []);
    expect(s.discoveredNodes).toEqual(["empyrean_trace_5@10:20", "other@1:1"]);
    expect(s.autoDiscoveredNodes).toEqual(["empyrean_trace_5@10:20"]);
  });

  it("keeps two sets independent", () => {
    const s = state();
    report(s, SET, ["t1"]);
    report(s, "quests", ["q1"]);
    expect(s.gameReportedNodes).toEqual({ [SET]: ["t1"], quests: ["q1"] });
    // Quests empty twice: only q1 goes; traces untouched.
    report(s, "quests", []);
    report(s, "quests", []);
    expect(s.discoveredNodes).toEqual(["t1"]);
    expect(s.gameReportedNodes).toEqual({ [SET]: ["t1"], quests: [] });
    // A set that reports an id the other set owns does not claim it.
    report(s, "quests", ["t1"]);
    expect(s.gameReportedNodes).toEqual({ [SET]: ["t1"], quests: [] });
  });

  it("produces no write for a no-op report", () => {
    const s = state();
    report(s, SET, ["t1", "t2"]);
    const before = {
      discoveredNodes: s.discoveredNodes,
      autoDiscoveredNodes: s.autoDiscoveredNodes,
      gameReportedNodes: s.gameReportedNodes,
    };
    const r = report(s, SET, ["t2", "t1"]);
    expect(r.update).toBeNull();
    expect(s.discoveredNodes).toBe(before.discoveredNodes);
    expect(s.autoDiscoveredNodes).toBe(before.autoDiscoveredNodes);
    expect(s.gameReportedNodes).toBe(before.gameReportedNodes);
  });

  it("re-adds an owned id the user un-marked while the game still reports it", () => {
    const s = state();
    report(s, SET, ["t1"]);
    s.discoveredNodes = []; // user toggled the pin off
    const r = report(s, SET, ["t1"]);
    expect(r.added).toEqual(["t1"]);
    expect(s.discoveredNodes).toEqual(["t1"]);
    expect(s.autoDiscoveredNodes).toEqual(["t1"]);
    expect(s.gameReportedNodes).toEqual({ [SET]: ["t1"] });
  });

  it("only patches the fields that change", () => {
    const r = diffGameReportedSet({
      setName: SET,
      reportedIds: ["t1"],
      discoveredNodes: [],
      autoDiscoveredNodes: ["t1"],
      gameReportedNodes: { [SET]: ["t1"] },
      misses: undefined,
    });
    expect(r.update).toEqual({ discoveredNodes: ["t1"] });
  });
});
