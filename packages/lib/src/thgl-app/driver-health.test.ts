import {
  DriverHealth,
  describeDriverHealth,
  isDriverHealthProblem,
  isGameBlockedByDriver,
} from "./driver-health";

function health(overrides: Partial<DriverHealth> = {}): DriverHealth {
  return {
    state: "ok",
    code: 0,
    detail: "",
    blockedProcesses: [],
    bridgeServiceInstalled: true,
    bridgeServiceRunning: true,
    driverServiceRunning: true,
    repairNeedsElevation: false,
    repairing: false,
    lastRepair: "",
    isElevated: false,
    updatedAt: 0,
    ...overrides,
  };
}

describe("isDriverHealthProblem", () => {
  it("is silent for null, unknown, ok and a transient busy pipe", () => {
    expect(isDriverHealthProblem(null)).toBe(false);
    expect(isDriverHealthProblem(health({ state: "unknown" }))).toBe(false);
    expect(isDriverHealthProblem(health({ state: "ok" }))).toBe(false);
    expect(isDriverHealthProblem(health({ state: "bridgeBusy" }))).toBe(false);
  });

  it("flags every broken link of the BridgeHost -> driver chain", () => {
    for (const state of [
      "bridgeNotInstalled",
      "bridgeNotRunning",
      "bridgeNoResponse",
      "clientNotAuthorized",
      "driverNotRunning",
      "deviceAccessDenied",
      "error",
    ] as const) {
      expect(isDriverHealthProblem(health({ state }))).toBe(true);
    }
  });
});

describe("describeDriverHealth", () => {
  it("offers a service start for a stopped BridgeHost and marks the UAC need", () => {
    const advice = describeDriverHealth(
      health({ state: "bridgeNotRunning", isElevated: false }),
    );
    expect(advice.repair).toBe("startBridgeHost");
    expect(advice.repairLabelKey).toBe("driver.repair.startService");
    expect(advice.needsElevation).toBe(true);
    expect(advice.titleKey).toBe("driver.bridgeNotRunning.title");
  });

  it("does not claim a UAC prompt when the app is already elevated", () => {
    const advice = describeDriverHealth(
      health({ state: "bridgeNotRunning", isElevated: true }),
    );
    expect(advice.needsElevation).toBe(false);
  });

  it("offers a service restart when the driver is down or the service hangs", () => {
    for (const state of ["driverNotRunning", "bridgeNoResponse"] as const) {
      const advice = describeDriverHealth(health({ state, isElevated: false }));
      expect(advice.repair).toBe("restartBridgeHost");
      expect(advice.repairLabelKey).toBe("driver.repair.restartService");
      expect(advice.needsElevation).toBe(true);
    }
  });

  it("offers a reinstall for a missing service, a rejected signature and a refused device", () => {
    for (const state of [
      "bridgeNotInstalled",
      "clientNotAuthorized",
      "deviceAccessDenied",
      "error",
    ] as const) {
      const advice = describeDriverHealth(health({ state }));
      expect(advice.repair).toBe("reinstall");
      expect(advice.needsElevation).toBe(false);
      expect(advice.descriptionKey).toBe(`driver.${state}.description`);
    }
  });

  it("offers nothing for ok / unknown / busy", () => {
    expect(describeDriverHealth(health({ state: "ok" })).repair).toBeNull();
    expect(
      describeDriverHealth(health({ state: "unknown" })).repair,
    ).toBeNull();
    expect(
      describeDriverHealth(health({ state: "bridgeBusy" })).repair,
    ).toBeNull();
  });
});

describe("isGameBlockedByDriver", () => {
  it("matches the game's process names case-insensitively", () => {
    const h = health({
      state: "clientNotAuthorized",
      blockedProcesses: ["CrimsonDesert.exe"],
    });
    expect(isGameBlockedByDriver(h, ["crimsondesert.exe"])).toBe(true);
    expect(isGameBlockedByDriver(h, ["Palworld-Win64-Shipping.exe"])).toBe(
      false,
    );
  });

  it("is false without a health report or without blocked processes", () => {
    expect(isGameBlockedByDriver(null, ["CrimsonDesert.exe"])).toBe(false);
    expect(
      isGameBlockedByDriver(health({ state: "ok" }), ["CrimsonDesert.exe"]),
    ).toBe(false);
  });
});
