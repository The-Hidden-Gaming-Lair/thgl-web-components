import { useEffect, useRef, useState, useCallback } from "react";

function useThrottledMemo<T>(
  computeFn: () => T,
  deps: any[],
  delay: number,
): T {
  const [value, setValue] = useState<T>(() => computeFn());

  const computeFnRef = useRef(computeFn);
  computeFnRef.current = computeFn;

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const updateValue = useCallback(() => {
    if (mountedRef.current) {
      setValue(computeFnRef.current());
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      updateValue();
    }, delay);

    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, deps);

  return value;
}

export default useThrottledMemo;
