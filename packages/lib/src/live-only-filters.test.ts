import { getHiddenLiveOnlyFilters } from "./settings";

describe("getHiddenLiveOnlyFilters (#903)", () => {
  const values = [
    { id: "amber_bug", no_map_markers: true },
    { id: "amber_fishing", no_map_markers: true },
    { id: "copper" },
  ];
  const active = ["amber_bug", "copper"];

  it("flags ticked live-only filters in global Predicted mode", () => {
    expect([
      ...getHiddenLiveOnlyFilters(values, active, "static", {}, false),
    ]).toEqual(["amber_bug"]);
  });

  it("flags nothing in Live mode", () => {
    expect(
      getHiddenLiveOnlyFilters(values, active, "live", {}, false).size,
    ).toBe(0);
  });

  it("flags a per-filter Predicted override while global is Live", () => {
    expect([
      ...getHiddenLiveOnlyFilters(
        values,
        active,
        "live",
        { amber_bug: "static", copper: "static" },
        false,
      ),
    ]).toEqual(["amber_bug"]);
  });
});
