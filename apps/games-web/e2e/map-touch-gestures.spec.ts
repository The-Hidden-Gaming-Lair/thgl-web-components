import { expect, test, type CDPSession, type Page } from "@playwright/test";
import { MAPS, openMap } from "./fixtures";

/**
 * Two-finger gesture intent on the WebGL map (webmap.ts pinch handler):
 *  - a pinch zooms without rotating or tilting, even though real fingers
 *    wobble by a few degrees and drift vertically ("can't zoom on mobile
 *    without rotating the map");
 *  - a deliberate twist past the threshold rotates, and the map does not jump
 *    when rotation engages;
 *  - a two-finger vertical drag with the fingers a fixed distance apart tilts.
 *
 * Touches are synthesized through CDP (Chromium turns them into the pointer
 * events the map listens to); Playwright's touchscreen API is single-touch.
 */
type Pt = { x: number; y: number };

// One CDP session per page: detaching a session drops its touch state, so a
// touchMove on a fresh session fails with "Must send a TouchStart first".
const sessions = new WeakMap<Page, Promise<CDPSession>>();
function cdpFor(page: Page): Promise<CDPSession> {
  let s = sessions.get(page);
  if (!s) {
    s = page.context().newCDPSession(page);
    sessions.set(page, s);
  }
  return s;
}

async function touch(
  page: Page,
  type: "touchStart" | "touchMove" | "touchEnd",
  points: Pt[],
) {
  const cdp = await cdpFor(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type,
    touchPoints: points.map((p, id) => ({ ...p, id, radiusX: 4, radiusY: 4 })),
  });
}

/** Two fingers around `c`, `dist` apart, at `angle` (radians from +x). */
const fingers = (c: Pt, dist: number, angle: number): Pt[] => [
  {
    x: c.x - (Math.cos(angle) * dist) / 2,
    y: c.y - (Math.sin(angle) * dist) / 2,
  },
  {
    x: c.x + (Math.cos(angle) * dist) / 2,
    y: c.y + (Math.sin(angle) * dist) / 2,
  },
];

const nextFrame = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<void>((r) =>
        requestAnimationFrame(() => requestAnimationFrame(() => r())),
      ),
  );

const camera = (page: Page) =>
  page.evaluate(() => {
    const map = (window as any).__thgl.useMapStore.getState().map;
    return {
      zoom: map.getZoom() as number,
      bearing: map.getBearing() as number,
      pitch: map.getPitch() as number,
    };
  });

/** Drive a two-finger gesture through `steps` frames of (dist, angle, center). */
async function gesture(
  page: Page,
  c: Pt,
  frames: { dist: number; angle: number; c?: Pt }[],
) {
  await touch(page, "touchStart", fingers(c, frames[0].dist, frames[0].angle));
  for (const f of frames) {
    await touch(page, "touchMove", fingers(f.c ?? c, f.dist, f.angle));
  }
  await touch(page, "touchEnd", []);
  await page.waitForTimeout(150);
}

test.describe("two-finger gestures", () => {
  test.beforeEach(async ({ page }) => {
    await openMap(page, MAPS.kilima);
    await page.evaluate(() => {
      const map = (window as any).__thgl.useMapStore.getState().map;
      map.setBearing(0);
      map.setPitch(0);
      map.setZoom(3);
    });
    await page.waitForTimeout(300);
  });

  test("a wobbly pinch zooms without rotating or tilting", async ({ page }) => {
    const box = (await page.locator("canvas").first().boundingBox())!;
    const c = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    const before = await camera(page);
    // Spread from 100px to 220px while the finger line wobbles ±6° and the
    // midpoint drifts 12px down — what a real pinch looks like.
    const frames = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      frames.push({
        dist: 100 + 120 * t,
        angle: (Math.sin(i * 1.3) * 6 * Math.PI) / 180,
        c: { x: c.x, y: c.y + 12 * t },
      });
    }
    await gesture(page, c, frames);
    const after = await camera(page);
    expect(after.zoom).toBeGreaterThan(before.zoom + 0.8);
    expect(Math.abs(after.bearing)).toBeLessThan(1e-6);
    expect(after.pitch).toBe(0);
  });

  test("a deliberate twist rotates from the threshold on, without a jump", async ({
    page,
  }) => {
    const box = (await page.locator("canvas").first().boundingBox())!;
    const c = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    const frames = [];
    for (let i = 0; i <= 20; i++) {
      frames.push({ dist: 160, angle: ((i * 2.5) / 180) * Math.PI }); // 0 → 50°
    }
    // Step through and record the bearing per frame to check continuity.
    await touch(page, "touchStart", fingers(c, 160, 0));
    const bearings: number[] = [];
    for (const f of frames) {
      await touch(page, "touchMove", fingers(c, f.dist, f.angle));
      // Touch moves are delivered rAF-aligned: let the handler run before
      // sampling, otherwise two moves land in one sample and look like a jump.
      await nextFrame(page);
      bearings.push((await camera(page)).bearing);
    }
    await touch(page, "touchEnd", []);
    // Below the threshold (~11.5°) nothing rotates; rotation engages on the
    // first frame past it (12.5°, or one frame later once CDP has rounded the
    // touch coordinates to whole pixels) …
    // The engage frame itself still reads 0 (the bearing is offset by the
    // twist at that moment), so the first non-zero frame is the one after it.
    const firstTurn = bearings.findIndex((b) => Math.abs(b) > 1e-6);
    const engagedAt = firstTurn - 1;
    expect(engagedAt).toBeGreaterThanOrEqual(5);
    expect(engagedAt).toBeLessThanOrEqual(7);
    // … from then on the map turns by the twist beyond that frame's angle (no
    // jump on engage), and no single frame moves by more than the 2.5° step.
    const finalDeg = (Math.abs(bearings[bearings.length - 1]!) * 180) / Math.PI;
    expect(Math.abs(finalDeg - (50 - engagedAt * 2.5))).toBeLessThan(1.5);
    for (let i = 1; i < bearings.length; i++) {
      expect(Math.abs(bearings[i]! - bearings[i - 1]!)).toBeLessThan(
        (3 / 180) * Math.PI,
      );
    }
    const after = await camera(page);
    expect(Math.abs(after.zoom - 3)).toBeLessThan(0.05);
  });

  test("a two-finger vertical drag tilts without zooming", async ({ page }) => {
    const box = (await page.locator("canvas").first().boundingBox())!;
    const c = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    const frames = [];
    for (let i = 0; i <= 10; i++) {
      frames.push({ dist: 160, angle: 0, c: { x: c.x, y: c.y - 8 * i } }); // 80px up
    }
    await gesture(page, c, frames);
    const after = await camera(page);
    expect(after.pitch).toBeGreaterThan(0.1);
    expect(Math.abs(after.bearing)).toBeLessThan(1e-6);
    expect(Math.abs(after.zoom - 3)).toBeLessThan(0.05);
  });
});
