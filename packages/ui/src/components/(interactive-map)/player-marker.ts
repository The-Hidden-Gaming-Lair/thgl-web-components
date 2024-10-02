import { ActorPlayer } from "@repo/lib/overwolf";
import leaflet from "leaflet";

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

export class PlayerMarker extends leaflet.Marker {
  declare options: leaflet.MarkerOptions & { rotation: number };
  private _icon: HTMLElement | undefined = undefined;

  constructor(
    latLng: leaflet.LatLngExpression,
    options: leaflet.MarkerOptions & { rotation: number },
  ) {
    super(latLng, options);
  }

  _setPos(pos: leaflet.Point): void {
    if (!this._icon) {
      return;
    }
    if (this._icon.style.transform) {
      this._icon.style.transition = "transform 0.1s linear";
    }

    this._icon.style.transformOrigin = "center";
    this._icon.style.transform = `translate3d(${pos.x}px,${pos.y}px,0) rotate(${this.options.rotation}deg)`;
    return;
  }

  updatePosition({ x, y, r }: ActorPlayer) {
    const latLng = this.getLatLng();
    const newLatLng = [x, y] as leaflet.LatLngTuple;
    if (!latLng.equals(newLatLng)) {
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

      this.options.rotation = playerRotation;
      this.setLatLng(newLatLng);
    }
  }
}
