/**
 * Zusätzliche Chat-Anfragen nach Klick auf „Weiter testen“ (pro IP, pro Rate-Limit-Fenster).
 */

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 900_000);
const BONUS_PER_GRANT = Math.max(
  1,
  Math.min(Number(process.env.PLAYGROUND_BONUS_CHAT_REQUESTS || 5), 50),
);
const MAX_GRANTS_PER_WINDOW = Math.max(
  1,
  Math.min(Number(process.env.PLAYGROUND_BONUS_MAX_GRANTS_PER_WINDOW || 1), 100),
);

/** @type {Map<string, { remaining: number, grants: number, windowId: number }>} */
const byIp = new Map();

function currentWindowId(now = Date.now()) {
  return Math.floor(now / WINDOW_MS);
}

function getEntry(ip) {
  const wid = currentWindowId();
  let entry = byIp.get(ip);
  if (!entry || entry.windowId !== wid) {
    entry = { remaining: 0, grants: 0, windowId: wid };
    byIp.set(ip, entry);
  }
  return entry;
}

export function getBonusChatConfig() {
  return {
    enabled: true,
    requestsPerGrant: BONUS_PER_GRANT,
    maxGrantsPerWindow: MAX_GRANTS_PER_WINDOW,
  };
}

/** @returns {{ ok: true, granted: number, remaining: number } | { ok: false, code: string, remaining: number }} */
export function grantBonusChat(ip) {
  const entry = getEntry(ip);
  if (entry.grants >= MAX_GRANTS_PER_WINDOW) {
    return { ok: false, code: "max_grants", remaining: entry.remaining };
  }
  entry.grants += 1;
  entry.remaining += BONUS_PER_GRANT;
  return {
    ok: true,
    granted: BONUS_PER_GRANT,
    remaining: entry.remaining,
  };
}

/** express-rate-limit skip: true = normales Chat-Limit nicht anwenden */
export function shouldSkipChatRateLimit(ip) {
  const entry = getEntry(ip);
  if (entry.remaining > 0) {
    entry.remaining -= 1;
    return true;
  }
  return false;
}
