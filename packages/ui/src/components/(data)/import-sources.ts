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
   * DevTools console. It must hand the user their found-marker data in a shape
   * that source's parser in data-forge accepts (appsample: a JSON array of
   * marker ids; wuthering.gg: its `marked-locations` object).
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

// wuthering.gg stores found markers in localStorage under `marked-locations`
// (an object keyed by their marker type, each holding the coordinate keys of the
// markers you hid). Signing in there syncs that same object, so reading
// localStorage covers guests and accounts alike — no token needed. Downloads a
// file for the same reasons as above, and logs the JSON as a manual fallback.
const WUTHERINGGG_SNIPPET = `(() => {
  try {
    const payload = localStorage.getItem('marked-locations');
    const marks = payload ? JSON.parse(payload) : {};
    const count = Object.values(marks).reduce((n, v) => n + ((v && v.Locations) || []).length, 0);
    if (!count) { alert('No found markers in this browser. Open the map, mark something as found, then run this again (and use the same browser you tracked in).'); return; }
    console.log('%cTH.GL export (' + count + ' markers) — you can also copy the JSON below and paste it into TH.GL:', 'font-weight:bold');
    console.log(payload);
    try {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
      a.download = 'thgl-map-progress.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      alert('Found ' + count + ' markers and downloaded them as thgl-map-progress.json. Upload that file in the TH.GL import box (or copy the JSON from the Console and paste it).');
    } catch (dlErr) {
      alert('Found ' + count + ' markers. Download was blocked, so copy the long { ... } line printed in the Console and paste it into TH.GL.');
    }
  } catch (err) { alert('Export failed: ' + err.message); }
})();`;

// The 光环助手 (ghzs666.com) map comes in two front ends over the same point
// database and marks API: the international www.ghzs666.com/wutheringwaves-map
// (Google sign-in, localStorage prefix `wuthering-`, token cookie `wm_token`)
// and the Chinese static-web.ghzs.com/cspage_pro/mingchao-map.html (prefix
// `mc-`, cookie `pw_token`). Marked points sit in `<prefix>leafsIds…` keys
// (guest, archive link and signed-in user each get one), each a JSON array of
// point ids. Marking needs an account, so the snippet also reads the cloud
// marks the way the site does: GET /marks with the token cookie as Token header
// ({ mark_id, marks }), or the archive link's /marks/<prefix>marksId (an id
// array). It unions everything. Downloads a file for the same reasons as above.
const GHZS_SNIPPET = `(async () => {
  try {
    const ids = new Set();
    const add = (list) => (Array.isArray(list) ? list : []).forEach(id => ids.add(String(id)));
    const prefixes = ['wuthering-', 'mc-'];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !prefixes.some(p => k.indexOf(p + 'leafsIds') === 0)) continue;
      try { add(JSON.parse(localStorage.getItem(k))); } catch (e) {}
    }
    const api = 'https://api-wiki-game.ghzs.com/v1d0/web/kurogame-mc/map/marks';
    const cookie = (name) => (document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)')) || [])[1];
    const token = cookie('wm_token') || cookie('pw_token');
    const markId = localStorage.getItem('wuthering-marksId') || localStorage.getItem('mc-marksId');
    try {
      if (token) { const r = await fetch(api, { headers: { Token: decodeURIComponent(token) } }); if (r.ok) add(((await r.json()) || {}).marks); }
      else if (markId) { const r = await fetch(api + '/' + markId); if (r.ok) add(await r.json()); }
    } catch (e) { console.warn('Could not read the cloud marks, using the ones in this browser', e); }
    if (!ids.size) { alert('No marked points found. Open www.ghzs666.com/wutheringwaves-map, sign in with the account you marked with, wait for the map to load, then run this again.'); return; }
    const payload = JSON.stringify([...ids]);
    console.log('%cTH.GL export (' + ids.size + ' markers) — you can also copy the array below and paste it into TH.GL:', 'font-weight:bold');
    console.log(payload);
    try {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
      a.download = 'thgl-map-progress.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      alert('Found ' + ids.size + ' markers and downloaded them as thgl-map-progress.json. Upload that file in the TH.GL import box (or copy the array from the Console and paste it).');
    } catch (dlErr) {
      alert('Found ' + ids.size + ' markers. Download was blocked, so copy the long [ ... ] line printed in the Console and paste it into TH.GL.');
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
  {
    id: "wutheringgg",
    name: "wuthering.gg (Interactive Map)",
    games: ["wuthering-waves"],
    siteUrl: "https://wuthering.gg/map",
    steps: [
      "Open wuthering.gg/map on a computer, in the browser you tracked your markers in. (If you have an account there, sign in first and any browser works.)",
      "Press F12 to open DevTools, then click the Console tab.",
      "Paste the snippet below and press Enter. (If the browser blocks the paste, type “allow pasting” first, then paste again.)",
      "It downloads a thgl-map-progress.json file — upload it below (or copy the JSON it prints in the Console and paste it).",
    ],
    snippet: WUTHERINGGG_SNIPPET,
  },
  {
    id: "ghzs",
    name: "光环助手 / ghzs666.com (鸣潮互动地图)",
    games: ["wuthering-waves"],
    siteUrl: "https://www.ghzs666.com/wutheringwaves-map",
    steps: [
      "Open the ghzs666.com Wuthering Waves map on a computer (www.ghzs666.com/wutheringwaves-map, or the Chinese static-web.ghzs.com/cspage_pro/mingchao-map.html if you marked there), sign in with the account you marked your points with, and wait for the map to load.",
      "Press F12 to open DevTools, then click the Console tab.",
      "Paste the snippet below and press Enter. (If the browser blocks the paste, type “allow pasting” first, then paste again.)",
      "It downloads a thgl-map-progress.json file — upload it below (or copy the array it prints in the Console and paste it).",
    ],
    snippet: GHZS_SNIPPET,
  },
];

export function importSourcesForGame(game: string): ImportSource[] {
  return IMPORT_SOURCES.filter((s) => s.games.includes(game));
}
