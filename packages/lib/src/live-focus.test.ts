import {
  createLiveFocusTracker,
  readFocusNodeIds,
  replaceHighlightIds,
} from "./live-focus";
import { useGameState } from "./game";

describe("readFocusNodeIds", () => {
  it("returns the string ids of focusNodeIds", () => {
    expect(
      readFocusNodeIds({
        collectedNodeIds: ["q_1101010"],
        focusNodeIds: ["q_1102150@s2g1", 42, "", null, "q_1202012@turnin"],
      }),
    ).toEqual(["q_1102150@s2g1", "q_1202012@turnin"]);
  });

  it("keeps an empty list (no open quests) apart from a missing field", () => {
    expect(readFocusNodeIds({ focusNodeIds: [] })).toEqual([]);
    expect(readFocusNodeIds({ collectedNodeIds: ["x"] })).toBeNull();
    expect(readFocusNodeIds(null)).toBeNull();
    expect(readFocusNodeIds({ focusNodeIds: "q_1" })).toBeNull();
  });
});

describe("replaceHighlightIds", () => {
  it("replaces instead of adding", () => {
    expect(replaceHighlightIds(["a", "b"], ["c"])).toEqual(["c"]);
    expect(replaceHighlightIds(["a", "b"], [])).toEqual([]);
  });

  it("dedupes the new ids", () => {
    expect(replaceHighlightIds([], ["a", "a", "b"])).toEqual(["a", "b"]);
  });

  it("keeps the previous reference for the same ids in any order", () => {
    const prev = ["a", "b"];
    expect(replaceHighlightIds(prev, ["b", "a"])).toBe(prev);
    expect(replaceHighlightIds(prev, ["a", "b", "a"])).toBe(prev);
    expect(replaceHighlightIds(prev, ["a"])).not.toBe(prev);
  });
});

describe("useGameState.setHighlightSpawnIDs", () => {
  afterEach(() => useGameState.setState({ highlightSpawnIDs: [] }));

  it("replaces the set and leaves the store untouched when unchanged", () => {
    const { setHighlightSpawnIDs, addHighlightSpawnIDs } =
      useGameState.getState();
    addHighlightSpawnIDs(["old@1:2"]);
    setHighlightSpawnIDs(["q_1@s1g1", "q_1@s1g2"]);
    const first = useGameState.getState().highlightSpawnIDs;
    expect(first).toEqual(["q_1@s1g1", "q_1@s1g2"]);

    const listener = jest.fn();
    const unsub = useGameState.subscribe(listener);
    setHighlightSpawnIDs(["q_1@s1g2", "q_1@s1g1"]);
    unsub();
    expect(listener).not.toHaveBeenCalled();
    expect(useGameState.getState().highlightSpawnIDs).toBe(first);
  });
});

describe("createLiveFocusTracker", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("sets the focus of every payload that carries it", () => {
    const setIds = jest.fn();
    const focus = createLiveFocusTracker(setIds, 1000);
    focus.apply({ focusNodeIds: ["a"] });
    focus.apply({ focusNodeIds: ["b"] });
    expect(setIds.mock.calls).toEqual([[["a"]], [["b"]]]);
  });

  it("clears its focus when a payload lacks the field", () => {
    const setIds = jest.fn();
    const focus = createLiveFocusTracker(setIds, 1000);
    focus.apply({ focusNodeIds: ["a"] });
    focus.apply({ collectedNodeIds: ["x"] });
    expect(setIds).toHaveBeenLastCalledWith([]);
  });

  it("never touches the highlights for a game that sends no focus", () => {
    const setIds = jest.fn();
    const focus = createLiveFocusTracker(setIds, 1000);
    focus.apply({ collectedNodeIds: ["x"] });
    focus.apply(null);
    jest.advanceTimersByTime(5000);
    expect(setIds).not.toHaveBeenCalled();
  });

  it("drops a stale focus when the messages stop (game closed)", () => {
    const setIds = jest.fn();
    const focus = createLiveFocusTracker(setIds, 1000);
    focus.apply({ focusNodeIds: ["a"] });
    jest.advanceTimersByTime(900);
    focus.apply({ focusNodeIds: ["a"] }); // re-arms the timer
    jest.advanceTimersByTime(900);
    expect(setIds).toHaveBeenCalledTimes(2);
    jest.advanceTimersByTime(200);
    expect(setIds).toHaveBeenLastCalledWith([]);
    expect(setIds).toHaveBeenCalledTimes(3);
    jest.advanceTimersByTime(5000);
    expect(setIds).toHaveBeenCalledTimes(3);
  });
});
