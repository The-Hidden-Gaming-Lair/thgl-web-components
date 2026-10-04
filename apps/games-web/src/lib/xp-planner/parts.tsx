import { interpolate } from "@repo/lib";

/**
 * Hook-free pieces shared by the server-rendered /xp-planner pages and the
 * client planner.
 */

export function xpT(labels: Record<string, string>) {
  return (key: string, vars?: Record<string, string | number>) => {
    const v = labels[`xp.${key}`] ?? key;
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

export const fmt = (n: number, locale: string, digits = 0) =>
  n.toLocaleString(locale, { maximumFractionDigits: digits });

/** "23 XP per ore", "0.33 XP per damage". */
export function xpPerUnit(
  t: ReturnType<typeof xpT>,
  xp: number,
  unit: string,
  locale: string,
) {
  return t("perUnit", {
    xp: fmt(xp, locale, 3),
    unit: t(`unit.${unit}`),
  });
}

export function FlagBadge({
  flag,
  labels,
}: {
  flag?: string;
  labels: Record<string, string>;
}) {
  if (!flag) return null;
  const t = xpT(labels);
  return (
    <span
      title={t(`flag.${flag}.help`)}
      className="rounded border border-slate-700 bg-slate-900/60 px-1.5 py-0.5 text-[11px] text-slate-300"
    >
      {t(`flag.${flag}`)}
    </span>
  );
}
