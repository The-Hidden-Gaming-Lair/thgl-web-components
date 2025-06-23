import { postWebviewMessage } from "./webview";

export type CurrentVersion = {
  version: string;
  changelog: string;
};

export type AppVersion = {
  buildDate: string;
  buildTime: string;
  buildVersion?: string;
};

export function getVersionFromWebview() {
  return postWebviewMessage<AppVersion>({ action: "getVersion", payload: {} });
}

export function isRunningAsAdminFromWebview() {
  return postWebviewMessage<boolean>({
    action: "isRunningAsAdmin",
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
