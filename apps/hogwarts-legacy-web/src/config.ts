import { type AppConfig } from "@repo/lib";

export const APP_CONFIG: AppConfig = {
  name: "hogwarts-legacy",
  title: "Hogwarts Legacy",
  domain: "hogwarts",
  supportedLocales: ["en"],
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
  keywords: ["Accio Page", "Field Guide Pages", "Collections"],
};
