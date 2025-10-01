import { ActorPlayer } from "@repo/lib/overwolf";
import WebMapMarker, { type WebMapMarkerOptions } from "./webmap-marker";
import type { InteractiveMap } from "./store";

const SCALE = 0.083492;
const DEG_45 = Math.PI / 4; // 45 degrees in radians
const OFFSET = {
  x: 113.2,
  y: -227.4,
};
export const normalizePoint = ({
  x,
  y,
  z,
}: {
  x: number;
  y: number;
  z: number;
}) => {
  const scaledX = x * SCALE;
  const scaledY = y * SCALE;
  const rotatedX = scaledX * Math.cos(DEG_45) - scaledY * Math.sin(DEG_45);
  const rotatedY = scaledX * Math.sin(DEG_45) + scaledY * Math.cos(DEG_45);
  return {
    x: (-rotatedX + OFFSET.x) / 1.65,
    y: (-rotatedY + OFFSET.y) / 1.65,
    z,
  };
};

export class PlayerMarker extends WebMapMarker {
  declare options: WebMapMarkerOptions & {
    rotation: number;
    rotationOffset?: number;
  };
  private _icon: HTMLElement | undefined = undefined;

  constructor(
    latLng: [number, number],
    options: WebMapMarkerOptions & {
      rotation: number;
      rotationOffset?: number;
    },
  ) {
    super(latLng, options);
  }

  // WebMap handles position and rotation through IconMarkerLayer
  // This method is kept for compatibility but WebMap manages positioning differently
  _setPos(pos: { x: number; y: number }): void {
    // WebMap handles positioning internally through the IconMarkerLayer
    // We update the marker's internal position for tooltip compatibility
    this._point = pos;
    return;
  }

  updatePosition({ x, y, r }: ActorPlayer) {
    const latLng = this.getLatLng();
    const newLatLng = [x, y] as [number, number];
    // Simple array comparison since WebMap doesn't have equals method
    if (latLng[0] !== newLatLng[0] || latLng[1] !== newLatLng[1]) {
      let playerRotation = r;

      const oldRotation = this.options.rotation || playerRotation;

      let spins = 0;
      if (oldRotation >= 180) {
        spins += Math.floor(Math.abs(oldRotation + 180) / 360);
      } else if (oldRotation <= -180) {
        spins -= Math.floor(Math.abs(oldRotation - 180) / 360);
      }
      playerRotation += 360 * spins;
      if (oldRotation - playerRotation >= 180) {
        playerRotation += 360;
      } else if (playerRotation - oldRotation >= 180) {
        playerRotation -= 360;
      }
      if (this.options.rotationOffset) {
        playerRotation -= this.options.rotationOffset;
      }

      this.options.rotation = playerRotation;
      this.setLatLng(newLatLng);
    }
  }

  // Compatibility methods for tooltip binding (WebMap handles tooltips differently)
  bindTooltip(content: string): this {
    // WebMap tooltips are handled at the component level
    return this;
  }

  unbindTooltip(): this {
    // WebMap tooltips are handled at the component level
    return this;
  }

  remove(): this {
    // Delegate to removeFrom with current map
    if (this._map) {
      this.removeFrom(this._map);
    }
    return this;
  }
}
