import type { AffineTransform, LatLng } from '../types';

export function createAffineProjection(tf: AffineTransform){
  return {
    project: ([lat, lng]: LatLng, zoom: number) => {
      const s = Math.pow(2, zoom);
      return { x: s * (tf.a * lng + tf.b), y: s * (tf.c * lat + tf.d) };
    },
    unproject: ({ x, y }: { x: number; y: number }, zoom: number): LatLng => {
      const s = Math.pow(2, zoom);
      const X = x / s; const Y = y / s;
      return [(Y - tf.d) / tf.c, (X - tf.b) / tf.a];
    },
  } as const;
}

