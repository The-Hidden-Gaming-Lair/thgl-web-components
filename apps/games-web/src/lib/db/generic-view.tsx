import Link from "next/link";
import { localizePath, type TilesConfig, type FiltersConfig } from "@repo/lib";
import { SpriteIcon } from "@/lib/db/sprite-icon";
import { DbLocationMap } from "@/lib/db/db-location-map";
import { DbEmbeddedMap, type EmbeddedMapSpawn } from "@/lib/db/db-embedded-map";
import { resolveDict } from "@/lib/db/resolve-dict";
import {
  FilterableRefs,
  type IconSprite as RefIconSprite,
} from "@/lib/db/filterable-refs";

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
type LocationsProp = {
  total: number;
  list: ItemLocation[];
  /** Singular/plural noun for the "Found at N …" heading (e.g. "deposit"/"deposits",
   *  "chest"/"chests"). Defaults to "location"/"locations" — set by data-forge per
   *  game so the wording fits (ore deposits ≠ chests ≠ POIs). */
  noun?: string;
  nounPlural?: string;
};

function isLocationsProp(v: unknown): v is LocationsProp {
  return (
    typeof v === "object" &&
    v !== null &&
    Array.isArray((v as LocationsProp).list)
  );
}

/** A whole-level embed: a map name + its teleporter / object markers. */
type EmbeddedMapProp = { mapName: string; spawns: EmbeddedMapSpawn[] };
function isEmbeddedMapProp(v: unknown): v is EmbeddedMapProp {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as EmbeddedMapProp).mapName === "string" &&
    Array.isArray((v as EmbeddedMapProp).spawns)
  );
}

/** Rarity tiers an item rolls (per-instance), produced by data-forge. */
type RarityTier = { label: string; color: string };
function isRarityTiers(v: unknown): v is RarityTier[] {
  return (
    Array.isArray(v) &&
    v.length > 0 &&
    v.every(
      (t) =>
        typeof (t as RarityTier)?.label === "string" &&
        typeof (t as RarityTier)?.color === "string",
    )
  );
}

/** A per-level table (e.g. a skill's upgrade cost by level), produced by data-forge. */
type UpgradeTable = {
  label?: string;
  columns: string[];
  rows: (string | number)[][];
};
function isUpgradeTable(v: unknown): v is UpgradeTable {
  return (
    typeof v === "object" &&
    v !== null &&
    Array.isArray((v as UpgradeTable).columns) &&
    Array.isArray((v as UpgradeTable).rows)
  );
}

/** A cross-link to another DB entry (item↔trader), produced by data-forge.
 *  `group` buckets refs under a sub-heading (e.g. a boss's drops by class);
 *  `tooltip` shows extra detail (e.g. the item's power) on hover. */
type DbRef = {
  id: string;
  section: string;
  name: string;
  count?: number;
  group?: string;
  tooltip?: string;
};

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

/** A labelled list of map areas (e.g. a monster's "Found In") → chips, each
 *  optionally linking to its map page when that map is rendered. */
type AreasProp = { label: string; items: { name: string; href?: string }[] };
function isAreasProp(v: unknown): v is AreasProp {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as AreasProp).label === "string" &&
    Array.isArray((v as AreasProp).items) &&
    (v as AreasProp).items.every(
      (it) => typeof (it as { name?: unknown })?.name === "string",
    )
  );
}

/** A labelled icon variant (e.g. a familiar's skin recolours), produced by data-forge. */
type Variant = { label: string; icon: IconSprite };
function isVariantArray(v: unknown): v is Variant[] {
  return (
    Array.isArray(v) &&
    v.length > 0 &&
    v.every(
      (e) =>
        typeof e === "object" &&
        e !== null &&
        typeof (e as Variant).label === "string" &&
        typeof (e as Variant).icon === "object" &&
        (e as Variant).icon !== null,
    )
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
  filters,
  statIcons,
  monoDetails = true,
  badges,
  dict,
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
  /** Filters config (from version.json) — used to resolve each location's real sprite icon
   *  on the embedded map instead of the plain white-circle fallback. */
  filters?: FiltersConfig;
  /** Optional stat-label → icon-id map; renders the icon on matching stat cards
   *  (the view stays generic — the caller supplies the game-specific mapping). */
  statIcons?: Record<string, string>;
  /** Render the "Details" table in monospace (default). Set false for games
   *  whose extra props are prose (Songs of Conquest) rather than technical keys. */
  monoDetails?: boolean;
  /** Full localization dict — resolves cross-link (DbRef) names, which the data
   *  carries as bare `{id, section}` (names live in the per-locale dict). */
  dict?: Record<string, string>;
}) {
  // DbRefs carry no baked name (localized via dict). Resolve name from the ref
  // itself, then the dict, then fall back to the raw id.
  const refName = (r: { id: string; name?: string }) =>
    r.name || (dict ? resolveDict(dict, r.id) : "") || r.id;
  const hasDesc = desc && desc !== `${id}_desc` && desc !== id;
  // "Found where on the map" — rendered as its own clickable section, not in
  // the table.
  const locations = isLocationsProp(props?.locations)
    ? props.locations
    : undefined;
  // A whole-level interactive map embed (a map DB entry's own view).
  const embeddedMap = isEmbeddedMapProp(props?.embeddedMap)
    ? props.embeddedMap
    : undefined;
  // A per-level table (e.g. a skill's upgrade cost by level).
  const upgradeTable = isUpgradeTable(props?.upgradeTable)
    ? props.upgradeTable
    : undefined;
  // Rarity tiers this item rolls per instance.
  const rarityTiers = isRarityTiers(props?.rarityTiers)
    ? props.rarityTiers
    : undefined;
  // Cross-links to other DB entries, rendered as their own link sections.
  const soldBy = asDbRefList(props?.soldBy);
  const sells = asDbRefList(props?.sells);
  const drops = asDbRefList(props?.drops); // creature → item drops
  const droppedBy = asDbRefList(props?.droppedBy); // item → creatures
  const ingredients = asDbRefList(props?.ingredients); // crafted item → its ingredients
  const usedToCraft = asDbRefList(props?.usedToCraft); // ingredient → items it crafts
  // Labelled icon variants (e.g. a familiar's skin recolours) → own gallery section.
  const variants = isVariantArray(props?.variants) ? props.variants : undefined;
  // Rarity/value-tier pill, rendered next to the name.
  const rarity = isRarity(props?.rarity) ? props.rarity : undefined;
  // "Craftable at <station>" provenance line.
  const craftable = isCraftable(props?.craftable) ? props.craftable : undefined;
  // Labelled map-area chips (e.g. "Found In" / "Gathered In"), linked where the
  // map is rendered.
  const areas = isAreasProp(props?.areas) ? props.areas : undefined;
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
      k !== "embeddedMap" &&
      k !== "upgradeTable" &&
      k !== "rarityTiers" &&
      k !== "soldBy" &&
      k !== "sells" &&
      k !== "rarity" &&
      k !== "craftable" &&
      k !== "drops" &&
      k !== "droppedBy" &&
      k !== "ingredients" &&
      k !== "usedToCraft" &&
      k !== "variants" &&
      k !== "areas",
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

  const refPill = (r: DbRef) => {
    const ic = icons?.[r.id];
    return (
      <Link
        key={`${r.section}/${r.id}`}
        href={localizePath(`/db/${r.section}/${r.id}`, locale)}
        prefetch={false}
        data-reftip-anchor={r.tooltip ? "" : undefined}
        title={refName(r)}
        className="relative inline-flex items-center gap-1.5 rounded border border-slate-700 bg-slate-900/60 py-1 pr-2.5 text-xs hover:border-amber-700/70 hover:bg-slate-900 transition-colors"
        style={{ paddingLeft: ic ? 4 : 10 }}
      >
        {ic && (
          <span className="flex h-5 w-5 shrink-0 items-center justify-center">
            <SpriteIcon
              icon={ic}
              appName={appName}
              size={20}
              iconsHash={iconsHash}
            />
          </span>
        )}
        <span className="text-slate-200">{refName(r)}</span>
        {typeof r.count === "number" && r.count > 1 && (
          <span className="font-mono text-muted-foreground">×{r.count}</span>
        )}
        {r.tooltip && (
          <span
            data-reftip
            className="pointer-events-none absolute left-0 top-full z-50 mt-1 w-64 max-w-[80vw] whitespace-normal rounded border border-slate-600 bg-slate-950 px-2.5 py-1.5 text-[11px] font-normal normal-case leading-snug text-slate-200 shadow-xl"
          >
            {r.tooltip}
          </span>
        )}
      </Link>
    );
  };

  // Large sections (e.g. a boss's ~30 drops) get a client-side text + group
  // filter; small ones stay a plain static list.
  const renderRefs = (refs: DbRef[]) =>
    refs.length > 10 ? (
      <FilterableRefs
        items={refs.map((r) => ({
          ...r,
          name: refName(r),
          icon: (icons?.[r.id] as RefIconSprite) ?? null,
        }))}
        appName={appName}
        iconsHash={iconsHash}
        locale={locale}
      />
    ) : (
      refLinks(refs)
    );

  // An icon-first grid: centered icon in a fixed square + name caption + hover
  // tooltip. Used for icon-heavy cross-link props (e.g. a map's monsters /
  // gatherables) where a gallery reads better than a wall of name pills.
  const iconGrid = (refs: DbRef[]) => (
    <div className="flex flex-wrap gap-2">
      {refs.map((r) => {
        const ic = icons?.[r.id];
        const label = refName(r);
        return (
          <Link
            key={`${r.section}/${r.id}`}
            href={localizePath(`/db/${r.section}/${r.id}`, locale)}
            prefetch={false}
            title={label}
            className="group flex w-16 flex-col items-center gap-1"
          >
            <span className="relative flex h-12 w-12 items-center justify-center rounded border border-slate-700 bg-slate-900/60 transition-colors group-hover:border-amber-700/70 group-hover:bg-slate-900">
              {ic ? (
                <SpriteIcon
                  icon={ic}
                  appName={appName}
                  size={36}
                  iconsHash={iconsHash}
                />
              ) : (
                <span className="text-[9px] text-slate-600">?</span>
              )}
              {typeof r.count === "number" && r.count > 1 && (
                <span className="absolute -bottom-1 -right-1 rounded bg-slate-950/90 px-1 font-mono text-[10px] leading-tight text-amber-300 ring-1 ring-slate-700">
                  ×{r.count}
                </span>
              )}
            </span>
            <span className="line-clamp-2 text-center text-[10px] leading-tight text-slate-300 group-hover:text-amber-300">
              {label}
            </span>
          </Link>
        );
      })}
    </div>
  );

  // Arbitrary DbRef props (Monsters / Gatherables / Connects To …): an icon
  // grid when every ref has an icon, else the standard pills.
  const renderRefProp = (refs: DbRef[]) =>
    refs.length >= 3 && refs.every((r) => icons?.[r.id])
      ? iconGrid(refs)
      : renderRefs(refs);

  const refLinks = (refs: DbRef[]) => {
    // No group field → flat list (existing behavior for all other games).
    if (!refs.some((r) => r.group)) {
      return <div className="flex flex-wrap gap-2">{refs.map(refPill)}</div>;
    }
    // Bucket under sub-headings, preserving first-seen group order.
    const groups: { label: string; items: DbRef[] }[] = [];
    for (const r of refs) {
      const label = r.group ?? "";
      let g = groups.find((x) => x.label === label);
      if (!g) groups.push((g = { label, items: [] }));
      g.items.push(r);
    }
    return (
      <div className="space-y-3">
        {groups.map((g) => (
          <div key={g.label}>
            {g.label && (
              <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-500/80">
                {g.label}
              </div>
            )}
            <div className="flex flex-wrap gap-2">{g.items.map(refPill)}</div>
          </div>
        ))}
      </div>
    );
  };

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

      {embeddedMap && tiles && (
        <div className="mb-6 max-w-3xl">
          <DbEmbeddedMap
            mapName={embeddedMap.mapName}
            spawns={embeddedMap.spawns}
            tiles={tiles}
            appName={appName}
            filters={filters}
          />
        </div>
      )}

      {variants && (
        <div className="mb-6 max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Variants
          </div>
          <div className="flex flex-wrap gap-3">
            {variants.map((v) => (
              <div key={v.label} className="flex flex-col items-center gap-1">
                <div className="p-2 border border-slate-700 rounded bg-slate-900/60">
                  <SpriteIcon
                    icon={v.icon}
                    appName={appName}
                    size={56}
                    iconsHash={iconsHash}
                  />
                </div>
                <span className="text-[11px] text-slate-300">{v.label}</span>
              </div>
            ))}
          </div>
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
                  {humanizeKey(k)}
                </div>
                <div className="text-sm font-medium text-slate-100">
                  {String(v)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {rarityTiers && (
        <div className="mb-6 max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Rarity
          </div>
          <p className="text-xs text-muted-foreground mb-2 max-w-2xl">
            Rarity is rolled per instance when this item drops or is crafted
            (like its random bonuses) — shown by the item&apos;s border colour.
            Higher tiers roll more and stronger bonuses.
          </p>
          <div className="flex flex-wrap gap-2">
            {rarityTiers.map((t) => (
              <span
                key={t.label}
                className="inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-medium"
                style={{
                  color: t.color,
                  borderColor: `${t.color}66`,
                  backgroundColor: `${t.color}14`,
                }}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: t.color }}
                />
                {t.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {upgradeTable && upgradeTable.rows.length > 0 && (
        <div className="mb-6 max-w-md">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            {upgradeTable.label ?? "Upgrade"}
          </div>
          <div className="border border-slate-800 rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-900/60">
                  {upgradeTable.columns.map((c) => (
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
                {upgradeTable.rows.map((row, i) => (
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
        </div>
      )}

      {areas && areas.items.length > 0 && (
        <div className="mb-6 max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            {areas.label}
          </div>
          <div className="flex flex-wrap gap-2">
            {areas.items.map((a) =>
              a.href ? (
                <Link
                  key={a.name}
                  href={localizePath(a.href, locale)}
                  prefetch={false}
                  className="inline-flex items-center rounded border border-slate-700 bg-slate-900/60 px-2.5 py-1 text-xs text-amber-300 hover:border-amber-700/70 hover:bg-slate-900 transition-colors"
                >
                  {a.name}
                </Link>
              ) : (
                <span
                  key={a.name}
                  className="inline-flex items-center rounded border border-slate-800 bg-slate-900/40 px-2.5 py-1 text-xs text-muted-foreground"
                >
                  {a.name}
                </span>
              ),
            )}
          </div>
        </div>
      )}

      {locations && locations.list.length > 0 && (
        <div className="mb-6 max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Found at {locations.total}{" "}
            {locations.total === 1
              ? (locations.noun ?? "location")
              : (locations.nounPlural ?? "locations")}
          </div>
          {tiles ? (
            // Embedded interactive map pinning every location.
            <DbLocationMap
              locations={locations.list}
              mapName={locations.list[0].map}
              tiles={tiles}
              appName={appName}
              filters={filters}
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
          {renderRefs(drops)}
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
          {renderRefProp(refs)}
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
