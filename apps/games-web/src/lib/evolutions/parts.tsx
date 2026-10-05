import Link from "next/link";
import {
  localizePath,
  type EvolutionBranch,
  type EvolutionsData,
} from "@repo/lib";
import { resolveDict } from "@/lib/db/resolve-dict";
import { SpriteIcon } from "@/lib/db/sprite-icon";
import type { EvoEntity, EvolutionNames } from "./data";

/**
 * Hook-free, server-rendered pieces of the Evolution guide (hub + per-Aniimo
 * pages): a species chip, one branch's requirement box and the whole line
 * as a nested tree.
 */

export type EvoCtx = {
  data: EvolutionsData;
  names: EvolutionNames;
  dict: Record<string, string>;
  label: (key: string, vars?: Record<string, string>) => string;
  appName: string;
  iconsHash?: string;
  locale: string;
};

export const EVO_LINK =
  "text-amber-300 underline underline-offset-2 hover:text-amber-200";

function Icon({
  entity,
  size,
  ctx,
}: {
  entity?: EvoEntity;
  size: number;
  ctx: EvoCtx;
}) {
  return entity?.icon ? (
    <SpriteIcon
      icon={entity.icon}
      appName={ctx.appName}
      iconsHash={ctx.iconsHash}
      size={size}
    />
  ) : (
    <span
      className="inline-block shrink-0 rounded bg-muted"
      style={{ width: size, height: size }}
    />
  );
}

export function SpeciesChip({
  id,
  ctx,
  size = 40,
  current,
}: {
  id: string;
  ctx: EvoCtx;
  size?: number;
  current?: boolean;
}) {
  const sp = ctx.names.species[id];
  return (
    <Link
      href={localizePath(`/evolutions/${id}`, ctx.locale)}
      aria-current={current ? "page" : undefined}
      className={`inline-flex items-center gap-2 rounded-md border px-2 py-1 hover:bg-accent ${
        current ? "border-amber-500/70 bg-amber-950/30" : "border-slate-800"
      }`}
    >
      <Icon entity={sp} size={size} ctx={ctx} />
      <span className="font-medium">{sp?.name ?? id}</span>
    </Link>
  );
}

function ItemLink({
  id,
  count,
  ctx,
}: {
  id: string;
  count: number;
  ctx: EvoCtx;
}) {
  const item = ctx.names.items[id];
  return (
    <Link
      href={localizePath(`/db/items/${id}`, ctx.locale)}
      className="inline-flex items-center gap-1 hover:underline"
    >
      <Icon entity={item} size={20} ctx={ctx} />
      <span>
        {item?.name ?? id} ×{count}
      </span>
    </Link>
  );
}

/** Every requirement of one branch, in the game's order: unlock, level, the rest, stones. */
export function Requirements({
  branch,
  ctx,
}: {
  branch: EvolutionBranch;
  ctx: EvoCtx;
}) {
  const t = (key: string) => resolveDict(ctx.dict, key) || key;
  const forms = branch.forms;
  return (
    <ul className="space-y-1 text-sm">
      {branch.unlock && (
        <li>
          <span className="text-muted-foreground">{ctx.label("unlock")}: </span>
          {t(branch.unlock)}
        </li>
      )}
      {branch.level !== undefined && (
        <li>{ctx.label("level", { level: String(branch.level) })}</li>
      )}
      {branch.conditions.map((c) => (
        <li key={c}>{t(c)}</li>
      ))}
      {branch.items.map((it) => (
        <li key={it.id} className="flex flex-wrap items-center gap-x-2">
          <ItemLink id={it.id} count={it.count} ctx={ctx} />
          {it.alt && (
            <>
              <span className="text-muted-foreground">{ctx.label("or")}</span>
              <ItemLink id={it.alt.id} count={it.alt.count} ctx={ctx} />
            </>
          )}
        </li>
      ))}
      {forms && (
        <li className="pt-1">
          <span className="text-muted-foreground">{ctx.label("forms")}: </span>
          {forms.map((f, i) => (
            <span key={f.form}>
              {i > 0 && ", "}
              {t(f.form)}
              {f.extra.length > 0 && ` (${f.extra.map(t).join("; ")})`}
            </span>
          ))}
        </li>
      )}
    </ul>
  );
}

/** The branches of one species, each a card (target + requirements) with its own branches nested inside. */
function Branches({
  id,
  ctx,
  current,
  seen,
}: {
  id: string;
  ctx: EvoCtx;
  current?: string;
  seen: Set<string>;
}) {
  const branches = (ctx.data.species[id]?.evolutions ?? []).filter(
    (b) => !seen.has(b.to),
  );
  if (!branches.length) return null;
  for (const b of branches) seen.add(b.to);
  return (
    <ul className="ml-5 mt-2 space-y-3 border-l border-slate-700 pl-4">
      {branches.map((b) => (
        <li key={b.to}>
          <div className="space-y-2 rounded-md border border-slate-800 bg-slate-900/40 p-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground" aria-hidden>
                ↳
              </span>
              <SpeciesChip id={b.to} ctx={ctx} current={b.to === current} />
            </div>
            <Requirements branch={b} ctx={ctx} />
          </div>
          <Branches id={b.to} ctx={ctx} current={current} seen={seen} />
        </li>
      ))}
    </ul>
  );
}

/** A whole line: the root species and, nested under it, every branch. */
export function EvolutionTree({
  id,
  ctx,
  current,
}: {
  id: string;
  ctx: EvoCtx;
  current?: string;
}) {
  return (
    <div>
      <SpeciesChip id={id} ctx={ctx} current={id === current} />
      <Branches id={id} ctx={ctx} current={current} seen={new Set([id])} />
    </div>
  );
}

/** Compact one-row chain for the hub: every species of a line with its entry level. */
export function LineRow({
  line,
  ctx,
}: {
  line: EvolutionsData["lines"][number];
  ctx: EvoCtx;
}) {
  return (
    <li className="flex flex-wrap items-center gap-x-1 gap-y-2 rounded-md border border-slate-800 p-2">
      {line.species.map((sid, i) => {
        const parent = ctx.data.species[sid]?.from[0];
        const branch = parent
          ? ctx.data.species[parent]?.evolutions.find((b) => b.to === sid)
          : undefined;
        return (
          <span key={sid} className="inline-flex items-center gap-1">
            {i > 0 && (
              <span className="px-1 text-xs text-muted-foreground">
                {parent && parent !== line.species[i - 1]
                  ? `${ctx.names.species[parent]?.name ?? parent} → `
                  : "→ "}
                {branch?.level !== undefined &&
                  ctx.label("levelShort", { level: String(branch.level) })}
              </span>
            )}
            <SpeciesChip id={sid} ctx={ctx} size={32} />
          </span>
        );
      })}
    </li>
  );
}
