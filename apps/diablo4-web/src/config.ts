import { type AppConfig } from "@repo/lib";

export const APP_CONFIG: AppConfig = {
  name: "diablo4",
  title: "Diablo IV",
  domain: "diablo4",
  appUrl: "https://www.overwolf.com/app/Leon_Machens-Diablo_4_Map",
  withoutLiveMode: true,
  internalLinks: [
    {
      href: "/",
      title: "Maps",
      description: "Explore Diablo 4 Interactive Maps",
      iconName: "Map",
      linkText: "Explore Maps",
    },
    {
      title: "Vessel of Hatred",
      description: "Prepare for the Vessel of Hatred expansion",
      href: "/vessel-of-hatred",
      iconName: "MessageSquareWarning",
    },
  ],
  externalLinks: [],
  markerOptions: {
    radius: 6,
    playerIcon: "player.webp",
    imageSprite: true,
    zPos: {
      xyMaxDistance: 10,
      zDistance: 2,
    },
  },
};
