import { useSettingsStore } from "../settings";
import { promisifyOverwolf } from "./promisify";

export type PresenceData = [
  string,
  string,
  string,
  string,
  string,
  string,
  boolean,
  number,
  string,
  string,
  string,
  string,
];
export async function initDiscordRPC(
  applicationID: string,
  updatePresence: (
    callback: (data: PresenceData) => void,
  ) => void | Promise<void>,
) {
  try {
    let discordRPCPlugin = await loadDiscordRPCPlugin(applicationID);
    let refreshPresenceTimeout: NodeJS.Timeout | null = null;
    let displayDiscordActivityStatus =
      useSettingsStore.getState().displayDiscordActivityStatus;
    const refreshPresence = async () => {
      if (!displayDiscordActivityStatus) {
        return;
      }
      if (refreshPresenceTimeout) {
        clearTimeout(refreshPresenceTimeout);
      }
      updatePresence((data) =>
        discordRPCPlugin.updatePresence(
          ...data,
          async (response: SuccessResponse | ErrorResponse) => {
            if (response.status === "error") {
              discordRPCPlugin = await loadDiscordRPCPlugin(applicationID);
              updatePresence((data) =>
                discordRPCPlugin.updatePresence(
                  ...data,
                  (response: SuccessResponse | ErrorResponse) => {
                    if (response.status === "error") {
                      console.error("Discord RPC error: " + response.error);
                    }
                  },
                ),
              );
            }
          },
        ),
      );

      refreshPresenceTimeout = setTimeout(refreshPresence, 30000);
    };
    useSettingsStore.subscribe((state) => {
      if (state.displayDiscordActivityStatus === displayDiscordActivityStatus) {
        return;
      }
      displayDiscordActivityStatus = state.displayDiscordActivityStatus;
      if (displayDiscordActivityStatus) {
        console.log("Displaying Discord Activity Status");
        refreshPresence();
      } else {
        if (refreshPresenceTimeout) {
          clearTimeout(refreshPresenceTimeout);
        }
        console.log("Disposing Discord RPC plugin");
        discordRPCPlugin.dispose(() => {});
      }
    });
    if (displayDiscordActivityStatus) {
      console.log("Displaying Discord Activity Status");
      refreshPresence();
    }
    return refreshPresence;
  } catch (e) {
    console.error("Error initializing Discord RPC", e);
  }
}

export async function loadDiscordRPCPlugin(
  applicationID: string,
  logLevel: LogLevel = 4,
) {
  const result = await promisifyOverwolf(
    overwolf.extensions.current.getExtraObject,
  )("discord");
  const discordRPCPlugin = result.object as DiscordRPCPlugin;
  try {
    await promisifyOverwolf(discordRPCPlugin.initialize)(
      applicationID,
      logLevel,
    );
  } catch (e) {
    // If the plugin is already initialized, we can ignore this error
  }
  return discordRPCPlugin;
}

export type DiscordRPCPlugin = {
  initialize: (
    applicationID: string,
    logLevel: LogLevel,
    callback: CallbackResponse,
  ) => void;
  onClientReady: Listener<OnClientReadyCallbackResponse>;
  onPresenceUpdate: Listener<SuccessCallbackResponse>;
  onClientError: Listener<ErrorCallbackResponse>;
  onLogLine: Listener<OnLogLineCallbackResponse>;
  updatePresence: (
    details: string,
    state: string,
    largeImageKey: string,
    largeImageText: string,
    smallImageKey: string,
    smallImageText: string,
    showTimestamps: boolean,
    endTime: number,
    button1Text: string,
    button1Url: string,
    button2Text: string,
    button2Url: string,
    callback: CallbackResponse,
  ) => void;
  updatePresenceWithButtonsArray: (
    details: string,
    state: string,
    largeImageKey: string,
    largeImageText: string,
    smallImageKey: string,
    smallImageText: string,
    showTimestamps: boolean,
    endTime: number,
    buttonsJson: string,
    callback: CallbackResponse,
  ) => void;
  dispose: (callback: CallbackResponse) => void;
};

type Listener<T> = {
  addListener: (callback: T) => void;
  removeListener: (callback: T) => void;
};
type SuccessResponse = {
  status: "success";
  success: true;
};
type ErrorResponse = {
  status: "error";
  success: false;
  error: string;
};
type OnClientReadyResponse = SuccessResponse & {
  user: User;
};
type OnLogLineResponse = {
  level: string;
  message: string;
};
type SuccessCallbackResponse = (response: SuccessResponse) => void;
type ErrorCallbackResponse = (response: ErrorResponse) => void;
type CallbackResponse = SuccessCallbackResponse | ErrorCallbackResponse;
type OnClientReadyCallbackResponse = (response: OnClientReadyResponse) => void;
type OnLogLineCallbackResponse = (response: OnLogLineResponse) => void;

export enum LogLevel {
  Trace = 1,
  Info = 2,
  Warning = 3,
  Error = 4,
  None = 0x100,
}

export type User = {
  id: number;
  username: string;
  discriminator: number;
  global_name: string;
  avatar: string;
  flags: Flag;
  premium_type: PremiumType;
  cdnEndpoint: string;
};

export enum Flag {
  None = 0x0,
  Employee = 0x1,
  Partner = 0x2,
  HypeSquad = 0x4,
  BugHunter = 0x8,
  HouseBravery = 0x40,
  HouseBrilliance = 0x80,
  HouseBalance = 0x100,
  EarlySupporter = 0x200,
  TeamUser = 0x400,
}

export enum PremiumType {
  None,
  NitroClassic,
  Nitro,
}

export function dispose(discordRPCPlugin: DiscordRPCPlugin) {
  return promisifyOverwolf(discordRPCPlugin.dispose)();
}
