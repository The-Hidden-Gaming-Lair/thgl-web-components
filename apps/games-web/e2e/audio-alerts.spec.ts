import { expect, test, type Page } from "@playwright/test";
import { CLAY, MAPS, openMap, toggleFilter } from "./fixtures";

/**
 * Positional audio alerts (Settings > Accessibility). Playwright cannot hear
 * anything, but the page builds the Web Audio graph in the page context, so a
 * recording fake `AudioContext` installed with `addInitScript` BEFORE the app
 * boots observes every alert: its peak gain, its pan and its frequencies.
 * (Same technique as `installFakeWebviewBridge` in fixtures.ts.)
 *
 * What is guarded:
 *  - the pan sign follows the player's HEADING, including Palia's
 *    `playerIconForward: 90` (the single most likely bug in this feature: a
 *    facing sum that drops the icon-forward correction pans a marker dead
 *    ahead to the side);
 *  - the gain rises as the player closes in;
 *  - with the switch off, one approach makes exactly one centred alert, which
 *    is the long-standing behaviour every existing user has.
 *
 * Determinism: the alert candidate is a single injected LIVE actor, in Live
 * mode, so the map's own (dense, layout-dependent) Clay spawns are out of the
 * picture - predicted spawns are skipped by the alert path anyway.
 *
 * Needs the dev servers running, like the rest of the suite:
 *   bun run test:e2e -- e2e/audio-alerts.spec.ts
 */

/**
 * Palia's VillageWorld affine transformation (public/palia/config/tiles.json)
 * has a positive lng coefficient, so a LARGER lng is further RIGHT on screen.
 * The actor therefore sits to the screen-right of every player position below.
 */
const ACTOR = {
  address: 9001,
  type: CLAY.actorClass,
  mapName: MAPS.kilima.key,
  x: CLAY.spawn.lat,
  y: CLAY.spawn.lng,
  z: 0,
  r: 0,
};

type Play = { peakGain: number; pan: number; freqs: number[] };

/**
 * Replace `window.AudioContext` with a recorder that satisfies everything
 * audio-alert.ts touches. Every `oscillator.start()` walks its own output
 * chain and records the gain peak + the pan it will be played at.
 */
async function installFakeAudio(page: Page) {
  await page.addInitScript(() => {
    const plays: { peakGain: number; pan: number; freqs: number[] }[] = [];
    (window as any).__audio = { plays };

    const param = (onSet: (v: number) => void) => ({
      value: 0,
      setValueAtTime(v: number) {
        onSet(v);
        return this;
      },
      linearRampToValueAtTime(v: number) {
        onSet(v);
        return this;
      },
      exponentialRampToValueAtTime(v: number) {
        onSet(v);
        return this;
      },
      cancelScheduledValues() {
        return this;
      },
    });

    function FakeContext(this: any) {
      const destination: any = { kind: "destination", out: null };
      this.state = "running";
      this.sampleRate = 48000;
      this.destination = destination;
      Object.defineProperty(this, "currentTime", {
        get: () => performance.now() / 1000,
      });
      this.resume = () => Promise.resolve();
      this.suspend = () => Promise.resolve();
      this.close = () => Promise.resolve();

      this.createGain = () => {
        const node: any = { kind: "gain", peak: 0, out: null };
        node.gain = param((v: number) => {
          if (v > node.peak) node.peak = v;
        });
        node.connect = (dest: any) => {
          node.out = dest;
          return dest;
        };
        node.disconnect = () => {};
        return node;
      };

      this.createStereoPanner = () => {
        const node: any = { kind: "panner", panValue: 0, out: null };
        node.pan = param((v: number) => {
          node.panValue = v;
        });
        node.connect = (dest: any) => {
          node.out = dest;
          return dest;
        };
        node.disconnect = () => {};
        return node;
      };

      this.createOscillator = () => {
        const node: any = { kind: "osc", type: "sine", freqs: [], out: null };
        node.frequency = param((v: number) => node.freqs.push(v));
        node.connect = (dest: any) => {
          node.out = dest;
          return dest;
        };
        node.disconnect = () => {};
        node.start = () => {
          let peakGain = 0;
          let pan = 0;
          for (let n = node.out; n; n = n.out) {
            if (n.kind === "gain") peakGain = Math.max(peakGain, n.peak);
            if (n.kind === "panner") pan = n.panValue;
          }
          plays.push({ peakGain, pan, freqs: node.freqs.slice() });
        };
        node.stop = () => {};
        return node;
      };
    }

    (window as any).AudioContext = FakeContext;
    (window as any).webkitAudioContext = FakeContext;
  });
}

/**
 * Alerts only. The AudioAlertUnlocker plays a zero-gain blip inside the first
 * user gesture; it must never be mistaken for an alert.
 */
function plays(page: Page): Promise<Play[]> {
  return page.evaluate(() =>
    ((window as any).__audio.plays as Play[]).filter((p) => p.peakGain > 0),
  );
}

function resetPlays(page: Page) {
  return page.evaluate(() => {
    (window as any).__audio.plays.length = 0;
  });
}

function setPlayer(page: Page, dLng: number, r: number) {
  return page.evaluate(
    ({ lat, lng, r: heading }) =>
      (window as any).__thgl.useGameState.getState().setPlayer({
        address: 1,
        type: "Player",
        mapName: (window as any).__thgl.userStore.getState().mapName,
        x: lat,
        y: lng,
        z: 0,
        r: heading,
      }),
    { lat: ACTOR.x, lng: ACTOR.y + dLng, r },
  );
}

/** Live mode + one injected actor + the alert settings under test. */
async function armAlerts(
  page: Page,
  settings: Record<string, unknown>,
): Promise<void> {
  await toggleFilter(page, CLAY.id);
  await page.evaluate((extra) => {
    const t = (window as any).__thgl;
    // The web map starts Predicted, and "Auto Live Mode" forces it back
    // whenever no Peer Link sender is connected - opt out first.
    t.useSettingsStore.setState({ autoLiveModeWithMe: false });
    t.useSettingsStore.getState().setLiveMode("live");
    t.useSettingsStore.setState({
      audioAlertsMuted: false,
      audioAlertNotifications: false,
      audioAlertRange: 5000,
      audioAlertVolume: 1,
      audioAlertSound: "chime",
      audioAlertSoundByFilter: {},
      ...extra,
    });
  }, settings);
  await page.evaluate(
    ({ id, actor }) => {
      const t = (window as any).__thgl;
      t.useSettingsStore.setState({ audioAlertByFilter: { [id]: true } });
      t.useGameState.getState().setActors([actor]);
    },
    { id: CLAY.id, actor: ACTOR },
  );
}

/**
 * Move the player (heading + distance) and return the first alert that was
 * computed from the NEW pose.
 *
 * `throttledPlayer` only advances ~1x/s, so a position set sooner than that is
 * swallowed - hence the wait before the move. And in positional mode the type
 * keeps re-pinging on its distance-scaled cooldown (~1.3 s at 1800 units of a
 * 5000 range) whether or not the player moves, so a ping armed under the OLD
 * pose can land right after `setPlayer`. Counting only once a full cooldown
 * has passed since the move guarantees the next ping reflects the new pose.
 */
async function ping(page: Page, dLng: number, r: number): Promise<Play> {
  await page.waitForTimeout(1100);
  await setPlayer(page, dLng, r);
  await page.waitForTimeout(1500);
  const before = (await plays(page)).length;
  await expect
    .poll(() => plays(page).then((p) => p.length), { timeout: 10_000 })
    .toBeGreaterThan(before);
  const all = await plays(page);
  return all[all.length - 1];
}

test.describe("audio alerts", () => {
  test("positional: the pan follows the heading and the gain rises on approach", async ({
    page,
  }) => {
    await installFakeAudio(page);
    await openMap(page, MAPS.kilima);
    await armAlerts(page, { audioAlertPositional: true, audioAlertVolume: 1 });
    await resetPlays(page);

    // Facing = r + tile rotation (0 on VillageWorld) + playerIconForward (90).
    // Player 1800 units WEST of the actor, so the actor is to the screen-right.

    // r = -90 -> facing 0 (up): the actor is 90 degrees to the RIGHT.
    const right = await ping(page, -1800, -90);
    expect(right.pan).toBeGreaterThan(0.5);

    // r = +90 -> facing 180 (down): the same actor is now to the LEFT.
    const left = await ping(page, -1800, 90);
    expect(left.pan).toBeLessThan(-0.5);

    // r = 0 -> facing 90 (right): the actor is DEAD AHEAD. This is the
    // playerIconForward guard - drop that term and this lands hard right.
    const ahead = await ping(page, -1800, 0);
    expect(Math.abs(ahead.pan)).toBeLessThan(0.2);

    // Dead ahead is not attenuated, the sides are (rearAttenuation), so at the
    // same distance "ahead" has to be the loudest of the three.
    expect(ahead.peakGain).toBeGreaterThan(right.peakGain);
    expect(ahead.peakGain).toBeGreaterThan(left.peakGain);

    // r = 180 -> facing 270 (left): the actor is BEHIND. Centred, but dipped.
    const behind = await ping(page, -1800, 180);
    expect(Math.abs(behind.pan)).toBeLessThan(0.2);
    expect(behind.peakGain).toBeLessThan(ahead.peakGain * 0.8);

    // Closing in, same heading: strictly louder.
    const near = await ping(page, -200, 0);
    expect(near.peakGain).toBeGreaterThan(ahead.peakGain * 1.5);

    // ...and it keeps repeating while the player stands still (the cadence is
    // ~0.5 s at 200 units of a 5000 range).
    const repeats = (await plays(page)).length;
    await expect
      .poll(() => plays(page).then((p) => p.length), { timeout: 10_000 })
      .toBeGreaterThan(repeats);
  });

  test("off by default: one centred alert per approach, and no repeats", async ({
    page,
  }) => {
    await installFakeAudio(page);
    await openMap(page, MAPS.kilima);
    await armAlerts(page, { audioAlertPositional: false, audioAlertVolume: 1 });
    await resetPlays(page);

    await setPlayer(page, -1800, -90);
    await expect
      .poll(() => plays(page).then((p) => p.length), { timeout: 10_000 })
      .toBe(1);

    const [only] = await plays(page);
    // Centred, full volume (chime's own 0.6 headroom), no distance falloff.
    expect(only.pan).toBe(0);
    expect(only.peakGain).toBeCloseTo(0.6, 3);

    // Standing still and moving closer must NOT produce a second ding: the
    // latch only resets when everything leaves the range.
    await page.waitForTimeout(1100);
    await setPlayer(page, -200, -90);
    await page.waitForTimeout(2500);
    expect((await plays(page)).length).toBe(1);
  });

  test("per-filter tone: the picked tone is the one that plays", async ({
    page,
  }) => {
    await installFakeAudio(page);
    await openMap(page, MAPS.kilima);
    await armAlerts(page, { audioAlertPositional: false, audioAlertVolume: 1 });
    await page.evaluate((id) => {
      (window as any).__thgl.useSettingsStore
        .getState()
        .setAudioAlertSoundByFilters([id], "soft");
    }, CLAY.id);
    await resetPlays(page);

    await setPlayer(page, -1800, -90);
    await expect
      .poll(() => plays(page).then((p) => p.length), { timeout: 10_000 })
      .toBe(1);

    // "soft" is C5 -> E5; the global "chime" would be A5 -> C#6.
    const [only] = await plays(page);
    expect(only.freqs[0]).toBeCloseTo(523.25, 2);
    expect(only.freqs[1]).toBeCloseTo(659.25, 2);
  });
});
