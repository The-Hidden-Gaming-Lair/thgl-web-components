import type { DrawingsAndNodes, PrivateNode } from "./settings";

/**
 * Parse a "My Filters" JSON file into a filter ready for `addMyFilter`.
 *
 * Three input shapes are accepted, and telling them apart is the whole job:
 *
 *  1. **A modern filter export** — the object the app itself writes today:
 *     `{ name, nodes, drawing?, … }`, plus, once the filter has been synced,
 *     the server fields `id` / `shareCode` / `visibility` / `synced`.
 *  2. **A legacy bare drawing** — `{ id, positions | polylines, … }` from
 *     before drawings lived inside a filter.
 *  3. **A legacy bare node array** — `[{ id, filter, … }, …]`.
 *
 * The bug this closes: shape 1 was detected only *after* shape 2, whose test
 * was `data.id && !data.filter`. That test predates server ids — back then a
 * filter export had no `id`, so only a drawing matched. Once filters gained a
 * server `id`, EVERY exported synced filter started matching the legacy-drawing
 * test first and was wrapped whole into `drawing`, silently discarding all of
 * its nodes. The user saw an import that "worked" and a map with nothing on it.
 * (Reproduced with a real 4-node Dune Awakening export.) A modern filter is now
 * recognised by its own fields — `nodes` or `drawing` — before any legacy test
 * runs.
 *
 * Server identity is stripped, mirroring the share-code import: an imported
 * file becomes a FRESH local copy. Keeping the original `id` would point the
 * importer's next upload at the original owner's server row.
 *
 * @param data    parsed JSON
 * @param mapName map to attach to converted legacy drawing polylines
 * @param now     timestamp for the generated unique name (injectable for tests)
 * @throws if the shape matches none of the three
 */
export function parseImportedFilter(
  data: unknown,
  mapName = "",
  now: number = Date.now(),
): DrawingsAndNodes {
  if (Array.isArray(data)) {
    // Shape 3: a bare node array. `filter` was the old per-node owner field;
    // the filter name now lives on the parent, so drop it from each node.
    const first = data[0] as { id?: string; filter?: string } | undefined;
    if (!first?.id) throw new Error("Invalid filter");
    const group = first.filter ?? "Unsorted";
    const nodes = (data as PrivateNode[]).map((node) => {
      const copy = { ...node } as PrivateNode & { filter?: string };
      delete copy.filter;
      return copy;
    });
    return { name: uniqueName(stripPrefixes(group), now), nodes };
  }

  if (!data || typeof data !== "object") throw new Error("Invalid filter");
  const obj = data as Record<string, unknown>;

  // Shape 1 FIRST — a modern export is identified by its own fields, never by
  // the absence of a legacy one. This ordering is the fix.
  const isModernFilter =
    Array.isArray(obj.nodes) ||
    (!!obj.drawing && typeof obj.drawing === "object");
  if (isModernFilter) {
    if (typeof obj.name !== "string") throw new Error("Invalid filter");
    const filter = { ...obj } as DrawingsAndNodes & {
      voteCount?: number;
      commentCount?: number;
    };
    filter.name = uniqueName(stripPrefixes(filter.name), now);
    // Fresh local copy — never inherit the source's server identity.
    delete filter.id;
    delete filter.shareCode;
    delete filter.visibility;
    delete filter.voteCount;
    delete filter.commentCount;
    delete filter.synced;
    return filter;
  }

  // Shape 2: a legacy bare drawing.
  if (obj.id && !obj.filter) {
    const drawing = { ...obj } as Record<string, unknown>;
    if (Array.isArray(drawing.positions)) {
      drawing.polylines = (drawing.positions as { position: unknown }[][]).map(
        (line) => ({
          positions: line.map((point) => point.position),
          size: 4,
          color: "#FFFFFFAA",
          mapName,
        }),
      );
      delete drawing.positions;
    }
    delete drawing.types;
    const name = uniqueName(
      typeof drawing.name === "string"
        ? stripPrefixes(drawing.name)
        : "Drawing",
      now,
    );
    delete drawing.name;
    return { name, drawing: drawing as DrawingsAndNodes["drawing"] };
  }

  throw new Error("Invalid filter");
}

/**
 * Heal a filter that a PREVIOUS (broken) file import wrapped into a drawing.
 *
 * Nothing was lost when that happened: the old code assigned the whole parsed
 * object — nodes and all — to `drawing`, so the botched filter still carries
 * its markers, just in a field the map never renders as markers. Rather than
 * telling everyone who already imported a file to delete it and re-import, we
 * unwrap it in place on rehydrate.
 *
 * The discriminator is exact: a real {@link Drawing} has no `nodes` field, so
 * `drawing.nodes` being an array can only mean a whole filter was stuffed in
 * there. A genuine drawing (polylines, rectangles, texts…) is never touched.
 *
 * Only unwraps when the outer filter has no nodes of its own, so a filter that
 * legitimately holds both can't be disturbed. Server identity found inside the
 * wrapper is deliberately NOT restored — the copy stays a local one, exactly
 * as {@link parseImportedFilter} would have made it.
 *
 * Returns the same reference when there is nothing to repair.
 */
export function repairMisimportedFilter(
  filter: DrawingsAndNodes,
): DrawingsAndNodes {
  const drawing = filter.drawing as unknown as
    | (Record<string, unknown> & { nodes?: unknown })
    | undefined;
  if (!drawing || typeof drawing !== "object") return filter;
  if (!Array.isArray(drawing.nodes)) return filter;
  if (filter.nodes?.length) return filter;

  const repaired: DrawingsAndNodes = {
    ...filter,
    nodes: drawing.nodes as PrivateNode[],
  };
  // The wrapped filter may itself have carried a real drawing; keep it.
  const inner = drawing.drawing;
  if (inner && typeof inner === "object") {
    repaired.drawing = inner as DrawingsAndNodes["drawing"];
  } else {
    delete repaired.drawing;
  }
  return repaired;
}

/** {@link repairMisimportedFilter} across a list; same ref when unchanged. */
export function repairMisimportedFilters(
  filters: DrawingsAndNodes[],
): DrawingsAndNodes[] {
  let changed = false;
  const out = filters.map((f) => {
    const repaired = repairMisimportedFilter(f);
    if (repaired !== f) changed = true;
    return repaired;
  });
  return changed ? out : filters;
}

/** Names are `my_<timestamp>_<label>`; re-stamp so an import can't collide. */
function uniqueName(label: string, now: number): string {
  return `my_${now}_${label}`;
}

function stripPrefixes(name: string): string {
  return name
    .replace(/my_\d+_/, "")
    .replace("private_", "")
    .replace(/shared_\d+_/, "");
}
