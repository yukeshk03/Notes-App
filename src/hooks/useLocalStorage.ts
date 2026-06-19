import { useEffect, useState } from 'react';

/**
 * A useState-compatible hook that synchronously hydrates from localStorage on
 * first render (no loading flicker) and persists every subsequent change.
 */
export function useLocalStorageState<T>(key: string, initialValue: T | (() => T)) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) return JSON.parse(stored) as T;
    } catch {
      // Corrupt or inaccessible storage — fall back to the initial value below.
    }
    return initialValue instanceof Function ? initialValue() : initialValue;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage may be full or unavailable (e.g. private browsing) — fail silently.
    }
  }, [key, value]);

  return [value, setValue] as const;
}
