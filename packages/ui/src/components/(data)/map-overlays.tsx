"use client";
import { createPortal } from "react-dom";
import { useUserStore, useUserStoreApi } from "../(providers)";
import { useMapStore } from "../(interactive-map)/store";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { cn, DATA_FORGE_CDN_URL } from "@repo/lib";
import {
  ZoneOverlayLayer,
  DrawingLayer,
  type DrawingShape,
} from "@repo/lib/web-map";
import {
  ChevronDown,
  ChevronRight,
  FoldVertical,
  Layers,
  UnfoldVertical,
  X,
} from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { useT } from "../(providers)";
import useSWRImmutable from "swr/immutable";
import { SidePanel } from "./side-panel";

interface ZoneEntry {
  values: number[];
  name: string;
  desc?: string;
  centers?: [number, number][];
}

interface ZoneLayer {
  group: string;
  bitmap: string;
  zones: ZoneEntry[];
}

interface OverlayConfig {
  mapName: string;
  bounds: [[number, number], [number, number]];
  layers: ZoneLayer[];
}

export interface MapOverlaysProps {
  configUrl: string;
  basePath: string;
}

/** Golden-angle HSL color for a zone value — matches data-mining zoneRGBA */
function zoneColor(val: number): [number, number, number, number] {
  const hue = ((val * 137.508) % 360) / 360;
  const sat = (65 + ((val * 7) % 20)) / 100;
  const lit = (45 + ((val * 11) % 15)) / 100;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = lit < 0.5 ? lit * (1 + sat) : lit + sat - lit * sat;
  const p = 2 * lit - q;
  return [
    Math.round(hue2rgb(p, q, hue + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, hue) * 255),
    Math.round(hue2rgb(p, q, hue - 1 / 3) * 255),
    180,
  ];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/** Pure UI for a single group */
function OverlayGroupUI({
  layer,
  activeCount,
  onToggleAll,
}: {
  layer: ZoneLayer;
  activeCount: number;
  onToggleAll: () => void;
}) {
  const [open, setOpen] = useState(false);
  const filters = useUserStore((state) => state.filters);
  const setFilters = useUserStore((state) => state.setFilters);
  const t = useT();
  const ratio = layer.zones.length > 0 ? activeCount / layer.zones.length : 0;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className={cn(
          "group flex items-center transition-colors w-full px-1.5",
          { "text-muted-foreground": !activeCount },
        )}
      >
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              "flex items-center gap-1 text-left transition-colors hover:text-primary py-1 px-0.5 truncate grow min-w-0",
              { "text-muted-foreground": !activeCount },
            )}
            type="button"
          >
            <ChevronRight
              className={cn(
                "h-3 w-3 shrink-0 transition-transform duration-200",
                open && "rotate-90",
              )}
            />
            <span className="font-semibold truncate">
              {t(layer.group) || layer.group}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums shrink-0">
              {activeCount}/{layer.zones.length}
            </span>
          </button>
        </CollapsibleTrigger>
        <button
          className="text-[10px] text-muted-foreground hover:text-primary px-1.5 py-1 transition-colors shrink-0 uppercase tracking-wide"
          onClick={onToggleAll}
          type="button"
          title={
            activeCount
              ? t("myFilters.disableAll", { fallback: "Disable all" })
              : t("myFilters.enableAll", { fallback: "Enable all" })
          }
        >
          {activeCount
            ? t("myFilters.none", { fallback: "None" })
            : t("myFilters.all", { fallback: "All" })}
        </button>
      </div>
      {/* Progress bar */}
      <div className="h-[2px] bg-muted/20 mx-1.5 overflow-hidden rounded-full">
        <div
          className="h-full bg-primary/50 transition-all duration-300 rounded-full"
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <CollapsibleContent>
        <div className="flex flex-col">
          {layer.zones.map((zone) => {
            const filterName = `${layer.group}: ${zone.name}`;
            const isActive = filters.includes(filterName);
            const btn = (
              <button
                key={zone.values[0]}
                className={cn(
                  "flex items-center gap-2 transition-colors hover:text-primary py-0.5 pl-7 pr-2.5 text-sm truncate",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
                onClick={() => {
                  const newFilters = isActive
                    ? filters.filter((f) => f !== filterName)
                    : [...filters, filterName];
                  setFilters(newFilters);
                }}
                type="button"
              >
                <span className="truncate">{t(zone.name) || zone.name}</span>
              </button>
            );
            if (zone.desc) {
              const descText = t(`${zone.desc}_desc`) || zone.desc;
              return (
                <Tooltip
                  key={zone.values[0]}
                  delayDuration={300}
                  disableHoverableContent
                >
                  <TooltipTrigger asChild>{btn}</TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[350px]">
                    <p className="font-semibold">{t(zone.name) || zone.name}</p>
                    <p
                      className="text-xs text-muted-foreground"
                      dangerouslySetInnerHTML={{ __html: descText }}
                    />
                  </TooltipContent>
                </Tooltip>
              );
            }
            return btn;
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ── Zone Details Panel (lazy-loaded knowledge data) ──

type KnowledgeCategory = { category: string; items: string[] };
type NpcKnowledgeData = {
  regions: Record<string, KnowledgeCategory[]>;
  global: KnowledgeCategory[];
};

export function ZoneDetailsPanel({ appName }: { appName: string }) {
  const zone = useUserStore((state) => state.selectedZone);
  const setSelectedZone = useUserStore((state) => state.setSelectedZone);

  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (zone) requestAnimationFrame(() => setVisible(true));
    else setVisible(false);
  }, [zone]);

  const isKnowledgeZone = zone?.group === "zone_group_npc_knowledge";
  const knowledgeUrl = isKnowledgeZone
    ? `${DATA_FORGE_CDN_URL}/${appName}/config/npc-knowledge.json`
    : null;
  const { data: knowledgeData } = useSWRImmutable<NpcKnowledgeData>(
    knowledgeUrl,
    (url: string) => fetch(url).then((r) => r.json()),
  );

  const regionCategories = useMemo(() => {
    if (!knowledgeData || !zone) return null;
    for (const [regionKey, categories] of Object.entries(
      knowledgeData.regions,
    )) {
      if (zone.name.toLowerCase().includes(regionKey.toLowerCase())) {
        return { region: regionKey, categories, global: knowledgeData.global };
      }
    }
    for (const [regionKey, categories] of Object.entries(
      knowledgeData.regions,
    )) {
      for (const word of zone.name.split(/\s+/)) {
        if (
          word.length > 3 &&
          regionKey.toLowerCase().startsWith(word.toLowerCase())
        ) {
          return {
            region: regionKey,
            categories,
            global: knowledgeData.global,
          };
        }
      }
    }
    return { region: "", categories: [], global: knowledgeData.global };
  }, [knowledgeData, zone]);

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );
  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const close = () => {
    setVisible(false);
    setTimeout(() => setSelectedZone(null), 200);
  };

  if (!zone) return null;

  const panelContent = (
    <>
      {/* Header — matches MarkerPanel layout */}
      <div className="flex items-center gap-2 px-3 py-2 border-b shrink-0">
        <button
          type="button"
          aria-label="Close"
          className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-muted transition-colors shrink-0"
          onClick={close}
        >
          <X className="w-4 h-4" />
        </button>
        <h2 className="text-sm font-semibold truncate grow">{zone.name}</h2>
        {isKnowledgeZone && (
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-medium leading-none shrink-0">
            NPC Knowledge
          </span>
        )}
      </div>

      <div
        className="flex-1 overflow-y-auto"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "hsl(var(--ring) / 0.5) transparent",
        }}
      >
        <div className="p-3 space-y-3">
          {!isKnowledgeZone && zone.desc && (
            <p
              className="text-xs text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: zone.desc }}
            />
          )}
          {isKnowledgeZone && !regionCategories && (
            <p className="text-xs text-muted-foreground">Loading...</p>
          )}
          {isKnowledgeZone && regionCategories && (
            <>
              {regionCategories.categories.length > 0 && (
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                    Region — {regionCategories.region}
                  </p>
                  {regionCategories.categories.map((cat) => (
                    <CategoryList
                      key={cat.category}
                      category={cat}
                      expanded={expandedCategories.has(`r_${cat.category}`)}
                      onToggle={() => toggleCategory(`r_${cat.category}`)}
                    />
                  ))}
                </div>
              )}
              {regionCategories.global.length > 0 && (
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                    Global (all regions)
                  </p>
                  {regionCategories.global.map((cat) => (
                    <CategoryList
                      key={cat.category}
                      category={cat}
                      expanded={expandedCategories.has(`g_${cat.category}`)}
                      onToggle={() => toggleCategory(`g_${cat.category}`)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );

  return (
    <SidePanel visible={visible} onClose={close}>
      {panelContent}
    </SidePanel>
  );
}

function CategoryList({
  category,
  expanded,
  onToggle,
}: {
  category: KnowledgeCategory;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="mb-0.5">
      <button
        onClick={onToggle}
        className="flex items-center gap-1 w-full text-left py-0.5 px-1 hover:bg-muted rounded text-xs"
        type="button"
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3 shrink-0" />
        ) : (
          <ChevronRight className="h-3 w-3 shrink-0" />
        )}
        <span className="truncate">{category.category}</span>
        <span className="text-muted-foreground ml-auto shrink-0">
          {category.items.length}
        </span>
      </button>
      {expanded && (
        <div className="pl-5 py-0.5">
          {category.items.map((item) => (
            <div key={item} className="text-xs text-muted-foreground py-0.5">
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function MapOverlays({ configUrl, basePath }: MapOverlaysProps) {
  const [open, setOpen] = useState(false);
  const map = useMapStore((state) => state.map);
  const filters = useUserStore((state) => state.filters);
  const setFilters = useUserStore((state) => state.setFilters);
  const userStoreApi = useUserStoreApi();
  const t = useT();

  const { data: config } = useSWRImmutable<OverlayConfig>(configUrl, fetcher);
  const zoneLayersRef = useRef<Map<string, ZoneOverlayLayer>>(new Map());
  const addedRef = useRef<Set<string>>(new Set());
  const drawingLayerRef = useRef<DrawingLayer | null>(null);

  // Per-group active state
  const layerStates = useMemo(() => {
    if (!config) return [];
    return config.layers.map((layer) => {
      const itemNames = layer.zones.map((z) => `${layer.group}: ${z.name}`);
      const activeZones = layer.zones.filter((z) =>
        filters.includes(`${layer.group}: ${z.name}`),
      );
      return { layer, itemNames, activeZones };
    });
  }, [config, filters]);

  const allActiveItems = useMemo(
    () =>
      layerStates.flatMap(({ layer, activeZones }) =>
        activeZones.map((z) => `${layer.group}: ${z.name}`),
      ),
    [layerStates],
  );

  // Sync ZoneOverlayLayers with map — layers stay added (palette = transparent
  // when inactive) to avoid destroying/reloading the bitmap on every toggle.
  useEffect(() => {
    if (!map || !config || map.mapName !== config.mapName) return;

    const zoneLayers = zoneLayersRef.current;
    const added = addedRef.current;

    for (const { layer, activeZones } of layerStates) {
      if (!zoneLayers.has(layer.group)) {
        const zl = new ZoneOverlayLayer({
          url: `${basePath}/${layer.bitmap}`,
          bounds: config.bounds,
        });
        zoneLayers.set(layer.group, zl);
      }

      const zl = zoneLayers.get(layer.group)!;

      // Add layer once; never remove — visibility is palette-driven
      if (!added.has(layer.group)) {
        map.addLayer(zl, { zIndex: 20 });
        added.add(layer.group);
      }

      zl.clearAll();
      if (activeZones.length > 0) {
        const toSet: {
          value: number;
          color: [number, number, number, number];
        }[] = [];
        for (const z of activeZones) {
          const color = zoneColor(z.values[0]);
          for (const v of z.values) {
            toSet.push({ value: v, color });
          }
        }
        zl.setZones(toSet);
      }
    }
  }, [map, config, layerStates]);

  // Cleanup only on map/config change or unmount
  useEffect(() => {
    if (!map) return;
    return () => {
      const zoneLayers = zoneLayersRef.current;
      const added = addedRef.current;
      for (const [group] of zoneLayers) {
        if (added.has(group)) {
          const zl = zoneLayers.get(group);
          if (zl) map.removeLayer(zl);
        }
      }
      added.clear();
    };
  }, [map, config]);

  // Labels
  useEffect(() => {
    if (!map || !config || map.mapName !== config.mapName) return;

    if (drawingLayerRef.current) {
      map.removeLayer(drawingLayerRef.current);
      drawingLayerRef.current = null;
    }

    const labelsData: { name: string; center: [number, number] }[] = [];
    for (const { activeZones } of layerStates) {
      for (const z of activeZones) {
        if (z.centers) {
          for (const c of z.centers) {
            labelsData.push({ name: t(z.name) || z.name, center: c });
          }
        }
      }
    }
    if (labelsData.length === 0) return;

    const dl = new DrawingLayer({ interactive: false });
    map.addLayer(dl, { zIndex: 25 });
    let idx = 0;
    for (const { name, center } of labelsData) {
      dl.addShape({
        id: `overlay_label_${idx++}`,
        type: "text",
        center,
        text: name,
        color: "#ffffffcc",
        size: 11,
        mapName: config.mapName,
      } as DrawingShape);
    }
    drawingLayerRef.current = dl;

    return () => {
      if (drawingLayerRef.current) {
        map.removeLayer(drawingLayerRef.current);
        drawingLayerRef.current = null;
      }
    };
  }, [map, config, allActiveItems.join(",")]);

  // Zone hover tooltip on the map
  const [zoneTooltip, setZoneTooltip] = useState<{
    x: number;
    y: number;
    name: string;
    desc: string;
  } | null>(null);

  // Zone details panel (opened on click) — stored in shared state
  const selectedZone = useUserStore((state) => state.selectedZone);
  const setSelectedZone = useUserStore((state) => state.setSelectedZone);

  // Build zone lookup: group → pixelValue → zone
  const zoneLookup = useMemo(() => {
    if (!config) return new Map<string, Map<number, ZoneEntry>>();
    const lookup = new Map<string, Map<number, ZoneEntry>>();
    for (const layer of config.layers) {
      const valueMap = new Map<number, ZoneEntry>();
      for (const zone of layer.zones) {
        for (const v of zone.values) {
          valueMap.set(v, zone);
        }
      }
      lookup.set(layer.group, valueMap);
    }
    return lookup;
  }, [config]);

  useEffect(() => {
    if (!map || !config || allActiveItems.length === 0) {
      setZoneTooltip(null);
      return;
    }

    const getCanvas = () =>
      document.querySelector("canvas") as HTMLElement | null;

    const handler = (e: {
      latlng: [number, number];
      originalEvent: MouseEvent;
    }) => {
      const zoneLayers = zoneLayersRef.current;
      for (const { layer, activeZones } of layerStates) {
        if (activeZones.length === 0) continue;
        const zl = zoneLayers.get(layer.group);
        if (!zl) continue;
        const pixelValue = zl.sampleAt(e.latlng);
        if (pixelValue <= 0) continue;

        const valueMap = zoneLookup.get(layer.group);
        const zone = valueMap?.get(pixelValue);
        if (!zone?.desc) continue;

        const isActive = activeZones.some((az) =>
          az.values.includes(pixelValue),
        );
        if (!isActive) continue;

        const zoneName = t(zone.name) || zone.name;
        const descText = t(`${zone.desc}_desc`) || zone.desc || "";

        setZoneTooltip({
          x: e.originalEvent.clientX,
          y: e.originalEvent.clientY,
          name: zoneName,
          desc: descText,
        });
        const c = getCanvas();
        if (c) c.style.cursor = "pointer";
        return;
      }
      setZoneTooltip(null);
      const c = getCanvas();
      if (c) c.style.cursor = "grab";
    };

    const docLeaveHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && !target.closest("canvas")) {
        setZoneTooltip(null);
      }
    };

    // Click handler — open zone details panel (skip if a marker was clicked)
    const clickHandler = (e: {
      latlng: [number, number];
      originalEvent: MouseEvent;
    }) => {
      // Defer to next tick so marker click can set selectedNodeId first
      setTimeout(() => {
        if (userStoreApi.getState().selectedNodeId) return; // marker was clicked
        _handleZoneClick(e);
      }, 0);
    };
    const _handleZoneClick = (e: {
      latlng: [number, number];
      originalEvent: MouseEvent;
    }) => {
      const zoneLayers2 = zoneLayersRef.current;
      for (const { layer, activeZones } of layerStates) {
        if (activeZones.length === 0) continue;
        const zl = zoneLayers2.get(layer.group);
        if (!zl) continue;
        const pv = zl.sampleAt(e.latlng);
        if (pv <= 0) continue;
        const vm = zoneLookup.get(layer.group);
        const zone = vm?.get(pv);
        if (!zone?.desc) continue;
        const isActive = activeZones.some((az) => az.values.includes(pv));
        if (!isActive) continue;

        setSelectedZone({
          name: t(zone.name) || zone.name,
          desc: t(`${zone.desc}_desc`) || "",
          group: layer.group,
        });
        setZoneTooltip(null);
        return;
      }
      // Clicked empty area — close zone panel
      setSelectedZone(null);
    };

    map.on("mousemove", handler);
    map.on("click", clickHandler);
    document.addEventListener("mouseover", docLeaveHandler);

    return () => {
      map.off("mousemove", handler);
      map.off("click", clickHandler);
      document.removeEventListener("mouseover", docLeaveHandler);
      setZoneTooltip(null);
      const c = getCanvas();
      if (c) c.style.cursor = "grab";
    };
  }, [map, config, layerStates, allActiveItems.join(","), zoneLookup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      zoneLayersRef.current.clear();
      addedRef.current.clear();
    };
  }, []);

  if (!map) return <Skeleton className="h-7 w-full" />;
  if (!config) return null;
  if (map.mapName !== config.mapName) return null;

  const totalActive = allActiveItems.length;

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="flex items-center transition-colors w-full px-1.5">
          <CollapsibleTrigger asChild>
            <button
              className="text-left transition-colors p-1 pr-2 truncate grow flex items-center justify-between"
              type="button"
            >
              <span
                className={cn(
                  "font-semibold flex items-center gap-1.5",
                  totalActive > 0 && "text-primary",
                )}
              >
                <Layers className="h-4 w-4" />
                Zone Overlays
                {!open && totalActive > 0 && (
                  <span className="text-[10px] font-normal opacity-60">
                    ({totalActive})
                  </span>
                )}
              </span>
              {open ? (
                <FoldVertical className="h-4 w-4" />
              ) : (
                <UnfoldVertical className="h-4 w-4" />
              )}
            </button>
          </CollapsibleTrigger>
        </div>
        {open && (
          <div>
            {layerStates.map(({ layer, itemNames, activeZones }) => (
              <OverlayGroupUI
                key={layer.group}
                layer={layer}
                activeCount={activeZones.length}
                onToggleAll={() => {
                  const hasActive = activeZones.length > 0;
                  const newFilters = hasActive
                    ? filters.filter((f) => !itemNames.includes(f))
                    : [...new Set([...filters, ...itemNames])];
                  setFilters(newFilters);
                }}
              />
            ))}
          </div>
        )}
      </Collapsible>
      {zoneTooltip &&
        !selectedZone &&
        createPortal(
          <div
            className="fixed z-9999 pointer-events-none bg-popover text-popover-foreground border rounded-md shadow-md px-3 py-2 max-w-[350px]"
            style={{
              left: zoneTooltip.x + 16,
              top: zoneTooltip.y - 8,
            }}
          >
            <p className="font-semibold text-sm">{zoneTooltip.name}</p>
            <p
              className="text-xs text-muted-foreground mt-0.5"
              dangerouslySetInnerHTML={{ __html: zoneTooltip.desc }}
            />
          </div>,
          document.body,
        )}
    </>
  );
}
