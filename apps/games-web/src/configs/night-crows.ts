import { resolveAppConfig } from "@repo/lib";

export const nightCrows = resolveAppConfig({
  name: "night-crows",
  supportedLocales: ["en"],
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
      href: "/activities-tracker",
      title: "activities.navTitle",
      description: "activities.navDescription",
      linkText: "activities.navLinkText",
      bgImage: "/games/thgl-web/activity-tracker.webp",
      iconName: "Activity",
    },
  ],
  externalLinks: [],
  keywords: ["Wandering Tyrant", "World Bosses", "Activities Tracker"],
});
