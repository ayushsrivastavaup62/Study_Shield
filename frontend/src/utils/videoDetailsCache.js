const DETAILS_PREFIX = 'studyshield-details-';
const CLASSIFY_PREFIX = 'studyshield-classify-v2-';
const TTL_MS = 60 * 60 * 1000;

const memoryDetails = new Map();
const memoryClassify = new Map();

function readStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed.value;
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify({ value, timestamp: Date.now() }));
  } catch {
    // ignore
  }
}

export function getCachedDetails(videoId) {
  if (memoryDetails.has(videoId)) return memoryDetails.get(videoId);
  const stored = readStorage(`${DETAILS_PREFIX}${videoId}`);
  if (stored) memoryDetails.set(videoId, stored);
  return stored;
}

export function setCachedDetails(videoId, details) {
  memoryDetails.set(videoId, details);
  writeStorage(`${DETAILS_PREFIX}${videoId}`, details);
}

export function getCachedClassification(videoId) {
  if (memoryClassify.has(videoId)) return memoryClassify.get(videoId);
  const stored = readStorage(`${CLASSIFY_PREFIX}${videoId}`);
  if (stored !== null && stored !== undefined) {
    memoryClassify.set(videoId, stored);
    return stored;
  }
  return undefined;
}

export function setCachedClassification(videoId, isEducational) {
  memoryClassify.set(videoId, isEducational);
  writeStorage(`${CLASSIFY_PREFIX}${videoId}`, isEducational);
}
