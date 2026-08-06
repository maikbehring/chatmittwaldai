/**
 * Deutscher Strommix-Forecast (Carbon Aware) — Proxy + Zusammenfassung für UI-Badge.
 * @see https://carbonawarecomputing.blob.core.windows.net/forecasts/de.json
 */

const DEFAULT_FORECAST_URL =
  "https://carbonawarecomputing.blob.core.windows.net/forecasts/de.json";

/** UBA-Jahresmittel 2025 — Referenz in inferenceFootprint.ts */
export const UBA_GRID_CO2_GRAMS_PER_KWH = 344;

const CACHE_TTL_MS = 10 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;
const HINT_MIN_IMPROVEMENT = 0.08;

let cache = {
  fetchedAt: 0,
  summary: null,
};

export function getGridCarbonConfig() {
  const enabled = process.env.PLAYGROUND_GRID_CARBON_ENABLED !== "0";
  const forecastUrl = (
    process.env.PLAYGROUND_GRID_CARBON_FORECAST_URL || DEFAULT_FORECAST_URL
  ).trim();
  return {
    enabled,
    forecastUrl,
    region: "de",
    baselineUba2025: UBA_GRID_CO2_GRAMS_PER_KWH,
    sourceUrl: DEFAULT_FORECAST_URL,
  };
}

function berlinHour(isoTime) {
  const h = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Berlin",
    hour: "numeric",
    hour12: false,
  }).format(new Date(isoTime));
  return Number(h);
}

function berlinDateKey(isoTime) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(isoTime));
}

function roundRating(n) {
  return Math.round(Number(n) * 10) / 10;
}

/**
 * @param {{ Emissions?: { Time: string; Rating: number; Duration?: string }[]; UpdatedAt?: string; GeneratedAt?: string }} raw
 * @param {Date} [now]
 */
export function summarizeGridCarbonForecast(raw, now = new Date()) {
  const emissions = Array.isArray(raw?.Emissions) ? raw.Emissions : [];
  if (emissions.length === 0) {
    throw new Error("Forecast ohne Emissions-Daten.");
  }

  const nowMs = now.getTime();
  const currentEntry = pickClosestEmission(emissions, nowMs);
  if (!currentEntry) throw new Error("Kein passender Forecast-Zeitpunkt.");

  const future24h = emissions.filter((e) => {
    const t = new Date(e.Time).getTime();
    return t >= nowMs && t <= nowMs + 24 * 60 * 60 * 1000;
  });

  const future48h = emissions.filter((e) => {
    const t = new Date(e.Time).getTime();
    return t > nowMs && t <= nowMs + 48 * 60 * 60 * 1000;
  });

  const window = future24h.length > 0 ? future24h : emissions;
  let minEntry = window[0];
  let maxEntry = window[0];
  for (const e of window) {
    if (e.Rating < minEntry.Rating) minEntry = e;
    if (e.Rating > maxEntry.Rating) maxEntry = e;
  }

  const hint = computeCarbonHint(
    currentEntry.Rating,
    future48h.length > 0 ? future48h : future24h,
    nowMs,
  );

  const series24h = buildSeries24h(emissions, nowMs);

  return {
    region: "de",
    unit: "gCO2/kWh",
    updatedAt: raw.UpdatedAt ?? raw.GeneratedAt ?? null,
    current: {
      rating: roundRating(currentEntry.Rating),
      at: currentEntry.Time,
    },
    baselineUba2025: UBA_GRID_CO2_GRAMS_PER_KWH,
    next24h: {
      min: roundRating(minEntry.Rating),
      minAt: minEntry.Time,
      max: roundRating(maxEntry.Rating),
    },
    series24h,
    hint,
    sourceUrl: DEFAULT_FORECAST_URL,
  };
}

function buildSeries24h(emissions, nowMs) {
  const endMs = nowMs + 24 * 60 * 60 * 1000;
  return emissions
    .filter((e) => e?.Time && typeof e.Rating === "number")
    .filter((e) => {
      const t = new Date(e.Time).getTime();
      return t >= nowMs - 8 * 60 * 1000 && t <= endMs;
    })
    .sort((a, b) => new Date(a.Time).getTime() - new Date(b.Time).getTime())
    .map((e) => ({
      time: e.Time,
      rating: roundRating(e.Rating),
    }));
}

function pickClosestEmission(emissions, nowMs) {
  let best = null;
  let bestDist = Infinity;
  for (const e of emissions) {
    if (!e?.Time || typeof e.Rating !== "number") continue;
    const dist = Math.abs(new Date(e.Time).getTime() - nowMs);
    if (dist < bestDist) {
      bestDist = dist;
      best = e;
    }
  }
  return best;
}

function computeCarbonHint(currentRating, futureEmissions, nowMs) {
  if (!futureEmissions.length || currentRating <= 0) return null;

  let minEntry = null;
  for (const e of futureEmissions) {
    const t = new Date(e.Time).getTime();
    if (t <= nowMs) continue;
    if (!minEntry || e.Rating < minEntry.Rating) minEntry = e;
  }
  if (!minEntry) return null;

  const improvement = (currentRating - minEntry.Rating) / currentRating;
  if (improvement < HINT_MIN_IMPROVEMENT) return null;

  const minHour = berlinHour(minEntry.Time);
  const nowDay = berlinDateKey(nowMs);
  const minDay = berlinDateKey(minEntry.Time);

  if (minDay !== nowDay && minHour >= 5 && minHour <= 9) {
    return "morgen_frueh_guenstiger";
  }
  if (minHour >= 22 || minHour <= 5) {
    return "heute_nacht_guenstiger";
  }
  return null;
}

async function fetchForecastJson(url) {
  const ctrl = new AbortController();
  const timeoutId = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      throw new Error(`Forecast HTTP ${res.status}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Liefert gecachte Zusammenfassung; bei Fehler optional stale Cache. */
export async function getGridCarbonSummary() {
  const { enabled, forecastUrl } = getGridCarbonConfig();
  if (!enabled) return null;

  const now = Date.now();
  if (cache.summary && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.summary;
  }

  try {
    const raw = await fetchForecastJson(forecastUrl);
    const summary = summarizeGridCarbonForecast(raw);
    cache = { fetchedAt: now, summary };
    return summary;
  } catch (e) {
    console.error("Grid-Carbon-Forecast:", e);
    if (cache.summary) return cache.summary;
    throw e;
  }
}
