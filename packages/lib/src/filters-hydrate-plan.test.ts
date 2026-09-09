import { planFilterHydrate } from "./filters-sync";
import type { DrawingsAndNodes } from "./settings";

const f = (over: Partial<DrawingsAndNodes> & { name: string }) =>
  ({ ...over }) as DrawingsAndNodes;
const node = (id: string) => ({ id, p: [0, 0] }) as any;

let seq = 0;
const newId = () => `minted-${++seq}`;
beforeEach(() => {
  seq = 0;
});

const plan = (over: Partial<Parameters<typeof planFilterHydrate>[0]>) =>
  planFilterHydrate({
    local: [],
    server: [],
    pendingIds: new Set(),
    dirtyIds: [],
    isTombstoned: () => false,
    newId,
    game: "palia",
    ...over,
  });

describe("planFilterHydrate", () => {
  it("takes the server list at a clean mount and pushes nothing", () => {
    const out = plan({ server: [f({ name: "s", id: "S", synced: true })] });
    expect(out.filters.map((x) => x.id)).toEqual(["S"]);
    expect(out.toPush).toEqual([]);
    expect(out.droppedIds).toEqual([]);
  });

  it("re-pushes an edit whose debounce never fired (dirty id) — and only if the filter still exists", () => {
    // The dirty marker is durable; the pending rule keeps the local copy, but
    // only the re-push actually re-arms the upload. An id that no longer maps
    // to a filter is ignored rather than crashing the hydrate.
    const local = [
      f({ name: "edited", id: "E", synced: true, nodes: [node("n")] }),
    ];
    const server = [f({ name: "edited", id: "E", synced: true, nodes: [] })];
    const out = plan({
      local,
      server,
      pendingIds: new Set(["E"]),
      dirtyIds: ["E", "ghost"],
    });
    expect(out.toPush.map((x) => x.id)).toEqual(["E"]);
    expect(out.toPush[0].nodes).toHaveLength(1); // the LOCAL (newer) copy
  });

  it("re-pushes a first upload that never landed (local id, no server row)", () => {
    const local = [f({ name: "stranded", id: "L", nodes: [node("n")] })];
    const out = plan({ local });
    expect(out.filters.map((x) => x.id)).toEqual(["L"]);
    expect(out.toPush.map((x) => x.id)).toEqual(["L"]);
  });

  it("adopts a local-only filter with content, stamps the game, and pushes it", () => {
    const local = [f({ name: "backup-restored", nodes: [node("n")] })];
    const out = plan({ local });
    expect(out.filters[0].id).toBe("minted-1");
    expect(out.filters[0].game).toBe("palia");
    expect(out.toPush.map((x) => x.id)).toEqual(["minted-1"]);
  });

  it("drops a previously-synced filter the server no longer has and reports the id", () => {
    const local = [f({ name: "remote-deleted", id: "R", synced: true })];
    const out = plan({ local });
    expect(out.filters).toEqual([]);
    expect(out.droppedIds).toEqual(["R"]);
    expect(out.toPush).toEqual([]);
  });

  it("keeps a synced-but-absent filter that is still pending (save-then-hydrate race)", () => {
    const local = [
      f({ name: "just-saved", id: "J", synced: true, nodes: [node("n")] }),
    ];
    const out = plan({ local, pendingIds: new Set(["J"]) });
    expect(out.filters.map((x) => x.id)).toEqual(["J"]);
    expect(out.droppedIds).toEqual([]);
  });

  it("never resurrects a tombstoned server row and never keeps a tombstoned local one", () => {
    const out = plan({
      local: [f({ name: "deleted-here", id: "D", synced: true })],
      server: [f({ name: "deleted-here", id: "D", synced: true })],
      isTombstoned: (x) => x.id === "D",
    });
    expect(out.filters).toEqual([]);
  });

  it("pushes each id once even when several sources name it", () => {
    const local = [f({ name: "e", id: "E", synced: true, nodes: [node("n")] })];
    const server = [f({ name: "e", id: "E", synced: true, nodes: [] })];
    const out = plan({
      local,
      server,
      pendingIds: new Set(["E"]),
      dirtyIds: ["E", "E"],
    });
    expect(out.toPush).toHaveLength(1);
  });
});
