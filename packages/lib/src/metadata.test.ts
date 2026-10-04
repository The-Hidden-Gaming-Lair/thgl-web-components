import { getMetadataAlternates } from "./metadata";

describe("getMetadataAlternates", () => {
  it("shares one path across locales", () => {
    expect(getMetadataAlternates("/maps", "de", ["en", "de"])).toEqual({
      canonical: "/de/maps",
      languageAlternates: { en: "/maps", de: "/de/maps", "x-default": "/maps" },
    });
  });

  it("uses each locale's own translated slug", () => {
    const slugs: Record<string, string> = { en: "Bloom", de: "Bl%C3%BCte" };
    const pathFor = (locale: string) => `/guides/${slugs[locale]}`;
    // Requested via another locale's slug (/de/guides/Bloom): the canonical
    // and every alternate still name the per-locale URLs the sitemap lists.
    expect(getMetadataAlternates(pathFor, "de", ["en", "de"])).toEqual({
      canonical: "/de/guides/Bl%C3%BCte",
      languageAlternates: {
        en: "/guides/Bloom",
        de: "/de/guides/Bl%C3%BCte",
        "x-default": "/guides/Bloom",
      },
    });
  });
});
