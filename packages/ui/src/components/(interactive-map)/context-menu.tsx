import {
  useCoordinates,
  useT,
  useUserStore,
  useUserStoreApi,
} from "../(providers)";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../ui/dropdown-menu";
import { ShareMapView } from "./share-map-view";
import { EmbedMapDialog } from "./embed-map-dialog";
import { Code, Forward, Route } from "lucide-react";
import { toast } from "sonner";
import { useMap, type GameMap } from "./store";
import { useSettingsStore } from "@repo/lib";
import { planRouteFromHere } from "./plan-route";

const ROUTE_COLOR = "#FF3B30";

export function ContextMenu({
  contextMenuData,
  onClose,
  domain,
}: {
  contextMenuData: {
    x: number;
    y: number;
    p: [number, number];
  } | null;
  onClose: () => void;
  domain: string;
}) {
  const [openShowMapView, setOpenShowMapView] = useState(false);
  const [openEmbed, setOpenEmbed] = useState(false);
  const map = useMap();
  const mapContainer = map?.getContainer()?.parentElement;
  const setTempPrivateNode = useSettingsStore(
    (state) => state.setTempPrivateNode,
  );
  const mapName = useUserStore((state) => state.mapName);
  const userStore = useUserStoreApi();
  const t = useT();
  const { spawns } = useCoordinates();
  const [center, setCenter] = useState(contextMenuData?.p);

  useEffect(() => {
    if (contextMenuData?.p) {
      setCenter(contextMenuData.p);
    }
  }, [contextMenuData?.p]);

  // The route becomes a "My Filters" drawing, so it saves, syncs, shares and
  // edits like one drawn by hand.
  const planRoute = (gameMap: GameMap, clickLatLng: [number, number]) => {
    const settings = useSettingsStore.getState();
    const plan = planRouteFromHere({
      map: gameMap,
      mapName,
      clickLatLng,
      spawns,
      discoveredNodes: settings.discoveredNodes,
      // Not the drawing color: its translucent white default vanishes on
      // snow and desert tiles. Editable afterwards like any drawing.
      color: ROUTE_COLOR,
      size: Math.max(settings.drawingSize, 4),
      startLabel: t("route.start", { fallback: "Start" }),
      textColor: settings.textColor,
      textSize: settings.textSize,
    });
    if (!plan.ok) {
      toast.error(
        plan.reason === "tooMany"
          ? t("route.tooMany", {
              fallback:
                "Too many markers on screen ({{count}}). Zoom in or turn off some filters.",
              vars: { count: String(plan.stops) },
            })
          : t("route.empty", {
              fallback:
                "No markers left to visit on screen. Turn on the filters you want to collect and move the map to the area first.",
            }),
      );
      return;
    }
    const base = t("route.name", { fallback: "Route" });
    const names = new Set(settings.myFilters.map((f) => f.name));
    let n = 1;
    while (names.has(`${base} ${n}`)) n++;
    const name = `${base} ${n}`;
    void settings.addMyFilter({
      name,
      drawing: { id: crypto.randomUUID(), ...plan.drawing },
    });
    const { filters, setFilters } = userStore.getState();
    setFilters([...filters.filter((f) => f !== name), name]);
    toast.success(
      t("route.created", {
        fallback: "{{name}}: {{count}} stops. You find it under {{list}}.",
        vars: {
          name,
          count: String(plan.stops),
          list: t("myFilters.title", { fallback: "My Filters" }),
        },
      }),
    );
  };

  return (
    <>
      {contextMenuData && mapContainer && (
        <DropdownMenu
          onOpenChange={(open) => {
            if (!open) {
              onClose();
            }
          }}
          open
        >
          <DropdownMenuContent
            container={mapContainer}
            style={{
              transform: `translate3d(calc(${contextMenuData.x}px), calc(${contextMenuData.y}px + 200%), 0px)`,
            }}
          >
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                setTempPrivateNode({
                  p: contextMenuData.p,
                });
              }}
            >
              Add Node
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                if (map) planRoute(map, contextMenuData.p);
              }}
            >
              <Route className="mr-2 h-4 w-4" />{" "}
              {t("route.plan", { fallback: "Plan Route From Here" })}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setOpenShowMapView(true);
              }}
            >
              <Forward className="mr-2 h-4 w-4" /> Share Map View URL
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setOpenEmbed(true);
              }}
            >
              <Code className="mr-2 h-4 w-4" /> Embed Map on a Website
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <ShareMapView
        domain={domain}
        open={openShowMapView}
        onClose={() => setOpenShowMapView(false)}
        mapName={mapName}
        center={center}
      />
      <EmbedMapDialog
        open={openEmbed}
        onClose={() => setOpenEmbed(false)}
        center={center}
      />
    </>
  );
}
