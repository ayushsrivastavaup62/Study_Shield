const CACHE_TTL_MS = 60 * 60 * 1000;
const store = new Map();

function get(videoId) {
  const entry = store.get(videoId);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    store.delete(videoId);
    return null;
  }
  return entry.data;
}

function set(videoId, data) {
  store.set(videoId, { data, timestamp: Date.now() });
}

module.exports = { get, set, CACHE_TTL_MS };
