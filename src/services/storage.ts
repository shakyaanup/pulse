// Small wrapper around localStorage for the demo's saved data.
//
// - Every key is prefixed, so Pulse's data can be found and cleared without
//   touching anything else stored for localhost.
// - The version lets us throw old data away if its shape ever changes:
//   bump it and saved data from older versions is simply ignored.
// - localStorage can throw (private browsing, storage full, disabled), so
//   every call is wrapped -- saving is a nice-to-have, never a crash.
const PREFIX = 'pulse:v1:';

export const readStorage = <T>(key: string): T | undefined => {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw === null ? undefined : (JSON.parse(raw) as T);
  } catch {
    return undefined;
  }
};

export const writeStorage = <T>(key: string, value: T): void => {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Not saved -- the app keeps working with in-memory state
  }
};

// Removes every key Pulse has saved ("Reset demo data")
export const clearAppStorage = (): void => {
  try {
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith(PREFIX))
      .forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Nothing to clear
  }
};
