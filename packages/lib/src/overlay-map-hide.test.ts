import {
  resolveOverlayMapHidden,
  useOverlayMapHideSession,
} from "./overlay-map-hide";

describe("resolveOverlayMapHidden", () => {
  it("is not hidden when the player map is unknown (loading / plain web)", () => {
    expect(resolveOverlayMapHidden({ housing: true }, null, null)).toEqual({
      flagged: false,
      overridden: false,
      hidden: false,
    });
  });

  it("hides on a flagged map", () => {
    expect(resolveOverlayMapHidden({ housing: true }, "housing", null)).toEqual(
      {
        flagged: true,
        overridden: false,
        hidden: true,
      },
    );
  });

  it("does not hide on an unflagged map", () => {
    expect(
      resolveOverlayMapHidden({ housing: true }, "kilima", null).hidden,
    ).toBe(false);
  });

  it("shows while the override targets the current map", () => {
    const r = resolveOverlayMapHidden({ housing: true }, "housing", "housing");
    expect(r).toEqual({ flagged: true, overridden: true, hidden: false });
  });

  it("tolerates a store hydrated before the field existed", () => {
    expect(resolveOverlayMapHidden(undefined, "housing", null).hidden).toBe(
      false,
    );
  });
});

describe("useOverlayMapHideSession", () => {
  const reset = () =>
    useOverlayMapHideSession.setState({ playerMap: null, overrideMap: null });

  beforeEach(reset);

  it("tracks the player map and starts without an override", () => {
    useOverlayMapHideSession.getState().setPlayerMap("housing");
    expect(useOverlayMapHideSession.getState()).toMatchObject({
      playerMap: "housing",
      overrideMap: null,
    });
  });

  it("toggles the override for the current map", () => {
    useOverlayMapHideSession.getState().setPlayerMap("housing");
    useOverlayMapHideSession.getState().toggleOverride();
    expect(useOverlayMapHideSession.getState().overrideMap).toBe("housing");
    useOverlayMapHideSession.getState().toggleOverride();
    expect(useOverlayMapHideSession.getState().overrideMap).toBeNull();
  });

  it("ignores toggleOverride before any map is known", () => {
    useOverlayMapHideSession.getState().toggleOverride();
    expect(useOverlayMapHideSession.getState().overrideMap).toBeNull();
  });

  it("clears the override on map change (reverts upon exit), including on return", () => {
    const s = useOverlayMapHideSession.getState();
    s.setPlayerMap("housing");
    s.toggleOverride();
    s.setPlayerMap("kilima");
    expect(useOverlayMapHideSession.getState().overrideMap).toBeNull();
    useOverlayMapHideSession.getState().setPlayerMap("housing");
    expect(useOverlayMapHideSession.getState().overrideMap).toBeNull();
  });

  it("keeps the override on a same-map re-set (repeated live updates)", () => {
    const s = useOverlayMapHideSession.getState();
    s.setPlayerMap("housing");
    s.toggleOverride();
    useOverlayMapHideSession.getState().setPlayerMap("housing");
    expect(useOverlayMapHideSession.getState().overrideMap).toBe("housing");
  });
});
