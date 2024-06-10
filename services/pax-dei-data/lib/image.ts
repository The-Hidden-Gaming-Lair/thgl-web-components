import { loadImage, createCanvas, Canvas } from "@napi-rs/canvas";

export async function mergeImages(paths: string[]) {
  const rows = Math.sqrt(paths.length);
  let canvas: Canvas | null = null;
  for (const path of paths) {
    const image = await loadImage(path);

    if (!canvas) {
      canvas = createCanvas(image.width * rows, image.height * rows);
    }
    const x = +path.match(/x(\d+)/)![1];
    const y = rows - +path.match(/y(\d+)/)![1] - 1;
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

export async function colorizeImage(imagePath: string, color: string) {
  const image = await loadImage(imagePath);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, image.width, image.height);
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, image.width, image.height);
  return canvas;
}
