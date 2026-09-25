import { resolveAppConfig, DATA_FORGE_CDN_URL } from "@repo/lib";

// Inlined per-map preview URLs. The first one keeps the ?v=2 cache buster.
const preview = (mapId: string, version?: string) => {
  const url = `${DATA_FORGE_CDN_URL}/infinity-nikki/map-tiles/${mapId}/preview.webp`;
  return version ? `${url}?v=${version}` : url;
};

export const infinityNikki = resolveAppConfig({
  name: "infinity-nikki",
  // = the dicts data-forge emits (dicts/<locale>.json + dicts/db/<locale>.json).
  supportedLocales: [
    "en",
    "de",
    "es",
    "fr",
    "id",
    "it",
    "ja",
    "ko",
    "pt",
    "th",
    "zh-CN",
    "zh-TW",
  ],
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
    "Outfit & clothing database",
  ],
  db: {
    heroSubtitle: "Game Database",
    searchPlaceholder: "Search outfits, clothing, items…",
    sectionsInNav: true,
    homeSections: [
      {
        href: "/db/outfit-sets",
        type: "outfit-sets",
        titleFallback: "Outfits",
        icon: "👗",
        description:
          "Every outfit with its pieces, style totals, labels, ability and evolutions.",
      },
      {
        href: "/db/clothing",
        type: "clothing",
        titleFallback: "Clothing",
        icon: "👚",
        description:
          "Hair, dresses, tops, bottoms, outerwear, socks and shoes — style stats, labels and crafting materials.",
      },
      {
        href: "/db/accessories",
        type: "accessories",
        titleFallback: "Accessories",
        icon: "💍",
        description:
          "Headwear, earrings, necklaces, handhelds and every other accessory slot with style stats.",
      },
      {
        href: "/db/makeup",
        type: "makeup",
        titleFallback: "Makeup",
        icon: "💄",
        description: "Full looks, brows, lashes, lenses, lips and skin tones.",
      },
      {
        href: "/db/abilities",
        type: "abilities",
        titleFallback: "Abilities",
        icon: "✨",
        description: "Outfit abilities and the outfits that grant them.",
      },
      {
        href: "/db/inventory",
        type: "inventory",
        titleFallback: "Items",
        icon: "🎒",
        description:
          "Backpack items and currencies — crafting uses and where to find them on the map.",
      },
      {
        href: "/db/shops",
        type: "shops",
        titleFallback: "Shops",
        icon: "🛍️",
        description:
          "Every shop — what it sells, which currencies it takes and where to find it on the map.",
      },
      {
        href: "/db/eureka",
        type: "eureka",
        titleFallback: "Eureka",
        icon: "🌟",
        description: "Eureka head, hand and foot pieces by set.",
      },
      {
        href: "/db/momo-wardrobe",
        type: "momo-wardrobe",
        titleFallback: "Momo's Wardrobe",
        icon: "🐱",
        description: "Momo's cloaks.",
      },
      {
        href: "/db/labels",
        type: "labels",
        titleFallback: "Labels",
        icon: "🏷️",
        description:
          "Every clothing label and the clothing, accessories and Eureka pieces carrying it.",
      },
    ],
    typeLabels: {
      "outfit-sets": "Outfit",
      clothing: "Clothing",
      accessories: "Accessory",
      makeup: "Makeup",
      abilities: "Ability",
      inventory: "Item",
      eureka: "Eureka",
      "momo-wardrobe": "Momo",
      shops: "Shop",
      labels: "Label",
    },
  },
});
