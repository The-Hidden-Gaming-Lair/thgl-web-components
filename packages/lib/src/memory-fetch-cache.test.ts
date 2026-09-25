import {
  DATA_FORGE_CDN_URL,
  fetchDict,
  fetchJsonWithMemoryCache,
} from "./config";

type Reply = { status?: number; body?: unknown; fail?: boolean };

const calls: string[] = [];
let replies: Record<string, Reply[]> = {};

function reply(url: string, ...queue: Reply[]) {
  replies[url] = queue;
}

beforeEach(() => {
  calls.length = 0;
  replies = {};
  jest.useFakeTimers({ now: 1_000_000 });
  globalThis.fetch = jest.fn(async (input: RequestInfo | URL) => {
    const url = input.toString();
    calls.push(url);
    const next = replies[url]?.shift() ?? { status: 404 };
    if (next.fail) throw new TypeError("fetch failed");
    return new Response(JSON.stringify(next.body ?? null), {
      status: next.status ?? 200,
    });
  }) as typeof fetch;
});

afterEach(() => {
  jest.useRealTimers();
});

const flush = async () => {
  for (let i = 0; i < 5; i++) await Promise.resolve();
  await new Promise((resolve) =>
    jest.requireActual("timers").setImmediate(resolve),
  );
};

describe("fetchJsonWithMemoryCache", () => {
  it("serves stale data immediately and refreshes in the background", async () => {
    const url = "https://cdn.example/swr.json";
    reply(url, { body: { v: 1 } }, { body: { v: 2 } });

    expect(await fetchJsonWithMemoryCache(url)).toEqual({ v: 1 });
    jest.advanceTimersByTime(61_000);

    // Expired: returns the old value without waiting, refresh runs behind it.
    expect(await fetchJsonWithMemoryCache(url)).toEqual({ v: 1 });
    await flush();
    expect(await fetchJsonWithMemoryCache(url)).toEqual({ v: 2 });
    expect(calls).toEqual([url, url]);
  });

  it("keeps serving the stale copy when the refresh fails", async () => {
    const url = "https://cdn.example/refresh-fails.json";
    reply(url, { body: { v: 1 } }, { fail: true }, { fail: true });
    jest.spyOn(console, "warn").mockImplementation(() => {});

    await fetchJsonWithMemoryCache(url);
    jest.advanceTimersByTime(61_000);
    expect(await fetchJsonWithMemoryCache(url)).toEqual({ v: 1 });
    await flush();
    expect(await fetchJsonWithMemoryCache(url)).toEqual({ v: 1 });
    // Failed refresh backs off for a TTL instead of retrying every call.
    expect(calls).toEqual([url, url, url]);
  });

  it("retries a thrown fetch once", async () => {
    const url = "https://cdn.example/retry.json";
    reply(url, { fail: true }, { body: { ok: true } });
    expect(await fetchJsonWithMemoryCache(url)).toEqual({ ok: true });
    expect(calls).toEqual([url, url]);
  });

  it("never refreshes immutable entries", async () => {
    const url = "https://cdn.example/pinned.json?v=abc";
    reply(url, { body: { v: 1 } });
    await fetchJsonWithMemoryCache(url, { immutable: true });
    jest.advanceTimersByTime(24 * 60 * 60 * 1000);
    expect(await fetchJsonWithMemoryCache(url, { immutable: true })).toEqual({
      v: 1,
    });
    await flush();
    expect(calls).toEqual([url]);
  });
});

describe("content-hash pinning", () => {
  it("fetches dicts pinned to version.json's contentHash", async () => {
    const base = `${DATA_FORGE_CDN_URL}/pin-game`;
    reply(`${base}/version.json`, {
      body: { more: { nodes: {}, icons: "", contentHash: "h1" } },
    });
    reply(`${base}/dicts/en.json?v=h1`, { body: { a: "A" } });

    expect(await fetchDict("pin-game", "en")).toEqual({ a: "A" });
    expect(calls).toContain(`${base}/dicts/en.json?v=h1`);
  });

  it("falls back to the plain URL when version.json has no contentHash", async () => {
    const base = `${DATA_FORGE_CDN_URL}/legacy-game`;
    reply(`${base}/version.json`, { body: { more: { nodes: {}, icons: "" } } });
    reply(`${base}/dicts/en.json`, { body: { b: "B" } });

    expect(await fetchDict("legacy-game", "en")).toEqual({ b: "B" });
  });
});
