import { type AppConfig } from "@repo/lib";

export const APP_CONFIG: AppConfig = {
  name: "hogwarts-legacy",
  title: "Hogwarts Legacy",
  domain: "hogwarts",
  appUrl: "https://www.overwolf.com/app/Leon_Machens-Hogwarts.gg",
  markerOptions: {
    radius: 6,
    playerIcon: "player.webp",
    imageSprite: true,
    zPos: {
      xyMaxDistance: 15000,
      zDistance: 350,
    },
  },
};
