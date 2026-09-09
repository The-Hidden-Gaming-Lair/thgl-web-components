import QRCode from "qrcode";
import { useEffect, useRef } from "react";

/**
 * Standard dark-on-light QR with a light quiet zone. Do NOT invert it to match
 * the dark theme: inverted codes (light modules on dark) are unreadable for
 * many phone camera apps and third-party scanners, so the tooltip shows a
 * white card instead.
 */
export function QR({ value }: { value: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    QRCode.toCanvas(canvasRef.current!, value, {
      width: 200,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    });
  }, [value]);

  return (
    <canvas
      ref={canvasRef}
      className="mx-auto rounded-sm bg-white"
      aria-label="Peer Link QR code"
    />
  );
}
