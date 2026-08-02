import { type DatabaseConfig, fetchDatabaseType } from "@repo/lib";
import type { EntitySection } from "./sections-renderer";

/**
 * Flatten a DB item's `props` into one searchable effect-text string: top-level
 * string values (a skill's "Level 1" → "+3 View Radius", an artifact's
 * "Effect" → "+10 View Radius") plus `_sections` row values and list items
 * (where e.g. spells keep their per-tier effects). Links and chips are
 * cross-references and cost pills, not effect text — including them would make
 * every "Order" search match every Order-cost spell.
 */
export function flattenPropsText(
  props: Record<string, unknown> | undefined,
): string {
  if (!props) return "";
  const parts: string[] = [];
  for (const [key, value] of Object.entries(props)) {
    if (key === "_sections" && Array.isArray(value)) {
      for (const sec of value as EntitySection[]) {
        if (sec.kind === "rows") {
          for (const row of sec.rows ?? []) {
            if (typeof row.value === "string") parts.push(row.value);
          }
        } else if (sec.kind === "list") {
          for (const item of sec.items ?? []) {
            if (typeof item === "string") parts.push(item);
          }
        }
      }
      continue;
    }
    if (key.startsWith("_")) continue;
    if (typeof value === "string") parts.push(value);
    else if (Array.isArray(value)) {
      for (const v of value) if (typeof v === "string") parts.push(v);
    }
  }
  return parts.join(" · ");
}

/**
 * The slim `database.index.json` strips `props` (bar opt-in lite props), so
 * effect text must come from the per-type `database.<type>.json` file.
 * Monolith-database games have no per-type files but already carry full props
 * on the index items — the fetch fails and we fall back to the category as-is.
 */
export async function fetchFullPropsCategory(
  appName: string,
  category: DatabaseConfig[number],
): Promise<DatabaseConfig[number]> {
  try {
    const full = await fetchDatabaseType(appName, category.type);
    if (Array.isArray(full?.items)) return full;
  } catch {
    // No split per-type file for this game — use the index category.
  }
  return category;
}
