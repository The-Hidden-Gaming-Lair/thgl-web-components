import { type OverwolfAppConfig } from "@repo/lib";

export const APP_CONFIG: OverwolfAppConfig = {
  name: "wuthering-waves",
  title: "Wuthering Waves",
  domain: "wuthering",
  appUrl: "https://www.overwolf.com/app/Leon_Machens-Wuthering_Waves_Map",
  gameClassId: 24300,
  appId: "gjohaodckfkkodlmmmmeifkdkifddegkleppngad",
  discordApplicationId: "1249803392822546512",
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
