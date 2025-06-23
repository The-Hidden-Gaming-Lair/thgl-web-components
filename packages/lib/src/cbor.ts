import { Encoder } from "cbor-x";

export function decodeFromBuffer<T>(messagePack: Buffer | Uint8Array): T {
  const encoder = new Encoder({ useRecords: true, pack: true });
  return encoder.decode(messagePack) as T;
}

export function encodeToBuffer(content: any) {
  const encoder = new Encoder({ useRecords: true, pack: true });
  const serializedAsBuffer = encoder.encode(content);
  return serializedAsBuffer;
}
