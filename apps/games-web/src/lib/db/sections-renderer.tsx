import Link from "next/link";
import { localizePath } from "@repo/lib";
import { SpriteIcon } from "@/lib/db/sprite-icon";
import { EntityTooltip } from "@/lib/db/entity-tooltip";
import { resolveDict } from "@/lib/db/resolve-dict";

type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

/** A cross-link to another DB entry, produced by a data-mining transform.
 *  Carries only the target id; the display name resolves per-locale from `dict`.
 *  `name` is an optional English fallback only — never the source of truth. */
export type SectionLink = {
  section: string;
  id: string;
  name?: string;
  sub?: string;
};

/** A non-clickable icon + value pill (resource / essence costs, …). */
export type SectionChip = { iconId?: string; label: string; title?: string };

/** A structured extra section the generic card view can't express
 *  (cross-link grids / stat tables / bullet lists / cost chips). This is the
 *  generic `props._sections` contract any database game can emit; see the
 *  data-forge add-game skill `references/database-quality.md`. */
export type EntitySection =
  | { title: string; kind: "links"; links: SectionLink[] }
  | { title: string; kind: "rows"; rows: { label: string; value: string }[] }
  | { title: string; kind: "list"; items: string[] }
  | { title: string; kind: "chips"; chips: SectionChip[] };

/**
 * Renders a list of structured `_sections` — the generic, game-agnostic
 * cross-reference / stat / chip / list renderer shared across database games.
 *
 * A new database game emits `props._sections` (see the data contract above) and
 * gets clickable, per-locale-resolved cross-links + stat tables for free: just
 * pass the array here from its detail view.
 *
 * Names resolve from `dict` first (per-locale), then the link's optional `name`
 * fallback, then the raw id — pass `resolveLinkName` to override.
 */
export function SectionsRenderer({
  sections,
  icons,
  dict,
  appName,
  locale = "en",
  iconsHash,
  resolveLinkName,
}: {
  sections: EntitySection[];
  icons?: Record<string, IconSprite>;
  dict?: Record<string, string>;
  appName: string;
  locale?: string;
  iconsHash?: string;
  /** Override link-name resolution (default: dict lookup → link.name → id). */
  resolveLinkName?: (link: SectionLink) => string;
}) {
  const linkName =
    resolveLinkName ??
    ((l: SectionLink) => (dict && resolveDict(dict, l.id)) || l.name || l.id);

  return (
    <>
      {sections.map((sec) => (
        <div key={sec.title} className="mb-6 max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            {sec.title}
          </div>
          {sec.kind === "links" ? (
            <div className="flex flex-wrap gap-2">
              {sec.links.map((l) => {
                const ic = icons?.[l.id];
                return (
                  <EntityTooltip
                    key={`${l.section}/${l.id}`}
                    entityId={l.id}
                    locale={locale}
                  >
                    <Link
                      href={localizePath(`/db/${l.section}/${l.id}`, locale)}
                      prefetch={false}
                      className="inline-flex items-center gap-1.5 rounded border border-slate-700 bg-slate-900/60 py-1 pr-2.5 text-xs hover:border-amber-700/70 hover:bg-slate-900 transition-colors"
                      style={{ paddingLeft: ic ? 4 : 10 }}
                    >
                      {ic && (
                        <SpriteIcon
                          icon={ic}
                          appName={appName}
                          size={20}
                          iconsHash={iconsHash}
                        />
                      )}
                      <span className="text-slate-200">{linkName(l)}</span>
                      {l.sub && (
                        <span className="font-mono text-muted-foreground">
                          {l.sub}
                        </span>
                      )}
                    </Link>
                  </EntityTooltip>
                );
              })}
            </div>
          ) : sec.kind === "list" ? (
            <ul className="space-y-1">
              {sec.items.map((it, i) => (
                <li key={i} className="flex items-start gap-1.5 text-sm">
                  <span className="text-amber-500 mt-1 shrink-0">&#x25C6;</span>
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          ) : sec.kind === "chips" ? (
            <div className="flex flex-wrap gap-2">
              {sec.chips.map((c, i) => {
                const ic = c.iconId ? icons?.[c.iconId] : undefined;
                return (
                  <span
                    key={i}
                    title={c.title}
                    className="inline-flex items-center gap-1.5 rounded border border-slate-700 bg-slate-900/60 py-1 pr-2.5 text-sm font-medium text-slate-100"
                    style={{ paddingLeft: ic ? 4 : 10 }}
                  >
                    {ic && (
                      <SpriteIcon
                        icon={ic}
                        appName={appName}
                        size={20}
                        iconsHash={iconsHash}
                      />
                    )}
                    {c.label}
                  </span>
                );
              })}
            </div>
          ) : (
            <div className="border border-slate-800 rounded">
              <table className="w-full text-sm">
                <tbody>
                  {sec.rows.map((r) => (
                    <tr
                      key={r.label}
                      className="border-t border-slate-800/50 first:border-t-0"
                    >
                      <td className="px-3 py-1.5 text-muted-foreground text-xs w-1/3 align-top">
                        {r.label}
                      </td>
                      <td className="px-3 py-1.5 text-xs">{r.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </>
  );
}
