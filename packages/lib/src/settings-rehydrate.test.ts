import {
  reconcileRehydratedProfiles,
  stripTombstonedFromProfiles,
} from "./settings-rehydrate";
import type { DrawingsAndNodes, Profile } from "./settings";

const f = (over: Partial<DrawingsAndNodes> & { name: string }) =>
  ({ ...over }) as DrawingsAndNodes;

const profile = (
  id: string,
  settings: Partial<Profile["settings"]> | undefined,
): Profile =>
  ({
    id,
    name: id,
    settings: settings as Profile["settings"],
    createdAt: 0,
    updatedAt: 0,
  }) as Profile;

const never = () => false;

describe("stripTombstonedFromProfiles", () => {
  it("returns the SAME array when no profile holds a tombstoned filter", () => {
    // Identity matters: this runs inside `partialize` on every store write,
    // so a fresh array here would mean a storage write per state change.
    const profiles = [profile("p1", { myFilters: [f({ name: "keep" })] })];
    expect(stripTombstonedFromProfiles(profiles, never)).toBe(profiles);
  });

  it("removes only tombstoned filters and leaves untouched profiles by reference", () => {
    const clean = profile("clean", { myFilters: [f({ name: "a" })] });
    const dirty = profile("dirty", {
      myFilters: [f({ name: "gone" }), f({ name: "stays" })],
    });
    const out = stripTombstonedFromProfiles(
      [clean, dirty],
      (x) => x.name === "gone",
    );
    expect(out[0]).toBe(clean);
    expect(out[1]).not.toBe(dirty);
    expect(out[1].settings.myFilters?.map((x) => x.name)).toEqual(["stays"]);
    // The input profile object is not mutated.
    expect(dirty.settings.myFilters).toHaveLength(2);
  });

  it("leaves a legacy profile without a myFilters key alone", () => {
    const legacy = profile("old", {});
    const out = stripTombstonedFromProfiles([legacy], () => true);
    expect(out[0]).toBe(legacy);
    expect("myFilters" in out[0].settings).toBe(false);
  });
});

describe("reconcileRehydratedProfiles", () => {
  const args = (
    over: Partial<Parameters<typeof reconcileRehydratedProfiles>[0]>,
  ) => ({
    profiles: [] as Profile[],
    currentProfileId: "p1",
    inMemory: {},
    isTombstoned: never,
    isRecentHydrateDrop: never,
    ...over,
  });

  it("returns no current profile when the id is unknown", () => {
    const out = reconcileRehydratedProfiles(
      args({ profiles: [profile("other", { myFilters: [] })] }),
    );
    expect(out.currentProfile).toBeUndefined();
    expect(out.profiles).toHaveLength(1);
  });

  it("at mount (empty in-memory list) the persisted filters win untouched", () => {
    const persisted = [f({ name: "a", id: "A" })];
    const profiles = [profile("p1", { myFilters: persisted })];
    const out = reconcileRehydratedProfiles(args({ profiles }));
    expect(out.currentProfile?.settings.myFilters).toBe(persisted);
    expect(out.profiles).toBe(profiles);
  });

  it("unions an in-memory add the writing window did not know about (the vanishing-filter bug)", () => {
    // Window B just added "new"; window A (stale) persisted its whole blob
    // without it. B's storage-event rehydrate must keep "new" AND write it
    // into the profile, so B's next persist carries it back to disk.
    const persisted = [f({ name: "a", id: "A" })];
    const profiles = [profile("p1", { myFilters: persisted })];
    const out = reconcileRehydratedProfiles(
      args({
        profiles,
        inMemory: {
          currentProfileId: "p1",
          myFilters: [f({ name: "a", id: "A" }), f({ name: "new", id: "N" })],
        },
      }),
    );
    const names = out.currentProfile?.settings.myFilters?.map((x) => x.name);
    expect(names).toEqual(["a", "new"]);
    // Written back into the profiles array without mutating the input.
    expect(out.profiles[0].settings.myFilters?.map((x) => x.name)).toEqual([
      "a",
      "new",
    ]);
    expect(profiles[0].settings.myFilters).toBe(persisted);
  });

  it("does NOT union across a profile switch made by another window", () => {
    const profiles = [
      profile("p1", { myFilters: [f({ name: "p1-only", id: "P" })] }),
      profile("p2", { myFilters: [f({ name: "p2-only", id: "Q" })] }),
    ];
    const out = reconcileRehydratedProfiles(
      args({
        profiles,
        currentProfileId: "p2",
        inMemory: {
          currentProfileId: "p1",
          myFilters: [
            f({ name: "p1-only", id: "P" }),
            f({ name: "leak", id: "L" }),
          ],
        },
      }),
    );
    expect(out.currentProfile?.id).toBe("p2");
    expect(out.currentProfile?.settings.myFilters?.map((x) => x.name)).toEqual([
      "p2-only",
    ]);
  });

  it("drops a filter another window just recorded as deleted-elsewhere instead of unioning it back", () => {
    const profiles = [
      profile("p1", { myFilters: [f({ name: "a", id: "A" })] }),
    ];
    const out = reconcileRehydratedProfiles(
      args({
        profiles,
        inMemory: {
          currentProfileId: "p1",
          myFilters: [
            f({ name: "a", id: "A" }),
            f({ name: "remote-deleted", id: "R" }),
          ],
        },
        isRecentHydrateDrop: (id) => id === "R",
      }),
    );
    expect(out.currentProfile?.settings.myFilters?.map((x) => x.name)).toEqual([
      "a",
    ]);
  });

  it("strips tombstoned filters from the persisted blob before anything else", () => {
    const profiles = [
      profile("p1", {
        myFilters: [
          f({ name: "deleted-here", id: "D" }),
          f({ name: "a", id: "A" }),
        ],
      }),
    ];
    const out = reconcileRehydratedProfiles(
      args({ profiles, isTombstoned: (x) => x.id === "D" }),
    );
    expect(out.currentProfile?.settings.myFilters?.map((x) => x.name)).toEqual([
      "a",
    ]);
  });

  it("heals a same-name twin pair (server id + stale id-less copy) into one", () => {
    const profiles = [
      profile("p1", {
        myFilters: [
          f({ name: "twin", id: "T", nodes: [] }),
          f({ name: "twin", nodes: [] }),
        ],
      }),
    ];
    const out = reconcileRehydratedProfiles(args({ profiles }));
    expect(out.currentProfile?.settings.myFilters).toHaveLength(1);
    expect(out.currentProfile?.settings.myFilters?.[0].id).toBe("T");
  });

  it("keeps a legacy profile without a myFilters key key-less", () => {
    const profiles = [profile("p1", { liveMode: "static" })];
    const out = reconcileRehydratedProfiles(args({ profiles }));
    expect(out.currentProfile).toBe(profiles[0]);
    expect("myFilters" in out.currentProfile!.settings).toBe(false);
  });
});
