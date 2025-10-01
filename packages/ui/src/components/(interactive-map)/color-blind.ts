import type { ColorBlindMode } from "@repo/lib";

export function applyColorBlindTransform(
  data: Uint8ClampedArray,
  mode: Exclude<ColorBlindMode, "none">,
  severity: number = 1,
) {
  let m00 = 1,
    m01 = 0,
    m02 = 0,
    m10 = 0,
    m11 = 1,
    m12 = 0,
    m20 = 0,
    m21 = 0,
    m22 = 1;

  switch (mode) {
    case "protanopia":
      m00 = 0.56667;
      m01 = 0.43333;
      m02 = 0.0;
      m10 = 0.55833;
      m11 = 0.44167;
      m12 = 0.0;
      m20 = 0.0;
      m21 = 0.24167;
      m22 = 0.75833;
      break;
    case "deuteranopia":
      m00 = 0.625;
      m01 = 0.375;
      m02 = 0.0;
      m10 = 0.7;
      m11 = 0.3;
      m12 = 0.0;
      m20 = 0.0;
      m21 = 0.3;
      m22 = 0.7;
      break;
    case "tritanopia":
      m00 = 0.95;
      m01 = 0.05;
      m02 = 0.0;
      m10 = 0.0;
      m11 = 0.43333;
      m12 = 0.56667;
      m20 = 0.0;
      m21 = 0.475;
      m22 = 0.525;
      break;
  }

  const s = Math.max(0, Math.min(1, severity));
  if (s === 0) return;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const R = r * m00 + g * m01 + b * m02;
    const G = r * m10 + g * m11 + b * m12;
    const B = r * m20 + g * m21 + b * m22;
    // Lerp original->transformed by severity
    const outR = r + (R - r) * s;
    const outG = g + (G - g) * s;
    const outB = b + (B - b) * s;
    data[i] = outR < 0 ? 0 : outR > 255 ? 255 : outR;
    data[i + 1] = outG < 0 ? 0 : outG > 255 ? 255 : outG;
    data[i + 2] = outB < 0 ? 0 : outB > 255 ? 255 : outB;
  }
}
