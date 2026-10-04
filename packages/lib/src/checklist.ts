/**
 * Collection / completion checklist (`/checklist/<section>`): pure logic shared
 * by the server page and the client view. Progress lives per viewer in the
 * browser (one localStorage key per game) and can be exported as JSON or a
 * share code. Everything here is side-effect free so it runs (and is tested)
 * on both sides.
 */

/** Ticked entry ids per checklist section slug. */
export type ChecklistProgress = Record<string, string[]>;

export type ChecklistCount = { done: number; total: number; percent: number };

/** localStorage key holding every checklist section of one game. */
export function checklistStorageKey(game: string): string {
  return `thgl-checklist:${game}`;
}

function cleanIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const id of value) {
    if (typeof id !== "string" || !id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

function cleanProgress(value: unknown): ChecklistProgress {
  const out: ChecklistProgress = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return out;
  for (const [section, ids] of Object.entries(value)) {
    const clean = cleanIds(ids);
    if (clean.length) out[section] = clean;
  }
  return out;
}

/** Stored progress → object. Tolerates null, garbage and old shapes. */
export function parseChecklistProgress(
  raw: string | null | undefined,
): ChecklistProgress {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as { sections?: unknown } | null;
    return cleanProgress(parsed?.sections ?? parsed);
  } catch {
    return {};
  }
}

export function serializeChecklistProgress(
  progress: ChecklistProgress,
): string {
  return JSON.stringify({ v: 1, sections: cleanProgress(progress) });
}

/** Tick (or untick) several ids of one section. Returns a new object. */
export function setChecklistEntries(
  progress: ChecklistProgress,
  section: string,
  ids: string[],
  checked: boolean,
): ChecklistProgress {
  const current = new Set(progress[section] ?? []);
  for (const id of ids) {
    if (checked) current.add(id);
    else current.delete(id);
  }
  const next = { ...progress };
  if (current.size) next[section] = [...current];
  else delete next[section];
  return next;
}

/** Flip one id of one section. Returns a new object. */
export function toggleChecklistEntry(
  progress: ChecklistProgress,
  section: string,
  id: string,
): ChecklistProgress {
  const isChecked = (progress[section] ?? []).includes(id);
  return setChecklistEntries(progress, section, [id], !isChecked);
}

/**
 * Done / total over the CURRENT entry list: ticks of entries that no longer
 * exist (removed by a game patch) are kept in storage but never counted.
 */
export function countChecklist(
  entryIds: readonly string[],
  checked: ReadonlySet<string> | readonly string[],
): ChecklistCount {
  const set = checked instanceof Set ? checked : new Set(checked);
  let done = 0;
  for (const id of entryIds) if (set.has(id)) done++;
  const total = entryIds.length;
  const percent = total ? Math.floor((done / total) * 1000) / 10 : 0;
  return { done, total, percent };
}

/** Done / total per group id, in first-seen group order. */
export function countChecklistGroups(
  entries: readonly { id: string; groupId?: string }[],
  checked: ReadonlySet<string>,
): Map<string, { done: number; total: number }> {
  const out = new Map<string, { done: number; total: number }>();
  for (const e of entries) {
    const key = e.groupId ?? "";
    const g = out.get(key) ?? { done: 0, total: 0 };
    g.total++;
    if (checked.has(e.id)) g.done++;
    out.set(key, g);
  }
  return out;
}

export function normalizeChecklistQuery(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export type ChecklistFilter = {
  query?: string;
  /** Only entries of this group id (null/undefined = all). */
  group?: string | null;
  /** Only entries that are not ticked yet. */
  missingOnly?: boolean;
};

/** Search (name + optional text), group and missing-only filters. */
export function filterChecklistEntries<
  T extends { id: string; name: string; groupId?: string; text?: string },
>(
  entries: readonly T[],
  checked: ReadonlySet<string>,
  filter: ChecklistFilter,
): T[] {
  const q = normalizeChecklistQuery(filter.query ?? "");
  return entries.filter((e) => {
    if (filter.group != null && (e.groupId ?? "") !== filter.group) {
      return false;
    }
    if (filter.missingOnly && checked.has(e.id)) return false;
    if (!q) return true;
    if (normalizeChecklistQuery(e.name).includes(q)) return true;
    return e.text ? normalizeChecklistQuery(e.text).includes(q) : false;
  });
}

// --- Export / import ------------------------------------------------------

const EXPORT_KIND = "thgl-checklist";

/** Full-fidelity JSON export of every section of one game. */
export function exportChecklistJson(
  game: string,
  progress: ChecklistProgress,
): string {
  return JSON.stringify(
    {
      kind: EXPORT_KIND,
      v: 1,
      game,
      exportedAt: new Date().toISOString(),
      sections: cleanProgress(progress),
    },
    null,
    2,
  );
}

export class ChecklistImportError extends Error {
  constructor(
    public reason: "invalid" | "wrong-game",
    public game?: string,
  ) {
    super(reason);
  }
}

/** Parse an export file. Throws ChecklistImportError when unusable. */
export function parseChecklistJson(
  text: string,
  game: string,
): ChecklistProgress {
  let parsed: { kind?: unknown; game?: unknown; sections?: unknown };
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new ChecklistImportError("invalid");
  }
  if (!parsed || parsed.kind !== EXPORT_KIND || !parsed.sections) {
    throw new ChecklistImportError("invalid");
  }
  if (typeof parsed.game === "string" && parsed.game !== game) {
    throw new ChecklistImportError("wrong-game", parsed.game);
  }
  return cleanProgress(parsed.sections);
}

/** Union (merge) or overwrite (replace) per section present in `incoming`. */
export function mergeChecklistProgress(
  current: ChecklistProgress,
  incoming: ChecklistProgress,
  mode: "merge" | "replace",
): ChecklistProgress {
  const next: ChecklistProgress = { ...current };
  for (const [section, ids] of Object.entries(incoming)) {
    const merged =
      mode === "replace"
        ? cleanIds(ids)
        : cleanIds([...(current[section] ?? []), ...ids]);
    if (merged.length) next[section] = merged;
    else delete next[section];
  }
  return next;
}

// --- Share code -------------------------------------------------------------

const CODE_PREFIX = "CL1";

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string): string {
  const b64 = text.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

function commonPrefix(ids: string[]): string {
  if (ids.length < 2) return "";
  let prefix = ids[0];
  for (const id of ids) {
    while (prefix && !id.startsWith(prefix)) prefix = prefix.slice(0, -1);
    if (!prefix) break;
  }
  return prefix;
}

/**
 * Compact copy/paste code for one section: `CL1.<section>.<base64url>`. The
 * payload keeps ids (not positions), so a code stays valid after a game patch
 * adds or removes entries; the shared id prefix is stored once.
 */
export function encodeChecklistShareCode(
  section: string,
  ids: readonly string[],
): string {
  const sorted = cleanIds([...ids]).sort();
  const prefix = commonPrefix(sorted);
  const payload = JSON.stringify([
    prefix,
    sorted.map((id) => id.slice(prefix.length)),
  ]);
  return `${CODE_PREFIX}.${encodeURIComponent(section)}.${toBase64Url(payload)}`;
}

/** Share code → section + ids, or null when it is not a valid code. */
export function decodeChecklistShareCode(
  code: string,
): { section: string; ids: string[] } | null {
  const parts = code.trim().split(".");
  if (parts.length !== 3 || parts[0] !== CODE_PREFIX) return null;
  try {
    const section = decodeURIComponent(parts[1]);
    const parsed = JSON.parse(fromBase64Url(parts[2])) as unknown;
    if (!Array.isArray(parsed) || parsed.length !== 2) return null;
    const [prefix, rest] = parsed as [unknown, unknown];
    if (typeof prefix !== "string" || !Array.isArray(rest)) return null;
    const ids = cleanIds(
      rest
        .filter((s): s is string => typeof s === "string")
        .map((s) => prefix + s),
    );
    if (!section) return null;
    return { section, ids };
  } catch {
    return null;
  }
}
