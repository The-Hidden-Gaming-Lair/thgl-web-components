import { type AppConfig } from "@repo/lib";

export const APP_CONFIG: AppConfig = {
  name: "pax-dei",
  title: "Pax Dei",
  domain: "paxdei",
  appUrl: null, // "https://www.overwolf.com/app/Leon_Machens-Pax_Dei_Map",
  withoutLiveMode: true,
  externalLinks: [
    { href: "https://paxdei.gaming.tools?ref=thgl", title: "Database" },
  ],
  markerOptions: {
    imageSprite: true,
    radius: 6,
    playerIcon: "player.webp",
  },
};
