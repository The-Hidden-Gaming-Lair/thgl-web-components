import { type OverwolfAppConfig } from "@repo/lib";

export const APP_CONFIG: OverwolfAppConfig = {
  name: "palworld",
  title: "Palworld",
  domain: "palworld",
  appUrl: "https://www.overwolf.com/app/Leon_Machens-Palworld-Interactive-map",
  gameClassId: 23944,
  appId: "ebafpjfhleenmkcmdhlbdchpdalblhiellgfmmbb",
  discordApplicationId: "1199636411821854730",
  markerOptions: {
    radius: 6,
    // playerIcon: "player.webp",
    imageSprite: true,
    zPos: {
      xyMaxDistance: 15000,
      zDistance: 400,
    },
  },
};
