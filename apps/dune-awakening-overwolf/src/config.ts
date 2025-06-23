import { type OverwolfAppConfig } from "@repo/lib";

export const APP_CONFIG: OverwolfAppConfig = {
  name: "dune-awakening",
  title: "Dune Awakening",
  domain: "duneawakening",
  appUrl: "https://www.overwolf.com/app/Leon_Machens-Dune_Awakening_Map",
  gameClassId: 24300,
  appId: "xxx",
  discordApplicationId: "xxx",
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
