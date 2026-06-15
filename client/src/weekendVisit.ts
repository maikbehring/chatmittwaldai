import { ensureOkApiResponse, type PlaygroundRateLimits } from "./apiErrors";
import { playgroundApiHeaders } from "./playgroundSessionApiKey";
import { formatPlaygroundTodayContext } from "./playgroundDate";

export type WeekendVisitPrepare = {
  query: string;
  city: string;
  country: string;
  admin1: string;
  latitude: number;
  longitude: number;
  timezone: string;
  wikipediaTitle: string;
  weekend: {
    saturday: string;
    sunday: string;
    labelSaturday: string;
    labelSunday: string;
  };
  fetchedAt: string;
};

export type WeekendVisitWikipedia = {
  title: string;
  description: string;
  extract: string;
  url: string;
};

export type WeekendVisitWeatherDay = {
  date: string;
  label: string;
  weatherCode: number;
  weatherLabel: string;
  tempMaxC: number | null;
  tempMinC: number | null;
  precipProbPct: number | null;
  precipMm: number | null;
};

export type WeekendVisitSources = {
  wikipedia: WeekendVisitWikipedia;
  weather: {
    source: string;
    latitude: number;
    longitude: number;
    days: WeekendVisitWeatherDay[];
  };
  fetchedAt: string;
};

export type WeekendVisitData = WeekendVisitPrepare & WeekendVisitSources;

export async function prepareWeekendVisitCity(
  city: string,
  signal?: AbortSignal,
  rateLimits?: PlaygroundRateLimits | null,
): Promise<WeekendVisitPrepare> {
  const res = await fetch(
    `/api/weekend-visit/prepare?city=${encodeURIComponent(city.trim())}`,
    { headers: playgroundApiHeaders(), signal },
  );
  await ensureOkApiResponse(res, rateLimits);
  return (await res.json()) as WeekendVisitPrepare;
}

export async function fetchWeekendVisitSources(
  prepare: WeekendVisitPrepare,
  signal?: AbortSignal,
  rateLimits?: PlaygroundRateLimits | null,
): Promise<WeekendVisitSources> {
  const res = await fetch("/api/weekend-visit/sources", {
    method: "POST",
    headers: playgroundApiHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      latitude: prepare.latitude,
      longitude: prepare.longitude,
      saturday: prepare.weekend.saturday,
      sunday: prepare.weekend.sunday,
      wikipediaTitle: prepare.wikipediaTitle,
    }),
    signal,
  });
  await ensureOkApiResponse(res, rateLimits);
  return (await res.json()) as WeekendVisitSources;
}

function formatWeatherDay(day: WeekendVisitWeatherDay): string {
  const temp =
    day.tempMinC != null && day.tempMaxC != null
      ? `${Math.round(day.tempMinC)}–${Math.round(day.tempMaxC)} °C`
      : "—";
  const rain =
    day.precipProbPct != null ? `Regenwahrscheinlichkeit max. ${Math.round(day.precipProbPct)} %` : "";
  const precip = day.precipMm != null ? `Niederschlag ${day.precipMm} mm` : "";
  return `${day.label} (${day.date}): ${day.weatherLabel}, ${temp}${rain ? `, ${rain}` : ""}${precip ? `, ${precip}` : ""}`;
}

export function formatWeekendVisitContext(data: WeekendVisitData): string {
  const region = [data.city, data.admin1, data.country].filter(Boolean).join(", ");
  const wiki = data.wikipedia;
  const weatherLines = data.weather.days.map(formatWeatherDay).join("\n");

  return (
    `${formatPlaygroundTodayContext()}\n\n` +
    `[Playground — Wochenend-Besuch: Live-Daten für ${region}. ` +
    `Kommendes Wochenende: ${data.weekend.labelSaturday} und ${data.weekend.labelSunday}. ` +
    `Stand Abruf: ${data.fetchedAt.slice(0, 16).replace("T", " ")} Uhr.]\n\n` +
    `WICHTIG: Nutze nur diese Fakten für Stadt, Wetter und Hintergrund — keine erfundenen Sehenswürdigkeiten oder Wetterwerte.\n\n` +
    `--- Stadt (Geocoding Open-Meteo) ---\n` +
    `Eingabe: ${data.query}\n` +
    `Ort: ${region}\n` +
    `Koordinaten: ${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}\n\n` +
    `--- Wikipedia (de) — ${wiki.title} ---\n` +
    (wiki.description ? `Kurz: ${wiki.description}\n` : "") +
    (wiki.url ? `URL: ${wiki.url}\n` : "") +
    `${wiki.extract || "(kein Auszug verfügbar)"}\n\n` +
    `--- Wetterprognose (${data.weather.source}) ---\n` +
    `${weatherLines}\n`
  );
}
