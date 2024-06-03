import { loadImage, createCanvas } from "@napi-rs/canvas";

export async function mergeImages(paths: string[]) {
  const images = await Promise.all(paths.map((path) => loadImage(path)));
  const canvas = createCanvas(images[0].width, images[0].height);
  const ctx = canvas.getContext("2d");
  images.forEach((image) => {
    ctx.drawImage(image, 0, 0, image.width, image.height);
  });
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
    canvas.width / 6,
    0,
    2 * Math.PI
  );
  ctx.fillStyle = color;
  ctx.strokeStyle = "black";
  ctx.fill();
  ctx.stroke();
  return canvas;
}
