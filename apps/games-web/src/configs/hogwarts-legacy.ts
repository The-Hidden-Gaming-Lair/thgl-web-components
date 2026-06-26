import { type AppConfig } from "@repo/lib";

export const hogwartsLegacy: AppConfig = {
  name: "hogwarts-legacy",
  title: "Hogwarts Legacy",
  domain: "hogwarts",
  supportedLocales: ["en"],
  // The Hogwarts Legacy Overwolf app was deprecated; the game is now supported
  // via the THGL Companion App (same as Avowed). The old Overwolf URL 404s.
  appUrl: "https://www.th.gl/companion-app",
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
