import QRCode from "qrcode";
import { useEffect, useRef } from "react";

export function QR({ value }: { value: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    QRCode.toCanvas(canvasRef.current!, value, {
      color: { dark: "#fff", light: "#27272a" },
    });
  }, [value]);

  return <canvas ref={canvasRef} className="h-[150px] w-[300px] mx-auto" />;
}
