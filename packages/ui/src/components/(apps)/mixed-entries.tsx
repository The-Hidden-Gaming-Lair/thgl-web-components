import {
  AppConfig,
  fetchDatabaseEntry,
  fetchDatabaseIndex,
  fetchDatabaseType,
  fetchDbDict,
  getDbSectionByType,
  getT,
  localizePath,
} from "@repo/lib";
import Link from "next/link";

/** A codex entry's labelled table (`props.upgradeTable`, e.g. Palia's "Where to Catch"). */
type EntryTable = {
  label?: string;
  columns: string[];
  rows: (string | number)[][];
};

export type MixedEntry = {
  href: string;
  name: string;
  table: EntryTable | null;
};

/**
 * The codex entries a mixed marker type stands for (`mixedDbEntries`), each with its own
 * table: guides show these instead of a map whose spots belong to different entries.
 * Best-effort like the DB links: an entry that can't be loaded is dropped.
 */
export async function getMixedEntries(
  appConfig: AppConfig,
  locale: string,
  refs: { section: string; id: string }[],
): Promise<MixedEntry[]> {
  if (!appConfig.db || refs.length === 0) return [];
  try {
    const [index, localeDict] = await Promise.all([
      fetchDatabaseIndex(appConfig.name),
      fetchDbDict(appConfig.name, locale),
    ]);
    const sectionByType = getDbSectionByType(appConfig.db.homeSections, index);
    const t = getT(localeDict);
    const entries = await Promise.all(
      refs.map(async (ref): Promise<MixedEntry | null> => {
        const cat = index.find(
          (c) =>
            (sectionByType.get(c.type) ?? c.type) === ref.section &&
            c.items.some((i) => i.id === ref.id),
        );
        if (!cat) return null;
        const item =
          (cat.entries
            ? await fetchDatabaseEntry(appConfig.name, cat.type, ref.id)
            : null) ??
          (await fetchDatabaseType(appConfig.name, cat.type)).items.find(
            (i) => i.id === ref.id,
          );
        const table = (item?.props as { upgradeTable?: EntryTable } | undefined)
          ?.upgradeTable;
        return {
          href: localizePath(
            `/db/${ref.section}/${encodeURIComponent(ref.id)}`,
            locale,
          ),
          name: t(ref.id),
          table:
            Array.isArray(table?.columns) && Array.isArray(table?.rows)
              ? table
              : null,
        };
      }),
    );
    return entries.filter((e): e is MixedEntry => e !== null);
  } catch {
    return [];
  }
}

/** The intro line (if any) + each mixed entry's name and table, in place of the map. */
export function MixedEntriesTables({
  intro,
  entries,
}: {
  intro?: string;
  entries: MixedEntry[];
}) {
  return (
    <section className="my-4">
      {intro && <p className="text-sm mb-4">{intro}</p>}
      {entries.map((entry) => (
        <div key={entry.href} className="mb-6 max-w-md mx-auto text-left">
          <Link
            href={entry.href}
            className="text-base font-semibold text-amber-300 underline underline-offset-2 hover:text-amber-200"
          >
            {entry.name}
          </Link>
          {entry.table && entry.table.rows.length > 0 && (
            <div className="mt-2 border border-slate-800 rounded overflow-hidden">
              <table className="w-full text-sm">
                {entry.table.label && (
                  <caption className="px-3 py-1.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {entry.table.label}
                  </caption>
                )}
                <thead>
                  <tr className="bg-slate-900/60">
                    {entry.table.columns.map((c) => (
                      <th
                        key={c}
                        className="px-3 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entry.table.rows.map((row, i) => (
                    <tr
                      key={i}
                      className="border-t border-slate-800/50 first:border-t-0"
                    >
                      {row.map((cell, j) => (
                        <td
                          key={j}
                          className={`px-3 py-1.5 ${j === 0 ? "text-slate-300" : "font-medium text-slate-100"}`}
                        >
                          {String(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
