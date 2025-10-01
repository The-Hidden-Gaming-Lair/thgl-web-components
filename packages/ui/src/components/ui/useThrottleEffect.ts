import { useEffect, useRef } from "react";

export function useThrottledEffect(
  effectFn: () => void,
  deps: any[],
  delay: number,
  skipFirstCall: boolean = false,
): void {
  const lastCall = useRef<number>(0);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasCalledOnceThisMount = useRef<boolean>(false);
  const latestEffectFn = useRef(effectFn);

  useEffect(() => {
    latestEffectFn.current = effectFn;
  }, [effectFn]);

  useEffect(() => {
    if (skipFirstCall && !hasCalledOnceThisMount.current) {
      hasCalledOnceThisMount.current = true;
      return;
    }

    const now = Date.now();
    const timeSinceLastCall = now - lastCall.current;
    const remainingDelay = Math.max(0, delay - timeSinceLastCall);

    const invoke = () => {
      lastCall.current = Date.now();
      latestEffectFn.current?.();
    };

    if (timeSinceLastCall >= delay) {
      invoke();
    } else {
      if (timeout.current) clearTimeout(timeout.current);
      timeout.current = setTimeout(invoke, remainingDelay);
    }

    return () => {
      if (timeout.current) {
        clearTimeout(timeout.current);
        timeout.current = null;
      }
    };
  }, deps);
}
