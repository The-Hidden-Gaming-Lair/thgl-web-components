"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  activeSkills,
  damageSkills,
  decodeTeam,
  defenseProfile,
  encodeTeam,
  interpolate,
  localizePath,
  offenseCoverage,
  rankCounters,
  recommendedTeam,
  STAT_KEYS,
  suggestNext,
  summarizeTeam,
  TEAM_SIZE,
  type TeamBuilderData,
  type TeamMember,
} from "@repo/lib";
import {
  Button,
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@repo/ui/controls";
import { SpriteIcon } from "@/lib/db/sprite-icon";
import type { TeamBuilderNames, TeamSpeciesInfo } from "./data";
import {
  chipFor,
  ElementChart,
  fmtMult,
  multClass,
  SpeciesIcon,
} from "./parts";

export type TeamBuilderProps = {
  data: TeamBuilderData;
  names: TeamBuilderNames;
  appName: string;
  iconsHash?: string;
  locale: string;
};

const LAST_KEY = "aniimo-team-builder-last";
const SAVED_KEY = "aniimo-team-builder-saved";
const COUNTERS_SHOWN = 12;

type Saved = { name: string; t: string };
type T = (key: string, vars?: Record<string, string | number>) => string;

export function TeamBuilder({
  data,
  names,
  appName,
  iconsHash,
  locale,
}: TeamBuilderProps) {
  const t: T = (key, vars) => {
    const v = names.labels[`tb.${key}`] ?? key;
    return vars
      ? interpolate(
          v,
          Object.fromEntries(
            Object.entries(vars).map(([k, x]) => [k, String(x)]),
          ),
        )
      : v;
  };
  const byId = useMemo(
    () => new Map(names.species.map((s) => [s.id, s])),
    [names.species],
  );
  const elementIds = data.elements.map((e) => e.id);

  const [team, setTeam] = useState<TeamMember[]>([]);
  const [enemy, setEnemy] = useState<string>();
  const [saved, setSaved] = useState<Saved[]>([]);
  const [copied, setCopied] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  // URL → state runs once; state → URL only after that (else the first,
  // empty state would overwrite a shared link before it is read).
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (hydrated) return;
    const q = new URLSearchParams(window.location.search);
    let initial = decodeTeam(data, q.get("t"));
    if (!initial.length && !q.has("t")) {
      try {
        initial = decodeTeam(data, localStorage.getItem(LAST_KEY));
      } catch {
        /* storage blocked */
      }
    }
    setTeam(initial);
    const vs = q.get("vs");
    if (vs && data.chart[vs]) setEnemy(vs);
    try {
      const s = JSON.parse(localStorage.getItem(SAVED_KEY) ?? "[]");
      if (Array.isArray(s))
        setSaved(
          s.filter(
            (x): x is Saved =>
              typeof x?.name === "string" && typeof x?.t === "string",
          ),
        );
    } catch {
      /* storage blocked */
    }
    setHydrated(true);
  }, [data, hydrated]);

  const shareUrl = () => {
    const q = new URLSearchParams();
    if (team.length) q.set("t", encodeTeam(team));
    if (enemy) q.set("vs", enemy);
    const qs = q.toString();
    return `${window.location.origin}${window.location.pathname}${qs ? `?${qs}` : ""}`;
  };

  useEffect(() => {
    if (!hydrated) return;
    const url = shareUrl();
    if (url !== window.location.href)
      window.history.replaceState(null, "", url);
    try {
      localStorage.setItem(LAST_KEY, encodeTeam(team));
    } catch {
      /* storage blocked */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, team, enemy]);

  const persistSaved = (next: Saved[]) => {
    setSaved(next);
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(next));
    } catch {
      /* storage blocked */
    }
  };

  const add = (id: string) =>
    setTeam((cur) =>
      cur.length >= TEAM_SIZE || cur.some((m) => m.id === id)
        ? cur
        : [...cur, { id }],
    );
  const remove = (id: string) =>
    setTeam((cur) => cur.filter((m) => m.id !== id));
  const toggleSkill = (id: string, skill: string) =>
    setTeam((cur) =>
      cur.map((m) => {
        if (m.id !== id) return m;
        const off = new Set(m.off ?? []);
        if (off.has(skill)) off.delete(skill);
        else off.add(skill);
        return off.size ? { id, off: [...off] } : { id };
      }),
    );

  const name = (id: string) => byId.get(id)?.name ?? id;
  const el = (id: string) => names.elements[id] ?? id;
  const role = (id?: string) => (id ? (names.roles[id] ?? id) : "");
  const list = (ids: string[]) => ids.map(el).join(", ");
  const Chip = useMemo(
    () => chipFor(data, names, appName, iconsHash),
    [data, names, appName, iconsHash],
  );
  const shared = { data, names, t, appName, iconsHash, locale, byId, Chip };

  const summary = summarizeTeam(data, team);
  const coverage = offenseCoverage(data, team);
  const defense = defenseProfile(data, team);
  const suggestions = hydrated ? suggestNext(data, team) : [];
  const counters = enemy
    ? rankCounters(data, enemy).slice(0, COUNTERS_SHOWN)
    : [];
  const full = team.length >= TEAM_SIZE;

  return (
    <div className="space-y-8">
      {/* -- Team ------------------------------------------------------ */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("yourTeam")} · {team.length}/{TEAM_SIZE}
          </h2>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!team.length}
              onClick={() => {
                const label = window.prompt(
                  t("teamName"),
                  team.map((m) => name(m.id)).join(" / "),
                );
                if (!label) return;
                persistSaved([
                  { name: label, t: encodeTeam(team) },
                  ...saved.filter((s) => s.name !== label),
                ]);
              }}
            >
              {t("save")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!team.length}
              onClick={() => setTeam([])}
            >
              {t("clear")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                navigator.clipboard?.writeText(shareUrl()).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                });
              }}
            >
              {copied ? t("copied") : t("share")}
            </Button>
          </div>
        </div>

        <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,18rem),1fr))]">
          {team.map((m) => (
            <MemberCard
              key={m.id}
              member={m}
              onRemove={() => remove(m.id)}
              onToggleSkill={(s) => toggleSkill(m.id, s)}
              {...shared}
            />
          ))}
          {!full && (
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="flex min-h-40 flex-col items-center justify-center gap-1 rounded-md border border-dashed text-muted-foreground hover:bg-accent"
            >
              <span className="text-3xl leading-none">+</span>
              <span className="text-sm">{t("addAniimo")}</span>
            </button>
          )}
        </div>

        <SpeciesPicker
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          exclude={new Set(team.map((m) => m.id))}
          onPick={(id) => {
            add(id);
            setPickerOpen(false);
          }}
          {...shared}
        />

        {saved.length > 0 && (
          <div className="space-y-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("saved")}
            </h3>
            <ul className="flex flex-wrap gap-2">
              {saved.map((s) => (
                <li
                  key={s.name}
                  className="flex items-center gap-1 rounded-md border px-2 py-1 text-sm"
                >
                  <button
                    type="button"
                    className="hover:text-amber-300"
                    onClick={() => setTeam(decodeTeam(data, s.t))}
                  >
                    {s.name}
                  </button>
                  <button
                    type="button"
                    aria-label={t("delete")}
                    className="text-muted-foreground hover:text-rose-400"
                    onClick={() =>
                      persistSaved(saved.filter((x) => x.name !== s.name))
                    }
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* -- Analysis -------------------------------------------------- */}
      {team.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("summary")}
          </h2>
          <ul className="grid gap-2 text-sm [grid-template-columns:repeat(auto-fit,minmax(min(100%,16rem),1fr))]">
            <SummaryItem
              ok={summary.notCovered.length === 0}
              title={t("superEffective", {
                count: summary.superEffective.length,
                total: elementIds.length,
              })}
              detail={
                summary.notCovered.length
                  ? t("notCovered", { list: list(summary.notCovered) })
                  : undefined
              }
            />
            <SummaryItem
              ok={summary.shared.length === 0}
              title={
                summary.shared.length
                  ? t("shared", { list: list(summary.shared) })
                  : t("noShared")
              }
            />
            <SummaryItem
              ok={summary.missingRoles.length === 0}
              title={
                summary.missingRoles.length
                  ? t("missingRoles", {
                      list: summary.missingRoles.map((r) => role(r)).join(", "),
                    })
                  : t("allRoles")
              }
            />
          </ul>

          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[36rem] text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-2 py-1 text-left font-medium">
                    {t("element")}
                  </th>
                  <th className="px-2 py-1 text-left font-medium">
                    {t("offense")}
                  </th>
                  {team.map((m) => (
                    <th key={m.id} className="px-2 py-1 font-medium">
                      <span className="inline-flex items-center gap-1">
                        <SpeciesIcon
                          info={byId.get(m.id)}
                          size={20}
                          appName={appName}
                          iconsHash={iconsHash}
                        />
                        <span className="max-w-24 truncate">{name(m.id)}</span>
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {elementIds.map((e, i) => {
                  const cov = coverage[i];
                  const def = defense[i];
                  return (
                    <tr key={e}>
                      <td className="px-2 py-1">
                        <Chip id={e} />
                      </td>
                      <td className="px-2 py-1">
                        <span
                          className={`font-semibold ${multClass(cov.multiplier, true)}`}
                        >
                          {fmtMult(cov.multiplier)}
                        </span>
                        {cov.by.length > 0 && cov.multiplier > 1 && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            {cov.by
                              .slice(0, 2)
                              .map(
                                (b) =>
                                  `${name(b.member)}: ${names.skills[b.skill] ?? b.skill}`,
                              )
                              .join(" · ")}
                            {cov.by.length > 2 && ` +${cov.by.length - 2}`}
                          </span>
                        )}
                      </td>
                      {def.taken.map((x, j) => (
                        <td
                          key={team[j].id}
                          className={`px-2 py-1 text-center ${multClass(x, false)} ${x > 1 && def.weak >= 2 ? "bg-rose-500/10" : ""}`}
                        >
                          {fmtMult(x)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("offenseHint")} {t("defenseHint")}
          </p>

          <div className="space-y-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("teamStats")}
            </h3>
            <StatBars
              stats={summary.stats}
              max={Math.max(...summary.stats, 1)}
              t={t}
            />
          </div>
        </section>
      )}

      {/* -- Suggestions ----------------------------------------------- */}
      {!full && suggestions.length > 0 && team.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("suggestions")}
          </h2>
          <ul className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(min(100%,18rem),1fr))]">
            {suggestions.map((s) => {
              const why = [
                s.covers.length
                  ? t("suggest.covers", { list: list(s.covers) })
                  : "",
                s.fillsRole
                  ? t("suggest.fills", { role: role(s.fillsRole) })
                  : "",
                s.steadies.length
                  ? t("suggest.steadies", { list: list(s.steadies) })
                  : "",
              ].filter(Boolean);
              return (
                <li
                  key={s.id}
                  className="flex items-center gap-2 rounded-md border px-2 py-1.5"
                >
                  <SpeciesIcon
                    info={byId.get(s.id)}
                    size={36}
                    appName={appName}
                    iconsHash={iconsHash}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 text-sm">
                      <span className="truncate">{name(s.id)}</span>
                      <Chip id={data.species[s.id].main} compact />
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {why.join(" · ")}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => add(s.id)}>
                    {t("add")}
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* -- Counter finder -------------------------------------------- */}
      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("counters")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("countersHint")}</p>
        <div className="flex flex-wrap gap-1">
          {elementIds.map((e) => (
            <button
              key={e}
              type="button"
              aria-pressed={enemy === e}
              onClick={() => setEnemy(enemy === e ? undefined : e)}
              className={`rounded-md border px-2 py-1 ${enemy === e ? "border-amber-300 bg-accent" : "hover:bg-accent"}`}
            >
              <Chip id={e} />
            </button>
          ))}
        </div>
        {enemy && (
          <ol className="divide-y rounded-md border">
            {counters.map((c, i) => (
              <li key={c.id} className="flex items-center gap-2 px-2 py-1.5">
                <span className="w-5 text-right text-xs text-muted-foreground">
                  {i + 1}
                </span>
                <SpeciesIcon
                  info={byId.get(c.id)}
                  size={32}
                  appName={appName}
                  iconsHash={iconsHash}
                />
                <div className="min-w-0 flex-1">
                  <Link
                    href={localizePath(`/team-builder/${c.id}`, locale)}
                    className="text-sm hover:text-amber-300"
                  >
                    {name(c.id)}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">
                    {role(data.species[c.id].role)}
                    {c.skill &&
                      ` · ${names.skills[c.skill.id] ?? c.skill.id} (${t("power")} ${c.skill.power})`}
                  </p>
                </div>
                <span className="text-xs">
                  {t("counter.offense")}{" "}
                  <b className={multClass(c.offense, true)}>
                    {fmtMult(c.offense)}
                  </b>
                </span>
                <span className="text-xs">
                  {t("counter.taken")}{" "}
                  <b className={multClass(c.taken, false)}>
                    {fmtMult(c.taken)}
                  </b>
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={full || team.some((m) => m.id === c.id)}
                  onClick={() => add(c.id)}
                >
                  {t("add")}
                </Button>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* -- The game's own recommendations ---------------------------- */}
      {data.recommended.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("recommended")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("recommendedHint")}
          </p>
          <ul className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(min(100%,24rem),1fr))]">
            {data.recommended.map((r) => (
              <li key={r.element} className="space-y-1 rounded-md border p-2">
                <div className="flex items-center gap-2">
                  <Chip id={r.element} />
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-auto"
                    onClick={() => setTeam(recommendedTeam(data, r.element))}
                  >
                    {t("useTeam")}
                  </Button>
                </div>
                <ul className="space-y-0.5 text-sm">
                  {data.roles
                    .filter((ro) => r.roles[ro.id]?.length)
                    .map((ro) => (
                      <li
                        key={ro.id}
                        className="flex flex-wrap items-center gap-x-2"
                      >
                        <span className="w-20 shrink-0 text-xs text-muted-foreground">
                          {role(ro.id)}
                        </span>
                        {r.roles[ro.id].map((id) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => add(id)}
                            disabled={full}
                            className="inline-flex items-center gap-1 rounded px-1 hover:bg-accent disabled:opacity-60"
                            title={t("add")}
                          >
                            <SpeciesIcon
                              info={byId.get(id)}
                              size={22}
                              appName={appName}
                              iconsHash={iconsHash}
                            />
                            {name(id)}
                          </button>
                        ))}
                      </li>
                    ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* -- Element chart --------------------------------------------- */}
      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("chart")}
        </h2>
        <ElementChart
          data={data}
          names={names}
          label={(k) => t(k)}
          appName={appName}
          iconsHash={iconsHash}
        />
      </section>
    </div>
  );
}

type Shared = {
  data: TeamBuilderData;
  names: TeamBuilderNames;
  t: T;
  appName: string;
  iconsHash?: string;
  locale: string;
  byId: Map<string, TeamSpeciesInfo>;
  Chip: ReturnType<typeof chipFor>;
};

function SummaryItem({
  ok,
  title,
  detail,
}: {
  ok: boolean;
  title: string;
  detail?: string;
}) {
  return (
    <li className="rounded-md border px-3 py-2">
      <span className={ok ? "text-emerald-400" : "text-amber-300"}>
        {ok ? "✓ " : "! "}
      </span>
      {title}
      {detail && (
        <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
      )}
    </li>
  );
}

function StatBars({ stats, max, t }: { stats: number[]; max: number; t: T }) {
  return (
    <dl className="grid grid-cols-[auto_1fr_auto] items-center gap-x-2 gap-y-0.5 text-xs">
      {STAT_KEYS.map((k, i) => (
        <div key={k} className="contents">
          <dt className="text-muted-foreground">{t(`stats.${k}`)}</dt>
          <dd className="h-1.5 overflow-hidden rounded bg-muted">
            <div
              className="h-full rounded bg-slate-400"
              style={{ width: `${Math.round(((stats[i] ?? 0) / max) * 100)}%` }}
            />
          </dd>
          <dd className="text-right tabular-nums">{stats[i] ?? 0}</dd>
        </div>
      ))}
    </dl>
  );
}

function MemberCard({
  member,
  onRemove,
  onToggleSkill,
  ...s
}: Shared & {
  member: TeamMember;
  onRemove: () => void;
  onToggleSkill: (skill: string) => void;
}) {
  const { data, names, t, appName, iconsHash, locale, byId } = s;
  const sp = data.species[member.id];
  const info = byId.get(member.id);
  const all = damageSkills(data, member.id);
  const on = new Set(activeSkills(data, member).map((x) => x.id));
  const roleIcon = sp.role ? names.roleIcons[sp.role] : undefined;
  return (
    <div className="flex flex-col gap-2 rounded-md border p-2">
      <div className="flex items-start gap-2">
        <SpeciesIcon
          info={info}
          size={56}
          appName={appName}
          iconsHash={iconsHash}
        />
        <div className="min-w-0 flex-1">
          <Link
            href={localizePath(`/team-builder/${member.id}`, locale)}
            className="block truncate font-medium hover:text-amber-300"
          >
            {info?.name ?? member.id}
          </Link>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            {sp.elements.map((e) => (
              <s.Chip key={e} id={e} />
            ))}
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            {roleIcon && (
              <SpriteIcon
                icon={roleIcon}
                appName={appName}
                iconsHash={iconsHash}
                size={16}
              />
            )}
            {names.roles[sp.role ?? ""] ?? sp.role}
          </div>
        </div>
        <button
          type="button"
          aria-label={t("remove")}
          title={t("remove")}
          onClick={onRemove}
          className="text-muted-foreground hover:text-rose-400"
        >
          ×
        </button>
      </div>
      <StatBars stats={sp.stats} max={160} t={t} />
      {all.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground" title={t("skillsHint")}>
            {t("skills")}
          </p>
          <ul className="flex flex-wrap gap-1">
            {all.map((sk) => {
              const active = on.has(sk.id);
              const color = data.elements.find(
                (e) => e.id === sk.element,
              )?.color;
              return (
                <li key={sk.id}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => onToggleSkill(sk.id)}
                    title={`${names.elements[sk.element ?? ""] ?? ""} · ${t("power")} ${sk.power}${sk.ep ? ` · ${t("ep")} ${sk.ep}` : ""}${sk.cd ? ` · ${t("cd")} ${sk.cd}s` : ""}`}
                    className={`rounded border px-1.5 py-0.5 text-xs ${active ? "" : "opacity-40 line-through"}`}
                    style={{ borderColor: color }}
                  >
                    {names.skills[sk.id] ?? sk.id}
                    <span className="ml-1 text-muted-foreground">
                      {sk.power}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <Link
        href={localizePath(`/db/aniimo/${member.id}`, locale)}
        className="mt-auto text-xs text-primary hover:underline"
      >
        {t("codex")}
      </Link>
    </div>
  );
}

function SpeciesPicker({
  open,
  onOpenChange,
  exclude,
  onPick,
  data,
  names,
  appName,
  iconsHash,
  t,
  Chip,
}: Shared & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exclude: Set<string>;
  onPick: (id: string) => void;
}) {
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder={t("search")} />
      <CommandList>
        <CommandEmpty>{t("none")}</CommandEmpty>
        {names.species
          .filter((sp) => !exclude.has(sp.id))
          .map((sp) => {
            const d = data.species[sp.id];
            const elements = d.elements.map((e) => names.elements[e] ?? e);
            const roleLabel = names.roles[d.role ?? ""] ?? d.role ?? "";
            return (
              <CommandItem
                key={sp.id}
                value={`${sp.name} ${elements.join(" ")} ${roleLabel} ${sp.id}`}
                onSelect={() => onPick(sp.id)}
              >
                <SpeciesIcon
                  info={sp}
                  size={28}
                  appName={appName}
                  iconsHash={iconsHash}
                />
                <span className="ml-2">{sp.name}</span>
                <span className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                  {d.elements.map((e) => (
                    <Chip key={e} id={e} compact />
                  ))}
                  {roleLabel}
                </span>
              </CommandItem>
            );
          })}
      </CommandList>
    </CommandDialog>
  );
}
