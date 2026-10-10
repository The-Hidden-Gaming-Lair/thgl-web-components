"use client";

import { cn, useSettingsStore } from "@repo/lib";
import { Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCoordinates, useT, useUserStore } from "../(providers)";

/**
 * Filters that appeared since the player's last visit (`newFilters` in the
 * user store, inbox #987/#1107): a "New" badge per filter row and a one-time
 * map chip that opens the filter panel on them.
 */
export function NewBadge({ className }: { className?: string }) {
  const t = useT();
  return (
    <span
      className={cn(
        "inline-block rounded bg-primary px-1 text-[10px] leading-4 font-semibold uppercase tracking-wide text-primary-foreground shrink-0",
        className,
      )}
    >
      {t("filters.new")}
    </span>
  );
}

/**
 * Acknowledges the group's new filters once the player has seen them: the
 * group was open in the visible panel and is then closed, unmounted or the
 * page is left. Until then the badges stay, so they can actually be read.
 */
export function useAcknowledgeNewFilters(open: boolean, newIds: string[]) {
  const showFilters = useSettingsStore((state) => state.showFilters);
  const acknowledge = useUserStore((state) => state.acknowledgeNewFilters);
  const seen = open && showFilters && newIds.length > 0;
  const idsRef = useRef(newIds);
  idsRef.current = newIds;
  const pendingRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    if (!seen) return;
    // Deferred, and cancelled by a re-setup: StrictMode's mount → cleanup →
    // mount must not count as "closed" (it cleared the badges on open).
    clearTimeout(pendingRef.current);
    const ack = () => acknowledge(idsRef.current);
    window.addEventListener("pagehide", ack);
    return () => {
      window.removeEventListener("pagehide", ack);
      pendingRef.current = setTimeout(ack, 0);
    };
  }, [seen, acknowledge]);
}

const MAX_CHIP_NAMES = 3;

export function NewFiltersChip({
  embed,
  onOpen,
}: {
  embed?: boolean;
  /** Called on click, before the panel opens (MarkersSearch clears a query
   * so the filter list shows every group). */
  onOpen?: () => void;
}) {
  const t = useT();
  const { filters } = useCoordinates();
  const hasHydrated = useUserStore((state) => state._hasHydrated);
  const newFilters = useUserStore((state) => state.newFilters);
  const announced = useUserStore((state) => state.announcedNewFilters);
  const announceNewFilters = useUserStore((state) => state.announceNewFilters);
  const setGroupOpen = useUserStore((state) => state.setGroupOpen);
  const showFilters = useSettingsStore((state) => state.showFilters);
  const toggleShowFilters = useSettingsStore(
    (state) => state.toggleShowFilters,
  );
  // Latched on first sight: the chip shows for this page view, and is marked
  // announced straight away so the next visit doesn't repeat it.
  const [ids, setIds] = useState<string[] | null>(null);

  useEffect(() => {
    if (!hasHydrated || ids !== null || embed) return;
    const fresh = newFilters.filter((id) => !announced.includes(id));
    if (fresh.length === 0) return;
    setIds(newFilters);
    announceNewFilters();
  }, [hasHydrated, newFilters, announced, ids, embed, announceNewFilters]);

  // Every new filter acknowledged (badges seen or toggled) → nothing to point at.
  const visible = ids?.filter((id) => newFilters.includes(id)) ?? [];
  if (visible.length === 0) return null;

  const names = visible.map((id) => t(id) || id);
  const shown =
    names.length > MAX_CHIP_NAMES
      ? `${names.slice(0, MAX_CHIP_NAMES).join(", ")}, …`
      : names.join(", ");
  const label =
    visible.length === 1
      ? t("filters.newChip.one", { vars: { names: shown } })
      : t("filters.newChip.other", {
          vars: { count: String(visible.length), names: shown },
        });

  return (
    <div
      data-testid="new-filters-chip"
      className="fixed top-[64px] left-1/2 -translate-x-1/2 z-500 flex max-w-[calc(100vw-1rem)] md:max-w-md items-center rounded-full border border-primary/60 bg-card text-card-foreground shadow-md text-xs"
    >
      <button
        className="flex min-w-0 items-center gap-1.5 py-1.5 pl-3 pr-1 hover:text-primary transition-colors"
        onClick={() => {
          onOpen?.();
          for (const filter of filters) {
            if (filter.values.some((value) => visible.includes(value.id))) {
              setGroupOpen(filter.group, true);
            }
          }
          if (!showFilters) toggleShowFilters();
          setIds([]);
        }}
        title={names.join(", ")}
        type="button"
      >
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
        <span className="truncate">{label}</span>
      </button>
      <button
        aria-label={t("filters.newChip.dismiss")}
        className="shrink-0 rounded-full p-1.5 mr-0.5 text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setIds([])}
        type="button"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
