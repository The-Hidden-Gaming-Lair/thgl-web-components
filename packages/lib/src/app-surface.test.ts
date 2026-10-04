import {
  isAppContentPath,
  isAppOverlayPath,
  parseAppPath,
  toAppSurfacePath,
} from "./app-surface";

const locales = ["en", "de", "zh-CN"];

describe("toAppSurfacePath", () => {
  it("prefixes game paths after the locale", () => {
    expect(toAppSurfacePath("/db/pals/x", "palworld", locales)).toBe(
      "/apps/palworld/db/pals/x",
    );
    expect(toAppSurfacePath("/de/db/pals/x?q=1#a", "palworld", locales)).toBe(
      "/de/apps/palworld/db/pals/x?q=1#a",
    );
    expect(toAppSurfacePath("/zh-CN/guides", "palia", locales)).toBe(
      "/zh-CN/apps/palia/guides",
    );
  });

  it("does not mistake a 2-letter route for a locale", () => {
    expect(toAppSurfacePath("/db", "palia", locales)).toBe("/apps/palia/db");
  });

  it("maps the game root to the app map page", () => {
    expect(toAppSurfacePath("/", "palia", locales)).toBe("/apps/palia");
    expect(toAppSurfacePath("/de", "palia", locales)).toBe("/de/apps/palia");
    expect(toAppSurfacePath("/?map=x", "palia", locales)).toBe(
      "/apps/palia?map=x",
    );
  });

  it("leaves app paths and absolute URLs alone", () => {
    expect(toAppSurfacePath("/apps/palia/db", "palia", locales)).toBe(
      "/apps/palia/db",
    );
    expect(toAppSurfacePath("https://palia.th.gl/db", "palia", locales)).toBe(
      "https://palia.th.gl/db",
    );
    expect(toAppSurfacePath("//cdn.th.gl/x", "palia", locales)).toBe(
      "//cdn.th.gl/x",
    );
  });
});

describe("parseAppPath", () => {
  it("splits locale, game and sub path", () => {
    expect(parseAppPath("/apps/palia")).toEqual({
      localePrefix: "",
      gameId: "palia",
      rest: "",
    });
    expect(parseAppPath("/de/apps/palia/db/x")).toEqual({
      localePrefix: "/de",
      gameId: "palia",
      rest: "/db/x",
    });
    expect(parseAppPath("/db/x")).toBeNull();
    expect(parseAppPath("/apps")).toBeNull();
  });

  it("tells content pages from the map and the overlay", () => {
    expect(isAppContentPath("/apps/palia/db")).toBe(true);
    expect(isAppContentPath("/de/apps/palia/weekly-wants")).toBe(true);
    expect(isAppContentPath("/apps/palia")).toBe(false);
    expect(isAppContentPath("/apps/palia/overlay")).toBe(false);
    expect(isAppOverlayPath("/de/apps/palia/overlay")).toBe(true);
    expect(isAppOverlayPath("/apps/palia")).toBe(false);
  });
});
