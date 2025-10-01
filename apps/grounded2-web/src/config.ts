import { type AppConfig } from "@repo/lib";

export const APP_CONFIG: AppConfig = {
  name: "grounded2",
  title: "Grounded 2",
  domain: "grounded2",
  supportedLocales: ["en", "de", "es", "es-MX", "fr", "it", "zh-CN"],
  appUrl: null,
  internalLinks: [
    {
      title: "Brookhollow Park Map",
      description:
        "Navigate Grounded 2's Brookhollow Park with our interactive maps.",
      href: "/maps/Brookhollow%20Park",
      iconName: "Map",
      bgImage:
        "https://data.th.gl/grounded2/map-tiles/brookhollow-park/preview.webp",
      linkText: "Explore the Brookhollow Park Map",
    },
    {
      href: "/guides",
      title: "config.internalLinks.guides.title",
      linkText: "config.internalLinks.guides.linkText",
      iconName: "BookOpen",
    },
  ],
  promoLinks: [],
  externalLinks: [],
  keywords: ["Wonders", "Ominent Facilities", "Resources"],
};
