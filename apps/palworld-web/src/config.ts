import { type AppConfig } from "@repo/lib";

export const APP_CONFIG: AppConfig = {
  name: "palworld",
  title: "Palworld",
  domain: "palworld",
  appUrl: "https://www.overwolf.com/app/Leon_Machens-Palworld-Interactive-map",
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
