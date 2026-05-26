const CACHE_TTL_MS = 30 * 60 * 1000;
const store = new Map();

function cacheKey(query, pageToken) {
  return `${(query || '').trim().toLowerCase()}|${pageToken || ''}`;
}

function get(query, pageToken) {
  const key = cacheKey(query, pageToken);
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

function set(query, pageToken, data) {
  const key = cacheKey(query, pageToken);
  store.set(key, { data, timestamp: Date.now() });
}

function findLatestForQuery(query) {
  const prefix = `${(query || '').trim().toLowerCase()}|`;
  let latest = null;
  for (const [key, entry] of store.entries()) {
    if (!key.startsWith(prefix)) continue;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      store.delete(key);
      continue;
    }
    if (!latest || entry.timestamp > latest.timestamp) {
      latest = entry;
    }
  }
  return latest?.data || null;
}

module.exports = { get, set, findLatestForQuery, CACHE_TTL_MS };
