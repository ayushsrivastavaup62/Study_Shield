const CACHE_PREFIX = 'studyshield-search-cache-';
const CACHE_TTL_MS = 30 * 60 * 1000;

function cacheKey(query, pageToken = null) {
  const q = (query || '').trim().toLowerCase();
  const page = pageToken || '';
  return `${CACHE_PREFIX}${q}::${page}`;
}

export function getCachedSearch(query, pageToken = null) {
  try {
    const raw = localStorage.getItem(cacheKey(query, pageToken));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(cacheKey(query, pageToken));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function setCachedSearch(query, payload, pageToken = null) {
  try {
    localStorage.setItem(
      cacheKey(query, pageToken),
      JSON.stringify({
        ...payload,
        timestamp: Date.now(),
      })
    );
  } catch {
    // localStorage full or unavailable
  }
}

export function hasFreshSearchCache(query, pageToken = null) {
  const cached = getCachedSearch(query, pageToken);
  return Boolean(cached?.videos?.length);
}

export function isQuotaExceededError(error) {
  const status = error?.response?.status;
  const data = error?.response?.data;
  if (data?.quotaExceeded) return true;
  if (status === 403) return true;
  const msg = (data?.message || error?.message || '').toLowerCase();
  return msg.includes('quota');
}
