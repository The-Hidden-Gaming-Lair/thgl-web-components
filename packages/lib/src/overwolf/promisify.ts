export function promisifyOverwolf<R extends overwolf.Result>(
  fn: (callback: overwolf.CallbackFunction<R>) => void,
): () => Promise<R>;
export function promisifyOverwolf<P1, R extends overwolf.Result>(
  fn: (p1: P1, callback: overwolf.CallbackFunction<R>) => void,
): (p1: P1) => Promise<R>;
export function promisifyOverwolf<P1, P2, R extends overwolf.Result>(
  fn: (p1: P1, p2: P2, callback: overwolf.CallbackFunction<R>) => void,
): (p1: P1, p2: P2) => Promise<R>;
export function promisifyOverwolf<P1, P2, P3, R extends overwolf.Result>(
  fn: (p1: P1, p2: P2, p3: P3, callback: overwolf.CallbackFunction<R>) => void,
): (p1: P1, p2: P2, p3: P3) => Promise<R>;
export function promisifyOverwolf<R extends overwolf.Result>(
  fn: any,
): (...args: any[]) => Promise<R> {
  return function (...args: any[]) {
    return new Promise<R>((resolve, reject) => {
      function callback(result: R) {
        if (result === null || result.success) {
          resolve(result);
        } else {
          reject(new Error(result.error || (result as any).reason || result));
        }
      }
      args.push(callback);
      try {
        fn.call(null, ...args);
      } catch (e) {
        if (e instanceof Error) {
          reject(new Error(e.message));
        } else {
          reject(e);
        }
      }
    });
  };
}
