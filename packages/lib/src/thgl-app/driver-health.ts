import { postWebviewMessage } from "./webview";

// Mirror of THGLApp `DriverHealthMonitor::ToJson()` (Source/GameIntegration/driver_health.cpp).
// Every game feature depends on THGLApp -> THGLBridgeHost (service) -> THGLDriver (kernel);
// this is the classified state of that chain, broadcast as a `driverHealth` message.
export type DriverHealthState =
  | "unknown"
  | "ok"
  | "bridgeNotInstalled"
  | "bridgeNotRunning"
  | "bridgeBusy"
  | "bridgeNoResponse"
  | "clientNotAuthorized"
  | "driverNotRunning"
  | "deviceAccessDenied"
  | "clientNotInAllowlist"
  | "clientImageUnreadable"
  | "error";

export type DriverHealth = {
  state: DriverHealthState;
  code: number;
  detail: string;
  // Supported game exes currently running that the app cannot track because of `state`.
  blockedProcesses: string[];
  bridgeServiceInstalled: boolean;
  bridgeServiceRunning: boolean;
  driverServiceRunning: boolean;
  // The BridgeHost log says it could not download the allowlist manifest: the reason a fresh
  // app build gets refused by the driver. Optional: older app builds do not send it.
  manifestUpdateBlocked?: boolean;
  repairNeedsElevation: boolean;
  repairing: boolean;
  lastRepair: string;
  isElevated: boolean;
  updatedAt: number;
};

export type DriverRepairKind =
  | "startBridgeHost" // start the stopped service
  | "restartBridgeHost" // stop + start: the service reinstalls the kernel driver on start
  | "reinstall"; // re-run the installer

export type DriverHealthAdvice = {
  // Dictionary keys (packages/ui/src/dicts/thgl-app.*.json, `driver.*`).
  titleKey: string;
  descriptionKey: string;
  // Repair the UI should offer, if any.
  repair: DriverRepairKind | null;
  repairLabelKey: string | null;
  // The offered repair triggers a Windows UAC prompt.
  needsElevation: boolean;
};

/**
 * True when the chain is broken in a way the user must act on. `unknown` (never probed) and
 * `ok` are silent; so is a transient `bridgeBusy` — the next scan resolves it.
 */
export function isDriverHealthProblem(health: DriverHealth | null): boolean {
  if (!health) return false;
  return (
    health.state !== "unknown" &&
    health.state !== "ok" &&
    health.state !== "bridgeBusy"
  );
}

/**
 * Pure mapping from a health state to what the dashboard should say and offer. Kept free of
 * React so it can be unit-tested and reused by the game page and the global banner.
 */
export function describeDriverHealth(health: DriverHealth): DriverHealthAdvice {
  const base = (
    key: string,
    repair: DriverRepairKind | null,
    repairLabelKey: string | null = null,
    descriptionKey = `driver.${key}.description`,
  ): DriverHealthAdvice => ({
    titleKey: `driver.${key}.title`,
    descriptionKey,
    repair,
    repairLabelKey,
    // Service control needs SERVICE_START/STOP rights: a UAC prompt unless the app is elevated.
    needsElevation:
      repair === "startBridgeHost" || repair === "restartBridgeHost"
        ? !health.isElevated
        : false,
  });

  switch (health.state) {
    case "bridgeNotInstalled":
      return base("bridgeNotInstalled", "reinstall", "driver.repair.reinstall");
    case "bridgeNotRunning":
      return base(
        "bridgeNotRunning",
        "startBridgeHost",
        "driver.repair.startService",
      );
    case "bridgeNoResponse":
      return base(
        "bridgeNoResponse",
        "restartBridgeHost",
        "driver.repair.restartService",
      );
    case "clientNotAuthorized":
      return base(
        "clientNotAuthorized",
        "reinstall",
        "driver.repair.reinstall",
      );
    case "driverNotRunning":
      // BridgeHost reinstalls and starts the driver on every service start, so a restart
      // is the fix; reinstalling only helps when the driver binary itself is broken.
      return base(
        "driverNotRunning",
        "restartBridgeHost",
        "driver.repair.restartService",
      );
    case "deviceAccessDenied":
      return base("deviceAccessDenied", "reinstall", "driver.repair.reinstall");
    case "clientNotInAllowlist":
      // The driver refuses this app build because BridgeHost's cached allowlist manifest is
      // older than the build. A reinstall cannot fix it (the installer ships no manifest and
      // keeps the cached one), so offer the service restart, which re-attempts the download.
      // When the BridgeHost log proves the download is being blocked, say so outright.
      return base(
        "clientNotInAllowlist",
        "restartBridgeHost",
        "driver.repair.restartService",
        health.manifestUpdateBlocked
          ? "driver.clientNotInAllowlist.blockedDescription"
          : "driver.clientNotInAllowlist.description",
      );
    case "clientImageUnreadable":
      // The driver could not even read the app's own image to hash it. Nothing the app can
      // repair: security software is holding the file.
      return base("clientImageUnreadable", null);
    case "error":
      return base("error", "reinstall", "driver.repair.reinstall");
    case "bridgeBusy":
      return base("bridgeBusy", null);
    case "ok":
    case "unknown":
    default:
      return base("ok", null);
  }
}

/**
 * Whether one of `processNames` (a game's companion process names, any case) is running but
 * blocked by the driver problem — the game page uses this to replace "Start the game to
 * enable the overlay" with the real reason.
 */
export function isGameBlockedByDriver(
  health: DriverHealth | null,
  processNames: string[],
): boolean {
  if (!health || health.blockedProcesses.length === 0) return false;
  const wanted = new Set(processNames.map((p) => p.toLowerCase()));
  return health.blockedProcesses.some((p) => wanted.has(p.toLowerCase()));
}

export function getDriverHealthFromWebview() {
  return postWebviewMessage<DriverHealth>({
    action: "getDriverHealth",
    payload: {},
  });
}

export function repairDriverFromWebview(kind: DriverRepairKind) {
  return postWebviewMessage<undefined>({
    action: "repairDriver",
    payload: { kind },
  });
}
