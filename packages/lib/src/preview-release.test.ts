import {
  isPreviewFeature,
  isPreviewFeatureEnabled,
  PREVIEW_FEATURES,
} from "./preview-release";
import { PREVIEW_LIVE_MODES } from "./settings";

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
