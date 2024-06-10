import { loadImage, createCanvas, Canvas } from "@napi-rs/canvas";

import { readJSON } from "./fs.js";
import { DA_Coast } from "../types.js";

export function createCanvasBySize(size: number) {
  return createCanvas(size, size);
}

export async function extractImageDataByIndex(
  filePath: string,
  index: number,
  rgbFactor: [number, number, number] = [1, 1, 1],
) {
  const image = await loadImage(filePath);

  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, image.width, image.height);

  const imageData = ctx.getImageData(0, 0, image.width, image.height);
  ctx.clearRect(0, 0, image.width, image.height);

  const pixels = imageData.data;
  for (let i = 0; i < pixels.length; i += 4) {
    const value = pixels[i + index];
    pixels[i] = value * rgbFactor[0];
    pixels[i + 1] = value * rgbFactor[1];
    pixels[i + 2] = value * rgbFactor[2];
    pixels[i + 3] = value === 0 ? 0 : 255;
  }
  return imageData;
}

export function putImageData(
  canvas: Canvas,
  imageData: ImageData,
  dx: number,
  dy: number,
) {
  const ctx = canvas.getContext("2d");
  ctx.putImageData(imageData, dx, dy);
}

const AREA_WORLD_SIZE = 204800;

export async function createMap(textureFilePath: string, dataFilePath: string) {
  const hillshade = await loadImage(
    textureFilePath + "/MapMasks/map_rock_tree_hillshade.png",
  );

  const dir = textureFilePath.split("/").at(-1);
  const roadPOIWater = await loadImage(
    textureFilePath + "/MapMasks/map_road_poi_water.png",
  );
  const heatmap = await loadImage(textureFilePath + "/MapMasks/map_height.png");

  const width = hillshade.width;
  const height = hillshade.height;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, hillshade.width, hillshade.height);
  // ctx.drawImage(bg, 0, 0, width, height);
  let coastImageData: ImageData | null = null;
  let padding = 0;
  let offset = 0;
  try {
    const coastInfo = await readJSON<DA_Coast>(
      dataFilePath + `/DA_Coast_${dir}.json`,
    );
    const areaSize = coastInfo[0].Properties.AreaSize.X;
    const coast = await loadImage(
      textureFilePath + `/DA_Coast_${dir}_Ground.png`,
    );
    const coastCanvas = createCanvas(width, height);
    const coastCtx = coastCanvas.getContext("2d");
    if (areaSize === 256000) {
      // coastCtx.drawImage(coast, 0, 0, width, height);
      padding = 150;
      offset = 50;
      coastCtx.drawImage(
        coast,
        offset,
        offset,
        coast.width - offset * 2,
        coast.height - offset * 2,
        0,
        0,
        width,
        height,
      );
    } else {
      padding = 80;
      coastCtx.drawImage(coast, 0, 0, width, height);
      // coastCtx.drawImage(
      //   coast,
      //   10,
      //   10,
      //   coast.width - 20,
      //   coast.height - 20,
      //   0,
      //   0,
      //   width,
      //   height
      // );
    }

    coastImageData = coastCtx.getImageData(0, 0, width, height);
  } catch (e) {
    console.warn("No coast image found for", textureFilePath);
  }

  const hillShadeCanvas = createCanvas(width, height);
  const hillshadeCtx = hillShadeCanvas.getContext("2d");
  hillshadeCtx.drawImage(
    hillshade,
    offset,
    offset,
    width - offset * 2,
    height - offset * 2,
  );

  const roadPOIWaterCanvas = createCanvas(width, height);
  const roadPOIWaterCtx = roadPOIWaterCanvas.getContext("2d");
  roadPOIWaterCtx.drawImage(
    roadPOIWater,
    offset,
    offset,
    width - offset * 2,
    height - offset * 2,
  );

  const heatmapCanvas = createCanvas(width, height);
  const heatmapCtx = heatmapCanvas.getContext("2d");
  heatmapCtx.drawImage(
    heatmap,
    offset,
    offset,
    width - offset * 2,
    height - offset * 2,
  );

  const hillshadeImageData = hillshadeCtx.getImageData(0, 0, width, height);
  const roadPOIWaterImageData = roadPOIWaterCtx.getImageData(
    0,
    0,
    width,
    height,
  );
  const heatmapImageData = heatmapCtx.getImageData(0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  for (let i = 0; i < pixels.length; i += 4) {
    const x = (i / 4) % width;
    const y = Math.floor(i / 4 / width);
    const isEdge =
      coastImageData &&
      (x < padding ||
        y < padding ||
        x > width - padding ||
        y > height - padding);

    const isCost = coastImageData && coastImageData.data[i] < 112;
    const isWater = roadPOIWaterImageData.data[i + 2] === 255;
    const isPOI = roadPOIWaterImageData.data[i + 1] === 255;
    const isRoad = roadPOIWaterImageData.data[i + 0] === 255;
    const isRock = hillshadeImageData.data[i] === 255;
    const isTree = hillshadeImageData.data[i + 1] === 255;
    const heightMap = heatmapImageData.data[i];

    if (isEdge || isCost || isWater) {
      pixels[i] = 96;
      pixels[i + 1] = 140;
      pixels[i + 2] = 138;
      pixels[i + 3] = 255;
    } else if (isRoad) {
      pixels[i] = 108;
      pixels[i + 1] = 64;
      pixels[i + 2] = 69;
      pixels[i + 3] = 255;
    } else if (isRock) {
      pixels[i] = 150;
      pixels[i + 1] = 150;
      pixels[i + 2] = 150;
      pixels[i + 3] = hillshadeImageData.data[i + 2];
    } else if (isTree) {
      pixels[i] = 195;
      pixels[i + 1] = 203;
      pixels[i + 2] = 121;
      pixels[i + 3] = hillshadeImageData.data[i + 2];
    } else {
      pixels[i] = 150 + heightMap;
      pixels[i + 1] = 140 + heightMap;
      pixels[i + 2] = 117 + heightMap;
      pixels[i + 3] = 255;
    }
  }

  putImageData(canvas, imageData, 0, 0);
  const rotatedCanvas = rotateCanvas(canvas, -90);

  return rotatedCanvas;
}

export function rotateCanvas(canvas: Canvas, angle: number) {
  const rotatedCanvas = createCanvas(canvas.width, canvas.height);
  const ctx = rotatedCanvas.getContext("2d");
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((angle * Math.PI) / 180);
  ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
  return rotatedCanvas;
}
