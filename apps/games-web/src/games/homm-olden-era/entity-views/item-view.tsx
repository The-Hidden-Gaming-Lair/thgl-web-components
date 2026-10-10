import Link from "next/link";
import { localizePath } from "@repo/lib";
import { resolveDict } from "@/lib/db/resolve-dict";
import { BonusList } from "@/games/homm-olden-era/bonus-display";
import { SpriteIcon } from "@/lib/db/sprite-icon";
import { EntityLinkCard } from "@/games/homm-olden-era/cross-link";

const APP_NAME = "homm-olden-era";

type ItemProps = {
  slot: string;
  rarity: string;
  itemSet?: string;
  itemsInSet?: string[];
  goodsValue: number;
  costBase: number;
  maxLevel: number;
  bonuses: {
    type: string;
    params?: (string | number)[];
    upgrade?: { increment: number; levelStep: number };
  }[];
};

type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

const RARITY_COLORS: Record<string, string> = {
  common: "text-slate-300 border-slate-600 bg-slate-800/30",
  uncommon: "text-green-400 border-green-800/50 bg-green-900/20",
  rare: "text-blue-400 border-blue-800/50 bg-blue-900/20",
  epic: "text-purple-400 border-purple-800/50 bg-purple-900/20",
  legendary: "text-amber-400 border-amber-800/50 bg-amber-900/20",
};

export function ItemView({
  name,
  desc,
  icon,
  props,
  dict,
  database,
  locale = "en",
  iconsHash,
}: {
  name: string;
  desc: string;
  icon?: IconSprite;
  props: ItemProps;
  dict: Record<string, string>;
  database: any[];
  locale?: string;
  iconsHash?: string;
}) {
  const isItemSet = !props.slot;
  if (isItemSet) {
    const memberIds: string[] = props.itemsInSet ?? [];

    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
          <span className="text-sm px-2.5 py-0.5 rounded bg-amber-900/30 text-amber-400 border border-amber-800/50 mt-1 inline-block">
            {resolveDict(dict, "item_sets")}
          </span>
        </div>

        {props.bonuses && props.bonuses.length > 0 && (
          <div>
            <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
              {resolveDict(dict, "ui.set_bonus")}
            </h2>
            <div className="space-y-2">
              {props.bonuses.map((tier: any, i: number) => {
                const tierDesc = tier.desc
                  ? resolveDict(dict, tier.desc)
                  : undefined;
                const hasTierDesc = tierDesc && tierDesc !== tier.desc;

                return (
                  <div
                    key={i}
                    className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-4"
                  >
                    <div className="text-sm font-medium text-amber-400 mb-1">
                      {tier.requiredItems}{" "}
                      {resolveDict(dict, "ui.items_in_set").toLowerCase()}
                    </div>
                    {hasTierDesc ? (
                      <p className="text-sm">
                        {tierDesc.replace(
                          /\{(\d+)\}/g,
                          (_: string, idx: string) => {
                            const paramIdx = parseInt(idx);
                            const value =
                              tier.effects?.[0]?.params?.[paramIdx + 1];
                            return value != null ? String(value) : `{${idx}}`;
                          },
                        )}
                      </p>
                    ) : tier.effects && tier.effects.length > 0 ? (
                      <BonusList
                        bonuses={tier.effects}
                        dict={dict}
                        locale={locale}
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {memberIds.length > 0 && (
          <div>
            <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
              {resolveDict(dict, "ui.items_in_set")}
            </h2>
            <div className="flex flex-wrap gap-2">
              {memberIds.map((itemId: string) => (
                <EntityLinkCard
                  key={itemId}
                  itemId={itemId}
                  database={database}
                  locale={locale}
                  dict={dict}
                  iconsHash={iconsHash}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const rarityStyle = RARITY_COLORS[props.rarity] ?? RARITY_COLORS.common;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        {icon && (
          <SpriteIcon
            icon={icon}
            appName={APP_NAME}
            size={64}
            iconsHash={iconsHash}
          />
        )}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span
              className={`text-sm px-2.5 py-0.5 rounded border capitalize ${rarityStyle}`}
            >
              {resolveDict(dict, `ui.rarity_${props.rarity}`)}
            </span>
            <span className="text-sm px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 capitalize">
              {(() => {
                const slotKey = `ui.slot_${props.slot}`;
                const resolved = resolveDict(dict, slotKey);
                if (resolved !== slotKey) return resolved;
                return props.slot.replace(/_slot$/, "").replace(/_/g, " ");
              })()}
            </span>
            {props.itemSet && (
              <Link
                prefetch={false}
                href={localizePath(`/db/artifacts/${props.itemSet}`, locale)}
                className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
              >
                {resolveDict(dict, "ui.set_prefix")}{" "}
                {resolveDict(dict, props.itemSet)}
              </Link>
            )}
          </div>
        </div>
      </div>

      {(() => {
        if (!desc || desc === name || desc.includes("_desc")) return null;
        const numericValues: string[] = [];
        for (const b of props.bonuses ?? []) {
          for (const p of b.params ?? []) {
            if (/^\d+$/.test(String(p)) && !numericValues.includes(String(p))) {
              numericValues.push(String(p));
            }
          }
        }
        const resolved = desc.replace(/\{(\d+)\}/g, (_, idx) => {
          return numericValues[parseInt(idx)] ?? `{${idx}}`;
        });
        return (
          <p className="text-muted-foreground italic border-l-2 border-amber-800/50 pl-3">
            {resolved}
          </p>
        );
      })()}

      <div className="grid grid-cols-3 gap-1">
        <div className="bg-slate-900/50 border border-slate-800 rounded px-3 py-2 text-center">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            {resolveDict(dict, "ui.value")}
          </div>
          <div className="text-lg font-semibold text-amber-400">
            {props.goodsValue?.toLocaleString()}
          </div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded px-3 py-2 text-center">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            {resolveDict(dict, "ui.cost")}
          </div>
          <div className="text-lg font-semibold text-slate-300">
            {props.costBase}
          </div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded px-3 py-2 text-center">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            {resolveDict(dict, "ui.max_level")}
          </div>
          <div className="text-lg font-semibold text-cyan-400">
            {props.maxLevel}
          </div>
        </div>
      </div>

      {props.bonuses && props.bonuses.length > 0 && (
        <div>
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
            {resolveDict(dict, "ui.bonuses")}
          </h2>
          <div className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-4">
            <BonusList bonuses={props.bonuses} dict={dict} locale={locale} />
          </div>
        </div>
      )}
    </div>
  );
}
