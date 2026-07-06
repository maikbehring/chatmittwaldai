import { apiUrl } from "./appPaths";
import { ensureOkApiResponse } from "./apiErrors";
import { playgroundApiHeaders } from "./playgroundSessionApiKey";

export type NetworkHop = {
  n: number;
  host: string;
  rttMs: number | null;
  note?: string;
};

export type NetworkPathTargetResult = {
  key: string;
  host: string;
  label: string;
  resolvedIp: string | null;
  hops: NetworkHop[];
  error: string | null;
  tool: string;
};

export type NetworkPathCheckResponse = {
  fetchedAt: string;
  client: {
    ip: string;
    geo: {
      city: string;
      region: string;
      country: string;
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
