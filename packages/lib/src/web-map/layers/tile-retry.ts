/**
 * Retry bookkeeping for map tiles whose image failed to load.
 *
 * An `<img>` error carries no status, so the layer cannot tell a transient
 * network hiccup (CDN edge stalled, app started before the network was up,
 * a request aborted mid-flight) from a genuinely missing tile. Treating the
 * first error as permanent left that tile black until the native zoom level
 * changed, which is exactly how a map ends up "half loaded and never
 * recovering". `navigator.onLine` is not a usable signal for this: it stays
 * true in most of those cases.
 *
 * Every failure is therefore retried with exponential backoff, capped per tile
 * so a tile that really does not exist stops being polled after a while.
 */
export interface TileRetryOptions {
  /** First retry delay in ms (doubles every attempt). */
  baseMs?: number;
  /** Upper bound for the delay in ms. */
  maxMs?: number;
  /** After this many failures the tile is left alone until `clear()`. */
  maxAttempts?: number;
  /** Clock, injectable for tests. */
  now?: () => number;
}

interface FailureState {
  attempts: number;
  /** Timestamp (ms, `now()` domain) from which the tile may be requested again. */
  retryAt: number;
}

export class TileRetryPolicy {
  private readonly baseMs: number;
  private readonly maxMs: number;
  private readonly maxAttempts: number;
  private readonly now: () => number;
  private failures = new Map<string, FailureState>();

  constructor(opts: TileRetryOptions = {}) {
    this.baseMs = opts.baseMs ?? 2000;
    this.maxMs = opts.maxMs ?? 30_000;
    this.maxAttempts = opts.maxAttempts ?? 10;
    this.now = opts.now ?? (() => performance.now());
  }

  /** Whether `key` may be requested (again) right now. */
  canRequest(key: string): boolean {
    const f = this.failures.get(key);
    if (!f) return true;
    return this.now() >= f.retryAt;
  }

  /**
   * Record a failed load for `key`. Returns the delay in ms until the next
   * attempt, or `null` when the tile has exhausted its attempts.
   */
  recordFailure(key: string): number | null {
    const prev = this.failures.get(key);
    const attempts = (prev?.attempts ?? 0) + 1;
    if (attempts >= this.maxAttempts) {
      this.failures.set(key, { attempts, retryAt: Infinity });
      return null;
    }
    const delay = Math.min(this.maxMs, this.baseMs * 2 ** (attempts - 1));
    this.failures.set(key, { attempts, retryAt: this.now() + delay });
    return delay;
  }

  /** A successful load clears the tile's failure history. */
  recordSuccess(key: string): void {
    this.failures.delete(key);
  }

  /** Earliest pending retry time across all tiles, or `null` when none is pending. */
  nextRetryAt(): number | null {
    let min: number | null = null;
    for (const f of this.failures.values()) {
      if (!Number.isFinite(f.retryAt)) continue;
      if (min === null || f.retryAt < min) min = f.retryAt;
    }
    return min;
  }

  /** Forget every failure (e.g. on a native zoom change: fresh attempt at the new level). */
  clear(): void {
    this.failures.clear();
  }

  get size(): number {
    return this.failures.size;
  }
}
