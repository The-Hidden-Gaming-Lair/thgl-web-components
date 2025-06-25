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
  internalLinks: [
    {
      href: "/maps/Palpagos%20Island",
      title: "Palpagos Island Map",
      description: "Navigate Palpagos Island with our interactive maps.",
      iconName: "Map",
      bgImage: "https://data.th.gl/palworld/map-tiles/default/preview.webp",
      linkText: "Explore the Palpagos Island Map",
    },
  ],
  externalLinks: [],
  keywords: ["Tides of Terraria", "Feybreak", "Predator & Alpha Pals"],
};
