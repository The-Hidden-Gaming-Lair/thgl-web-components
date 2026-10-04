import {
  buildEmbedSnippet,
  buildEmbedUrl,
  isEmbedPath,
  parseEmbedPath,
} from "./embed";
import { searchParamsToView } from "./search-params";

/**
 * Embed URLs are published on other sites, so their format is a contract:
 * the proxy must keep resolving them and the snippet must keep the
 * attribution link outside the iframe.
 */
describe("embed paths", () => {
  const locales = ["en", "de", "zh-CN"];

  it("parses the map route behind an embed URL", () => {
    expect(parseEmbedPath("/embed/maps/Kilima%20Village", locales)).toEqual({
      localePrefix: "",
      mapPath: "/maps/Kilima%20Village",
    });
    expect(parseEmbedPath("/zh-CN/embed/maps/X", locales)).toEqual({
      localePrefix: "/zh-CN",
      mapPath: "/maps/X",
    });
  });

  it("ignores everything else", () => {
    expect(parseEmbedPath("/maps/X", locales)).toBeNull();
    expect(parseEmbedPath("/embed/maps", locales)).toBeNull();
    expect(parseEmbedPath("/xx/embed/maps/X", locales)).toBeNull();
    expect(isEmbedPath("/maps/X")).toBe(false);
    expect(isEmbedPath("/de/embed/maps/X")).toBe(true);
  });
});

describe("buildEmbedUrl / buildEmbedSnippet", () => {
  const options = {
    domain: "palia",
    mapTitle: "Kilima Village",
    center: [-8000.123, 1000.456] as [number, number],
    zoom: 1.4321,
    types: ["landmark", "stable"],
    share: "AbC123",
  };

  it("builds a compact embed URL", () => {
    expect(buildEmbedUrl(options)).toBe(
      "https://palia.th.gl/embed/maps/Kilima%20Village?center=-8000.12,1000.46&zoom=1.43&types=landmark,stable&share=AbC123",
    );
    expect(
      buildEmbedUrl({ domain: "palia", mapTitle: "X", locale: "de" }),
    ).toBe("https://palia.th.gl/de/embed/maps/X");
  });

  it("puts the attribution link outside the iframe", () => {
    const html = buildEmbedSnippet({
      ...options,
      gameTitle: "Palia",
      mapDisplayName: "Kilima Village",
    });
    const [iframe, attribution] = html.split("\n");
    expect(iframe).toMatch(/^<iframe [^>]*><\/iframe>$/);
    expect(iframe).toContain("&amp;zoom=1.43");
    expect(attribution).toContain(
      '<a href="https://palia.th.gl/maps/Kilima%20Village">Palia Interactive Map</a>',
    );
  });
});

describe("searchParamsToView types / hide", () => {
  const all = ["a", "b", "c"];
  it("shows only `types`, dropping unknown ids", () => {
    expect(searchParamsToView({ types: "a,x" }, [...all]).filters).toEqual([
      "a",
    ]);
    expect(searchParamsToView({ types: "none" }, [...all]).filters).toEqual([]);
  });
  it("shows everything except `hide`", () => {
    expect(searchParamsToView({ hide: "b" }, [...all]).filters).toEqual([
      "a",
      "c",
    ]);
  });
});
