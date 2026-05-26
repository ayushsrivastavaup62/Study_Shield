const THROTTLE_MS = 700;

/**
 * Returns true if the call should proceed; false if throttled (too soon).
 */
export function shouldAllowSearch(lastSearchAtRef) {
  const now = Date.now();
  if (lastSearchAtRef.current && now - lastSearchAtRef.current < THROTTLE_MS) {
    return false;
  }
  lastSearchAtRef.current = now;
  return true;
}

export const SEARCH_THROTTLE_MS = THROTTLE_MS;
