import {
  addCraftList,
  craftListsStorageKey,
  craftListTargets,
  craftQueryParam,
  emptyCraftListsState,
  MAX_CRAFT_LISTS,
  mergeCraftTargets,
  nextCraftListName,
  parseCraftListsState,
  removeCraftList,
  renameCraftList,
  saveCraftListQuery,
  serializeCraftListsState,
} from "./crafting-lists";

describe("crafting lists", () => {
  it("keys storage per game", () => {
    expect(craftListsStorageKey("palia")).toBe("thgl-crafting-lists:palia");
  });

  it("round-trips and tolerates garbage", () => {
    const s = addCraftList(
      emptyCraftListsState(),
      "  Cakes  ",
      "items=a:2",
      5,
    )!;
    expect(s.lists[0]).toMatchObject({ name: "Cakes", query: "items=a:2" });
    expect(s.active).toBe(s.lists[0].id);
    expect(parseCraftListsState(serializeCraftListsState(s))).toEqual(s);
    expect(parseCraftListsState(null)).toEqual(emptyCraftListsState());
    expect(parseCraftListsState("{nope")).toEqual(emptyCraftListsState());
    expect(
      parseCraftListsState(
        JSON.stringify({
          lists: [
            { id: "x", name: "A", query: "items=a:1" },
            { id: "x", name: "dup", query: "" },
            { id: "y", name: "  ", query: "" },
            { id: "z", name: "B" },
            null,
          ],
          active: "gone",
        }),
      ),
    ).toEqual({
      lists: [{ id: "x", name: "A", query: "items=a:1", updatedAt: 0 }],
      active: null,
    });
  });

  it("adds, saves, renames and removes", () => {
    let s = addCraftList(emptyCraftListsState(), "One", "items=a:1", 1)!;
    const id = s.active!;
    expect(addCraftList(s, "   ", "", 2)).toBeNull();
    const same = saveCraftListQuery(s, id, "items=a:1", 3);
    expect(same).toBe(s);
    s = saveCraftListQuery(s, id, "items=a:4", 3);
    expect(s.lists[0]).toMatchObject({ query: "items=a:4", updatedAt: 3 });
    s = renameCraftList(s, id, "Renamed");
    expect(s.lists[0].name).toBe("Renamed");
    expect(renameCraftList(s, id, " ")).toBe(s);
    s = addCraftList(s, "Two", "", 4)!;
    expect(s.active).not.toBe(id);
    s = removeCraftList(s, s.active!);
    expect(s).toMatchObject({ active: null, lists: [{ id }] });
  });

  it("caps the number of lists", () => {
    let s = emptyCraftListsState();
    for (let i = 0; i < MAX_CRAFT_LISTS; i++)
      s = addCraftList(s, `L${i}`, "", i)!;
    expect(s.lists).toHaveLength(MAX_CRAFT_LISTS);
    expect(addCraftList(s, "more", "", 0)).toBeNull();
  });

  it("picks the next free default name", () => {
    const s = addCraftList(emptyCraftListsState(), "List 2", "", 0)!;
    expect(nextCraftListName(s.lists, (n) => `List ${n}`)).toBe("List 3");
    expect(nextCraftListName([], (n) => `List ${n}`)).toBe("List 1");
  });

  it("reads targets and merges them", () => {
    expect(craftQueryParam("?items=a:1&r=b:c", "r")).toBe("b:c");
    expect(craftQueryParam("items=a:1", "buy")).toBeNull();
    const s = addCraftList(
      emptyCraftListsState(),
      "X",
      "items=Cake%20A:10,b:2&buy=c",
      0,
    )!;
    expect(craftListTargets(s.lists[0])).toEqual([
      { id: "Cake A", qty: 10 },
      { id: "b", qty: 2 },
    ]);
    expect(
      mergeCraftTargets(
        [{ id: "b", qty: 1 }],
        [
          { id: "Cake A", qty: 10 },
          { id: "b", qty: 2 },
        ],
      ),
    ).toEqual([
      { id: "b", qty: 3 },
      { id: "Cake A", qty: 10 },
    ]);
  });
});
