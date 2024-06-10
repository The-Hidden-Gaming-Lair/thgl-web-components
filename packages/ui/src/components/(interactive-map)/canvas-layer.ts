import type { Coords, TileLayer, TileLayerOptions } from "leaflet";
import leaflet from "leaflet";

type Tile = HTMLCanvasElement & { complete: boolean };

const CanvasLayer = leaflet.TileLayer.extend({
  createCanvas(
    tile: Tile,
    coords: Coords,
    done: (err: unknown, tile: Tile) => void,
  ) {
    let err: unknown;
    const ctx = tile.getContext("2d");
    const { x: width, y: height } = this.getTileSize();
    tile.width = width;
    tile.height = height;

    const img = new Image();
    img.onload = () => {
      try {
        if (
          this.options.filter === "greyscale" ||
          this.options.filter === "colorful"
        ) {
          const threshold = this.options.threshold || 150;
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext("2d")!;
          context.drawImage(img, 0, 0);
          const imageData = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height,
          );
          const pixels = imageData.data;
          for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            if (gray >= threshold) {
              // Make grey
              if (this.options.filter === "greyscale") {
                pixels[i] = pixels[i + 1] = pixels[i + 2] = 100;
              }
              pixels[i + 3] = 180;
            } else {
              // Make transparent
              pixels[i + 3] = 1;
            }
          }

          ctx?.putImageData(imageData, 0, 0);
        } else {
          ctx?.drawImage(img, 0, 0);
        }
        tile.complete = true;
      } catch (e) {
        err = e;
      } finally {
        done(err, tile);
      }
    };
    const tileZoom = this._getZoomForUrl();
    img.src = isNaN(tileZoom) ? "" : this.getTileUrl(coords);
    img.crossOrigin = "anonymous";
  },
  createTile(coords: Coords, done: () => void) {
    const { timeout } = this.options;
    const { z: zoom } = coords;
    const tile = document.createElement("canvas");

    if (timeout) {
      if (zoom !== this._delaysForZoom) {
        this._clearDelaysForZoom();
        this._delaysForZoom = zoom;
      }

      if (!this._delays[zoom]) this._delays[zoom] = [];

      this._delays[zoom].push(
        setTimeout(() => {
          this.createCanvas(tile, coords, done);
        }, timeout),
      );
    } else {
      this.createCanvas(tile, coords, done);
    }
    return tile;
  },
  _clearDelaysForZoom() {
    const prevZoom = this._delaysForZoom;
    const delays = this._delays[prevZoom];

    if (!delays) return;

    delays.forEach((delay: number, index: number) => {
      clearTimeout(delay);
      delete delays[index];
    });

    delete this._delays[prevZoom];
  },
}) as new (url: string, options: TileLayerOptions) => TileLayer;

export const createCanvasLayer = function (
  url: string,
  options: TileLayerOptions & { filter: string },
) {
  return new CanvasLayer(url, options);
};
