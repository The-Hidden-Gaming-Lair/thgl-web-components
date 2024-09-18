import { $ } from "bun";
import { loadImage, createCanvas, Canvas, Image } from "@napi-rs/canvas";
import { OUTPUT_DIR, TEMP_DIR, TEXTURE_DIR } from "./dirs.js";
import { saveImage } from "./fs.js";

const savedIcons: string[] = [];

export type IconProps = {
  border?: boolean;
  color?: string;
  circle?: boolean;
  threshold?: number;
  glowing?: boolean;
  rotate?: number;
  contrast?: number;
  brightness?: number;
};
export async function saveIcon(
  assetPath: string,
  name: string,
  props: IconProps = {},
) {
  let filePath;
  if (
    assetPath.startsWith("/home") ||
    assetPath.startsWith("/mnt") ||
    assetPath.startsWith("C:\\")
  ) {
    filePath = assetPath;
  } else if (assetPath.startsWith("/")) {
    filePath = TEXTURE_DIR + assetPath;
  } else {
    filePath = TEXTURE_DIR + "/" + assetPath;
  }
  const filename = name
    .replaceAll(" ", "_")
    .replace(/[^a-zA-Z0-9_]/g, "")
    .toLowerCase();

  if (savedIcons.includes(filename)) {
    return `${filename}.webp`;
  }
  if (props.border && props.color) {
    const canvas = await drawInCircleWithBorderColor(filePath, props.color);
    saveImage(TEMP_DIR + `/${filename}.png`, canvas.toBuffer("image/png"));
    await $`cwebp -resize 64 64 "${TEMP_DIR}/${filename}.png" -m 6 -o "${OUTPUT_DIR}/icons/${filename}.webp" -quiet`;
  } else if (props.circle && props.color) {
    const canvas = await addCircleToImage(filePath, props.color);
    saveImage(TEMP_DIR + `/${filename}.png`, canvas.toBuffer("image/png"));
    await $`cwebp -resize 64 64 "${TEMP_DIR}/${filename}.png" -m 6 -o "${OUTPUT_DIR}/icons/${filename}.webp" -quiet`;
  } else if (props.glowing && props.color) {
    const canvas = await addOutlineToImage(filePath, props.color);
    saveImage(TEMP_DIR + `/${filename}.png`, canvas.toBuffer("image/png"));
    await $`cwebp -resize 64 64 "${TEMP_DIR}/${filename}.png" -m 6 -o "${OUTPUT_DIR}/icons/${filename}.webp" -quiet`;
  } else if (props.color) {
    const canvas = await colorizeImage(filePath, props.color, props.threshold);
    saveImage(TEMP_DIR + `/${filename}.png`, canvas.toBuffer("image/png"));
    await $`cwebp -resize 64 64 "${TEMP_DIR}/${filename}.png" -m 6 -o "${OUTPUT_DIR}/icons/${filename}.webp" -quiet`;
  } else if (props.rotate) {
    const canvas = await rotateImage(filePath, props.rotate);
    saveImage(TEMP_DIR + `/${filename}.png`, canvas.toBuffer("image/png"));
    await $`cwebp -resize 64 64 "${TEMP_DIR}/${filename}.png" -m 6 -o "${OUTPUT_DIR}/icons/${filename}.webp" -quiet`;
  } else if (
    typeof props.brightness !== "undefined" &&
    typeof props.contrast !== "undefined"
  ) {
    const canvas = await adjustBrightnessAndContrast(
      await loadCanvas(filePath),
      props.brightness,
      props.contrast,
    );
    saveImage(TEMP_DIR + `/${filename}.png`, canvas.toBuffer("image/png"));
    await $`cwebp -resize 64 64 ${TEMP_DIR}/${filename}.png -m 6 -o ${OUTPUT_DIR}/icons/${filename}.webp -quiet`;
  } else {
    await $`cwebp -resize 64 64 ${filePath} -m 6 -o ${OUTPUT_DIR}/icons/${filename}.webp -quiet`;
  }
  savedIcons.push(filename);
  return `${filename}.webp`;
}

export async function drawInCircleWithBorderColor(
  imagePath: string,
  color: string,
) {
  const image = await loadImage(imagePath);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  const radius = Math.min(image.width, image.height) / 2;
  const lineWidth = Math.min(image.width, image.height) / 20;
  ctx.beginPath();
  ctx.lineWidth = lineWidth;
  ctx.arc(
    image.width / 2,
    image.height / 2,
    radius - lineWidth * 2,
    0,
    2 * Math.PI,
  );
  ctx.fillStyle = "black";
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.save();
  ctx.clip();
  ctx.drawImage(
    image,
    0,
    0,
    image.width,
    image.height,
    (image.width - radius * 2) / 2,
    (image.height - radius * 2) / 2,
    radius * 2,
    radius * 2,
  );
  ctx.restore();
  return canvas;
}

export async function addCircleToImage(imagePath: string, color: string) {
  const image = await loadImage(imagePath);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, image.width, image.height);
  ctx.beginPath();

  ctx.arc(
    (canvas.width * 3) / 4,
    (canvas.height * 1) / 4,
    canvas.width / 8,
    0,
    2 * Math.PI,
  );
  ctx.fillStyle = color;
  ctx.strokeStyle = "black";
  ctx.fill();
  ctx.stroke();
  return canvas;
}

export async function colorizeImage(
  imagePath: string,
  color: string,
  brightnessThreshold = -1,
) {
  const image = await loadImage(imagePath);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");

  // Draw the image onto the canvas
  ctx.drawImage(image, 0, 0, image.width, image.height);

  // Get the image data
  const imageData = ctx.getImageData(0, 0, image.width, image.height);
  const data = imageData.data;

  // Parse the target color
  const [r, g, b] = parseColor(color);

  // Iterate over each pixel
  for (let i = 0; i < data.length; i += 4) {
    const [currentR, currentG, currentB] = [data[i], data[i + 1], data[i + 2]];

    // Calculate the brightness of the current pixel
    const brightness = 0.299 * currentR + 0.587 * currentG + 0.114 * currentB;

    // Check if the brightness is above the threshold
    if (brightness > brightnessThreshold) {
      // Apply the target color while preserving the alpha channel
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
  }

  // Put the modified image data back to the canvas
  ctx.putImageData(imageData, 0, 0);

  return canvas;
}

export async function addOutlineToImage(imagePath: string, color: string) {
  const image = await loadImage(imagePath);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  const grow = 8;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.shadowColor = color;
  ctx.shadowBlur = image.width / 26;
  for (var i = 0; i < grow; i++) {
    ctx.drawImage(image, 0, 0, image.width, image.height);
  }
  ctx.shadowColor = "#000";
  ctx.shadowBlur = 4;
  ctx.drawImage(image, 0, 0, image.width + grow, image.height + grow);
  ctx.drawImage(image, 0, 0, image.width + grow, image.height + grow);

  return canvas;
}

function parseColor(color: string) {
  // Assuming color is in the format "#RRGGBB"
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return [r, g, b];
}

export async function arrayJoinImages(
  paths: string[],
  regExp: RegExp,
  outPath: string,
) {
  const coordinates = paths
    .map((path) => {
      const matched = path.match(regExp);
      if (!matched) {
        throw new Error("Invalid path: " + path);
      }
      return { coords: [+matched[1], +matched[2]], path };
    })
    .sort((a, b) => {
      if (a.coords[1] !== b.coords[1]) {
        return a.coords[1] - b.coords[1];
      }
      return a.coords[0] - b.coords[0];
    });
  const firstImage = await loadImage(coordinates[0].path);
  const width = firstImage.width;
  const height = firstImage.height;

  const cellsMax = Math.max(...coordinates.map((c) => c.coords[0]));
  const rowsMax = Math.max(...coordinates.map((c) => c.coords[1]));

  const tempFolder = TEMP_DIR + "/arrayjoin";
  await $`mkdir -p ${tempFolder}`;
  await $`rm ${tempFolder}/*`.catch(() => null);

  console.log("Cells:", cellsMax, "Rows:", rowsMax);
  for (let j = 0; j < rowsMax; j++) {
    for (let i = 0; i < cellsMax; i++) {
      if (coordinates.find((c) => c.coords[0] === i && c.coords[1] === j)) {
        continue;
      }
      const canvas = createBlankImage(width, height);
      saveImage(
        tempFolder + `/${100000 + i * 1000 + j}}.png`,
        canvas.toBuffer("image/png"),
      );
    }
  }

  const across = cellsMax + 1;

  let i = 0;
  for (const pathCoordinates of coordinates) {
    // copy the image to the temp folder
    await $`cp ${pathCoordinates.path} ${tempFolder}/${100000 + pathCoordinates.coords[1] * 1000 + pathCoordinates.coords[0]}.png`;
    i++;
  }

  await $`python ${import.meta.path.replace("image.ts", "arrayjoin.py")} ${tempFolder} ${outPath} ${across}`;
  // await $`rm ${tempFolder}/*`.catch(() => null);
}

export async function mergeImages(
  paths: string[],
  regExp: RegExp,
  bgColor?: string,
  invertY?: boolean,
) {
  let canvas: Canvas | null = null;
  let coordinates = paths.map((path) => {
    const matched = path.match(regExp);
    if (!matched) {
      throw new Error("Invalid path: " + path);
    }
    return { coords: [+matched[1], +matched[2]], path };
  });
  const cellsMin = Math.min(...coordinates.map((c) => c.coords[0]));
  const rowsMin = Math.min(...coordinates.map((c) => c.coords[1]));
  const cellsMax = Math.max(...coordinates.map((c) => c.coords[0]));
  const rowsMax = Math.max(...coordinates.map((c) => c.coords[1]));
  console.log(
    `Cells: ${cellsMin} to ${cellsMax}, Rows: ${rowsMin} to ${rowsMax}`,
  );

  for (const pathCoordinates of coordinates) {
    const image = await loadImage(pathCoordinates.path);
    console.log(
      `Rendering ${pathCoordinates.path.split("/").at(-1)} at ${pathCoordinates.coords} with offset ${pathCoordinates.coords[0] - cellsMin}, ${rowsMax - rowsMin - (pathCoordinates.coords[1] - rowsMin)} with size ${image.width}x${image.height}`,
    );
    if (!canvas) {
      console.log(
        "Creating canvas with size",
        image.width * (cellsMax - cellsMin + 1),
        image.height * (rowsMax - rowsMin + 1),
      );
      canvas = createCanvas(
        image.width * (cellsMax - cellsMin + 1),
        image.height * (rowsMax - rowsMin + 1),
      );
      if (bgColor) {
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
    const ctx = canvas.getContext("2d");

    const isImageOnlyBlack = isBlackImage(image);

    if (bgColor && isImageOnlyBlack) {
      // Set the bgColor as the fill style of the canvas
      ctx.fillStyle = bgColor;
      // Fill the entire canvas with the bgColor
      ctx.fillRect(
        image.width * (pathCoordinates.coords[0] - cellsMin),
        image.height * (rowsMax - pathCoordinates.coords[1]),
        image.width,
        image.height,
      );
    } else {
      if (invertY) {
        ctx.drawImage(
          image,
          image.width * (pathCoordinates.coords[0] - cellsMin),
          image.height * pathCoordinates.coords[1],
          image.width,
          image.height,
        );
      } else {
        ctx.drawImage(
          image,
          image.width * (pathCoordinates.coords[0] - cellsMin),
          image.height * (rowsMax - pathCoordinates.coords[1]),
          image.width,
          image.height,
        );
      }
    }
  }

  return canvas!;
}

function isBlackImage(image: Image) {
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, image.width, image.height);
  const imageData = ctx.getImageData(0, 0, image.width, image.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    if (r !== 0 || g !== 0 || b !== 0) {
      return false;
    }
  }
  return true;
}

export async function extractCanvasFromSprite(
  spritePath: string,
  name: string,
  data: {
    Key: string;
    Value: {
      width: number;
      height: number;
      borderLeft: number;
      borderRight: number;
      borderTop: number;
      borderBottom: number;
      paddingLeft: number;
      paddingRight: number;
      paddingTop: number;
      paddingBottom: number;
      uv0X: number;
      uv0Y: number;
      uv3X: number;
      uv3Y: number;
      buv0X: number;
      buv0Y: number;
      buv3X: number;
      buv3Y: number;
    };
  },
  props: {
    rotate?: number;
  } = {},
) {
  const image = await loadImage(spritePath);
  const canvas = createCanvas(data.Value.width, data.Value.height);
  const canvasTmp = createCanvas(data.Value.width, data.Value.height);
  const ctx = canvas.getContext("2d");
  const ctxTmp = canvasTmp.getContext("2d");

  const spriteWidth = image.naturalWidth;
  const spriteHeight = image.naturalHeight;

  const sx = data.Value.uv0X * spriteWidth;
  const sy = data.Value.uv3Y * spriteHeight;
  const sWidth = (data.Value.uv3X - data.Value.uv0X) * spriteWidth;
  const sHeight = (data.Value.uv0Y - data.Value.uv3Y) * spriteHeight;
  ctxTmp.drawImage(
    image,
    sx,
    sy,
    sWidth,
    sHeight,
    0,
    0,
    data.Value.width,
    data.Value.height,
  );

  if (props.rotate) {
    const centerX = data.Value.width / 2;
    const centerY = data.Value.height / 2;
    ctx.translate(centerX, centerY);
    ctx.rotate((props.rotate * Math.PI) / 180);
    ctx.drawImage(
      canvasTmp,
      -centerX,
      -centerY,
      data.Value.width,
      data.Value.height,
    );
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    saveImage(TEMP_DIR + `/${name}.png`, canvas.toBuffer("image/png"));
  } else {
    saveImage(TEMP_DIR + `/${name}.png`, canvasTmp.toBuffer("image/png"));
  }

  await $`cwebp ${TEMP_DIR}/${name}.png -m 6 -o ${OUTPUT_DIR}/icons/${name}.webp -quiet`;

  return `${name}.webp`;
}

export async function rotateImage(imagePath: string, angle: number) {
  const image = await loadImage(imagePath);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  ctx.translate(image.width / 2, image.height / 2);
  ctx.rotate((angle * Math.PI) / 180);
  ctx.drawImage(image, -image.width / 2, -image.height / 2);
  return canvas;
}

export async function loadCanvas(imagePath: string) {
  const image = await loadImage(imagePath);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, image.width, image.height);
  return canvas;
}

export function adjustBrightnessAndContrast(
  canvas: Canvas,
  brightness: number,
  contrast: number,
) {
  const ctx = canvas.getContext("2d");
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.max(Math.min(data[i] * contrast + brightness, 255), 0);
    data[i + 1] = Math.max(
      Math.min(data[i + 1] * contrast + brightness, 255),
      0,
    );
    data[i + 2] = Math.max(
      Math.min(data[i + 2] * contrast + brightness, 255),
      0,
    );
  }

  ctx.putImageData(imageData, 0, 0);

  return canvas;
}

export function mirrorCancas(canvas: Canvas) {
  const mirroredCanvas = createCanvas(canvas.width, canvas.height);
  const ctx = mirroredCanvas.getContext("2d");
  ctx.translate(0, canvas.height);
  ctx.scale(1, -1);
  ctx.drawImage(canvas, 0, 0);
  return mirroredCanvas;
}

export function rotateCanvas(canvas: Canvas, angle: number) {
  const rotatedCanvas = createCanvas(canvas.width, canvas.height);
  const ctx = rotatedCanvas.getContext("2d");
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((angle * Math.PI) / 180);
  ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
  return rotatedCanvas;
}

export async function vectorize(
  filePath: string,
  outputPath: string,
  width: number,
  height: number,
) {
  const formData = new FormData();
  const file = Bun.file(filePath);
  formData.append("image", file);
  formData.append("output.size.width", width.toString());
  formData.append("output.size.height", height.toString());
  formData.append("output.size.unit", "px");

  const response = await fetch(
    // "https://vectorizer.ai/api/v1/vectorize?mode=test",
    "https://vectorizer.ai/api/v1/vectorize",
    {
      method: "POST",
      headers: {
        Authorization:
          "Basic dms0ZXJiY3pycTVjenJsOnFqZW5uZTlqYnIycnZnNWQwNzA3MGVydHFrOWVxYWJ0NjR0cDMwMTBnODYyZXJpMTIyZ2c=",
      },
      body: formData,
    },
  );

  if (!response.ok) {
    console.error("Error:", response.status, await response.text());
    return;
  }

  const blob = await response.blob();
  // const svg = await blob.text();
  // const filteredSvg = svg.replace(
  //   "viewBox=",
  //   'width="1000" height="1000" viewBox=',
  // );
  // fs.writeFileSync(outputPath, filteredSvg);
  return Bun.write(outputPath, blob);
}

export function createBlankImage(width: number, height: number) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);
  return canvas;
}

export function createCustomMapImage(
  filePath: string,
  width: number,
  height: number,
  waterPoints: [number, number][],
) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#0000FF";
  for (const [x, y] of waterPoints) {
    ctx.fillRect(x, y, 10, 10);
  }
  saveImage(filePath, canvas.toBuffer("image/png"));
}

export function virtualToRealSize(
  virtualPoint: [number, number],
  virtualBounds: [[number, number], [number, number]],
  realImageSize: [number, number],
): [number, number] {
  const [virtualWidth, virtualHeight] = [
    virtualBounds[1][0] - virtualBounds[0][0],
    virtualBounds[1][1] - virtualBounds[0][1],
  ];
  const [realWidth, realHeight] = realImageSize;
  const [realX, realY] = [
    (virtualPoint[0] - virtualBounds[0][0]) * (realWidth / virtualWidth),
    (virtualPoint[1] - virtualBounds[0][1]) * (realHeight / virtualHeight),
  ];
  return [realX, realY];
}

export function drawOnCanvas(
  canvas: Canvas,
  center: [number, number],
  yaw: number,
  size: [number, number],
  color: string,
) {
  const ctx = canvas.getContext("2d");
  ctx.save();
  ctx.translate(center[0], center[1]);
  ctx.rotate((yaw * Math.PI) / 180);
  ctx.fillStyle = color;
  ctx.fillRect(-size[0] / 2, -size[1] / 2, size[0], size[1]);
  ctx.restore();
  return canvas;
}
