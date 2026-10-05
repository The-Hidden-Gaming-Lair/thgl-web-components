import Image from "next/image";
import { getIconsUrl } from "@repo/lib";

const APP_NAME = "once-human";

/**
 * Once Human's weapon `quality` field is the standard MMO rarity
 * scale, capped at 5. Each tier gets its own colour theme on the
 * card border + a coloured pill in the corner so users can scan
 * rarities at a glance.
 */
const RARITY_TIERS = [
  {
    quality: 5,
    label: "Legendary",
    cardClass: "border-amber-700/60 hover:border-amber-500/70 bg-amber-950/30",
    pillClass: "bg-amber-900/40 text-amber-400 border-amber-800/50",
    heading: "text-amber-400",
  },
  {
    quality: 4,
    label: "Epic",
    cardClass:
      "border-purple-700/60 hover:border-purple-500/70 bg-purple-950/30",
    pillClass: "bg-purple-900/40 text-purple-400 border-purple-800/50",
    heading: "text-purple-400",
  },
  {
    quality: 3,
    label: "Rare",
    cardClass: "border-blue-700/60 hover:border-blue-500/70 bg-blue-950/30",
    pillClass: "bg-blue-900/40 text-blue-400 border-blue-800/50",
    heading: "text-blue-400",
  },
  {
    quality: 2,
    label: "Uncommon",
    cardClass: "border-green-700/60 hover:border-green-500/70 bg-green-950/30",
    pillClass: "bg-green-900/40 text-green-400 border-green-800/50",
    heading: "text-green-400",
  },
  {
    quality: 1,
    label: "Common",
    cardClass: "border-slate-700/60 hover:border-slate-500/70 bg-slate-900/30",
    pillClass: "bg-slate-800 text-slate-300 border-slate-700",
    heading: "text-slate-300",
  },
] as const;

export type WeaponItem = {
  id: string;
  name: string;
  icon: string;
  quality: number;
  durability: number;
  weight: number;
};

/**
 * Group weapons by rarity (legendary → common) and render each as an
 * icon card. The weapons category is small enough (~100 items) to
 * render in one pass without virtualization.
 */
export function WeaponsGrid({
  weapons,
  labels,
}: {
  weapons: WeaponItem[];
  /** Localized UI words (English fallbacks above / below). */
  labels?: {
    rarity?: Record<number, string>;
    durability?: string;
    weight?: string;
  };
}) {
  const byRarity = new Map<number, WeaponItem[]>();
  for (const w of weapons) {
    const r = Math.max(1, Math.min(5, Math.floor(w.quality ?? 1)));
    if (!byRarity.has(r)) byRarity.set(r, []);
    byRarity.get(r)!.push(w);
  }
  // Stable name sort within each rarity.
  for (const list of byRarity.values()) {
    list.sort((a, b) => a.name.localeCompare(b.name));
  }

  return (
    <div className="space-y-10">
      {RARITY_TIERS.map((tier) => {
        const list = byRarity.get(tier.quality);
        if (!list || list.length === 0) return null;
        return (
          <section key={tier.quality} className="space-y-4">
            <header className="flex items-baseline justify-between border-b border-slate-800 pb-2">
              <h2 className={`text-lg font-semibold ${tier.heading}`}>
                {labels?.rarity?.[tier.quality] ?? tier.label}
              </h2>
              <span className="text-xs text-muted-foreground tabular-nums">
                {list.length}
              </span>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {list.map((w) => (
                <article
                  key={w.id}
                  id={w.id}
                  className={`group border rounded-lg p-3 transition-colors flex flex-col gap-2 scroll-mt-20 ${tier.cardClass}`}
                >
                  <div className="aspect-169/50 bg-black/30 rounded flex items-center justify-center overflow-hidden">
                    <Image
                      src={getIconsUrl(APP_NAME, w.icon)}
                      alt=""
                      width={169}
                      height={50}
                      className="object-contain"
                    />
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-medium line-clamp-2">
                      {w.name}
                    </h3>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 border ${tier.pillClass}`}
                    >
                      {labels?.rarity?.[tier.quality] ?? tier.label}
                    </span>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                    {typeof w.durability === "number" && (
                      <>
                        <dt>{labels?.durability ?? "Durability"}</dt>
                        <dd className="text-right text-foreground tabular-nums">
                          {w.durability}
                        </dd>
                      </>
                    )}
                    {typeof w.weight === "number" && (
                      <>
                        <dt>{labels?.weight ?? "Weight"}</dt>
                        <dd className="text-right text-foreground tabular-nums">
                          {w.weight}
                        </dd>
                      </>
                    )}
                  </dl>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
