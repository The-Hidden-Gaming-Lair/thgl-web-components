import type { IconSprite, TeamBuilderData } from "@repo/lib";
import { SpriteIcon } from "@/lib/db/sprite-icon";
import type { TeamBuilderNames, TeamSpeciesInfo } from "./data";

/**
 * Hook-free display pieces shared by the client builder and the
 * server-rendered matchup pages (no "use client": each side renders them
 * in its own environment, so no data crosses the boundary per chip).
 */

/** Colour for a multiplier: green = good for us, red = bad for us. */
export function multClass(x: number, goodWhenHigh: boolean) {
  if (x === 1) return "text-muted-foreground";
  const good = goodWhenHigh ? x > 1 : x < 1;
  return good ? "text-emerald-400" : "text-rose-400";
}

export const fmtMult = (x: number) => `×${Number(x.toFixed(3))}`;

export function SpeciesIcon({
  info,
  size,
  appName,
  iconsHash,
}: {
  info?: TeamSpeciesInfo;
  size: number;
  appName: string;
  iconsHash?: string;
}) {
  return info?.icon ? (
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
  );
}

export type ElementInfo = TeamBuilderData["elements"][number];

export function ElementChip({
  element,
  icon,
  label,
  compact,
  appName,
  iconsHash,
}: {
  element?: ElementInfo;
  icon?: IconSprite;
  label: string;
  compact?: boolean;
  appName: string;
  iconsHash?: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 whitespace-nowrap text-xs"
      title={label}
    >
      {icon ? (
        <SpriteIcon
          icon={icon}
          appName={appName}
          iconsHash={iconsHash}
          size={16}
        />
      ) : (
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ background: element?.color ?? "currentColor" }}
        />
      )}
      {compact ? null : <span style={{ color: element?.color }}>{label}</span>}
    </span>
  );
}

/** Element chip by id, bound to one dataset + its localized names. */
export function chipFor(
  data: TeamBuilderData,
  names: Pick<TeamBuilderNames, "elements" | "elementIcons">,
  appName: string,
  iconsHash?: string,
) {
  const byId = new Map(data.elements.map((e) => [e.id, e]));
  return function Chip({ id, compact }: { id: string; compact?: boolean }) {
    return (
      <ElementChip
        element={byId.get(id)}
        icon={names.elementIcons[id]}
        label={names.elements[id] ?? id}
        compact={compact}
        appName={appName}
        iconsHash={iconsHash}
      />
    );
  };
}

export function ElementChart({
  data,
  names,
  label,
  appName,
  iconsHash,
}: {
  data: TeamBuilderData;
  names: Pick<TeamBuilderNames, "elements" | "elementIcons">;
  label: (key: string) => string;
  appName: string;
  iconsHash?: string;
}) {
  const Chip = chipFor(data, names, appName, iconsHash);
  const ids = data.elements.map((e) => e.id);
  return (
    <div className="space-y-1">
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-[32rem] text-center text-xs">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="px-1 py-1 text-left font-medium">
                {label("attacker")} ↓ / {label("defender")} →
              </th>
              {ids.map((d) => (
                <th key={d} className="px-1 py-1 font-medium">
                  <Chip id={d} compact />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {ids.map((a) => (
              <tr key={a}>
                <th className="px-1 py-1 text-left font-normal">
                  <Chip id={a} />
                </th>
                {ids.map((d) => {
                  const x = data.chart[a]?.[d] ?? 1;
                  return (
                    <td
                      key={d}
                      className={`px-1 py-1 tabular-nums ${multClass(x, true)}`}
                    >
                      {x === 1 ? "·" : fmtMult(x)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">{label("chartHint")}</p>
    </div>
  );
}
