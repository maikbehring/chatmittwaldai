import { spawn } from "node:child_process";
import { lookup } from "node:dns/promises";
import os from "node:os";

/** @typedef {{ n: number; host: string; rttMs: number | null; note?: string }} NetworkHop */

/** @typedef {{ key: string; host: string; label: string; resolvedIp: string | null; hops: NetworkHop[]; error: string | null; tool: string }} NetworkPathResult */

export const NETWORK_PATH_TARGETS = {
  mittwald: {
    host: "llm.aihosting.mittwald.de",
    label: "mittwald AI Hosting",
  },
  openai: {
    host: "api.openai.com",
    label: "OpenAI API",
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
  if (!ip || isPrivateOrLocalIp(ip)) return null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,regionName,city,lat,lon,query`,
      { signal: controller.signal },
    );
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== "success") return null;
    return {
      city: data.city || "",
      region: data.regionName || "",
      country: data.country || "",
      latitude: data.lat ?? null,
      longitude: data.lon ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * @param {import('express').Request} req
 * @param {string[]} targetKeys
 */
export async function buildNetworkPathCheck(req, targetKeys) {
  const clientIp = normalizeIp(resolveClientIp(req));
  const [geo, ...pathResults] = await Promise.all([
    fetchGeoForIp(clientIp),
    ...targetKeys.map(async (key) => {
      const target = NETWORK_PATH_TARGETS[key];
      if (!target) {
        return {
          key,
          host: "",
          label: key,
          resolvedIp: null,
          hops: [],
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

      const traced = await runTraceToHost(target.host);
      return {
        key,
        host: target.host,
        label: target.label,
        resolvedIp,
        hops: traced.hops,
        error: traced.error,
        tool: traced.tool,
      };
    }),
  ]);

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
      geo,
      userAgent: req.get("user-agent") || "",
    },
    probeOrigin: {
      label: "Playground-Server",
      hostname: probeHostname || undefined,
      note:
        "Traceroute-Hops starten am Server, auf dem der Playground läuft (typischerweise mittwald-Rechenzentrum). Die Browser-Latenz im UI zeigt die Verbindung von deinem Gerät.",
    },
    targets: pathResults,
  };
}
