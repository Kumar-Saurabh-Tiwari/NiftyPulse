import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(key: string, initial: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : initial;
    } catch {
      return initial;
    }
  });

  const setStoredValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const next = newValue instanceof Function ? newValue(prev) : newValue;
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          /* noop */
        }
        return next;
      });
    },
    [key]
  );

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) setValue(JSON.parse(stored) as T);
    } catch {
      /* noop */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [value, setStoredValue];
}
