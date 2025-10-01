import { type AppConfig } from "@repo/lib";

export const APP_CONFIG: AppConfig = {
  name: "satisfactory",
  title: "Satisfactory",
  domain: "satisfactory",
  supportedLocales: ["en"],
  appUrl: "https://www.overwolf.com/app/Leon_Machens-Satisfactory_Map",
  markerOptions: {
    radius: 6,
    playerIcon: "player.webp",
    imageSprite: true,
    zPos: {
      xyMaxDistance: 15000,
      zDistance: 400,
    },
  },
  keywords: ["Mercer Spheres", "Resource Nodes", "Power Slugs", "Hard Drives"],
};
