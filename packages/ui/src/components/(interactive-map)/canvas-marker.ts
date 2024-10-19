import leaflet, { CircleMarker } from "leaflet";
import { gameIcons } from "../(controls)";

leaflet.Canvas.include({
  updateCanvasImg(layer: CanvasMarker) {
    const layerContext = this._ctx as CanvasRenderingContext2D;
    if (!layerContext) {
      return;
    }
    const {
      icon,
      isHighlighted,
      isDiscovered,
      isCluster,
      fillColor,
      noCache,
      zPos,
    } = layer.options;
    let radius = layer.getRadius();
    if (isHighlighted) {
      radius *= 1.5;
    }
    let imageSize = radius * 2;
    const p = layer._point.round();
    const dx = p.x - radius;
    const dy = p.y - radius;
    if (icon !== undefined) {
      if (icon === null || layer.imageElement.width === 0) {
        layerContext.beginPath();
        layerContext.arc(p.x, p.y, radius * 0.75, 0, Math.PI * 2);
        layerContext.fillStyle = fillColor || "rgba(255, 255, 255, 0.6)";
        layerContext.fill();
        return;
      }

      const key =
        "width" in icon
          ? `${icon.url}${icon.x}${icon.y}@${radius}:${isHighlighted}:${isDiscovered}:${isCluster}${fillColor}${zPos}`
          : `${icon.url}@${radius}:${isHighlighted}:${isDiscovered}:${isCluster}${fillColor}${zPos}`;
      if (canvasCache[key]) {
        layerContext.drawImage(canvasCache[key], dx, dy);
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = imageSize;
      canvas.height = imageSize;
      if (isCluster) {
        imageSize /= 1.5;
      }
      const context = canvas.getContext("2d")!;
      context.shadowOffsetX = 0;
      context.shadowOffsetY = 0;
      context.shadowColor = "black";
      context.shadowBlur = 1;
      if (isDiscovered) {
        context.filter = "grayscale(100%)";
        context.globalAlpha = 0.5;
      }
      if (isHighlighted) {
        context.shadowColor = "white";
        context.shadowBlur = 15;
      }
      if ("width" in icon) {
        context.drawImage(
          layer.imageElement,
          icon.x,
          icon.y,
          icon.width || imageSize,
          icon.height || imageSize,
          (canvas.width - imageSize) / 2,
          (canvas.height - imageSize) / 2,
          imageSize,
          imageSize,
        );
      } else {
        context.drawImage(
          layer.imageElement,
          (canvas.width - imageSize) / 2,
          (canvas.height - imageSize) / 2,
          imageSize,
          imageSize,
        );
      }
      if (isCluster) {
        context.beginPath();

        const startX = (canvas.width * 1.1) / 4;
        const startY = (canvas.height * 1.1) / 4;
        const length = canvas.width / 6;
        context.lineWidth = 2.5;
        context.strokeStyle = "white";
        context.moveTo(startX + length, startY);
        context.lineTo(startX - length, startY);
        context.moveTo(startX, startY + length);
        context.lineTo(startX, startY - length);
        context.stroke();
      } else if (zPos === "top") {
        context.beginPath();
        const arrowSize = canvas.width / 6;
        const arrowX = canvas.width / 6;
        const arrowY = canvas.height / 6;
        context.moveTo(arrowX, arrowY);
        context.lineTo(arrowX - arrowSize, arrowY + arrowSize);
        context.lineTo(arrowX + arrowSize, arrowY + arrowSize);
        context.closePath();
        context.fillStyle = "white";
        context.fill();
      } else if (zPos === "bottom") {
        context.beginPath();
        const arrowSize = canvas.width / 6;
        const arrowX = canvas.width / 6;
        const arrowY = canvas.height / 6;
        context.moveTo(arrowX, arrowY);
        context.lineTo(arrowX - arrowSize, arrowY - arrowSize);
        context.lineTo(arrowX + arrowSize, arrowY - arrowSize);
        context.closePath();
        context.fillStyle = "white";
        context.fill();
      }
      if (fillColor) {
        // Get the image data
        const imageData = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        );
        const data = imageData.data;

        // Parse the target color
        const r = parseInt(fillColor.slice(1, 3), 16);
        const g = parseInt(fillColor.slice(3, 5), 16);
        const b = parseInt(fillColor.slice(5, 7), 16);
        const a = parseInt(fillColor.slice(7, 9), 16);

        // Iterate over each pixel
        for (let i = 0; i < data.length; i += 4) {
          const [currentR, currentG, currentB, currentA] = [
            data[i],
            data[i + 1],
            data[i + 2],
            data[i + 3],
          ];

          // Calculate the brightness of the current pixel
          const brightness =
            0.299 * currentR + 0.587 * currentG + 0.114 * currentB;

          // Check if the brightness is above the threshold
          if (brightness > 150) {
            // Apply the target color while preserving the alpha channel
            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
            if (a) {
              data[i + 3] = Math.min(currentA, a);
            }
          }
        }

        // Put the modified image data back to the canvas
        context.putImageData(imageData, 0, 0);
      }

      if (!noCache) {
        canvasCache[key] = canvas;
      }
      layerContext.drawImage(canvas, dx, dy);
      return;
    }
    if (layer.options.text) {
      layerContext.fillStyle = "#e6e5e3";
      layerContext.textAlign = "center";
      layerContext.strokeStyle = "#594f42";

      layerContext.font = `normal 700 ${radius}px Arial`;
      layerContext.lineWidth = 3;
      layerContext.strokeText(layer.options.text, p.x, p.y);
      layerContext.lineWidth = 1;
      layerContext.fillText(layer.options.text, p.x, p.y);
    }
  },
});

export type CanvasMarkerIcon =
  | {
      url: string;
    }
  | {
      name: string;
      url: string;
      x: number;
      y: number;
      width: number;
      height: number;
    };

export type CanvasMarkerOptions = {
  id: string;
  baseRadius: number;
  address?: number;
  isHighlighted?: boolean;
  isDiscovered?: boolean;
  isCluster?: boolean;
  noCache?: boolean;
  icon?: CanvasMarkerIcon | null;
  text?: string;
  zPos?: "top" | "bottom" | null;
};

const imageElements: Record<string, HTMLImageElement> = {};
const canvasCache: Record<string, HTMLCanvasElement> = {};

let flatGameIcons:
  | {
      name: string;
      url: string;
      author: string;
      x: number;
      y: number;
      width: number;
      height: number;
    }[]
  | null = null;
function findIcon(name: string) {
  if (!flatGameIcons) {
    flatGameIcons = gameIcons.flat().flatMap((g) => g.icons);
  }
  return flatGameIcons.find((icon) => icon.name === name);
}

class CanvasMarker extends CircleMarker {
  declare options: leaflet.CircleMarkerOptions & CanvasMarkerOptions;
  declare _point: leaflet.Point;
  declare _radius: number;
  declare _latlng: leaflet.LatLngExpression;
  declare _updateBounds: () => void;
  declare imageElement: HTMLImageElement;
  private _onImageLoad: (() => void) | undefined = undefined;

  constructor(
    latLng: leaflet.LatLngExpression,
    options: leaflet.CircleMarkerOptions & CanvasMarkerOptions,
  ) {
    super(latLng, options);
    if ("icon" in options && options.icon) {
      let url = options.icon.url;
      if ("name" in options.icon) {
        const icon = findIcon(options.icon.name);
        if (icon) {
          this.options.icon = icon;
          url = icon.url;
        }
      }
      if (!imageElements[url]) {
        imageElements[url] = document.createElement("img");
        if (!url.startsWith("/")) {
          imageElements[url].src = `/icons/${options.icon}`;
        } else {
          imageElements[url].src = url;
        }
      }
      this.imageElement = imageElements[url];
    }
  }

  update() {
    try {
      if (this.options.isHighlighted) {
        this.bringToFront();
      }
      this.redraw();
    } catch (err) {
      //
    }
  }

  setZPos(zPos: CanvasMarkerOptions["zPos"]) {
    this.options.zPos = zPos;
    this.update();
  }

  setIcon(newIcon: CanvasMarkerIcon | null | undefined) {
    this.options.icon = newIcon;
    if (newIcon) {
      let url = newIcon.url;
      if ("name" in newIcon) {
        const icon = findIcon(newIcon.name);
        if (icon) {
          this.options.icon = icon;
          url = icon.url;
        }
      }

      if (!imageElements[url]) {
        imageElements[url] = document.createElement("img");
        imageElements[url].src = url;
        this._onImageLoad = undefined;
      }
      this.imageElement = imageElements[url];
    }
    this.update();
  }

  setHighlight(isHighlighted: boolean) {
    this.options.isHighlighted = isHighlighted;
    this.update();
  }

  _project() {
    const zoom = this._map.getZoom();
    const minZoom = this._map.getMinZoom();
    const maxZoom = this._map.getMaxZoom();
    const factor = 1 / (maxZoom - minZoom);
    const normalizedZoom = zoom - minZoom;
    const zoomFactor = normalizedZoom * factor;
    const radius = this.options.radius!;
    this._radius = radius / 2 + radius * 2 * zoomFactor;
    this._point = this._map.latLngToLayerPoint(this._latlng);
    this._updateBounds();
  }

  _updatePath(): void {
    if (!this.imageElement || this.imageElement.complete) {
      if (this._onImageLoad) {
        this.imageElement.removeEventListener("load", this._onImageLoad);
        this.imageElement.removeEventListener("error", this._onImageLoad);
      }
      // @ts-expect-error updateCanvasImg is a custom method
      this._renderer.updateCanvasImg(this);
    } else if (!this._onImageLoad) {
      this._onImageLoad = () => {
        this.imageElement.removeEventListener("load", this._onImageLoad!);
        this.imageElement.removeEventListener("error", this._onImageLoad!);
        // @ts-expect-error updateCanvasImg is a custom method
        this._renderer.updateCanvasImg(this);
      };
      this.imageElement.addEventListener("load", this._onImageLoad);
      this.imageElement.addEventListener("error", this._onImageLoad);
    }
  }

  toggleDiscovered() {
    this.options.isDiscovered = !this.options.isDiscovered;
    this.update();
  }
}

export default CanvasMarker;
