import { type AppConfig } from "@repo/lib";

export const APP_CONFIG: AppConfig = {
  name: "night-crows",
  title: "Night Crows",
  domain: "nightcrows",
  appUrl: null,
  withoutLiveMode: true,
  internalLinks: [
    {
      href: "/",
      title: "Maps",
      description: "Explore Night Crows Interactive Maps",
      iconName: "Map",
      linkText: "Explore Maps",
    },
    {
      title: "Activities Tracker",
      description:
        "Track your progress and conquer the challenges of Night Crows",
      href: "/activities-tracker",
      iconName: "SquareCheckBig",
    },
  ],
  externalLinks: [],
};
