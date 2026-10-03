import { createDetectionTelemetry } from "./telemetry";

const CLASS_ID = 22700;

function setup(isRunning: () => boolean) {
  const posts: { url: string; body: any }[] = [];
  (globalThis as any).overwolf = {
    extensions: {
      current: {
        getManifest: (cb: (r: any) => void) =>
          cb({ success: true, meta: { version: "1.2.3" } }),
      },
    },
    games: {
      getRunningGameInfo: (cb: (r: any) => void) =>
        cb({ isRunning: isRunning(), id: CLASS_ID * 10 + 1 }),
    },
  };
  (globalThis as any).fetch = jest.fn((url: string, init: any) => {
    posts.push({ url, body: JSON.parse(init.body) });
    return Promise.resolve({ ok: true });
  });
  return posts;
}

describe("createDetectionTelemetry", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("reports read health every 300 s while the game runs, no positions", async () => {
    const posts = setup(() => true);
    const t = createDetectionTelemetry("diablo4", CLASS_ID);
    await Promise.resolve(); // manifest version
    jest.advanceTimersByTime(15_000); // first tick sees the game running
    t.onPlayerRead(true, "Sanctuary");
    t.onPlayerRead(true, "Sanctuary");
    t.onPlayerRead(false);
    jest.advanceTimersByTime(300_000);
    expect(posts).toHaveLength(1);
    expect(posts[0].url).toBe("https://actors-api.th.gl/telemetry/diablo4");
    expect(posts[0].body).toMatchObject({
      v: 1,
      client: "overwolf",
      appVersion: "1.2.3",
      player: { reads: 3, ok: 2 },
      actors: { reads: 0 },
      maps: ["Sanctuary"],
    });
    expect(posts[0].body.runningS).toBeGreaterThanOrEqual(300);
    expect(JSON.stringify(posts[0].body)).not.toMatch(/"x"|"y"/);
  });

  it("ignores reads while the game is not running and flushes when it closes", () => {
    let running = false;
    const posts = setup(() => running);
    const t = createDetectionTelemetry("diablo4", CLASS_ID);
    t.onPlayerRead(true, "Sanctuary"); // GEP poll before launch: not counted
    jest.advanceTimersByTime(60_000);
    expect(posts).toHaveLength(0);

    running = true;
    jest.advanceTimersByTime(15_000);
    t.onPlayerRead(true, "Dungeon");
    running = false;
    jest.advanceTimersByTime(15_000); // closed: send the partial period
    expect(posts).toHaveLength(1);
    expect(posts[0].body.player).toEqual({ reads: 1, ok: 1 });
  });
});
