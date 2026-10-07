import {
  getT,
  mapLinkTitle,
  mapNameEntries,
  mapNameFromHref,
  mapTileKeyFromHref,
} from "./i18n";

describe("mapLinkTitle", () => {
  // Tile keys are game ids; links carry the English name (inbox #766).
  const enDict = {
    asteria_plains: "Asteria Plains",
    asterleeds: "Asterleeds",
    deep: "@ptr",
    "@ptr": "The Deep",
  };
  const jaDict = {
    asteria_plains: "アステリア平原",
    asterleeds: "Asterleeds",
    deep: "@ptr",
    "@ptr": "深淵",
  };
  const ja = getT({
    "nav.mapTitle": "{{map}}マップ",
    "config.internalLinks.hagga.title": "ハガ盆地マップ",
    ...mapNameEntries(Object.keys(enDict), jaDict, enDict),
  });

  it("uses the localized map name the /maps cards show", () => {
    expect(
      mapLinkTitle(ja, {
        title: "Asteria Plains Map",
        href: "/maps/Asteria%20Plains",
      }),
    ).toBe("アステリア平原マップ");
    expect(
      mapLinkTitle(ja, { title: "The Deep Map", href: "/maps/The%20Deep" }),
    ).toBe("深淵マップ");
  });

  it("keeps the config name when the name is the same in both languages", () => {
    expect(
      mapLinkTitle(ja, { title: "Asterleeds Map", href: "/maps/Asterleeds" }),
    ).toBe("Asterleedsマップ");
  });

  it("prefers an explicit title translation", () => {
    expect(
      mapLinkTitle(ja, {
        title: "config.internalLinks.hagga.title",
        href: "/maps/Hagga%20Basin",
      }),
    ).toBe("ハガ盆地マップ");
  });

  it("leaves non-map titles alone", () => {
    expect(mapLinkTitle(ja, { title: "Weapons", href: "/db/weapons" })).toBe(
      "Weapons",
    );
  });
});

describe("mapNameFromHref", () => {
  it("decodes the map name", () => {
    expect(mapNameFromHref("/maps/Skimmer's%20Lair")).toBe("Skimmer's Lair");
    expect(mapNameFromHref("/maps/A%2C%20B?x=1")).toBe("A, B");
    expect(mapNameFromHref("/guides/x")).toBeUndefined();
  });
});

describe("mapTileKeyFromHref", () => {
  const enDict = { "4020034": "Wanxiang Realm", "1": "Miraland" };
  const tileKeys = ["1", "4020034", "Untranslated"];

  it("matches the English href name, whatever the page locale", () => {
    expect(mapTileKeyFromHref("/maps/Wanxiang%20Realm", tileKeys, enDict)).toBe(
      "4020034",
    );
    expect(mapTileKeyFromHref("/maps/Miraland", tileKeys, enDict)).toBe("1");
  });

  it("falls back to the raw tile key and misses non-map links", () => {
    expect(mapTileKeyFromHref("/maps/Untranslated", tileKeys, enDict)).toBe(
      "Untranslated",
    );
    expect(mapTileKeyFromHref("/maps/Nope", tileKeys, enDict)).toBeUndefined();
    expect(mapTileKeyFromHref("/db/weapons", tileKeys, enDict)).toBeUndefined();
  });
});
