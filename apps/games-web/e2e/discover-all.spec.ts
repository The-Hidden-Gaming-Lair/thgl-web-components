import { expect, test, type Page } from "@playwright/test";
import { BASE_URL, GAME, MAPS, openMap } from "./fixtures";

/**
 * "Discover all" / "Undiscover all" in a filter's settings popover touch only
 * that filter's markers.
 *
 * Regression (web, fix/discover-all-same-spot): a stored discovered mark used
 * to grey every marker within 1 map unit of it, whatever its filter. So
 * Discover all on filter X greyed filter Y's markers on the same spot, and
 * Undiscover all on X deleted the user's own ticks on Y's markers there.
 *
 * The pair is found at runtime from the drawn static markers, not hard-coded:
 * Palia stacks several bug filters on one spawn point (e.g. Kilima Night Moth,
 * Common Blue Butterfly and Princess Ladybug at the same coordinates), so a
 * filter X with neighbours of two other filters on two separate spots exists.
 */

type Pick = {
  /** Filter whose Discover all / Undiscover all the test clicks. */
  x: string;
  /** X's drawn marker ids on the map. */
  xIds: string[];
  /** Neighbour of an X marker (other filter), ticked by the user beforehand. */
  y1: { id: string; type: string; dist: number };
  /** Neighbour of another X marker (other filter), never ticked. */
  y2: { id: string; type: string; dist: number };
};

/**
 * A filter X and two markers of other filters, each within 1 map unit of an
 * X marker, and more than 1 unit apart from each other (so the ticked one
 * cannot grey the other one by position, even under the old rule).
 */
function pickMarkers(page: Page): Promise<Pick | null> {
  return page.evaluate(() => {
    const map = (window as any).__thgl.useMapStore.getState().map;
    const markers = (map.markerLayer.getInstances().filter(Boolean) as any[])
      .filter((i) => (i.id as string).startsWith(`${i.key}@`))
      .map((i) => ({
        id: i.id as string,
        type: i.key as string,
        x: i.latLng[0] as number,
        y: i.latLng[1] as number,
      }))
      .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    const dist = (a: (typeof markers)[0], b: (typeof markers)[0]) =>
      Math.hypot(a.x - b.x, a.y - b.y);
    const types = [...new Set(markers.map((m) => m.type))].sort();
    for (const x of types) {
      const xs = markers.filter((m) => m.type === x);
      const neighbours: { id: string; type: string; dist: number; m: any }[] =
        [];
      for (const m of markers) {
        if (m.type === x) continue;
        const d = Math.min(...xs.map((xm) => dist(xm, m)));
        if (d <= 1) neighbours.push({ id: m.id, type: m.type, dist: d, m });
      }
      for (const a of neighbours) {
        const b = neighbours.find((n) => dist(n.m, a.m) > 1);
        if (!b) continue;
        return {
          x,
          xIds: xs.map((m) => m.id),
          y1: { id: a.id, type: a.type, dist: a.dist },
          y2: { id: b.id, type: b.type, dist: b.dist },
        };
      }
    }
    return null;
  });
}

/** The filter's English label, as the sidebar shows it. */
async function filterLabel(page: Page, id: string): Promise<string> {
  const res = await page.request.get(
    `${BASE_URL}/__forge-cdn/${GAME}/dicts/en.json`,
  );
  const dict = (await res.json()) as Record<string, string>;
  const raw = dict[id] ?? id;
  return raw[0] === "@" ? (dict[raw] ?? id) : raw;
}

const discoveredNodes = (page: Page) =>
  page.evaluate(
    () =>
      (window as any).__thgl.useSettingsStore.getState()
        .discoveredNodes as string[],
  );

const isDiscovered = (page: Page, ids: string[]) =>
  page.evaluate(
    (list) =>
      list.map((id) =>
        (window as any).__thgl.useSettingsStore.getState().isDiscoveredNode(id),
      ) as boolean[],
    ids,
  );

/** The grey flag the marker layer draws with. */
const drawnDiscovered = (page: Page, id: string) =>
  page.evaluate((nodeId) => {
    const map = (window as any).__thgl.useMapStore.getState().map;
    const inst = (map.markerLayer.getInstances() as any[]).find(
      (i) => i?.id === nodeId,
    );
    return inst ? !!inst.isDiscovered : null;
  }, id);

test("Discover all / Undiscover all leave another filter's neighbouring marker alone", async ({
  page,
}) => {
  await openMap(page, MAPS.kilima);
  const pick = await pickMarkers(page);
  expect(
    pick,
    "a filter with neighbours of two other filters within 1 map unit",
  ).not.toBeNull();
  const { x, xIds, y1, y2 } = pick!;
  test.info().annotations.push({
    type: "markers",
    description: JSON.stringify({ x, y1, y2 }),
  });

  // (a) The user ticked Y1 (a marker of another filter on an X marker's spot).
  await page.evaluate((id) => {
    const s = (window as any).__thgl.useSettingsStore.getState();
    s.setDiscoveredNodes([]);
    s.setDiscoverNode(id, true);
  }, y1.id);
  expect(await isDiscovered(page, [y1.id, y2.id])).toEqual([true, false]);

  // Open X's settings popover through the sidebar.
  const label = await filterLabel(page, x);
  await page.getByPlaceholder("Type to search...").fill(label);
  const valueButton = page.getByRole("button", { name: label, exact: true });
  await expect(valueButton).toHaveCount(1);
  await valueButton
    .locator("xpath=..")
    .getByRole("button", { name: "Filter settings" })
    .click();
  const popover = page.getByRole("dialog");
  const bulk = popover.getByRole("button", {
    name: /^(Discover all|Undiscover all)/,
  });

  // Confirms through the dialog when the button asks (it does whenever some
  // of X's spots already count as discovered).
  const clickBulk = async (action: "Discover all" | "Undiscover all") => {
    await expect(bulk).toContainText(action);
    const [done] = /(\d+)\/\d+/
      .exec((await bulk.textContent()) ?? "")!
      .slice(1)
      .map(Number);
    await bulk.click();
    if (done > 0) {
      await page
        .getByRole("alertdialog")
        .getByRole("button", { name: action })
        .click();
    }
  };

  // (b) Discover all on X: every X marker, but not the neighbour Y2.
  await clickBulk("Discover all");
  await expect
    .poll(async () => (await isDiscovered(page, xIds)).every(Boolean))
    .toBe(true);
  expect(await discoveredNodes(page)).toContain(y1.id);
  expect(await isDiscovered(page, [y1.id, y2.id])).toEqual([true, false]);
  await expect.poll(() => drawnDiscovered(page, xIds[0])).toBe(true);
  expect(await drawnDiscovered(page, y2.id)).toBe(false);

  // (c) Undiscover all on X: X's marks go, the user's tick on Y1 stays.
  await clickBulk("Undiscover all");
  await expect
    .poll(async () => (await isDiscovered(page, xIds)).some(Boolean))
    .toBe(false);
  const marks = await discoveredNodes(page);
  expect(marks.filter((m) => m.startsWith(`${x}@`))).toEqual([]);
  expect(marks).toContain(y1.id);
  expect(await isDiscovered(page, [y1.id, y2.id])).toEqual([true, false]);
});
