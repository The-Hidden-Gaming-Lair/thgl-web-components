import { type OverwolfAppConfig } from "@repo/lib";

export const APP_CONFIG: OverwolfAppConfig = {
  name: "satisfactory",
  title: "Satisfactory",
  domain: "satisfactory",
  appUrl: "https://www.overwolf.com/app/Leon_Machens-Satisfactory_Map",
  gameClassId: 21646,
  appId: "mgpcocpamehmkagnkjcbabcnnhbebclkiekekhmg",
  discordApplicationId: "1302555829634863165",
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
