import {
  activityCount,
  activityLastReset,
  cleanActivitiesState,
  emptyActivitiesState,
  exportActivitiesJson,
  formatUtcOffset,
  gameWeekday,
  guessRegion,
  isAvailableToday,
  lastResetAt,
  migrateLegacyActivities,
  nextResetAt,
  parseActivitiesJson,
  pruneProgress,
  regionOffsetMinutes,
  removeCharacter,
  addCharacter,
  setActivityCount,
  ActivitiesImportError,
  type ActivitiesConfig,
  type ActivitiesReset,
} from "./activities";

const utc = (s: string) => Date.parse(s);

const reset: ActivitiesReset = {
  dailyHour: 4,
  weeklyDay: 1, // Monday
  regions: [
    { id: "asia", name: "Asia", utcOffsetMinutes: 480 },
    { id: "na", name: "America", tz: "America/New_York" },
  ],
};
const asia = reset.regions[0];
const na = reset.regions[1];

describe("reset clock", () => {
  test("daily reset at 04:00 UTC+8 = 20:00 UTC the day before", () => {
    // 2026-10-04 10:00 UTC = 18:00 Asia → last reset 2026-10-04 04:00 Asia.
    const now = utc("2026-10-04T10:00:00Z");
    expect(new Date(lastResetAt(reset, asia, "daily", now)).toISOString()).toBe(
      "2026-10-03T20:00:00.000Z",
    );
    expect(new Date(nextResetAt(reset, asia, "daily", now)).toISOString()).toBe(
      "2026-10-04T20:00:00.000Z",
    );
  });

  test("before the reset hour the last reset is yesterday's", () => {
    // 19:59 UTC = 03:59 Asia on 2026-10-05.
    const now = utc("2026-10-04T19:59:00Z");
    expect(new Date(lastResetAt(reset, asia, "daily", now)).toISOString()).toBe(
      "2026-10-03T20:00:00.000Z",
    );
  });

  test("weekly reset on Monday 04:00", () => {
    // Sunday 2026-10-04 (Asia 18:00) → last Monday 2026-09-28 04:00 Asia.
    const now = utc("2026-10-04T10:00:00Z");
    expect(
      new Date(lastResetAt(reset, asia, "weekly", now)).toISOString(),
    ).toBe("2026-09-27T20:00:00.000Z");
    expect(
      new Date(nextResetAt(reset, asia, "weekly", now)).toISOString(),
    ).toBe("2026-10-04T20:00:00.000Z");
    // Exactly at the reset instant it counts as the new week.
    const at = utc("2026-10-04T20:00:00Z");
    expect(lastResetAt(reset, asia, "weekly", at)).toBe(at);
  });

  test("monthly reset on the 1st", () => {
    const now = utc("2026-10-04T10:00:00Z");
    expect(
      new Date(lastResetAt(reset, asia, "monthly", now)).toISOString(),
    ).toBe("2026-09-30T20:00:00.000Z");
    expect(
      new Date(nextResetAt(reset, asia, "monthly", now)).toISOString(),
    ).toBe("2026-10-31T20:00:00.000Z");
  });

  test("IANA zones follow DST", () => {
    // New York: EDT (UTC-4) in October, EST (UTC-5) in December.
    expect(regionOffsetMinutes(na, utc("2026-10-04T12:00:00Z"))).toBe(-240);
    expect(regionOffsetMinutes(na, utc("2026-12-04T12:00:00Z"))).toBe(-300);
    expect(
      new Date(
        lastResetAt(reset, na, "daily", utc("2026-10-04T12:00:00Z")),
      ).toISOString(),
    ).toBe("2026-10-04T08:00:00.000Z");
    expect(
      new Date(
        lastResetAt(reset, na, "daily", utc("2026-12-04T12:00:00Z")),
      ).toISOString(),
    ).toBe("2026-12-04T09:00:00.000Z");
    // The night of the switch (2026-11-01): next reset is 04:00 EST.
    expect(
      new Date(
        nextResetAt(reset, na, "daily", utc("2026-10-31T12:00:00Z")),
      ).toISOString(),
    ).toBe("2026-11-01T09:00:00.000Z");
  });

  test("game weekday + weekday schedules", () => {
    // Asia Monday 2026-10-05 02:00 is still Sunday's game day.
    expect(gameWeekday(reset, asia, utc("2026-10-04T18:00:00Z"))).toBe(0);
    expect(gameWeekday(reset, asia, utc("2026-10-04T21:00:00Z"))).toBe(1);
    expect(isAvailableToday({ days: [0, 6] }, 0)).toBe(true);
    expect(isAvailableToday({ days: [0, 6] }, 3)).toBe(false);
    expect(isAvailableToday({}, 3)).toBe(true);
  });

  test("per-activity reset override", () => {
    // Guild check-in resets at 00:00 Asia while the game resets at 04:00.
    const now = utc("2026-10-04T17:00:00Z"); // Asia 01:00 Monday
    expect(
      new Date(
        activityLastReset(
          reset,
          asia,
          { frequency: "daily", reset: { hour: 0 } },
          now,
        ),
      ).toISOString(),
    ).toBe("2026-10-04T16:00:00.000Z");
    // Weekly on Friday at the game hour.
    expect(
      new Date(
        activityLastReset(
          reset,
          asia,
          { frequency: "weekly", reset: { weeklyDay: 5 } },
          now,
        ),
      ).toISOString(),
    ).toBe("2026-10-01T20:00:00.000Z");
    // No override = game rule.
    expect(activityLastReset(reset, asia, { frequency: "daily" }, now)).toBe(
      lastResetAt(reset, asia, "daily", now),
    );
  });

  test("guesses the closest region", () => {
    const now = utc("2026-10-04T12:00:00Z");
    expect(guessRegion(reset.regions, 540, now).id).toBe("asia"); // Tokyo
    expect(guessRegion(reset.regions, -420, now).id).toBe("na"); // LA
  });

  test("formats offsets", () => {
    expect(formatUtcOffset(480)).toBe("UTC+8");
    expect(formatUtcOffset(-300)).toBe("UTC-5");
    expect(formatUtcOffset(330)).toBe("UTC+5:30");
  });
});

describe("progress", () => {
  const daily = { id: "quests", frequency: "daily" as const, max: 3 };
  const weekly = { id: "boss", frequency: "weekly" as const, max: 1 };

  test("counts expire at the next reset of their frequency", () => {
    const t0 = utc("2026-10-04T10:00:00Z");
    let s = setActivityCount(emptyActivitiesState(), "quests", 2, t0);
    s = setActivityCount(s, "boss", 1, t0);
    const last = (now: number) => ({
      daily: lastResetAt(reset, asia, "daily", now),
      weekly: lastResetAt(reset, asia, "weekly", now),
      monthly: lastResetAt(reset, asia, "monthly", now),
    });
    expect(activityCount(s, daily, last(t0))).toBe(2);
    // After the daily (= also weekly, Monday) reset both are gone.
    const t1 = utc("2026-10-04T20:00:01Z");
    expect(activityCount(s, daily, last(t1))).toBe(0);
    expect(activityCount(s, weekly, last(t1))).toBe(0);
    // Mid-week only the daily one resets.
    s = setActivityCount(s, "boss", 1, t1);
    s = setActivityCount(s, "quests", 3, t1);
    const t2 = utc("2026-10-06T21:00:00Z");
    expect(activityCount(s, daily, last(t2))).toBe(0);
    expect(activityCount(s, weekly, last(t2))).toBe(1);
    // Pruning drops only what no frequency can count any more.
    const pruned = pruneProgress(s, last(utc("2026-11-03T00:00:00Z")));
    expect(pruned.progress.main).toEqual({});
  });

  test("characters keep separate progress", () => {
    const t0 = utc("2026-10-04T10:00:00Z");
    let s = setActivityCount(emptyActivitiesState(), "quests", 1, t0);
    s = addCharacter(s, "Alt", "alt1");
    expect(s.active).toBe("alt1");
    s = setActivityCount(s, "quests", 3, t0);
    expect(s.progress.main.quests.n).toBe(1);
    expect(s.progress.alt1.quests.n).toBe(3);
    s = removeCharacter(s, "alt1");
    expect(s.active).toBe("main");
    expect(s.progress.alt1).toBeUndefined();
    // The last character cannot be removed.
    expect(removeCharacter(s, "main").characters).toHaveLength(1);
  });

  test("clean state tolerates garbage", () => {
    const s = cleanActivitiesState({
      characters: [{ id: "a", name: "A" }, { id: "a" }, "x"],
      active: "zzz",
      progress: { a: { q: { n: 2, at: 5 }, bad: { n: "x" } }, ghost: {} },
      custom: [{ name: "Fish", max: 3, frequency: "daily" }, { name: "" }],
      hidden: ["h", 1, "h"],
    });
    expect(s.characters).toEqual([{ id: "a", name: "A" }]);
    expect(s.active).toBe("a");
    expect(s.progress).toEqual({ a: { q: { n: 2, at: 5 } } });
    expect(s.custom).toEqual([
      {
        id: "custom:fish",
        name: "Fish",
        category: "",
        max: 3,
        frequency: "daily",
      },
    ]);
    expect(s.hidden).toEqual(["h"]);
  });
});

describe("legacy migration", () => {
  const config: Pick<
    ActivitiesConfig,
    "activities" | "terms" | "legacyRetired"
  > = {
    activities: [
      {
        id: "daily_quests",
        name: "q",
        category: "quests",
        max: 30,
        frequency: "daily",
        legacy: ["Daily Quests"],
      },
      {
        id: "guild_shop",
        name: "gs",
        category: "shops",
        max: 1,
        frequency: "weekly",
        legacy: ["Guild Shop"],
      },
      {
        id: "brand_new",
        name: "new",
        category: "shops",
        max: 1,
        frequency: "daily",
      },
    ],
    terms: { en: { q: "Daily Quests", gs: "Guild Shop", new: "New Thing" } },
    legacyRetired: ["Old Removed Thing"],
  };

  test("maps titles, hides removed defaults, keeps customs + counts", () => {
    const raw = JSON.stringify({
      state: {
        customActivities: [
          {
            title: "Daily Quests",
            category: "Quests",
            max: 30,
            frequently: "daily",
          },
          {
            title: "Old Removed Thing",
            category: "X",
            max: 1,
            frequently: "daily",
          },
          {
            title: "My Fishing",
            category: "Mine",
            max: 5,
            frequently: "weekly",
          },
        ],
        progress: { "Daily Quests": 12, "My Fishing": 2, "Guild Shop": 1 },
        openCategories: [],
      },
      version: 0,
    });
    const now = 1_000;
    const s = migrateLegacyActivities(raw, config, now)!;
    expect(s.hidden).toEqual(["guild_shop"]);
    expect(s.custom).toEqual([
      {
        id: "custom:my-fishing",
        name: "My Fishing",
        category: "Mine",
        max: 5,
        frequency: "weekly",
      },
    ]);
    expect(s.progress.main).toEqual({
      daily_quests: { n: 12, at: now },
      "custom:my-fishing": { n: 2, at: now },
      guild_shop: { n: 1, at: now },
    });
  });

  test("garbage → null", () => {
    expect(migrateLegacyActivities("nope", config, 1)).toBeNull();
    expect(migrateLegacyActivities(null, config, 1)).toBeNull();
  });
});

describe("export / import", () => {
  test("round-trips and rejects other games", () => {
    const s = setActivityCount(emptyActivitiesState(), "a", 2, 10);
    const text = exportActivitiesJson("night-crows", s);
    expect(parseActivitiesJson(text, "night-crows").progress).toEqual(
      s.progress,
    );
    expect(() => parseActivitiesJson(text, "palworld")).toThrow(
      ActivitiesImportError,
    );
    expect(() => parseActivitiesJson("{}", "palworld")).toThrow(
      ActivitiesImportError,
    );
  });
});
