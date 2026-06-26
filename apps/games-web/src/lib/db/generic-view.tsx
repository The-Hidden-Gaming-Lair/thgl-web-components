import Link from "next/link";
import { localizePath, type TilesConfig } from "@repo/lib";
import { SpriteIcon } from "@/lib/db/sprite-icon";
import { DbLocationMap } from "@/lib/db/db-location-map";

type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

/** One map location an item is found at (e.g. a chest), produced by data-forge. */
type ItemLocation = {
  map: string;
  type: string;
  node: string; // deep-link node id "type@Y:X"
  x: number;
  y: number;
  label: string;
};
type LocationsProp = { total: number; list: ItemLocation[] };

function isLocationsProp(v: unknown): v is LocationsProp {
  return (
    typeof v === "object" &&
    v !== null &&
    Array.isArray((v as LocationsProp).list)
  );
}

/** A cross-link to another DB entry (item↔trader), produced by data-forge. */
type DbRef = { id: string; section: string; name: string; count?: number };

function isDbRefArray(v: unknown): v is DbRef[] {
  return (
    Array.isArray(v) &&
    v.every(
      (r) =>
        typeof r === "object" &&
        r !== null &&
        typeof (r as DbRef).id === "string" &&
        typeof (r as DbRef).section === "string",
    )
  );
}
function asDbRefList(v: unknown): DbRef[] | undefined {
  if (isDbRefArray(v))
    return (v as DbRef[]).length > 0 ? (v as DbRef[]) : undefined;
  if (typeof v === "object" && v !== null && !Array.isArray(v)) {
    const o = v as { id?: unknown; section?: unknown; list?: unknown };
    // A single DbRef object (e.g. a recipe's required `Tool`).
    if (typeof o.id === "string" && typeof o.section === "string") {
      return [o as DbRef];
    }
    if (isDbRefArray(o.list)) return o.list as DbRef[];
  }
  return undefined;
}

// A "stat" is a short scalar prop (number / boolean / short string) worth
// surfacing as a prominent card (e.g. Damage, Value, Stack Size). Longer or
// structured values (cipher keys, sprite arrays, tile bounds) stay in the
// raw details table.
function isStatValue(v: unknown): v is string | number | boolean {
  if (typeof v === "number" || typeof v === "boolean") return true;
  return typeof v === "string" && v.length > 0 && v.length <= 24;
}

/** A rarity/value-tier pill ({label, color}), produced by data-forge. */
type Rarity = { label: string; color: string };
function isRarity(v: unknown): v is Rarity {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as Rarity).label === "string" &&
    typeof (v as Rarity).color === "string"
  );
}

/** "Craftable at <station>" provenance (no ingredients in the source data). */
type Craftable = { station: string; map?: string; mapType?: string };
function isCraftable(v: unknown): v is Craftable {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as Craftable).station === "string"
  );
}

/**
 * Universal detail view for a generic database entry — used by the tenant-
 * resolved `/db/[section]/[id]` route (Gothic, etc.) and Drakantos.
 *
 * Layout: a hero card (icon + name + group), description, any data-forge
 * cross-link sections (map locations, sold-by, sells), a stat-card grid for
 * the recognised scalar fields, then a details table for everything else.
 */
export function GenericEntityView({
  id,
  name,
  desc,
  groupLabel,
  icon,
  props,
  iconsHash,
  appName,
  locale = "en",
  icons,
  tiles,
  statIcons,
  monoDetails = true,
  badges,
}: {
  id: string;
  name: string;
  desc?: string;
  groupLabel?: string;
  /** Extra header badges next to the group label (e.g. a "DLC" tag). Generic —
   *  the caller decides what to show. */
  badges?: { label: string; title?: string }[];
  icon?: IconSprite;
  props?: Record<string, unknown>;
  iconsHash?: string;
  appName: string;
  locale?: string;
  /** id → sprite icon for cross-linked entities (built from the DB index). */
  icons?: Record<string, IconSprite>;
  /** Map tile config — when present, `locations` render as an embedded map. */
  tiles?: TilesConfig;
  /** Optional stat-label → icon-id map; renders the icon on matching stat cards
   *  (the view stays generic — the caller supplies the game-specific mapping). */
  statIcons?: Record<string, string>;
  /** Render the "Details" table in monospace (default). Set false for games
   *  whose extra props are prose (Songs of Conquest) rather than technical keys. */
  monoDetails?: boolean;
}) {
  const hasDesc = desc && desc !== `${id}_desc` && desc !== id;
  // "Found where on the map" — rendered as its own clickable section, not in
  // the table.
  const locations = isLocationsProp(props?.locations)
    ? props.locations
    : undefined;
  // Cross-links to other DB entries, rendered as their own link sections.
  const soldBy = asDbRefList(props?.soldBy);
  const sells = asDbRefList(props?.sells);
  const drops = asDbRefList(props?.drops); // creature → item drops
  const droppedBy = asDbRefList(props?.droppedBy); // item → creatures
  const ingredients = asDbRefList(props?.ingredients); // crafted item → its ingredients
  const usedToCraft = asDbRefList(props?.usedToCraft); // ingredient → items it crafts
  // Rarity/value-tier pill, rendered next to the name.
  const rarity = isRarity(props?.rarity) ? props.rarity : undefined;
  // "Craftable at <station>" provenance line.
  const craftable = isCraftable(props?.craftable) ? props.craftable : undefined;
  // Remaining props, minus everything rendered in a dedicated section above.
  const remaining = Object.entries(props ?? {}).filter(
    ([k]) =>
      // `_`-prefixed props are structured data consumed by per-game custom
      // views (e.g. SoC's skill pools / faction indexes); hide from generic UI.
      !k.startsWith("_") &&
      k !== "region" &&
      k !== "regionId" &&
      k !== "category" &&
      k !== "categoryId" &&
      k !== "locations" &&
      k !== "soldBy" &&
      k !== "sells" &&
      k !== "rarity" &&
      k !== "craftable" &&
      k !== "drops" &&
      k !== "droppedBy" &&
      k !== "ingredients" &&
      k !== "usedToCraft",
  );
  // Any remaining prop whose value is a DbRef (single or array) — e.g. a recipe's
  // `Tool` or a codex entry's `documents` — renders as a labeled link section, not
  // JSON in the details table. (Generic so per-game custom cross-link keys work.)
  const refProps = remaining
    .map(([k, v]) => [k, asDbRefList(v)] as const)
    .filter((e): e is readonly [string, DbRef[]] => !!e[1]);
  const refKeys = new Set(refProps.map(([k]) => k));
  const nonRef = remaining.filter(([k]) => !refKeys.has(k));
  // Split into prominent stat cards vs. the raw details table.
  const statProps = nonRef.filter(([, v]) => isStatValue(v));
  const tableProps = Object.fromEntries(
    nonRef.filter(([, v]) => !isStatValue(v)),
  );
  const humanizeKey = (k: string) =>
    k
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/[_-]+/g, " ")
      .replace(/^./, (c) => c.toUpperCase());

  const refLinks = (refs: DbRef[]) => (
    <div className="flex flex-wrap gap-2">
      {refs.map((r) => {
        const ic = icons?.[r.id];
        return (
          <Link
            key={`${r.section}/${r.id}`}
            href={localizePath(`/db/${r.section}/${r.id}`, locale)}
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
            <span className="text-slate-200">{r.name}</span>
            {typeof r.count === "number" && r.count > 1 && (
              <span className="font-mono text-muted-foreground">
                ×{r.count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="py-4">
      <div className="flex items-start gap-5 mb-6 pb-6 border-b border-slate-800">
        {icon ? (
          <div className="shrink-0 p-3 border border-slate-700 rounded bg-slate-900/60">
            <SpriteIcon
              icon={icon}
              appName={appName}
              size={96}
              iconsHash={iconsHash}
            />
          </div>
        ) : (
          <div className="shrink-0 w-[120px] h-[120px] border border-dashed border-slate-700 rounded bg-slate-900/30 flex items-center justify-center text-slate-600 text-xs">
            no icon
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold mb-1 truncate">{name}</h1>
          <div className="flex items-center gap-2 text-xs flex-wrap">
            {rarity && (
              <span
                className="px-2 py-0.5 rounded border font-medium"
                style={{
                  color: rarity.color,
                  borderColor: `${rarity.color}66`,
                  backgroundColor: `${rarity.color}1a`,
                }}
              >
                {rarity.label}
              </span>
            )}
            {groupLabel && (
              <span className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-300">
                {groupLabel}
              </span>
            )}
            {badges?.map((b) => (
              <span
                key={b.label}
                title={b.title}
                className="px-2 py-0.5 rounded border border-amber-600/50 bg-amber-950/40 font-semibold text-amber-300"
              >
                {b.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {hasDesc && (
        <div className="mb-6 text-sm leading-relaxed whitespace-pre-line max-w-3xl">
          {desc}
        </div>
      )}

      {statProps.length > 0 && (
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-3xl">
          {statProps.map(([k, v]) => {
            const statIc = statIcons?.[k] ? icons?.[statIcons[k]] : undefined;
            return (
              <div
                key={k}
                className="rounded border border-slate-800 bg-slate-900/40 px-3 py-2"
              >
                <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {statIc && (
                    <SpriteIcon
                      icon={statIc}
                      appName={appName}
                      size={14}
                      iconsHash={iconsHash}
                    />
                  )}
                  {k}
                </div>
                <div className="text-sm font-medium text-slate-100">
                  {String(v)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {locations && locations.list.length > 0 && (
        <div className="mb-6 max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Found in {locations.total}{" "}
            {locations.total === 1 ? "chest" : "chests"}
          </div>
          {tiles ? (
            // Embedded interactive map pinning every location.
            <DbLocationMap
              locations={locations.list}
              mapName={locations.list[0].map}
              tiles={tiles}
              appName={appName}
            />
          ) : (
            // Fallback (no tiles): a flat list of coordinate links.
            <div className="flex flex-wrap gap-2">
              {locations.list.map((loc) => (
                <Link
                  key={loc.node}
                  href={localizePath(
                    `/maps/${loc.map}/${loc.type}/${encodeURIComponent(
                      loc.node,
                    )}?id=${encodeURIComponent(loc.node)}`,
                    locale,
                  )}
                  prefetch={false}
                  className="inline-flex items-center gap-1.5 rounded border border-slate-700 bg-slate-900/60 px-2.5 py-1 text-xs hover:border-amber-700/70 hover:bg-slate-900 transition-colors"
                >
                  <span
                    className={
                      loc.type === "chest_rune"
                        ? "text-fuchsia-300"
                        : "text-amber-300"
                    }
                  >
                    {loc.label}
                  </span>
                  <span className="font-mono text-muted-foreground">
                    [{loc.x}, {loc.y}]
                  </span>
                </Link>
              ))}
            </div>
          )}
          {locations.total > locations.list.length && (
            <div className="mt-2 text-xs text-muted-foreground">
              + {locations.total - locations.list.length} more
            </div>
          )}
        </div>
      )}

      {soldBy && soldBy.length > 0 && (
        <div className="mb-6 max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Sold by
          </div>
          {refLinks(soldBy)}
        </div>
      )}

      {sells && sells.length > 0 && (
        <div className="mb-6 max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Sells {sells.length} {sells.length === 1 ? "item" : "items"}
          </div>
          {refLinks(sells)}
        </div>
      )}

      {craftable && (
        <div className="mb-6 max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Craftable at
          </div>
          <span className="inline-flex items-center rounded border border-slate-700 bg-slate-900/60 px-2.5 py-1 text-xs text-amber-300">
            {craftable.station}
          </span>
        </div>
      )}

      {ingredients && ingredients.length > 0 && (
        <div className="mb-6 max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Crafted from
          </div>
          {refLinks(ingredients)}
        </div>
      )}

      {usedToCraft && usedToCraft.length > 0 && (
        <div className="mb-6 max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Used to craft
          </div>
          {refLinks(usedToCraft)}
        </div>
      )}

      {drops && drops.length > 0 && (
        <div className="mb-6 max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Drops
          </div>
          {refLinks(drops)}
        </div>
      )}

      {droppedBy && droppedBy.length > 0 && (
        <div className="mb-6 max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Dropped by
          </div>
          {refLinks(droppedBy)}
        </div>
      )}

      {refProps.map(([k, refs]) => (
        <div key={k} className="mb-6 max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            {humanizeKey(k)}
          </div>
          {refLinks(refs)}
        </div>
      ))}

      {Object.keys(tableProps).length > 0 && (
        <div className="border border-slate-800 rounded max-w-3xl">
          <div className="border-b border-slate-800 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Details
          </div>
          <table className="w-full text-sm">
            <tbody>
              {Object.entries(tableProps).map(([k, v]) => (
                <tr
                  key={k}
                  className="border-t border-slate-800/50 first:border-t-0"
                >
                  <td
                    className={`px-3 py-1.5 text-muted-foreground text-xs w-1/3 align-top ${monoDetails ? "font-mono" : ""}`}
                  >
                    {k}
                  </td>
                  <td
                    className={`px-3 py-1.5 text-xs ${monoDetails ? "font-mono break-all" : ""}`}
                  >
                    {formatValue(v)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return String(v);
  if (
    typeof v === "string" ||
    typeof v === "number" ||
    typeof v === "boolean"
  ) {
    return String(v);
  }
  if (Array.isArray(v)) {
    if (v.length === 0) return "[]";
    if (v.length > 20) {
      return `[${v.slice(0, 20).map(formatValue).join(", ")}, … (${v.length} total)]`;
    }
    return `[${v.map(formatValue).join(", ")}]`;
  }
  return JSON.stringify(v);
}
