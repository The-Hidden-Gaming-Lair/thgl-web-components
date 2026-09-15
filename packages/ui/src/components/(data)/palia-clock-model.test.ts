import {
  dayPhaseAt,
  eventCenter,
  eventStatus,
  formatCountdown,
  formatPaliaTime,
  inWindow,
  marketWindow,
  minutesUntil,
  paliaMinuteAt,
  resolveSchedule,
  type PaliaEvent,
} from "./palia-clock-model";

// Real timestamps at a given offset into the hour (Palia midnight = :00).
const atRealMinute = (minutes: number, seconds = 0) =>
  Date.UTC(2026, 8, 14, 10, minutes, seconds);

// Crab Wars as shipped: 5:36 activation, 90 s + 120 s lead, 240 s scored, 240 s reward.
const crabWars: PaliaEvent = {
  id: "crab_wars",
  kind: "daily",
  map: "AZ3_Root",
  start: 5 * 60 + 36,
  phases: [
    { seconds: 90 },
    { seconds: 120 },
    { seconds: 240, main: true },
    { seconds: 240 },
  ],
  locations: [[139950, 64367]],
};

// Flower Bloom: 12:00 activation, 60 s lead, then open-ended until 70% gathered.
const flowerBloom: PaliaEvent = {
  id: "flower_bloom",
  kind: "daily",
  map: "VillageWorld",
  start: 12 * 60,
  phases: [{ seconds: 60 }, { seconds: null, main: true }],
  gatherPct: 0.7,
  maxMinutes: 50,
  locations: [
    [0, 0],
    [200, 400],
  ],
};

const zeki: PaliaEvent = {
  id: "zeki_underground",
  kind: "shop",
  map: "VillageWorld",
  start: 21 * 60,
  end: 2 * 60,
  locations: [[1, 2]],
};

const maji: PaliaEvent = {
  id: "maji_market",
  kind: "market",
  map: "MajiMarket",
  start: 18 * 60,
  end: 3 * 60,
  locations: [],
  windows: [
    ["2026-09-08T07:00:00.000Z", "2026-09-15T07:00:00.000Z"],
    ["2026-10-06T07:00:00.000Z", "2026-10-13T07:00:00.000Z"],
  ],
};

describe("paliaMinuteAt", () => {
  it("maps the top of the real hour to Palia midnight and :30 to noon", () => {
    expect(paliaMinuteAt(atRealMinute(0))).toBe(0);
    expect(paliaMinuteAt(atRealMinute(30))).toBe(720);
    // 2.5 real seconds = one Palia minute
    expect(paliaMinuteAt(atRealMinute(0, 5))).toBeCloseTo(2, 6);
  });
});

describe("formatPaliaTime", () => {
  it("uses the game's 12-hour clock", () => {
    expect(formatPaliaTime(0)).toBe("12:00 AM");
    expect(formatPaliaTime(7 * 60)).toBe("7:00 AM");
    expect(formatPaliaTime(12 * 60)).toBe("12:00 PM");
    expect(formatPaliaTime(20 * 60 + 36)).toBe("8:36 PM");
    expect(formatPaliaTime(1440 + 5)).toBe("12:05 AM");
  });
});

describe("minutesUntil / inWindow", () => {
  it("wraps around midnight", () => {
    expect(minutesUntil(60, 1380)).toBe(120);
    expect(minutesUntil(100, 100)).toBe(0);
    expect(inWindow(1400, 21 * 60, 2 * 60)).toBe(true);
    expect(inWindow(30, 21 * 60, 2 * 60)).toBe(true);
    expect(inWindow(121, 21 * 60, 2 * 60)).toBe(false);
    expect(inWindow(500, 400, 600)).toBe(true);
    expect(inWindow(600, 400, 600)).toBe(false);
  });
});

describe("resolveSchedule", () => {
  it("walks Crab Wars' phases to the scored 7:00-8:36 window", () => {
    const s = resolveSchedule(crabWars);
    expect(s.leadStart).toBe(5 * 60 + 36);
    expect(s.mainStart).toBe(7 * 60);
    expect(s.mainEnd).toBe(8 * 60 + 36);
    expect(s.mainSeconds).toBe(240);
    expect(s.end).toBe(10 * 60 + 12);
  });

  it("leaves open-ended phases without an end", () => {
    const s = resolveSchedule(flowerBloom);
    expect(s.mainStart).toBe(12 * 60 + 24);
    expect(s.mainEnd).toBeNull();
    expect(s.end).toBeNull();
  });

  it("treats fixed windows as their own main phase", () => {
    const s = resolveSchedule(zeki);
    expect(s).toEqual({
      leadStart: 21 * 60,
      mainStart: 21 * 60,
      mainEnd: 2 * 60,
      mainSeconds: null,
      end: 2 * 60,
    });
  });
});

describe("eventStatus", () => {
  it("counts down to Crab Wars in real seconds", () => {
    // 7:00 Palia = real :17:30
    const status = eventStatus(crabWars, atRealMinute(10));
    expect(status.state).toBe("upcoming");
    expect(status.secondsToStart).toBeCloseTo(450, 6);
  });

  it("reports the lead-in, the scored phase and its remaining time", () => {
    // 6:12 Palia = real :15:30 → lead phase
    expect(eventStatus(crabWars, atRealMinute(15, 30)).state).toBe("lead");
    // 7:30 Palia = real :18:45 → active, 66 Palia minutes = 165 s left
    const active = eventStatus(crabWars, atRealMinute(18, 45));
    expect(active.state).toBe("active");
    expect(active.secondsToStart).toBe(0);
    expect(active.secondsToEnd).toBeCloseTo(165, 6);
    // 9:00 Palia (reward phase) is no longer "active" for players
    expect(eventStatus(crabWars, atRealMinute(22, 30)).state).toBe("upcoming");
  });

  it("shows open-ended events as started for a while, then upcoming", () => {
    // 12:24 Palia = real :31:00
    expect(eventStatus(flowerBloom, atRealMinute(31)).state).toBe("started");
    expect(eventStatus(flowerBloom, atRealMinute(30, 30)).state).toBe("lead");
    // 15:24 Palia = real :38:30 → display window over
    expect(eventStatus(flowerBloom, atRealMinute(38, 30)).state).toBe(
      "upcoming",
    );
  });

  it("keeps shops open across midnight", () => {
    // 1:00 Palia = real :02:30
    const open = eventStatus(zeki, atRealMinute(2, 30));
    expect(open.state).toBe("active");
    expect(open.secondsToEnd).toBeCloseTo(150, 6);
    // 3:00 Palia = real :07:30
    expect(eventStatus(zeki, atRealMinute(7, 30)).state).toBe("upcoming");
  });

  it("marks the market away outside its real-world weeks", () => {
    const during = Date.UTC(2026, 8, 10, 12, 50); // 20:00 Palia, inside week 1
    expect(eventStatus(maji, during).state).toBe("active");
    const between = Date.UTC(2026, 8, 20, 12, 50);
    expect(eventStatus(maji, between).state).toBe("away");
    const w = marketWindow(maji, between);
    expect(w.current).toBeNull();
    expect(w.next?.[0].toISOString()).toBe("2026-10-06T07:00:00.000Z");
  });
});

describe("dayPhaseAt", () => {
  const phases = [
    { id: "tod_morning", start: 180 },
    { id: "tod_day", start: 360 },
    { id: "tod_evening", start: 1080 },
    { id: "tod_night", start: 1260 },
  ];
  it("wraps night across midnight", () => {
    expect(dayPhaseAt(0, phases)?.id).toBe("tod_night");
    expect(dayPhaseAt(200, phases)?.id).toBe("tod_morning");
    expect(dayPhaseAt(720, phases)?.id).toBe("tod_day");
    expect(dayPhaseAt(1100, phases)?.id).toBe("tod_evening");
    expect(dayPhaseAt(1300, phases)?.id).toBe("tod_night");
  });
});

describe("helpers", () => {
  it("formats countdowns", () => {
    expect(formatCountdown(0.4)).toBe("now");
    expect(formatCountdown(12)).toBe("12s");
    expect(formatCountdown(245)).toBe("4m 05s");
    expect(formatCountdown(3725)).toBe("1h 02m");
  });

  it("centres the spots", () => {
    expect(eventCenter(flowerBloom)).toEqual([100, 200]);
    expect(eventCenter(maji)).toBeNull();
  });
});
