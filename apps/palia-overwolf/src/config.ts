import { type OverwolfAppConfig } from "@repo/lib";

export const APP_CONFIG: OverwolfAppConfig = {
  name: "palia",
  title: "Palia",
  domain: "palia",
  appUrl: "https://www.overwolf.com/app/Leon_Machens-Palia_Map",
  gameClassId: 23186,
  appId: "fgbodfoepckgplklpccjedophlahnjemfdknhfce",
  discordApplicationId: "1181323945866178560",
  markerOptions: {
    radius: 6,
    playerIcon: "player.webp",
    imageSprite: true,
    zPos: {
      xyMaxDistance: 15000,
      zDistance: 400,
    },
  },
};
