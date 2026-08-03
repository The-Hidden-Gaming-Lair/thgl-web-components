/**
 * Registry of third-party map sites we can import discovered-marker progress
 * from. The heavy lifting (parsing + translating a site's marker IDs to our
 * node IDs) happens server-side in data-forge (container/src/import-route.ts);
 * this registry only holds what the client needs: which games a source covers,
 * and the desktop export instructions/snippet shown in the import dialog.
 *
 * Adding a source: add an entry here AND a matching parser + generated mapping
 * in data-forge's import-route. Keyed by the same `id` and `game`.
 */
export type ImportSource = {
  /** Stable id; must match the `source` key in data-forge's import-route. */
  id: string;
  /** Display name shown in the dialog. */
  name: string;
  /** Our game ids this source can import into (match `activeApp`). */
  games: string[];
  /** The site users export from. */
  siteUrl: string;
  /** Short human steps for the export (rendered as an ordered list). */
  steps: string[];
  /**
   * Desktop-only console snippet the user pastes into the source site's
   * DevTools console. It must copy the user's found-marker data to the
   * clipboard in a shape data-forge's parser accepts (here: a JSON array of
   * marker id strings).
   */
  snippet: string;
};

// appsample stores a signed-in user's found markers in Firestore
// (project hotgames-gg, ww-users/{uid}.markerIds). The snippet reads the
// Firebase auth token from the site's IndexedDB, fetches that doc, and DOWNLOADS
// the id array as a file. Desktop only — mobile browsers have no console.
//
// Why a download and not the clipboard: navigator.clipboard.writeText throws
// "Document is not focused" from the DevTools console, and the console's copy()
// helper is only in scope for the SYNCHRONOUS top-level eval — after the
// `await fetch(...)` it's gone. A blob download is focus- and async-independent
// and handles any size. We also console.log the array as a manual fallback.
const APPSAMPLE_SNIPPET = `(async () => {
  try {
    const db = await new Promise((res, rej) => { const o = indexedDB.open('firebaseLocalStorageDb'); o.onsuccess = () => res(o.result); o.onerror = () => rej(o.error); });
    const rows = await new Promise((res, rej) => { const t = db.transaction('firebaseLocalStorage').objectStore('firebaseLocalStorage').getAll(); t.onsuccess = () => res(t.result); t.onerror = () => rej(t.error); });
    const e = rows.find(x => x.value && x.value.stsTokenManager && x.value.stsTokenManager.accessToken);
    if (!e) { alert('Not signed in. Sign in to the map with Google first, then run this again.'); return; }
    const r = await fetch('https://firestore.googleapis.com/v1/projects/hotgames-gg/databases/(default)/documents/ww-users/' + e.value.uid, { headers: { Authorization: 'Bearer ' + e.value.stsTokenManager.accessToken } });
    const doc = await r.json();
    const ids = ((doc.fields && doc.fields.markerIds && doc.fields.markerIds.arrayValue.values) || []).map(v => v.stringValue);
    const payload = JSON.stringify(ids);
    console.log('%cTH.GL export (' + ids.length + ' markers) — you can also copy the array below and paste it into TH.GL:', 'font-weight:bold');
    console.log(payload);
    try {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
      a.download = 'thgl-map-progress.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      alert('Found ' + ids.length + ' markers and downloaded them as thgl-map-progress.json. Upload that file in the TH.GL import box (or copy the array from the Console and paste it).');
    } catch (dlErr) {
      alert('Found ' + ids.length + ' markers. Download was blocked, so copy the long [ ... ] line printed in the Console and paste it into TH.GL.');
    }
  } catch (err) { alert('Export failed: ' + err.message); }
})();`;

export const IMPORT_SOURCES: ImportSource[] = [
  {
    id: "appsample",
    name: "appsample (Wuthering Waves Map)",
    games: ["wuthering-waves"],
    siteUrl: "https://wuthering-waves-map.appsample.com",
    steps: [
      "Open the appsample map on a computer and sign in with the same Google account you use there.",
      "Press F12 to open DevTools, then click the Console tab.",
      "Paste the snippet below and press Enter. (If the browser blocks the paste, type “allow pasting” first, then paste again.)",
      "It downloads a thgl-map-progress.json file — upload it below (or copy the array it prints in the Console and paste it).",
    ],
    snippet: APPSAMPLE_SNIPPET,
  },
];

export function importSourcesForGame(game: string): ImportSource[] {
  return IMPORT_SOURCES.filter((s) => s.games.includes(game));
}
