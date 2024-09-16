import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../ui/dropdown-menu";
import { ShareMapView } from "./share-map-view";
import { Forward } from "lucide-react";
import { useMap } from "./store";
import { useSettingsStore } from "@repo/lib";
import { useUserStore } from "../(providers)";

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
  const map = useMap();
  const mapContainer = map?.getPane("mapPane");
  const setTempPrivateNode = useSettingsStore(
    (state) => state.setTempPrivateNode,
  );
  const mapName = useUserStore((state) => state.mapName);
  const [center, setCenter] = useState(contextMenuData?.p);

  useEffect(() => {
    if (contextMenuData?.p) {
      setCenter(contextMenuData.p);
    }
  }, [contextMenuData?.p]);

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
                setOpenShowMapView(true);
              }}
            >
              <Forward className="mr-2 h-4 w-4" /> Share Map View URL
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
    </>
  );
}
