import type { LeafletMouseEvent, Map } from "leaflet";
import { Control, DomUtil } from "leaflet";

export function createCoordinatesControl(): {
  onAdd: (map: Map) => HTMLDivElement;
  onRemove: (map: Map) => void;
} & Control {
  const divElement = DomUtil.create("div", "leaflet-position");
  const handleMouseMove = (event: LeafletMouseEvent): void => {
    divElement.innerHTML = `<span>[${event.latlng.lng.toFixed(
      0,
    )}, ${event.latlng.lat.toFixed(0)}]</span>`;
  };
  const handleMouseOut = (): void => {
    divElement.innerHTML = ``;
  };

  const CoordinatesControl = Control.extend({
    onAdd(map: Map) {
      map.on("mousemove", handleMouseMove);
      map.on("mouseout", handleMouseOut);
      return divElement;
    },
    onRemove(map: Map) {
      map.off("mousemove", handleMouseMove);
      map.off("mouseout", handleMouseOut);
    },
  });

  return new CoordinatesControl({ position: "bottomright" });
}
