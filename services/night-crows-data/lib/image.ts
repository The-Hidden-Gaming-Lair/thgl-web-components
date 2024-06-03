import { loadImage, createCanvas } from "@napi-rs/canvas";

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
    2 * Math.PI
  );
  ctx.fillStyle = color;
  ctx.strokeStyle = "black";
  ctx.fill();
  ctx.stroke();
  return canvas;
}
