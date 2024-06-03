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

export async function colorizeImage(
  imagePath: string,
  color: string,
  brightnessThreshold = -1
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

function parseColor(color) {
  // Assuming color is in the format "#RRGGBB"
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return [r, g, b];
}
