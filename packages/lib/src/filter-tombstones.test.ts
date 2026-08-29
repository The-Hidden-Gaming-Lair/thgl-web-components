import {
  _setFilterTombstoneStorageForTests,
  clearFilterTombstones,
  enqueueFilterDelete,
  filterOutTombstoned,
  flushFilterDeletes,
  getPendingFilterDeletes,
  isFilterTombstoned,
  recordFilterTombstone,
  type StorageLike,
} from "./filter-tombstones";

/** Minimal in-memory Storage backing the injectable seam. */
function fakeStorage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

beforeEach(() => {
  _setFilterTombstoneStorageForTests(fakeStorage());
});

afterAll(() => {
  _setFilterTombstoneStorageForTests(undefined);
});

describe("tombstones", () => {
  it("matches by name and by id after a delete", () => {
    recordFilterTombstone({ name: "my_1_Campsite", id: "uuid-1" });
    expect(isFilterTombstoned({ name: "my_1_Campsite" })).toBe(true);
    expect(isFilterTombstoned({ name: "other", id: "uuid-1" })).toBe(true);
    expect(isFilterTombstoned({ name: "my_2_Campsite", id: "uuid-2" })).toBe(
      false,
    );
  });

  it("clearFilterTombstones lets a deliberate re-add survive", () => {
    recordFilterTombstone({ name: "my_1_Campsite", id: "uuid-1" });
    clearFilterTombstones({ name: "my_1_Campsite", id: "uuid-1" });
    expect(isFilterTombstoned({ name: "my_1_Campsite", id: "uuid-1" })).toBe(
      false,
    );
  });

  it("a server copy updated AFTER the delete wins and clears the tombstone", () => {
    recordFilterTombstone({ name: "my_1_Campsite", id: "uuid-1" });
    // Server updatedAt is unix SECONDS; one minute in the future.
    const updatedAt = Math.floor(Date.now() / 1000) + 60;
    expect(
      isFilterTombstoned({ name: "my_1_Campsite", id: "uuid-1", updatedAt }),
    ).toBe(false);
    // Side effect: the stale tombstone is gone entirely.
    expect(isFilterTombstoned({ name: "my_1_Campsite", id: "uuid-1" })).toBe(
      false,
    );
  });

  it("a server copy updated BEFORE the delete stays dropped", () => {
    recordFilterTombstone({ name: "my_1_Campsite", id: "uuid-1" });
    const updatedAt = Math.floor(Date.now() / 1000) - 3600;
    expect(
      isFilterTombstoned({ name: "my_1_Campsite", id: "uuid-1", updatedAt }),
    ).toBe(true);
  });

  it("filterOutTombstoned drops matches and keeps array identity when clean", () => {
    const clean = [{ name: "my_1_keep" }, { name: "my_2_keep", id: "k2" }];
    expect(filterOutTombstoned(clean)).toBe(clean);

    recordFilterTombstone({ name: "my_2_keep", id: "k2" });
    const filtered = filterOutTombstoned(clean);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe("my_1_keep");
  });

  it("no-ops without storage instead of throwing (SSR / privacy mode)", () => {
    _setFilterTombstoneStorageForTests(null);
    expect(() => recordFilterTombstone({ name: "x" })).not.toThrow();
    expect(isFilterTombstoned({ name: "x" })).toBe(false);
    expect(getPendingFilterDeletes()).toEqual([]);
  });
});

describe("pending-delete queue", () => {
  const discard404 = (err: unknown) =>
    !!err && typeof err === "object" && (err as any).status === 404;

  it("retries until the server confirms, then dequeues", async () => {
    enqueueFilterDelete("uuid-1");
    enqueueFilterDelete("uuid-2");
    expect(getPendingFilterDeletes().sort()).toEqual(["uuid-1", "uuid-2"]);

    // First flush: uuid-1 fails transiently, uuid-2 succeeds.
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    await flushFilterDeletes({
      isSignedIn: () => true,
      deleteFilter: async (id) => {
        if (id === "uuid-1") throw new Error("network");
      },
    });
    consoleError.mockRestore();
    expect(getPendingFilterDeletes()).toEqual(["uuid-1"]);

    // Second flush: succeeds → queue drains.
    await flushFilterDeletes({
      isSignedIn: () => true,
      deleteFilter: async () => {},
    });
    expect(getPendingFilterDeletes()).toEqual([]);
  });

  it("drops entries the caller classifies as unrecoverable (404/403)", async () => {
    enqueueFilterDelete("uuid-gone");
    await flushFilterDeletes({
      isSignedIn: () => true,
      deleteFilter: async () => {
        throw { status: 404 };
      },
      shouldDiscard: discard404,
    });
    expect(getPendingFilterDeletes()).toEqual([]);
  });

  it("keeps the queue intact while signed out (the signed-out-delete orphan fix)", async () => {
    enqueueFilterDelete("uuid-1");
    const deleteFilter = jest.fn();
    await flushFilterDeletes({ isSignedIn: () => false, deleteFilter });
    expect(deleteFilter).not.toHaveBeenCalled();
    expect(getPendingFilterDeletes()).toEqual(["uuid-1"]);
  });
});
