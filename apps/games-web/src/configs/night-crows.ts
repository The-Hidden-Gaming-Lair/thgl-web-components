import { resolveAppConfig } from "@repo/lib";

export const nightCrows = resolveAppConfig({
  name: "night-crows",
  supportedLocales: ["en"],
  appUrl: null,
  withoutLiveMode: true,
  internalLinks: [
    {
      href: "/activities-tracker",
      title: "activities.navTitle",
      description: "activities.navDescription",
      linkText: "activities.navLinkText",
      iconName: "Activity",
    },
  ],
  externalLinks: [],
  keywords: ["Wandering Tyrant", "World Bosses", "Activities Tracker"],
});
