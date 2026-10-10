import {
  isPreviewFeature,
  isPreviewFeatureEnabled,
  PREVIEW_FEATURES,
  previewFilterId,
  selectRequestedActorTypes,
} from "./preview-release";
import { PREVIEW_LIVE_MODES } from "./settings";

// The real registry can be empty (every preview public); the gating logic is
// tested against this one.
const TEST_REGISTRY = {
  "filter:palworld:lucky_pal": { title: "Lucky Pals", since: "2026-10-06" },
  "widgets-only-overlay": { title: "Widgets Only", since: "2026-10-04" },
};

describe("preview filters", () => {
  const typesIdMap = {
    BP_SheepBall_C: "sheepball",
    "BP_SheepBall_C_Variant.Lucky": "lucky_pal",
  };

  it("a registered filter value is a preview filter", () => {
    expect(
      isPreviewFeature(previewFilterId("palworld", "lucky_pal"), TEST_REGISTRY),
    ).toBe(true);
  });

  it("a preview live filter is only requested with access", () => {
    const enabled = ["sheepball", "lucky_pal"];
    expect(
      selectRequestedActorTypes(
        "palworld",
        typesIdMap,
        enabled,
        false,
        TEST_REGISTRY,
      ),
    ).toEqual(["BP_SheepBall_C"]);
    expect(
      selectRequestedActorTypes(
        "palworld",
        typesIdMap,
        enabled,
        true,
        TEST_REGISTRY,
      ),
    ).toEqual(["BP_SheepBall_C", "BP_SheepBall_C_Variant.Lucky"]);
  });

  it("disabled filters and other games are unaffected", () => {
    expect(
      selectRequestedActorTypes(
        "palworld",
        typesIdMap,
        ["sheepball"],
        true,
        TEST_REGISTRY,
      ),
    ).toEqual(["BP_SheepBall_C"]);
    expect(
      selectRequestedActorTypes(
        "palia",
        typesIdMap,
        ["lucky_pal"],
        false,
        TEST_REGISTRY,
      ),
    ).toEqual(["BP_SheepBall_C_Variant.Lucky"]);
  });
});

describe("preview features", () => {
  it("a registered feature needs Elite preview access", () => {
    expect(isPreviewFeature("widgets-only-overlay", TEST_REGISTRY)).toBe(true);
    expect(
      isPreviewFeatureEnabled("widgets-only-overlay", false, TEST_REGISTRY),
    ).toBe(false);
    expect(
      isPreviewFeatureEnabled("widgets-only-overlay", true, TEST_REGISTRY),
    ).toBe(true);
  });

  it("an unregistered (or since public) feature is open to everyone", () => {
    expect(isPreviewFeature("not-a-preview")).toBe(false);
    expect(isPreviewFeatureEnabled("not-a-preview", false)).toBe(true);
    // Object prototype keys are not registry entries.
    expect(isPreviewFeature("toString")).toBe(false);
  });

  it("every entry has a title and an ISO since date", () => {
    for (const feature of Object.values(PREVIEW_FEATURES)) {
      expect(feature.title).toBeTruthy();
      expect(feature.since).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("live modes are gated through `live-mode:<mode>` entries", () => {
    for (const mode of PREVIEW_LIVE_MODES) {
      expect(isPreviewFeature(`live-mode:${mode}`)).toBe(true);
    }
    expect(PREVIEW_LIVE_MODES.has("combined")).toBe(
      isPreviewFeature("live-mode:combined"),
    );
  });
});
