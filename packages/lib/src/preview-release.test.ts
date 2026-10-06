import {
  isPreviewFeature,
  isPreviewFeatureEnabled,
  PREVIEW_FEATURES,
  previewFilterId,
  selectRequestedActorTypes,
} from "./preview-release";
import { PREVIEW_LIVE_MODES } from "./settings";

describe("preview filters", () => {
  const typesIdMap = {
    BP_SheepBall_C: "sheepball",
    "BP_SheepBall_C_Variant.Lucky": "lucky_pal",
  };

  it("Palworld Lucky Pals is a preview filter", () => {
    expect(isPreviewFeature(previewFilterId("palworld", "lucky_pal"))).toBe(
      true,
    );
  });

  it("a preview live filter is only requested with access", () => {
    const enabled = ["sheepball", "lucky_pal"];
    expect(
      selectRequestedActorTypes("palworld", typesIdMap, enabled, false),
    ).toEqual(["BP_SheepBall_C"]);
    expect(
      selectRequestedActorTypes("palworld", typesIdMap, enabled, true),
    ).toEqual(["BP_SheepBall_C", "BP_SheepBall_C_Variant.Lucky"]);
  });

  it("disabled filters and other games are unaffected", () => {
    expect(
      selectRequestedActorTypes("palworld", typesIdMap, ["sheepball"], true),
    ).toEqual(["BP_SheepBall_C"]);
    expect(
      selectRequestedActorTypes("palia", typesIdMap, ["lucky_pal"], false),
    ).toEqual(["BP_SheepBall_C_Variant.Lucky"]);
  });
});

describe("preview features", () => {
  it("a registered feature needs Elite preview access", () => {
    expect(isPreviewFeature("widgets-only-overlay")).toBe(true);
    expect(isPreviewFeatureEnabled("widgets-only-overlay", false)).toBe(false);
    expect(isPreviewFeatureEnabled("widgets-only-overlay", true)).toBe(true);
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
