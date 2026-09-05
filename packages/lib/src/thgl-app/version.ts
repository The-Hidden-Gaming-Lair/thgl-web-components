import { postWebviewMessage, GpuFlag, CloseAction } from "./webview";
import { WindowMode } from "./apps";
import type { ConnectedClient } from "./states";

export type CurrentVersion = {
  version: string;
};

export type AppVersion = {
  buildDate: string;
  buildTime: string;
  buildVersion?: string;
};

export type InitialState = {
  version: AppVersion;
  isTaskInstalled: boolean;
  windowMode: WindowMode;
  gpuFlag: GpuFlag;
  isRunningAsAdmin: boolean;
  alwaysRunAsAdmin: boolean;
  exclusiveFullscreen?: boolean;
  closeAction: CloseAction;
  locale: string;
  connectedClients?: ConnectedClient[];
  // True when the app stripped the Windows Compatibility "Run as
  // administrator" flag for its exe at startup (it forces UAC elevation on
  // every launch and can fork the WebView2 storage identity — the app manages
  // elevation itself). Surfaced as a one-time dashboard toast.
  compatRunAsAdminFlagRemoved?: boolean;
};

export function getVersionFromWebview() {
  return postWebviewMessage<AppVersion>({ action: "getVersion", payload: {} });
}

export function getInitialStateFromWebview() {
  return postWebviewMessage<InitialState>({
    action: "getInitialState",
    payload: {},
  });
}

export function isTaskInstalledFromWebview() {
  return postWebviewMessage<boolean>({
    action: "isTaskInstalled",
    payload: {},
  });
}

export function addScheduledTaskFromWebview() {
  return postWebviewMessage<boolean>({
    action: "addScheduledTask",
    payload: {},
  });
}

export function removeScheduledTaskFromWebview() {
  return postWebviewMessage<boolean>({
    action: "removeScheduledTask",
    payload: {},
  });
}

export function triggerUpdate() {
  return postWebviewMessage({ action: "triggerUpdate", payload: {} });
}

export function getGpuFlag() {
  return postWebviewMessage<GpuFlag>({ action: "getGpuFlag", payload: {} });
}

export function setGpuFlag(flag: GpuFlag) {
  return postWebviewMessage({ action: "setGpuFlag", payload: { flag } });
}

export function setAlwaysRunAsAdmin(always: boolean) {
  return postWebviewMessage({
    action: "setAlwaysRunAsAdmin",
    payload: { always },
  });
}

export function setCloseAction(closeAction: CloseAction) {
  return postWebviewMessage({
    action: "setCloseAction",
    payload: { closeAction },
  });
}

// Opt-out mirror: pushes the Palia join-code mute to the native app so its world
// heartbeat can DROP the join code at the source (never transmitted when muted).
export function setWorldCodeRequestsMuted(muted: boolean) {
  return postWebviewMessage({
    action: "setWorldCodeRequestsMuted",
    payload: { muted },
  });
}

export function setLocaleOnNative(locale: string) {
  return postWebviewMessage({ action: "setLocale", payload: { locale } });
}
