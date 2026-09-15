"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@repo/ui/controls";
import { DataTable, type ColumnDef } from "@repo/ui/data";
import {
  PackageIcon,
  SnowflakeIcon,
  TreesIcon,
  UmbrellaIcon,
  HomeIcon,
  MountainIcon,
  ArrowUpDown,
  PlusIcon,
  MinusIcon,
  RotateCcwIcon,
  ExternalLinkIcon,
} from "lucide-react";
import { useT } from "@repo/ui/providers";
import rummageLoot from "./rummage-loot.json";

const STORAGE_KEY = "palia-rummage-loot-tracker";

type Locale = (typeof rummageLoot.locales)[number];

type LootItem = {
  id: string;
  name: string;
  weight: number;
  chance: string;
  icon: string;
  rarity?: string;
  isRecipe?: boolean;
  isQuest?: boolean;
  isSeasonal?: boolean;
};

// Check if an item can only be collected once (recipes and quest items)
function isOneTimeItem(item: LootItem): boolean {
  return !!(item.isRecipe || item.isQuest);
}

// Generate paliapedia URL from item ID
function getPaliapediaUrl(itemId: string): string {
  // Remove DA_ItemType_ prefix and convert to lowercase with hyphens
  const slug = itemId
    .replace(/^DA_ItemType_/, "")
    .toLowerCase()
    .replace(/_/g, "-");
  return `https://paliapedia.com/item/${slug}/`;
}

// Calculate adjusted drop chances based on collected one-time items
function calculateAdjustedChances(
  items: LootItem[],
  poolId: string,
  tracker: TrackerData,
): Map<string, string> {
  const chances = new Map<string, string>();

  // Calculate weight of collected one-time items
  let collectedOneTimeWeight = 0;
  for (const item of items) {
    if (isOneTimeItem(item) && (tracker[poolId]?.[item.id] || 0) >= 1) {
      collectedOneTimeWeight += item.weight;
    }
  }

  // Calculate total remaining weight
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  const adjustedTotalWeight = totalWeight - collectedOneTimeWeight;

  // Calculate adjusted chance for each item
  for (const item of items) {
    const isCollectedOneTime =
      isOneTimeItem(item) && (tracker[poolId]?.[item.id] || 0) >= 1;

    if (isCollectedOneTime) {
      // Collected one-time items have 0% chance
      chances.set(item.id, "0%");
    } else if (adjustedTotalWeight > 0) {
      // Recalculate chance based on adjusted total
      const chance = ((item.weight / adjustedTotalWeight) * 100).toFixed(1);
      chances.set(item.id, `${chance}%`);
    } else {
      chances.set(item.id, item.chance);
    }
  }

  return chances;
}

type LootPool = {
  nameKey: string;
  locationKey: string;
  items: LootItem[];
  totalWeight: number;
};

type TrackerData = Record<string, Record<string, number>>;

const pools = rummageLoot.pools as Record<string, LootPool>;
const itemTranslations = rummageLoot.translations.items;

const tabs = [
  {
    id: "chapaaNest",
    icon: HomeIcon,
    poolKey: "chapaaNest",
  },
  {
    id: "beachTrash",
    icon: UmbrellaIcon,
    poolKey: "beachTrash",
  },
  {
    id: "elderwood",
    icon: TreesIcon,
    poolKey: "elderwood",
  },
  {
    id: "royalHighlands",
    icon: MountainIcon,
    poolKey: "royalHighlands",
  },
];

const rarityOrder: Record<string, number> = {
  Common: 1,
  Uncommon: 2,
  Rare: 3,
  Epic: 4,
  Legendary: 5,
};

const rarityColors: Record<string, string> = {
  Common: "text-zinc-400",
  Uncommon: "text-emerald-400",
  Rare: "text-sky-400",
  Epic: "text-violet-400",
  Legendary: "text-amber-400",
};

const rarityBgColors: Record<string, string> = {
  Common: "bg-zinc-500/10 border-zinc-500/20",
  Uncommon: "bg-emerald-500/10 border-emerald-500/20",
  Rare: "bg-sky-500/10 border-sky-500/20",
  Epic: "bg-violet-500/10 border-violet-500/20",
  Legendary: "bg-amber-500/10 border-amber-500/20",
};

// Get item name translation from rummage-loot.json
function getItemName(itemId: string, locale: Locale): string {
  const translation = itemTranslations[
    itemId as keyof typeof itemTranslations
  ] as Record<Locale, string> | undefined;
  if (translation) {
    return translation[locale] || translation.en;
  }
  return itemId;
}

function createColumns(
  poolId: string,
  items: LootItem[],
  tracker: TrackerData,
  locale: Locale,
  t: (key: string) => string,
  onIncrement: (poolId: string, itemName: string) => void,
  onDecrement: (poolId: string, itemName: string) => void,
): ColumnDef<LootItem>[] {
  // Calculate adjusted chances based on collected one-time items
  const adjustedChances = calculateAdjustedChances(items, poolId, tracker);

  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="-ml-4"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("rummagePile.loot.column.item")}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const item = row.original;
        const itemName = getItemName(item.id, locale);
        const isCollectedOneTime =
          isOneTimeItem(item) && (tracker[poolId]?.[item.id] || 0) >= 1;
        const paliapediaUrl = getPaliapediaUrl(item.id);
        return (
          <div
            className={`flex items-center gap-2 ${isCollectedOneTime ? "opacity-50" : ""}`}
          >
            <a
              href={paliapediaUrl}
              target="_blank"
              rel="noopener"
              className={`inline-flex items-center gap-1 font-medium hover:text-primary hover:underline ${isCollectedOneTime ? "line-through" : ""}`}
            >
              {itemName}
              <ExternalLinkIcon className="w-3 h-3 opacity-50" />
            </a>
            {item.isRecipe && (
              <span className="shrink-0 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {t("rummagePile.label.recipe")}
              </span>
            )}
            {item.isQuest && (
              <span className="shrink-0 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-violet-500/10 text-violet-400 border border-violet-500/20">
                {t("rummagePile.label.quest")}
              </span>
            )}
            {item.isSeasonal && (
              <span
                className="shrink-0 text-sky-400"
                title={t("rummagePile.label.seasonal")}
              >
                <SnowflakeIcon className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "chance",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="-ml-4"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("rummagePile.loot.column.chance")}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const item = row.original;
        const adjustedChance = adjustedChances.get(item.id) || item.chance;
        const isCollectedOneTime =
          isOneTimeItem(item) && (tracker[poolId]?.[item.id] || 0) >= 1;
        return (
          <span
            className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-sm font-medium border ${
              isCollectedOneTime
                ? "bg-muted/30 text-muted-foreground/50 border-muted/20"
                : "bg-primary/10 text-primary border-primary/20"
            }`}
          >
            {adjustedChance}
          </span>
        );
      },
      sortingFn: (rowA, rowB) => {
        // Sort by adjusted chance
        const a = parseFloat(
          adjustedChances.get(rowA.original.id) || rowA.original.chance,
        );
        const b = parseFloat(
          adjustedChances.get(rowB.original.id) || rowB.original.chance,
        );
        return a - b;
      },
    },
    {
      accessorKey: "rarity",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="-ml-4"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("rummagePile.loot.column.rarity")}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const rarity = row.getValue("rarity") as string | undefined;
        if (!rarity) {
          return <span className="text-muted-foreground/50">—</span>;
        }
        const rarityName = t(`rummagePile.rarity.${rarity}`);
        return (
          <span
            className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
              rarityBgColors[rarity] || "bg-muted/50"
            } ${rarityColors[rarity] || "text-muted-foreground"}`}
          >
            {rarityName}
          </span>
        );
      },
      sortingFn: (rowA, rowB) => {
        const a = rarityOrder[rowA.original.rarity || ""] || 0;
        const b = rarityOrder[rowB.original.rarity || ""] || 0;
        return a - b;
      },
    },
    {
      id: "collected",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="-ml-4"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("rummagePile.loot.column.collected")}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      accessorFn: (row) => tracker[poolId]?.[row.id] || 0,
      cell: ({ row }) => {
        const item = row.original;
        const count = tracker[poolId]?.[item.id] || 0;
        const isOneTime = isOneTimeItem(item);
        const isMaxed = isOneTime && count >= 1;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onDecrement(poolId, item.id);
              }}
              disabled={count === 0}
            >
              <MinusIcon className="h-3.5 w-3.5" />
            </Button>
            <span
              className={`min-w-10 text-center font-mono text-sm font-semibold rounded-md px-2 py-1 ${
                count > 0
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-muted/30 text-muted-foreground"
              }`}
            >
              {isOneTime ? (count >= 1 ? "1" : "0") : count}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onIncrement(poolId, item.id);
              }}
              disabled={isMaxed}
            >
              <PlusIcon className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      },
      sortingFn: (rowA, rowB) => {
        const a = tracker[poolId]?.[rowA.original.id] || 0;
        const b = tracker[poolId]?.[rowB.original.id] || 0;
        return a - b;
      },
    },
  ];
}

// Normalize locale string to match supported locales
function normalizeLocale(localeParam: string): Locale {
  // Direct match
  if (rummageLoot.locales.includes(localeParam as Locale)) {
    return localeParam as Locale;
  }
  // Default to English for unsupported locales
  return "en";
}

// Pool key to translation key mapping
const poolNameKeys: Record<string, string> = {
  chapaaNest: "rummagePile.pool.chapaaNest",
  beachTrash: "rummagePile.pool.beachTrash",
  elderwood: "rummagePile.pool.elderwood",
  royalHighlands: "rummagePile.pool.royalHighlands",
};

const locationKeys: Record<string, string> = {
  chapaaNest: "rummagePile.location.kilima",
  beachTrash: "rummagePile.location.bahari",
  elderwood: "rummagePile.location.elderwood",
  royalHighlands: "rummagePile.location.royalHighlands",
};

export default function LootTables({
  locale: localeParam,
}: {
  locale: string;
}) {
  const locale = normalizeLocale(localeParam);
  const t = useT();
  const [activeTab, setActiveTab] = useState("chapaaNest");
  const [tracker, setTracker] = useState<TrackerData>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setTracker(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load tracker data:", e);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage when tracker changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tracker));
      } catch (e) {
        console.error("Failed to save tracker data:", e);
      }
    }
  }, [tracker, isLoaded]);

  const handleIncrement = useCallback((poolId: string, itemId: string) => {
    setTracker((prev) => ({
      ...prev,
      [poolId]: {
        ...prev[poolId],
        [itemId]: (prev[poolId]?.[itemId] || 0) + 1,
      },
    }));
  }, []);

  const handleDecrement = useCallback((poolId: string, itemId: string) => {
    setTracker((prev) => {
      const currentCount = prev[poolId]?.[itemId] || 0;
      if (currentCount <= 0) return prev;
      return {
        ...prev,
        [poolId]: {
          ...prev[poolId],
          [itemId]: currentCount - 1,
        },
      };
    });
  }, []);

  const handleResetPool = useCallback((poolId: string) => {
    setTracker((prev) => ({
      ...prev,
      [poolId]: {},
    }));
  }, []);

  const handleResetAll = useCallback(() => {
    setTracker({});
  }, []);

  const activePool = pools[activeTab];
  const columns = useMemo(
    () =>
      createColumns(
        activeTab,
        activePool.items,
        tracker,
        locale,
        t,
        handleIncrement,
        handleDecrement,
      ),
    [
      activeTab,
      activePool.items,
      tracker,
      locale,
      t,
      handleIncrement,
      handleDecrement,
    ],
  );

  // Calculate total collected for current pool
  const totalCollected = Object.values(tracker[activeTab] || {}).reduce(
    (sum, count) => sum + count,
    0,
  );

  const poolName = t(poolNameKeys[activeTab]);
  const locationName = t(locationKeys[activeTab]);

  return (
    <section
      id="loot-tables"
      className="mt-8 rounded-2xl bg-linear-to-br from-primary/5 via-transparent to-accent/5 border border-primary/20 p-6 md:p-8"
    >
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-primary mb-2 flex items-center gap-2">
            <PackageIcon className="w-6 h-6" />
            {t("rummagePile.loot.title")}
          </h3>
          <p className="text-muted-foreground">
            {t("rummagePile.loot.description")}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-muted-foreground hover:text-destructive hover:border-destructive/50"
          onClick={handleResetAll}
        >
          <RotateCcwIcon className="w-3.5 h-3.5 mr-2" />
          {t("rummagePile.loot.resetAll")}
        </Button>
      </div>

      {/* Tab Selector */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const tabLabel = t(locationKeys[tab.id]);
          const poolTotal = Object.values(tracker[tab.id] || {}).reduce(
            (sum, count) => sum + count,
            0,
          );
          return (
            <Button
              key={tab.id}
              variant={isActive ? "default" : "secondary"}
              className={
                isActive
                  ? "ring-2 ring-primary/50 ring-offset-2 ring-offset-background"
                  : "hover:bg-secondary/60"
              }
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon className="w-4 h-4 mr-2" />
              {tabLabel}
              {poolTotal > 0 && (
                <span className="ml-2 rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-xs font-semibold text-emerald-400">
                  {poolTotal}
                </span>
              )}
            </Button>
          );
        })}
      </div>

      {/* Pool Info */}
      <div className="mb-4 flex flex-wrap items-center justify-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-card/50 px-4 py-1.5 text-sm text-muted-foreground border border-border/50">
          {t("rummagePile.loot.possibleDrops")
            .replace("{count}", String(activePool.items.length))
            .replace("{pool}", poolName)}
        </span>
        {totalCollected > 0 && (
          <>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-400 border border-emerald-500/20">
              {t("rummagePile.loot.itemsCollected").replace(
                "{count}",
                String(totalCollected),
              )}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground hover:text-destructive"
              onClick={() => handleResetPool(activeTab)}
            >
              <RotateCcwIcon className="w-3 h-3 mr-1" />
              {t("rummagePile.loot.resetPool").replace("{pool}", poolName)}
            </Button>
          </>
        )}
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={activePool.items}
        filterColumn="name"
      />

      {/* Footer note */}
      <p className="mt-4 text-xs text-muted-foreground/70 text-center">
        {t("rummagePile.loot.footer")}
      </p>
    </section>
  );
}
