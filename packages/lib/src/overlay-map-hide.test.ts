import {
  resolveOverlayMapHidden,
  useOverlayMapHideSession,
} from "./overlay-map-hide";
import { useSettingsStore } from "./settings";

const resolve = (
  over: Partial<Parameters<typeof resolveOverlayMapHidden>[0]>,
) =>
  resolveOverlayMapHidden({
    hideOverlayByMap: {},
    hideOverlayWithoutMap: false,
    playerMap: null,
    currentMap: null,
    overrideMap: null,
    overrideNoMap: false,
    ...over,
  });

describe("resolveOverlayMapHidden — per-map rule", () => {
  it("is not hidden when the player map is unknown and the no-map option is off", () => {
    expect(resolve({ hideOverlayByMap: { housing: true } })).toEqual({
      reason: null,
      hidden: false,
      flagged: false,
      overridden: false,
    });
  });

  it("hides on a flagged map", () => {
    expect(
      resolve({
        hideOverlayByMap: { housing: true },
        playerMap: "housing",
        currentMap: "housing",
      }),
    ).toEqual({
      reason: "map",
      hidden: true,
      flagged: true,
      overridden: false,
    });
  });

  it("does not hide on an unflagged map", () => {
    expect(
      resolve({
        hideOverlayByMap: { housing: true },
        playerMap: "kilima",
        currentMap: "kilima",
      }).hidden,
    ).toBe(false);
  });

  it("shows while the override targets the current map", () => {
    expect(
      resolve({
        hideOverlayByMap: { housing: true },
        playerMap: "housing",
        currentMap: "housing",
        overrideMap: "housing",
      }),
    ).toEqual({
      reason: "map",
      hidden: false,
      flagged: true,
      overridden: true,
    });
  });

  it("keeps a flagged map hidden through data gaps when the no-map option is off (held playerMap)", () => {
    expect(
      resolve({
        hideOverlayByMap: { housing: true },
        playerMap: "housing",
        currentMap: null,
      }),
    ).toEqual({
      reason: "map",
      hidden: true,
      flagged: true,
      overridden: false,
    });
  });

  it("tolerates a store hydrated before the fields existed", () => {
    expect(
      resolveOverlayMapHidden({
        hideOverlayByMap: undefined,
        hideOverlayWithoutMap: undefined,
        playerMap: "housing",
        currentMap: "housing",
        overrideMap: null,
        overrideNoMap: false,
      }).hidden,
    ).toBe(false);
  });
});

describe("resolveOverlayMapHidden — no-map rule", () => {
  it("hides while no map is detected (option on)", () => {
    expect(resolve({ hideOverlayWithoutMap: true })).toEqual({
      reason: "noMap",
      hidden: true,
      flagged: false,
      overridden: false,
    });
  });

  it("defaults to ON for profiles persisted before the field existed", () => {
    expect(resolve({ hideOverlayWithoutMap: undefined }).hidden).toBe(true);
  });

  it("shows while the no-map override is active", () => {
    expect(
      resolve({ hideOverlayWithoutMap: true, overrideNoMap: true }),
    ).toEqual({
      reason: "noMap",
      hidden: false,
      flagged: false,
      overridden: true,
    });
  });

  it("the no-map rule takes precedence over the held flagged map", () => {
    // In the menu after leaving a flagged map: reason is noMap (its override
    // controls visibility), not the held map rule.
    expect(
      resolve({
        hideOverlayWithoutMap: true,
        hideOverlayByMap: { housing: true },
        playerMap: "housing",
        currentMap: null,
      }).reason,
    ).toBe("noMap");
  });

  it("does not apply while a map IS detected", () => {
    expect(
      resolve({
        hideOverlayWithoutMap: true,
        currentMap: "kilima",
        playerMap: "kilima",
      }),
    ).toEqual({
      reason: null,
      hidden: false,
      flagged: false,
      overridden: false,
    });
  });
});

describe("useOverlayMapHideSession", () => {
  const reset = () =>
    useOverlayMapHideSession.setState({
      playerMap: null,
      currentMap: null,
      overrideMap: null,
      overrideNoMap: false,
    });

  beforeEach(reset);

  it("tracks the player map and starts without overrides", () => {
    useOverlayMapHideSession.getState().setCurrentMap("housing");
    expect(useOverlayMapHideSession.getState()).toMatchObject({
      playerMap: "housing",
      currentMap: "housing",
      overrideMap: null,
      overrideNoMap: false,
    });
  });

  it("holds playerMap when the map is lost, but clears currentMap", () => {
    useOverlayMapHideSession.getState().setCurrentMap("housing");
    useOverlayMapHideSession.getState().setCurrentMap(null);
    expect(useOverlayMapHideSession.getState()).toMatchObject({
      playerMap: "housing",
      currentMap: null,
    });
  });

  it("toggles the per-map override for the current flagged map", () => {
    useSettingsStore.setState({
      hideOverlayByMap: { housing: true },
      hideOverlayWithoutMap: false,
    });
    useOverlayMapHideSession.getState().setCurrentMap("housing");
    useOverlayMapHideSession.getState().toggleOverride();
    expect(useOverlayMapHideSession.getState().overrideMap).toBe("housing");
    useOverlayMapHideSession.getState().toggleOverride();
    expect(useOverlayMapHideSession.getState().overrideMap).toBeNull();
  });

  it("toggles the no-map override while no map is detected", () => {
    useSettingsStore.setState({
      hideOverlayByMap: {},
      hideOverlayWithoutMap: true,
    });
    useOverlayMapHideSession.getState().toggleOverride();
    expect(useOverlayMapHideSession.getState().overrideNoMap).toBe(true);
    useOverlayMapHideSession.getState().toggleOverride();
    expect(useOverlayMapHideSession.getState().overrideNoMap).toBe(false);
  });

  it("clears the no-map override when a map is detected", () => {
    useSettingsStore.setState({
      hideOverlayByMap: {},
      hideOverlayWithoutMap: true,
    });
    useOverlayMapHideSession.getState().toggleOverride();
    useOverlayMapHideSession.getState().setCurrentMap("kilima");
    expect(useOverlayMapHideSession.getState().overrideNoMap).toBe(false);
  });

  it("clears the per-map override on map change (reverts upon exit), including on return", () => {
    useSettingsStore.setState({
      hideOverlayByMap: { housing: true },
      hideOverlayWithoutMap: false,
    });
    const s = useOverlayMapHideSession.getState();
    s.setCurrentMap("housing");
    s.toggleOverride();
    s.setCurrentMap("kilima");
    expect(useOverlayMapHideSession.getState().overrideMap).toBeNull();
    useOverlayMapHideSession.getState().setCurrentMap("housing");
    expect(useOverlayMapHideSession.getState().overrideMap).toBeNull();
  });

  it("keeps the per-map override across a data gap on the SAME map (loading screen)", () => {
    useSettingsStore.setState({
      hideOverlayByMap: { housing: true },
      hideOverlayWithoutMap: false,
    });
    const s = useOverlayMapHideSession.getState();
    s.setCurrentMap("housing");
    s.toggleOverride();
    useOverlayMapHideSession.getState().setCurrentMap(null);
    useOverlayMapHideSession.getState().setCurrentMap("housing");
    expect(useOverlayMapHideSession.getState().overrideMap).toBe("housing");
  });
});
