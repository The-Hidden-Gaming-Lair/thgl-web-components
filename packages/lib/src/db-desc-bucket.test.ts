import { DB_DESC_BUCKETS, dbDescBucket } from "./config";

// data-forge (data-mining/src/lib/dicts.ts) writes `dicts/db/desc/<locale>/<bucket>.json`
// with the same hash; its dicts.test.ts pins the same two values. A mismatch would make
// every codex detail page lose its description.
describe("dbDescBucket", () => {
  test("matches data-forge's buckets", () => {
    expect(DB_DESC_BUCKETS).toBe(64);
    expect(dbDescBucket("cl_1024600128_desc")).toBe("11");
    expect(dbDescBucket("suit_30178_desc")).toBe("12");
  });
});
