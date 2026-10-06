import {
  GAME_REPORTED_REMOVE_AFTER_MISSES,
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
    const s = state({
      discoveredNodes: ["t1", "t9", "effigy@3:4", "t1@5:6"],
      autoDiscoveredNodes: ["t1", "t9", "effigy@3:4"],
      gameReportedNodes: undefined,
    });
    const first = report(s, SET, ["t1"]);
    // Record created (adoption), nothing added or removed yet.
    expect(first.added).toEqual([]);
    expect(first.removed).toEqual([]);
    expect(first.update).toEqual({
      gameReportedNodes: { [SET]: ["t1", "t9"] },
    });
    // t9 (the other character's leftover) goes after the second miss.
    report(s, SET, ["t1"]);
    expect(s.discoveredNodes).toEqual(["t1", "effigy@3:4", "t1@5:6"]);
    expect(s.autoDiscoveredNodes).toEqual(["t1", "effigy@3:4"]);
    expect(s.gameReportedNodes).toEqual({ [SET]: ["t1"] });
  });

  it("migration does not adopt ids another set owns", () => {
    const s = state({
      discoveredNodes: ["q1", "t1"],
      autoDiscoveredNodes: ["q1", "t1"],
      gameReportedNodes: { quests: ["q1"] },
    });
    report(s, SET, ["t1"]);
    expect(s.gameReportedNodes).toEqual({ quests: ["q1"], [SET]: ["t1"] });
  });

  it("an existing empty record is not re-migrated", () => {
    const s = state({
      discoveredNodes: ["t9"],
      autoDiscoveredNodes: ["t9"],
      gameReportedNodes: { [SET]: [] },
    });
    const r = report(s, SET, []);
    expect(r.update).toBeNull();
    report(s, SET, []);
    expect(s.discoveredNodes).toEqual(["t9"]);
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
