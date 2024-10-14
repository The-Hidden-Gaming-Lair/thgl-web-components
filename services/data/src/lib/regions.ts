import { createCanvas, loadImage } from "@napi-rs/canvas";
import { Region } from "../types.js";
import { OUTPUT_DIR } from "./dirs.js";
import { writeJSON } from "./fs.js";

export function initRegions(seed?: Region[]): Region[] {
  return seed ?? [];
}

export function writeRegions(regions: Region[]) {
  writeJSON(OUTPUT_DIR + "/coordinates/regions.json", regions);
}

export async function getBorderFromMaskImage(
  fileName: string,
  maskValues: [number, number, number][],
) {
  const image = await loadImage(fileName);
  const width = image.width;
  const height = image.height;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height).data;

  // Function to get the RGB values of a pixel at (x, y)
  function getPixelRGB(x: number, y: number): [number, number, number] | null {
    if (x < 0 || y < 0 || x >= width || y >= height) {
      return null; // Out of bounds
    }
    const index = (y * width + x) * 4;
    return [imageData[index], imageData[index + 1], imageData[index + 2]];
  }

  // Function to check if a pixel's RGB matches any of the mask values
  function isMaskValue(pixelRGB: [number, number, number] | null): boolean {
    if (!pixelRGB) return false;
    return maskValues.some(
      (maskRGB) =>
        pixelRGB[0] === maskRGB[0] &&
        pixelRGB[1] === maskRGB[1] &&
        pixelRGB[2] === maskRGB[2],
    );
  }

  const border: [number, number][] = [];
  const visited = new Set<string>();

  // Stack-based traversal of the boundary of the region
  function findAndTraverseBorder(startX: number, startY: number) {
    const stack: [number, number][] = [[startX, startY]];
    visited.add(`${startX},${startY}`);

    const startPoint: [number, number] = [startX, startY];
    let hasReturnedToStart = false;

    // Directions for orthogonal and diagonal movement
    const directions: [number, number][] = [
      [-1, 0],
      [1, 0], // Left, Right
      [0, -1],
      [0, 1], // Top, Bottom
      [-1, -1],
      [1, -1], // Top-left, Top-right
      [-1, 1],
      [1, 1], // Bottom-left, Bottom-right
    ];

    let prevDx = 0;
    let prevDy = 0;
    while (stack.length > 0 && !hasReturnedToStart) {
      const [x, y] = stack.pop()!;
      border.push([x, y]);
      const candidates: Record<string, number> = checkNeighbors(x, y);
      // Check all 8 neighbors (including diagonals)
      const sortedCandidates = Object.entries(candidates).sort((a, b) => {
        const [ax, ay] = a[0].split(",").map(Number);
        const [bx, by] = b[0].split(",").map(Number);

        const candidatesA = Object.keys(checkNeighbors(ax, ay)).length;
        const candidatesB = Object.keys(checkNeighbors(bx, by)).length;
        if (candidatesA > candidatesB) return -1;
        if (candidatesB > candidatesA) return 1;
        const isDiagonalA = Math.abs(ax - x) === 1 && Math.abs(ay - y) === 1;
        const isDiagonalB = Math.abs(bx - x) === 1 && Math.abs(by - y) === 1;
        if (isDiagonalA && !isDiagonalB) return -1;
        if (isDiagonalB && !isDiagonalA) return 1;
        if (b[1] === a[1]) {
          const dxA = ax - x;
          const dyA = ay - y;
          const dxB = bx - x;
          const dyB = by - y;
          const dotA = dxA * prevDx + dyA * prevDy;
          const dotB = dxB * prevDx + dyB * prevDy;
          return dotB - dotA;
        }
        return b[1] - a[1];
      });
      const candidate = sortedCandidates[0];
      if (candidate) {
        const [nx, ny] = candidate[0].split(",").map(Number);
        stack.push([nx, ny]);
        visited.add(`${nx},${ny}`);
        prevDx = nx - x;
        prevDy = ny - y;

        // Check if we've returned to the starting point
        if (nx === startPoint[0] && ny === startPoint[1]) {
          hasReturnedToStart = true;
          // console.log("Returned to start point");
        }
      }
      if (stack.length === 0 && !hasReturnedToStart) {
        border.pop();
        const point = border.pop();
        if (point) {
          stack.push(point);
          visited.add(`${point[0]},${point[1]}`);
        } else {
          console.warn("Empty stack", x, y, visited.size);
          // console.log(visited);
        }
      }
    }
    if (!hasReturnedToStart) {
      console.warn("Did not return to start point", fileName, maskValues);
    }

    function checkNeighbors(x: number, y: number) {
      const candidates: Record<string, number> = {};
      for (const [dx, dy] of directions) {
        const nx = x + dx;
        const ny = y + dy;

        // Check if we've returned to the starting point
        if (nx === startPoint[0] && ny === startPoint[1] && border.length > 5) {
          hasReturnedToStart = true;
          // console.log("Returned to start point");
          break;
        }

        // If this neighbor has not been visited and is within the region
        if (!visited.has(`${nx},${ny}`) && isMaskValue(getPixelRGB(nx, ny))) {
          const isDiagonal = Math.abs(dx) === 1 && Math.abs(dy) === 1;
          if (isDiagonal) {
            // Check if the orthogonal neighbors are in the region
            const ortho1 = getPixelRGB(nx - dx, ny);
            const ortho2 = getPixelRGB(nx, ny - dy);
            if (isMaskValue(ortho1) && isMaskValue(ortho2)) {
              continue;
            }
          } else {
            if (dx !== 0) {
              const ortho1 = getPixelRGB(nx, ny - 1);
              const ortho2 = getPixelRGB(nx, ny + 1);
              if (isMaskValue(ortho1) && isMaskValue(ortho2)) {
                continue;
              }
            }
            if (dy !== 0) {
              const ortho1 = getPixelRGB(nx - 1, ny);
              const ortho2 = getPixelRGB(nx + 1, ny);
              if (isMaskValue(ortho1) && isMaskValue(ortho2)) {
                continue;
              }
            }
          }

          // Check if this is a border pixel
          for (const [bx, by] of directions) {
            const neighborX = nx + bx;
            const neighborY = ny + by;
            const neighborRGB = getPixelRGB(neighborX, neighborY);

            // If any neighbor is out of bounds or not in the region, it's a border pixel
            if (!isMaskValue(neighborRGB)) {
              if (!candidates[`${nx},${ny}`]) {
                candidates[`${nx},${ny}`] = 0;
              }
              candidates[`${nx},${ny}`]++;
            }
          }
        }
      }
      return candidates;
    }
  }

  // Find the first border point to start traversal
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelRGB = getPixelRGB(x, y);

      // Check if the pixel belongs to one of the target regions
      if (isMaskValue(pixelRGB)) {
        // Check 8 neighbors (orthogonal + diagonal) to see if this pixel is a border pixel
        const neighbors: [number, number][] = [
          [x - 1, y],
          [x + 1, y],
          [x, y - 1],
          [x, y + 1],
          [x - 1, y - 1],
          [x + 1, y - 1],
          [x - 1, y + 1],
          [x + 1, y + 1],
        ];

        let isBorder = false;

        for (const [nx, ny] of neighbors) {
          const neighborRGB = getPixelRGB(nx, ny);
          if (!isMaskValue(neighborRGB)) {
            isBorder = true;
            break;
          }
        }

        // If it is a border pixel, initiate boundary traversal from here
        if (isBorder) {
          findAndTraverseBorder(x, y);

          // Reduce points on the same line of the border array
          // for (let i = 0; i < border.length; i++) {
          //   const [x, y] = border[i];
          //   const [px, py] = border[i - 1] ?? border[border.length - 1];
          //   const [nx, ny] = border[i + 1] ?? border[0];

          //   // If the current point is on the same line as the previous and next points, remove it
          //   const sameHorizontal = x === px && x === nx;
          //   const sameVertical = y === py && y === ny;
          //   const sameDiagonal =
          //     Math.abs(x - px) === Math.abs(y - py) &&
          //     Math.abs(x - nx) === Math.abs(y - ny);

          //   if (sameHorizontal || sameVertical || sameDiagonal) {
          //     border.splice(i, 1);
          //     i--; // Adjust the index after removal
          //   }
          // }

          return border; // Once we find the border, return the result
        }
      }
    }
  }

  return border;
}
