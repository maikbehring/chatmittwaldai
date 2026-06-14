/** Header für vom Nutzer hinterlegten mittwald API-Key (nur Browser-Session). */
export const USER_API_KEY_HEADER = "x-mittwald-api-key";

const MIN_KEY_LEN = 8;
const MAX_KEY_LEN = 512;

export function readUserSessionApiKey(req) {
  const raw = req.get(USER_API_KEY_HEADER);
  if (typeof raw !== "string") return null;
  const key = raw.trim();
  if (key.length < MIN_KEY_LEN || key.length > MAX_KEY_LEN) return null;
  return key;
}

export function hasUserSessionApiKey(req) {
  return readUserSessionApiKey(req) != null;
}

export function resolveUpstreamApiKey(req, fallbackKey) {
  return readUserSessionApiKey(req) ?? fallbackKey;
}

export function shouldSkipPublicRateLimit(req) {
  return hasUserSessionApiKey(req);
}
