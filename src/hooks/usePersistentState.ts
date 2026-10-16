import { useEffect, useState } from 'react';
import { readStorage, writeStorage } from '../services/storage';

// Works like useState, but the value is saved to localStorage under `key`
// and restored from it the next time the app loads.
export const usePersistentState = <T>(key: string, initialValue: T) => {
  // A function passed to useState runs only on the first render, so storage
  // is read once -- not on every re-render
  const [value, setValue] = useState<T>(() => {
    const stored = readStorage<T>(key);
    return stored === undefined ? initialValue : stored;
  });

  // Saving is a side effect, so it lives in an effect. Runs after every
  // change to value.
  useEffect(() => {
    writeStorage(key, value);
  }, [key, value]);

  return [value, setValue] as const;
};
