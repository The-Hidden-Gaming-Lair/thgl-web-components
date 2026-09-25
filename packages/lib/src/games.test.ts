import {
  partitionFavoriteGames,
  sortGamesBy,
  sortGamesByLastPlayed,
  type Game,
  type GamesSort,
} from "./games";

/**
 * The dashboard sidebar order: "recent" must stay byte-for-byte what the app
 * did before the sort control existed, "alpha" must read A-Z by registry
 * title using the UI locale's collation rules (titles are not localized),
 * and favourites must survive ids that left the registry.
 */
const game = (id: string, title: string) => ({ id, title }) as Game;

const list = [
  game("dawnwalker", "The Blood of Dawnwalker"),
  game("palia", "Palia"),
  game("avowed", "Avowed"),
  game("palworld", "palworld lowercase"),
  game("olden-era", "HoMM: Olden Era"),
];

const ids = (games: Game[]) => games.map((g) => g.id);

describe("sortGamesBy", () => {
  it('"recent" returns exactly what sortGamesByLastPlayed returns', () => {
    const lastPlayed = { palia: 20, avowed: 10 };
    expect(ids(sortGamesBy(list, "recent", lastPlayed, "en"))).toEqual(
      ids(sortGamesByLastPlayed(list, lastPlayed)),
    );
  });

  it('"recent" keeps the registry order when nothing was played', () => {
    expect(ids(sortGamesBy(list, "recent", {}, "en"))).toEqual(ids(list));
  });

  it('"alpha" orders by title, case-insensitively', () => {
    expect(ids(sortGamesBy(list, "alpha", {}, "en"))).toEqual([
      "avowed",
      "olden-era",
      "palia",
      "palworld",
      "dawnwalker",
    ]);
  });

  it('"alpha" ignores lastPlayed', () => {
    expect(ids(sortGamesBy(list, "alpha", { dawnwalker: 99 }, "en"))).toEqual(
      ids(sortGamesBy(list, "alpha", {}, "en")),
    );
  });

  it('"alpha" sorts embedded numbers numerically', () => {
    const numbered = [game("g10", "Game 10"), game("g9", "Game 9")];
    expect(ids(sortGamesBy(numbered, "alpha", {}, "en"))).toEqual([
      "g9",
      "g10",
    ]);
  });

  it("does not mutate the input array", () => {
    const input = [...list];
    sortGamesBy(input, "alpha", {}, "en");
    expect(ids(input)).toEqual(ids(list));
  });

  it('"alpha" follows the collation rules of the UI locale', () => {
    // Same (unlocalized) titles, different rules: German files "Ä" with "A",
    // Swedish puts it after "Z".
    const umlaut = [game("z", "Zebra"), game("ae", "Äpfel")];
    expect(ids(sortGamesBy(umlaut, "alpha", {}, "de"))).toEqual(["ae", "z"]);
    expect(ids(sortGamesBy(umlaut, "alpha", {}, "sv"))).toEqual(["z", "ae"]);
  });

  it("falls back to the recent order for an unknown persisted sort value", () => {
    const lastPlayed = { avowed: 5 };
    expect(
      ids(sortGamesBy(list, "bogus" as GamesSort, lastPlayed, "en")),
    ).toEqual(ids(sortGamesByLastPlayed(list, lastPlayed)));
  });
});

describe("partitionFavoriteGames", () => {
  it("keeps the input order in both buckets", () => {
    const { favorites, rest } = partitionFavoriteGames(list, [
      "avowed",
      "dawnwalker",
    ]);
    expect(ids(favorites)).toEqual(["dawnwalker", "avowed"]);
    expect(ids(rest)).toEqual(["palia", "palworld", "olden-era"]);
  });

  it("ignores ids that are no longer in the registry", () => {
    const { favorites, rest } = partitionFavoriteGames(list, [
      "a-game-we-dropped",
      "palia",
    ]);
    expect(ids(favorites)).toEqual(["palia"]);
    expect(ids(rest)).toEqual([
      "dawnwalker",
      "avowed",
      "palworld",
      "olden-era",
    ]);
  });

  it("returns an empty favourites bucket by default", () => {
    const { favorites, rest } = partitionFavoriteGames(list, []);
    expect(favorites).toEqual([]);
    expect(ids(rest)).toEqual(ids(list));
  });

  it("does not mutate either input", () => {
    const input = [...list];
    const favoriteIds = ["palia", "avowed"];
    partitionFavoriteGames(input, favoriteIds);
    expect(ids(input)).toEqual(ids(list));
    expect(favoriteIds).toEqual(["palia", "avowed"]);
  });
});
