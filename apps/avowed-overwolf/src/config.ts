import { type OverwolfAppConfig } from "@repo/lib";

export const APP_CONFIG: OverwolfAppConfig = {
  name: "avowed",
  title: "Avowed",
  domain: "avowed",
  appUrl: "https://www.overwolf.com/app/leon_machens-avowed_interactive_maps",
  gameClassId: 25372,
  appId: "dfmnobmlhpkjnodhlabbmihmgocgpklofeklfmod",
  discordApplicationId: "1341792971040755763",
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
