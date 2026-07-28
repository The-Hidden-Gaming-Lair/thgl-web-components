/**
 * Evict the edge-cached status surfaces the moment the state changes —
 * admin flag/incident mutations and runner-detected transitions. The
 * 60s CDN cache stays (it absorbs the banner polling fleet); purging
 * on change is what makes the page effectively live for everyone, not
 * just the admin's cache-busted reload.
 *
 * Wildcards also evict query-string variants (?updated=… reloads).
 */
const PURGE_URLS = [
  "https://www.th.gl/status*",
  "https://www.th.gl/api/status*",
  "https://status.th.gl/api/status*",
];

export async function purgeStatusCache(): Promise<void> {
  const key = process.env.BUNNY_ACCOUNT_API_KEY;
  if (!key) return; // dev — nothing to purge
  await Promise.all(
    PURGE_URLS.map(async (url) => {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 3000);
      try {
        await fetch(
          `https://api.bunny.net/purge?url=${encodeURIComponent(url)}&async=true`,
          { method: "POST", headers: { AccessKey: key }, signal: ctrl.signal },
        );
      } catch (err) {
        // Purge failure only means up-to-60s staleness — never fail the caller.
        console.error(`[status] cache purge failed for ${url}:`, err);
      } finally {
        clearTimeout(timeout);
      }
    }),
  );
}
