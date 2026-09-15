import { resolveAppConfig, DATA_FORGE_CDN_URL } from "@repo/lib";

// Inlined per-map preview URLs. The first one keeps the ?v=2 cache buster.
const preview = (mapId: string, version?: string) => {
  const url = `${DATA_FORGE_CDN_URL}/infinity-nikki/map-tiles/${mapId}/preview.webp`;
  return version ? `${url}?v=${version}` : url;
};

export const infinityNikki = resolveAppConfig({
  name: "infinity-nikki",
  supportedLocales: ["en"],
  appUrl: "https://www.th.gl/companion-app",
  internalLinks: [
    {
      title: "Miraland Map",
      description:
        "Navigate Infinity Nikki's expansive world with our interactive maps.",
      href: "/maps/Miraland",
      iconName: "Map",
      bgImage: preview("1", "2"),
      linkText: "Explore the Overworld Map",
    },
    {
      title: "Wanxiang Realm Map",
      description: "Navigate the Wanxiang Realm with our interactive maps.",
      href: "/maps/Wanxiang%20Realm",
      iconName: "Map",
      bgImage: preview("4020034"),
      linkText: "View the Wanxiang Realm Map",
    },
    {
      title: "Danqing Island Map",
      description: "Navigate the Danqing Island with our interactive maps.",
      href: "/maps/Danqing%20Island",
      iconName: "Map",
      bgImage: preview("10000010"),
      linkText: "View the Danqing Island Map",
    },
    {
      title: "Danqing Realm Map",
      description: "Navigate the Danqing Realm with our interactive maps.",
      href: "/maps/Danqing%20Realm",
      iconName: "Map",
      bgImage: preview("10000027"),
      linkText: "View the Danqing Realm Map",
    },
    {
      title: "Firework Isles Map",
      description: "Navigate the Firework Isles with our interactive maps.",
      href: "/maps/Firework%20Isles",
      iconName: "Map",
      bgImage: preview("10000001"),
      linkText: "View the Firework Isles Map",
    },
    {
      title: "Serenity Island Map",
      description: "Navigate the Serenity Island with our interactive maps.",
      href: "/maps/Serenity%20Island",
      iconName: "Map",
      bgImage: preview("10000002"),
      linkText: "View the Serenity Island Map",
    },
    {
      title: "Sea of Stars Map",
      description: "Navigate the Sea of Stars with our interactive maps.",
      href: "/maps/Sea%20of%20Stars",
      iconName: "Map",
      bgImage: preview("14000000"),
      linkText: "View the Sea of Stars Map",
    },
  ],
  externalLinks: [],
  keywords: [
    "Whimstar & Whim Balloon spots",
    "Dew of Inspiration & Dew of Firework routes",
    "Wanxiang Bell & Whim Lantern locations",
  ],
});
