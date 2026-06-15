/**
 * Wochenend-Besuch: Geocoding (Open-Meteo), Wikipedia (de), Wetterprognose.
 */

const TZ = "Europe/Berlin";
const CACHE_TTL_MS = 15 * 60 * 1000;

/** @type {Map<string, { at: number, data: unknown }>} */
const cache = new Map();

function cacheGet(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return hit.data;
}

function cacheSet(key, data) {
  cache.set(key, { at: Date.now(), data });
}

function berlinYmd(date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function berlinWeekday(date) {
  const wd = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "short",
  }).format(date);
  const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[wd] ?? 0;
}

function addDaysYmd(ymd, days) {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

/** @returns {{ saturday: string, sunday: string, labelSaturday: string, labelSunday: string }} */
export function getUpcomingWeekendBerlin(now = new Date()) {
  const todayYmd = berlinYmd(now);
  const day = berlinWeekday(now);

  let daysUntilSaturday;
  if (day === 0) daysUntilSaturday = 6;
  else if (day === 6) daysUntilSaturday = 0;
  else daysUntilSaturday = 6 - day;

  const saturday = addDaysYmd(todayYmd, daysUntilSaturday);
  const sunday = addDaysYmd(saturday, 1);

  const fmt = (ymd) => {
    const [yy, mm, dd] = ymd.split("-").map(Number);
    const dt = new Date(yy, mm - 1, dd, 12, 0, 0);
    return new Intl.DateTimeFormat("de-DE", {
      timeZone: TZ,
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(dt);
  };

  return {
    saturday,
    sunday,
    labelSaturday: fmt(saturday),
    labelSunday: fmt(sunday),
  };
}

const WMO_DE = {
  0: "Klar",
  1: "Überwiegend klar",
  2: "Teilweise bewölkt",
  3: "Bedeckt",
  45: "Nebel",
  48: "Nebel mit Reifbildung",
  51: "Leichter Nieselregen",
  53: "Nieselregen",
  55: "Starker Nieselregen",
  61: "Leichter Regen",
  63: "Regen",
  65: "Starker Regen",
  71: "Leichter Schneefall",
  73: "Schneefall",
  75: "Starker Schneefall",
  80: "Regenschauer",
  81: "Regenschauer",
  82: "Starke Regenschauer",
  95: "Gewitter",
  96: "Gewitter mit Hagel",
  99: "Schweres Gewitter mit Hagel",
};

function wmoLabel(code) {
  const n = Number(code);
  return WMO_DE[n] ?? `Wettercode ${n}`;
}

/**
 * @param {string} cityQuery
 */
export async function prepareWeekendVisitCity(cityQuery) {
  const q = String(cityQuery ?? "").trim();
  if (q.length < 2) throw new Error("Bitte einen gültigen Stadtnamen eingeben (mind. 2 Zeichen).");

  const cacheKey = `prepare:${q.toLowerCase()}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const url =
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}` +
    `&count=5&language=de&format=json`;
  const res = await fetch(url, { signal: AbortSignal.timeout(12_000) });
  if (!res.ok) throw new Error(`Geocoding fehlgeschlagen (${res.status}).`);

  const json = await res.json();
  const results = Array.isArray(json?.results) ? json.results : [];
  if (results.length === 0) {
    throw new Error(`Stadt „${q}" wurde nicht gefunden. Bitte Schreibweise prüfen.`);
  }

  const best = results[0];
  const weekend = getUpcomingWeekendBerlin();

  const data = {
    query: q,
    city: String(best.name ?? q),
    country: String(best.country ?? ""),
    admin1: String(best.admin1 ?? ""),
    latitude: Number(best.latitude),
    longitude: Number(best.longitude),
    timezone: String(best.timezone ?? TZ),
    wikipediaTitle: String(best.name ?? q),
    weekend,
    fetchedAt: new Date().toISOString(),
  };

  cacheSet(cacheKey, data);
  return data;
}

async function fetchWikipediaSummary(title) {
  const encoded = encodeURIComponent(title.replace(/ /g, "_"));
  const url = `https://de.wikipedia.org/api/rest_v1/page/summary/${encoded}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "mittwald-ai-playground/1.0 (weekend-visit)" },
    signal: AbortSignal.timeout(12_000),
  });

  if (res.status === 404) {
    const searchUrl =
      `https://de.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(title)}` +
      `&srlimit=1&format=json&origin=*`;
    const sRes = await fetch(searchUrl, { signal: AbortSignal.timeout(12_000) });
    const sJson = await sRes.json();
    const hit = sJson?.query?.search?.[0]?.title;
    if (!hit) return { title, extract: "", description: "", url: "" };
    return fetchWikipediaSummary(hit);
  }

  if (!res.ok) throw new Error(`Wikipedia-Abruf fehlgeschlagen (${res.status}).`);

  const j = await res.json();
  return {
    title: String(j.title ?? title),
    description: String(j.description ?? ""),
    extract: String(j.extract ?? "").slice(0, 2500),
    url: String(j.content_urls?.desktop?.page ?? j.content_urls?.mobile?.page ?? ""),
  };
}

/**
 * @param {{
 *   latitude: number;
 *   longitude: number;
 *   saturday: string;
 *   sunday: string;
 *   wikipediaTitle: string;
 * }} opts
 */
export async function fetchWeekendVisitSources(opts) {
  const { latitude, longitude, saturday, sunday, wikipediaTitle } = opts;
  const cacheKey = `sources:${latitude},${longitude},${saturday},${sunday},${wikipediaTitle}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const forecastUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
    `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum` +
    `&timezone=${encodeURIComponent(TZ)}&start_date=${saturday}&end_date=${sunday}`;

  const [wiki, wRes] = await Promise.all([
    fetchWikipediaSummary(wikipediaTitle),
    fetch(forecastUrl, { signal: AbortSignal.timeout(12_000) }),
  ]);

  if (!wRes.ok) throw new Error(`Wetter-Abruf fehlgeschlagen (${wRes.status}).`);
  const wJson = await wRes.json();
  const daily = wJson?.daily;
  if (!daily?.time?.length) {
    throw new Error("Keine Wetterdaten für das Wochenende verfügbar.");
  }

  const days = daily.time.map((date, i) => ({
    date: String(date),
    label:
      date === saturday
        ? "Samstag"
        : date === sunday
          ? "Sonntag"
          : new Intl.DateTimeFormat("de-DE", {
              timeZone: TZ,
              weekday: "long",
              day: "numeric",
              month: "long",
            }).format(new Date(`${date}T12:00:00`)),
    weatherCode: Number(daily.weathercode?.[i]),
    weatherLabel: wmoLabel(daily.weathercode?.[i]),
    tempMaxC: daily.temperature_2m_max?.[i] ?? null,
    tempMinC: daily.temperature_2m_min?.[i] ?? null,
    precipProbPct: daily.precipitation_probability_max?.[i] ?? null,
    precipMm: daily.precipitation_sum?.[i] ?? null,
  }));

  const data = {
    wikipedia: wiki,
    weather: {
      source: "Open-Meteo",
      latitude,
      longitude,
      days,
    },
    fetchedAt: new Date().toISOString(),
  };

  cacheSet(cacheKey, data);
  return data;
}

/**
 * @param {string} cityQuery
 */
export async function fetchWeekendVisitData(cityQuery) {
  const prepare = await prepareWeekendVisitCity(cityQuery);
  const sources = await fetchWeekendVisitSources({
    latitude: prepare.latitude,
    longitude: prepare.longitude,
    saturday: prepare.weekend.saturday,
    sunday: prepare.weekend.sunday,
    wikipediaTitle: prepare.wikipediaTitle,
  });
  return { ...prepare, ...sources };
}
