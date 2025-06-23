import { type OverwolfAppConfig } from "@repo/lib";

export const APP_CONFIG: OverwolfAppConfig = {
  name: "once-human",
  title: "Once Human",
  domain: "oncehuman",
  appUrl: "https://www.overwolf.com/app/Leon_Machens-Once_Human_Map",
  gameClassId: 23930,
  appId: "hjolmidofgehhbnofcpdbcednenibgnblipabcko",
  discordApplicationId: "1271431538675814461",
  markerOptions: {
    radius: 6,
    playerIcon: "player.webp",
    imageSprite: true,
    zPos: {
      xyMaxDistance: 200,
      zDistance: 3,
    },
  },
};
