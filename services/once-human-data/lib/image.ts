import { loadImage, createCanvas, Canvas } from "@napi-rs/canvas";
import simplify from "simplify-js";

export async function mergeImages(paths: string[]) {
  const rows = Math.sqrt(paths.length);
  let canvas: Canvas | null = null;
  for (const path of paths) {
    const image = await loadImage(path);

    if (!canvas) {
      canvas = createCanvas(image.width * rows, image.height * rows);
    }
    const x = +path.match(/(\d+)_/)![1];
    const y = rows - +path.match(/_(\d+)/)![1] - 1;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(
      image,
      image.width * x,
      image.height * y,
      image.width,
      image.height,
    );
  }

  return canvas!;
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
    canvas.width / 6,
    0,
    2 * Math.PI,
  );
  ctx.fillStyle = color;
  ctx.strokeStyle = "black";
  ctx.fill();
  ctx.stroke();
  return canvas;
}

export async function addOutlineToImage(imagePath: string) {
  const image = await loadImage(imagePath);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  const grow = 8;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.shadowColor = "#fff";
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

const regionsData = [
  {
    id: "blackheart",
    rgb: [93, 111, 129],
  },
  {
    id: "lone_wolf_wastes",
    rgb: [],
  },
  {
    id: "iron_river",
    rgb: [],
  },
  {
    id: "broken_delta",
    rgb: [101, 119, 131],
  },
  {
    id: "dayton_wetlands",
    rgb: [131, 141, 144],
  },
  {
    id: "chalk_peak",
    rgb: [101, 112, 133],
  },
  {
    id: "red_sands",
    rgb: [],
  },
  {
    id: "chalk_peak_2",
    rgb: [93, 111, 129],
  },
];
export async function getRegionsFromImage(
  imagePath: string,
  transformation: [number, number, number, number],
) {
  const image = await loadImage(imagePath);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, image.width, image.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const regions: Record<string, { x: number; y: number }[]> = {};

  for (let i = 0; i < data.length; i += 4) {
    const region = data[i] + data[i + 1] + data[i + 2];
    if (
      region === 0 ||
      regionsData.some(
        (r) => r.rgb.length && r.rgb.every((c, j) => c === data[i + j]),
      )
    ) {
      continue;
    }

    if (!regions[region]) {
      regions[region] = [];
    }

    const x = (i / 4) % canvas.width;
    const y = Math.floor(i / 4 / canvas.width);
    const neighbors = [
      { x: x - 1, y },
      { x: x + 1, y },
      { x, y: y - 1 },
      { x, y: y + 1 },
    ];
    let hasDifferentNeighbor = false;
    for (const neighbor of neighbors) {
      const neighborIndex = (neighbor.y * canvas.width + neighbor.x) * 4;
      const neighborRegion =
        data[neighborIndex] + data[neighborIndex + 1] + data[neighborIndex + 2];
      if (neighborRegion !== region) {
        hasDifferentNeighbor = true;
        break;
      }
    }
    if (hasDifferentNeighbor) {
      regions[region].push({ x, y });
    }
  }

  return Object.entries(regions).map(([key, value]) => {
    const border = value.map(({ x, y }) => [y, x]);
    const center = border.reduce(
      (acc, [x, y]) => [acc[0] + x, acc[1] + y],
      [0, 0],
    );
    return {
      id: key,
      center,
      border,
    };
  });
}
