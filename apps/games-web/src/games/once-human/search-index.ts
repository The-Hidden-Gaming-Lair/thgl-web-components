import { localizePath } from "@repo/lib";
import { fetchDatabase } from "@repo/lib";
import { onceHuman } from "@/configs/once-human";
import { buildGenericSearchIndex } from "@/lib/db/generic-search-index";
import { loadAllWikiItemsForOnceHuman } from "./data";

const APP_NAME = "once-human";

const WIKI_TYPE_KEY: Record<string, string> = {
  remnants: "remnants",
  "regional-records": "regional_records",
  "echoes-of-stardust": "echoes_of_stardust",
};

/**
 * Build the header-search index for Once Human. Combines:
 *   - wiki entries (remnants, regional-records, echoes-of-stardust) —
 *     section pulled from the URL stem;
 *   - weapons — flat category, badge type = "weapon".
 *
 * Once Human ships weapon icons as standalone PNGs (no sprite atlas),
 * so we leave iconsUrl empty — the client falls back to text-only rows
 * in the dropdown.
 */
export async function buildOnceHumanSearchIndex(locale: string) {
  const wiki = await loadAllWikiItemsForOnceHuman();
  const wikiEntries = wiki.map((entry) => {
    const sectionKey = entry.href.replace(/^\/db\//, "");
    return {
      id: entry.id,
      name: entry.title,
      type: WIKI_TYPE_KEY[sectionKey] ?? sectionKey,
      section: sectionKey,
      href: localizePath(`${entry.href}/${entry.id}`, locale),
      subtitle: entry.category,
    };
  });

  // Weapons — single category, 107 items.
  const database = await fetchDatabase(APP_NAME);
  const weaponCat = database.find((c) => c.type === "weapon");
  const weaponEntries = (weaponCat?.items ?? []).map((item) => {
    const name = (item.props as { name?: string }).name ?? item.id;
    return {
      id: item.id,
      name,
      type: "weapon",
      section: "weapons",
      href: localizePath(`/db/weapons#${item.id}`, locale),
      subtitle: "Weapon",
    };
  });

  // Items, gear, facilities and recipes (the crafting codex sections): the
  // generic per-entry index, limited to those sections. Their icons are
  // standalone files with absolute urls, so the empty sprite url is fine.
  const codexTypes = new Set(
    (onceHuman.db?.homeSections ?? [])
      .map((s) => s.type)
      .filter(
        (t) =>
          t !== "weapon" &&
          t !== "remnants" &&
          t !== "regional_records" &&
          t !== "echoes_of_stardust",
      ),
  );
  const codex = await buildGenericSearchIndex(onceHuman, locale);
  const codexEntries = codex.entries.filter((e) => codexTypes.has(e.type));

  return {
    entries: [...wikiEntries, ...weaponEntries, ...codexEntries],
    iconsUrl: "",
  };
}
