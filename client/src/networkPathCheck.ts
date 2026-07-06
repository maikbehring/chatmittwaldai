import { apiUrl } from "./appPaths";
import { ensureOkApiResponse } from "./apiErrors";
import { playgroundApiHeaders } from "./playgroundSessionApiKey";

export type IpGeo = {
  city: string;
  region: string;
  country: string;
  countryCode: string;
};

export type NetworkHop = {
  n: number;
  host: string;
  rttMs: number | null;
  note?: string;
  scope?: "private" | "public" | "timeout";
  geo?: IpGeo | null;
  geoLabel?: string;
  foreign?: boolean;
};

export type NetworkPathSummary = {
  hopCount: number;
  publicHops: number;
  foreignHops: number;
  countries: string[];
  staysDomestic: boolean;
  crossesAbroad: boolean;
  firstForeignCountry: string | null;
};

export type NetworkPathTargetResult = {
  key: string;
  host: string;
  label: string;
  resolvedIp: string | null;
  resolvedGeo: IpGeo | null;
  hops: NetworkHop[];
  pathSummary: NetworkPathSummary;
  error: string | null;
  tool: string;
  tracerouteSkipped?: boolean;
  endpointInfo?: string;
};

export type NetworkPathCheckResponse = {
  fetchedAt: string;
  client: {
    ip: string;
    geo: {
      city: string;
      region: string;
      country: string;
      countryCode?: string;
      latitude: number | null;
      longitude: number | null;
    } | null;
    userAgent: string;
  };
  probeOrigin: {
    label: string;
    hostname?: string;
    note: string;
  };
  targets: NetworkPathTargetResult[];
};

export type BrowserLatencyProbe = {
  key: string;
  label: string;
  url: string;
  latencyMs: number | null;
};

const BROWSER_LATENCY_TARGETS = [
  {
    key: "mittwald",
    label: "mittwald (Website)",
    url: "https://www.mittwald.de/favicon.ico",
  },
  {
    key: "openai",
    label: "OpenAI (Website)",
    url: "https://openai.com/favicon.ico",
  },
] as const;

function measureImageLatency(url: string, timeoutMs = 10_000): Promise<number | null> {
  return new Promise((resolve) => {
    const start = performance.now();
    const img = new Image();
    const timer = window.setTimeout(() => {
      img.src = "";
      resolve(null);
    }, timeoutMs);
    const finish = () => {
      window.clearTimeout(timer);
      resolve(Math.round(performance.now() - start));
    };
    img.onload = finish;
    img.onerror = finish;
    img.src = `${url}${url.includes("?") ? "&" : "?"}_=${Date.now()}`;
  });
}

export async function measureBrowserLatencies(): Promise<BrowserLatencyProbe[]> {
  const playgroundStart = performance.now();
  let playgroundMs: number | null = null;
  try {
    const res = await fetch(apiUrl("/api/health"), {
      headers: playgroundApiHeaders(),
      cache: "no-store",
    });
    if (res.ok) playgroundMs = Math.round(performance.now() - playgroundStart);
  } catch {
    playgroundMs = null;
  }

  const remote = await Promise.all(
    BROWSER_LATENCY_TARGETS.map(async (t) => ({
      key: t.key,
      label: t.label,
      url: t.url,
      latencyMs: await measureImageLatency(t.url),
    })),
  );

  return [
    {
      key: "playground",
      label: "Playground (API)",
      url: apiUrl("/api/health"),
      latencyMs: playgroundMs,
    },
    ...remote,
  ];
}

export async function fetchNetworkPathCheck(
  targets: ("mittwald" | "openai")[] = ["mittwald", "openai"],
): Promise<NetworkPathCheckResponse> {
  const qs = new URLSearchParams({ targets: targets.join(",") });
  const res = await fetch(apiUrl(`/api/network/path-check?${qs}`), {
    headers: playgroundApiHeaders(),
    cache: "no-store",
  });
  await ensureOkApiResponse(res);
  return res.json() as Promise<NetworkPathCheckResponse>;
}

export function formatClientLocation(
  geo: NetworkPathCheckResponse["client"]["geo"],
): string | null {
  if (!geo) return null;
  const parts = [geo.city, geo.region, geo.country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

export function localTracerouteCommands(): { label: string; command: string }[] {
  return [
    { label: "mittwald AI Hosting", command: "traceroute llm.aihosting.mittwald.de" },
    { label: "OpenAI API", command: "traceroute api.openai.com" },
  ];
}

export function countryFlagEmoji(countryCode: string | undefined): string {
  if (!countryCode || countryCode.length !== 2) return "";
  const code = countryCode.toUpperCase();
  return String.fromCodePoint(
    ...[...code].map((char) => 0x1f1e6 + char.charCodeAt(0) - 65),
  );
}

export function formatHopLocation(hop: NetworkHop): string | null {
  if (hop.scope === "private") return hop.geoLabel ?? "Internes Netz";
  if (hop.scope === "timeout") return null;
  if (!hop.geo) return null;
  const parts = [hop.geo.city, hop.geo.region, hop.geo.country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : hop.geo.country || null;
}

export function formatPathSummary(target: NetworkPathTargetResult): string {
  const { pathSummary: s } = target;
  if (s.hopCount === 0) return "Keine Hop-Daten";
  const privateCount = target.hops.filter((h) => h.scope === "private").length;
  if (privateCount === s.hopCount) {
    return `${s.hopCount} Hops · internes Netz (Rechenzentrum)`;
  }
  if (s.staysDomestic) {
    return `${s.hopCount} Hops · überwiegend intern / Deutschland`;
  }
  if (s.crossesAbroad) {
    const countries = s.countries.length > 0 ? s.countries.join(" → ") : "Ausland";
    return `${s.hopCount} Hops · ${s.foreignHops} Auslands-Hop(s) · ${countries}`;
  }
  return `${s.hopCount} Hops`;
}

export function isDomesticOrInternalPath(target: NetworkPathTargetResult): boolean {
  if (target.pathSummary.staysDomestic) return true;
  return target.hops.length > 0 && target.hops.every((h) => h.scope === "private" || h.scope === "timeout");
}

export function formatResolvedTargetGeo(target: NetworkPathTargetResult): string | null {
  if (!target.resolvedGeo) return null;
  const flag = countryFlagEmoji(target.resolvedGeo.countryCode);
  const parts = [target.resolvedGeo.city, target.resolvedGeo.country].filter(Boolean);
  return `${flag ? `${flag} ` : ""}${parts.join(", ")}`.trim();
}
