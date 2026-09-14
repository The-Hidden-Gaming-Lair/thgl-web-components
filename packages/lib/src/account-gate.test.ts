import { resolveAccountGate } from "./account-gate";

const gate = (o: Partial<Parameters<typeof resolveAccountGate>[0]>) =>
  resolveAccountGate({
    mounted: true,
    devBypass: false,
    hasHydrated: true,
    hasPermission: false,
    ...o,
  });

describe("resolveAccountGate", () => {
  describe("SSR / first client render", () => {
    // The regression this ordering exists for: the THGLApp companion paywall
    // used to read isLocalDev + the perk directly while rendering, so the
    // SERVER (no window -> devBypass false, no account -> no permission)
    // rendered the Elite upsell into the HTML, the WebView painted it, and
    // hydration then removed it — a visible flash plus a hydration error.
    it("is pending before mount even when the answer would be 'deny'", () => {
      expect(
        gate({ mounted: false, devBypass: false, hasPermission: false }),
      ).toBe("pending");
    });

    it("is pending before mount even when the dev bypass applies", () => {
      expect(gate({ mounted: false, devBypass: true })).toBe("pending");
    });

    it("is pending before mount even for a permitted account", () => {
      expect(gate({ mounted: false, hasPermission: true })).toBe("pending");
    });
  });

  describe("after mount", () => {
    it("allows on a dev/debug host regardless of the account", () => {
      expect(gate({ devBypass: true, hasPermission: false })).toBe("allow");
      expect(gate({ devBypass: true, hasHydrated: false })).toBe("allow");
    });

    it("stays pending while the persisted account is still rehydrating", () => {
      // Not "deny" — otherwise the paywall flashes at users who DO have access.
      expect(gate({ hasHydrated: false, hasPermission: true })).toBe("pending");
      expect(gate({ hasHydrated: false, hasPermission: false })).toBe(
        "pending",
      );
    });

    it("allows a permitted account", () => {
      expect(gate({ hasPermission: true })).toBe("allow");
    });

    // Production behaviour: a signed-out / non-Elite visitor on th.gl must
    // still be locked out of a preview game.
    it("denies a hydrated account without the permission", () => {
      expect(gate({ hasPermission: false })).toBe("deny");
    });
  });
});
