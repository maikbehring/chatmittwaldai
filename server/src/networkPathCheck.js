import { spawn } from "node:child_process";
import { lookup } from "node:dns/promises";
import os from "node:os";

/** @typedef {{ city: string; region: string; country: string; countryCode: string }} IpGeo */

/** @typedef {{ n: number; host: string; rttMs: number | null; note?: string; scope?: 'private' | 'public' | 'timeout'; geo?: IpGeo | null; geoLabel?: string; foreign?: boolean }} NetworkHop */

/** @typedef {{ hopCount: number; publicHops: number; foreignHops: number; countries: string[]; staysDomestic: boolean; crossesAbroad: boolean; firstForeignCountry: string | null }} NetworkPathSummary */

/** @typedef {{ key: string; host: string; label: string; resolvedIp: string | null; resolvedGeo: IpGeo | null; hops: NetworkHop[]; pathSummary: NetworkPathSummary; error: string | null; tool: string; tracerouteSkipped?: boolean; endpointInfo?: string }} NetworkPathResult */

export const NETWORK_PATH_TARGETS = {
  mittwald: {
    host: "llm.aihosting.mittwald.de",
    label: "mittwald AI Hosting",
    /** Server-Traceroute wäre nur RZ-intern (Server → Server) — nicht aussagekräftig. */
    traceroute: false,
  },
  openai: {
    host: "api.openai.com",
    label: "OpenAI API",
    traceroute: true,
  },
};

const TRACE_TIMEOUT_MS = 28_000;
const MAX_HOPS = 24;

function resolveClientIp(req) {
  const forwarded = req.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return req.ip || req.socket?.remoteAddress || "";
}

function normalizeIp(ip) {
  if (!ip) return "";
  return ip.replace(/^::ffff:/, "");
}

function isPrivateOrLocalIp(ip) {
  if (!ip || ip === "::1" || ip === "127.0.0.1") return true;
  if (ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("169.254.")) return true;
  const m = /^172\.(\d+)\./.exec(ip);
  if (m) {
    const second = Number(m[1]);
    if (second >= 16 && second <= 31) return true;
  }
  return false;
}

function runCommand(cmd, args, timeoutMs) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code: code ?? 1, stdout, stderr });
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({ code: 1, stdout: "", stderr: err.message });
    });
  });
}

/** @param {string} output */
export function parseTracepathOutput(output) {
  /** @type {NetworkHop[]} */
  const hops = [];
  const seen = new Set();

  for (const rawLine of output.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;

    // tracepath: " 1:  10.0.0.1    1.234ms" or " 1:  10.0.0.1    asymm  2.345ms"
    const tracepathMatch = line.match(
      /^(\d+):\s+(\S+)\s+(?:(?:asymm|pmtu|reached)\s+)?(?:(\d+(?:\.\d+)?)\s*ms)?/i,
    );
    if (tracepathMatch) {
      const n = Number(tracepathMatch[1]);
      const host = tracepathMatch[2];
      if (host === "[LOCALHOST]" || host === "[UNREACHABLE]") continue;
      const rttMs = tracepathMatch[3] != null ? Number(tracepathMatch[3]) : null;
      const key = `${n}:${host}`;
      if (!seen.has(key)) {
        seen.add(key);
        hops.push({ n, host, rttMs });
      }
      continue;
    }

    // traceroute: " 3  10.0.0.1  1.234 ms  1.111 ms  1.000 ms"
    const tracerouteMatch = line.match(/^\s*(\d+)\s+(\S+)\s+([\d.]+)\s*ms/i);
    if (tracerouteMatch) {
      const n = Number(tracerouteMatch[1]);
      const host = tracerouteMatch[2];
      if (host === "*") {
        const key = `${n}:*`;
        if (!seen.has(key)) {
          seen.add(key);
          hops.push({ n, host: "*", rttMs: null, note: "timeout" });
        }
        continue;
      }
      const rttMs = Number(tracerouteMatch[3]);
      const key = `${n}:${host}`;
      if (!seen.has(key)) {
        seen.add(key);
        hops.push({ n, host, rttMs: Number.isFinite(rttMs) ? rttMs : null });
      }
    }
  }

  return hops.slice(0, MAX_HOPS);
}

async function runTraceToHost(host) {
  const tracepath = await runCommand(
    "tracepath",
    ["-n", "-l", String(MAX_HOPS), host],
    TRACE_TIMEOUT_MS,
  );
  if (tracepath.code === 0 || tracepath.stdout.trim()) {
    const hops = parseTracepathOutput(tracepath.stdout);
    if (hops.length > 0) {
      return { tool: "tracepath", hops, error: null };
    }
  }

  const traceroute = await runCommand(
    "traceroute",
    ["-n", "-w", "2", "-m", String(MAX_HOPS), host],
    TRACE_TIMEOUT_MS,
  );
  const hops = parseTracepathOutput(traceroute.stdout);
  if (hops.length > 0) {
    return { tool: "traceroute", hops, error: null };
  }

  const detail = (tracepath.stderr || traceroute.stderr || "Keine Hop-Daten").trim();
  return {
    tool: "tracepath",
    hops: [],
    error: detail || "Traceroute nicht verfügbar (tracepath/traceroute fehlgeschlagen).",
  };
}

async function fetchGeoForIp(ip) {
  const map = await fetchGeoBatch([ip]);
  return map.get(ip) ?? null;
}

/** @param {string[]} ips */
async function fetchGeoBatch(ips) {
  /** @type {Map<string, IpGeo>} */
  const map = new Map();
  const unique = [
    ...new Set(
      ips.filter((ip) => ip && ip !== "*" && !isPrivateOrLocalIp(ip) && /^\d{1,3}(\.\d{1,3}){3}$/.test(ip)),
    ),
  ];
  if (unique.length === 0) return map;

  const chunkSize = 100;
  for (let offset = 0; offset < unique.length; offset += chunkSize) {
    const chunk = unique.slice(offset, offset + chunkSize);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10_000);
      const res = await fetch(
        "http://ip-api.com/batch?fields=status,country,countryCode,regionName,city,query",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(chunk),
          signal: controller.signal,
        },
      );
      clearTimeout(timer);
      if (!res.ok) continue;
      const data = await res.json();
      if (!Array.isArray(data)) continue;
      for (const entry of data) {
        if (entry?.status !== "success" || !entry.query) continue;
        map.set(entry.query, {
          city: entry.city || "",
          region: entry.regionName || "",
          country: entry.country || "",
          countryCode: entry.countryCode || "",
        });
      }
    } catch {
      // Geo ist Zusatzinfo — Traceroute soll trotzdem liefern.
    }
  }
  return map;
}

/** @param {NetworkHop} hop @param {Map<string, IpGeo>} geoMap */
function enrichHopWithGeo(hop, geoMap) {
  if (hop.host === "*") {
    return { ...hop, scope: "timeout" };
  }
  if (isPrivateOrLocalIp(hop.host)) {
    return {
      ...hop,
      scope: "private",
      geoLabel: "Internes Netz (Rechenzentrum)",
      foreign: false,
    };
  }
  const geo = geoMap.get(hop.host) ?? null;
  const foreign = Boolean(geo?.countryCode && geo.countryCode !== "DE");
  return {
    ...hop,
    scope: "public",
    geo,
    foreign,
  };
}

/** @param {NetworkHop[]} hops */
function summarizePath(hops) {
  /** @type {Set<string>} */
  const countries = new Set();
  let foreignHops = 0;
  let publicHops = 0;
  let firstForeignCountry = null;

  for (const hop of hops) {
    if (hop.scope === "private" || hop.scope === "timeout") continue;
    publicHops += 1;
    if (hop.geo?.country) countries.add(hop.geo.country);
    if (hop.foreign) {
      foreignHops += 1;
      if (!firstForeignCountry && hop.geo?.country) {
        firstForeignCountry = hop.geo.country;
      }
    }
  }

  return {
    hopCount: hops.length,
    publicHops,
    foreignHops,
    countries: [...countries],
    staysDomestic: publicHops > 0 && foreignHops === 0,
    crossesAbroad: foreignHops > 0,
    firstForeignCountry,
  };
}

/** @param {NetworkHop[]} hops @param {Map<string, IpGeo>} geoMap */
function enrichHopsWithGeo(hops, geoMap) {
  return hops.map((hop) => enrichHopWithGeo(hop, geoMap));
}

/**
 * @param {import('express').Request} req
 * @param {string[]} targetKeys
 */
export async function buildNetworkPathCheck(req, targetKeys) {
  const clientIp = normalizeIp(resolveClientIp(req));

  const pathResults = await Promise.all(
    targetKeys.map(async (key) => {
      const target = NETWORK_PATH_TARGETS[key];
      if (!target) {
        return {
          key,
          host: "",
          label: key,
          resolvedIp: null,
          resolvedGeo: null,
          hops: [],
          pathSummary: summarizePath([]),
          error: "Unbekanntes Ziel.",
          tool: "none",
        };
      }

      let resolvedIp = null;
      try {
        const lookedUp = await lookup(target.host, { family: 4 });
        resolvedIp = lookedUp.address;
      } catch {
        resolvedIp = null;
      }

      if (target.traceroute === false) {
        return {
          key,
          host: target.host,
          label: target.label,
          resolvedIp,
          resolvedGeo: null,
          hops: [],
          pathSummary: summarizePath([]),
          error: null,
          tool: "none",
          tracerouteSkipped: true,
          endpointInfo:
            "Die API läuft im mittwald-Rechenzentrum in Deutschland. Ein Traceroute vom Playground-Server wäre nur eine interne Server-zu-Server-Verbindung im RZ — dafür nutze die Browser-Latenz oder einen lokalen Traceroute von deinem Rechner.",
        };
      }

      const traced = await runTraceToHost(target.host);
      return {
        key,
        host: target.host,
        label: target.label,
        resolvedIp,
        resolvedGeo: null,
        hops: traced.hops,
        pathSummary: summarizePath([]),
        error: traced.error,
        tool: traced.tool,
      };
    }),
  );

  const ipsToLookup = [clientIp];
  for (const result of pathResults) {
    if (result.resolvedIp) ipsToLookup.push(result.resolvedIp);
    for (const hop of result.hops) {
      if (hop.host && hop.host !== "*") ipsToLookup.push(hop.host);
    }
  }

  const geoMap = await fetchGeoBatch(ipsToLookup);
  const clientGeoRaw = geoMap.get(clientIp) ?? null;
  const clientGeo = clientGeoRaw
    ? {
        city: clientGeoRaw.city,
        region: clientGeoRaw.region,
        country: clientGeoRaw.country,
        countryCode: clientGeoRaw.countryCode,
        latitude: null,
        longitude: null,
      }
    : null;

  for (const result of pathResults) {
    result.hops = enrichHopsWithGeo(result.hops, geoMap);
    result.pathSummary = summarizePath(result.hops);
    result.resolvedGeo = result.resolvedIp ? geoMap.get(result.resolvedIp) ?? null : null;
  }

  let probeHostname = "";
  try {
    probeHostname = (await lookup(os.hostname(), { family: 4 })).address;
  } catch {
    probeHostname = "";
  }

  return {
    fetchedAt: new Date().toISOString(),
    client: {
      ip: clientIp,
      geo: clientGeo,
      userAgent: req.get("user-agent") || "",
    },
    probeOrigin: {
      label: "Playground-Server",
      hostname: probeHostname || undefined,
      note:
        "Traceroute wird nur für die OpenAI-API ausgeführt (Route ins Ausland). mittwald AI Hosting: Endpunkt-Info und Browser-Latenz — kein Server-Trace, weil der Playground im selben RZ liegt.",
    },
    targets: pathResults,
  };
}
