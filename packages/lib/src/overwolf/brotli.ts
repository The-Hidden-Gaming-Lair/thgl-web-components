import decompress from "brotli/decompress";
import { Buffer } from "buffer";

export function brotliDecompress(data: ArrayBuffer): Uint8Array {
  return decompress(Buffer.from(data));
}
