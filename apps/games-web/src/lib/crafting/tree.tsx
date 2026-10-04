import Link from "next/link";
import {
  craftStep,
  interpolate,
  localizePath,
  type CraftStation,
  type CraftingGraph,
  type RecipeChoice,
} from "@repo/lib";
import { SpriteIcon } from "@/lib/db/sprite-icon";
import type { CraftItemInfo } from "./data";

/**
 * Presentational pieces shared by the server-rendered /crafting/<id> pages
 * and the client calculator — no hooks, so they render on both sides.
 */

export function craftT(labels: Record<string, string>) {
  return (key: string, vars?: Record<string, string | number>) => {
    const v = labels[`crafting.${key}`] ?? key;
    return vars
      ? interpolate(
          v,
          Object.fromEntries(
            Object.entries(vars).map(([k, x]) => [k, String(x)]),
          ),
        )
      : v;
  };
}

export function formatQty(n: number, locale: string): string {
  return n.toLocaleString(locale);
}

const LINK = "hover:text-amber-300 hover:underline underline-offset-2";

/** Icon + name (codex link) of one item. */
export function ItemLabel({
  id,
  info,
  appName,
  iconsHash,
  locale,
  size = 24,
  href,
}: {
  id: string;
  info?: CraftItemInfo;
  appName: string;
  iconsHash?: string;
  locale: string;
  size?: number;
  /** Override the link target (default: the codex entry). */
  href?: string;
}) {
  const target = href ?? info?.db;
  const name = info?.name ?? id;
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      {info?.icon ? (
        <SpriteIcon
          icon={info.icon}
          appName={appName}
          iconsHash={iconsHash}
          size={size}
        />
      ) : (
        <span
          className="inline-block shrink-0 rounded bg-muted"
          style={{ width: size, height: size }}
        />
      )}
      {target ? (
        <Link
          href={localizePath(target, locale)}
          prefetch={false}
          className={`truncate ${LINK}`}
        >
          {name}
        </Link>
      ) : (
        <span className="truncate">{name}</span>
      )}
    </span>
  );
}

/** "Show on map" link for an item with spawns. */
export function MapLink({
  info,
  locale,
  label,
}: {
  info?: CraftItemInfo;
  locale: string;
  label: string;
}) {
  if (!info?.map) return null;
  return (
    <Link
      href={localizePath(info.map, locale)}
      prefetch={false}
      className="shrink-0 text-xs text-amber-400 hover:underline"
    >
      {label}
    </Link>
  );
}

export function stationLabel(
  s: CraftStation,
  infos: Record<string, CraftItemInfo>,
): string {
  return s.id !== undefined ? (infos[s.id]?.name ?? s.id) : (s.label ?? "");
}

export function StationChips({
  stations,
  infos,
  locale,
}: {
  stations: CraftStation[];
  infos: Record<string, CraftItemInfo>;
  locale: string;
}) {
  if (!stations.length) return null;
  return (
    <span className="inline-flex flex-wrap gap-1">
      {stations.map((s) => {
        const db = s.id ? infos[s.id]?.db : undefined;
        const cls =
          "rounded border border-slate-700 bg-slate-900/60 px-1.5 py-0.5 text-[11px] text-amber-300";
        return db ? (
          <Link
            key={s.id}
            href={localizePath(db, locale)}
            prefetch={false}
            className={`${cls} hover:border-amber-700/70`}
          >
            {stationLabel(s, infos)}
          </Link>
        ) : (
          <span key={s.id ?? s.label} className={cls}>
            {stationLabel(s, infos)}
          </span>
        );
      })}
    </span>
  );
}

type TreeProps = {
  graph: CraftingGraph;
  choice: RecipeChoice;
  infos: Record<string, CraftItemInfo>;
  labels: Record<string, string>;
  appName: string;
  iconsHash?: string;
  locale: string;
  /** Levels rendered open (deeper ones are collapsed `<details>`). */
  openDepth?: number;
  /** Max nodes rendered (huge factory trees stay bounded). */
  maxNodes?: number;
};

/**
 * Expandable ingredient tree for `qty` × `id` — one level per `craftStep`,
 * rounding up to whole crafts per branch. A branch that leads back to an
 * ancestor stops there (cycle) and is shown as gathered.
 */
export function CraftTree({
  id,
  qty,
  ...props
}: TreeProps & { id: string; qty: number }) {
  const budget = { left: props.maxNodes ?? 400 };
  return (
    <ul className="space-y-0.5 text-sm">
      <TreeNode
        {...props}
        id={id}
        qty={qty}
        depth={0}
        ancestors={[]}
        budget={budget}
      />
    </ul>
  );
}

function TreeNode({
  id,
  qty,
  depth,
  ancestors,
  budget,
  ...props
}: TreeProps & {
  id: string;
  qty: number;
  depth: number;
  ancestors: string[];
  budget: { left: number };
}) {
  const { graph, choice, infos, labels, appName, iconsHash, locale } = props;
  const t = craftT(labels);
  budget.left--;
  const cycle = ancestors.includes(id);
  const step = cycle ? null : craftStep(graph, id, qty, choice);
  const recipe = step?.recipe !== undefined ? graph.recipes[step.recipe] : null;
  const info = infos[id];
  const row = (
    <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
      <span className="w-14 shrink-0 text-right font-mono tabular-nums text-amber-200">
        {formatQty(qty, locale)}×
      </span>
      <ItemLabel
        id={id}
        info={info}
        appName={appName}
        iconsHash={iconsHash}
        locale={locale}
        size={20}
      />
      {recipe && step && (
        <span className="text-xs text-muted-foreground">
          {step.yield > 1
            ? t("craftsYield", {
                crafts: formatQty(step.crafts, locale),
                yield: step.yield,
              })
            : t("crafts", { crafts: formatQty(step.crafts, locale) })}
        </span>
      )}
      {recipe && (
        <StationChips
          stations={recipe.stations}
          infos={infos}
          locale={locale}
        />
      )}
      {!recipe && (
        <MapLink info={info} locale={locale} label={t("showOnMap")} />
      )}
      {cycle && (
        <span className="text-xs text-muted-foreground">{t("cycle")}</span>
      )}
    </span>
  );
  if (!step || !recipe || step.children.length === 0) {
    return (
      <li className="flex items-start gap-1 py-0.5">
        <span className="w-3 shrink-0" />
        {row}
      </li>
    );
  }
  if (budget.left <= 0) {
    return (
      <li className="py-0.5">
        {row}
        <span className="ml-16 block text-xs text-muted-foreground">
          {t("treeTruncated")}
        </span>
      </li>
    );
  }
  const next = [...ancestors, id];
  return (
    <li className="py-0.5">
      <details open={depth < (props.openDepth ?? 2)}>
        <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
          <span className="flex items-start gap-1">
            <span className="mt-0.5 w-3 shrink-0 text-xs text-muted-foreground transition-transform [details[open]>summary>span>&]:rotate-90">
              ▶
            </span>
            {row}
          </span>
        </summary>
        <ul className="ml-4 border-l border-slate-800 pl-2">
          {step.children.map((c) => (
            <TreeNode
              key={c.id}
              {...props}
              id={c.id}
              qty={c.qty}
              depth={depth + 1}
              ancestors={next}
              budget={budget}
            />
          ))}
        </ul>
      </details>
    </li>
  );
}
