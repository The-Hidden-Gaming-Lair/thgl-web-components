import { TileRetryPolicy } from "./tile-retry";

function policy(
  opts: { baseMs?: number; maxMs?: number; maxAttempts?: number } = {},
) {
  let t = 0;
  const p = new TileRetryPolicy({ ...opts, now: () => t });
  return { p, advance: (ms: number) => void (t += ms) };
}

describe("TileRetryPolicy", () => {
  it("allows the first request and retries after the base delay", () => {
    const { p, advance } = policy({ baseMs: 1000 });
    expect(p.canRequest("4/3/2")).toBe(true);
    expect(p.recordFailure("4/3/2")).toBe(1000);
    expect(p.canRequest("4/3/2")).toBe(false);
    advance(999);
    expect(p.canRequest("4/3/2")).toBe(false);
    advance(1);
    expect(p.canRequest("4/3/2")).toBe(true);
  });

  it("backs off exponentially and caps the delay", () => {
    const { p } = policy({ baseMs: 1000, maxMs: 5000, maxAttempts: 10 });
    expect(p.recordFailure("k")).toBe(1000);
    expect(p.recordFailure("k")).toBe(2000);
    expect(p.recordFailure("k")).toBe(4000);
    expect(p.recordFailure("k")).toBe(5000);
    expect(p.recordFailure("k")).toBe(5000);
  });

  it("gives up after maxAttempts until cleared", () => {
    const { p, advance } = policy({ baseMs: 10, maxAttempts: 3 });
    expect(p.recordFailure("k")).toBe(10);
    expect(p.recordFailure("k")).toBe(20);
    expect(p.recordFailure("k")).toBeNull();
    advance(1_000_000);
    expect(p.canRequest("k")).toBe(false);
    expect(p.nextRetryAt()).toBeNull();
    p.clear();
    expect(p.canRequest("k")).toBe(true);
  });

  it("a success resets the tile's history", () => {
    const { p } = policy({ baseMs: 1000 });
    p.recordFailure("k");
    p.recordFailure("k");
    p.recordSuccess("k");
    expect(p.canRequest("k")).toBe(true);
    expect(p.recordFailure("k")).toBe(1000);
  });

  it("tracks tiles independently and reports the earliest pending retry", () => {
    const { p, advance } = policy({ baseMs: 1000 });
    p.recordFailure("a");
    advance(500);
    p.recordFailure("b");
    expect(p.nextRetryAt()).toBe(1000);
    advance(500);
    expect(p.canRequest("a")).toBe(true);
    expect(p.canRequest("b")).toBe(false);
    expect(p.size).toBe(2);
  });
});
