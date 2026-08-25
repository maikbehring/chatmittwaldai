import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import express from "express";
import compression from "compression";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { getPlaygroundLinks } from "./playgroundLinks.js";
import { createRateLimitHandler, getRateLimitConfig } from "./rateLimit.js";
import {
  getBonusChatConfig,
  grantBonusChat,
  shouldSkipChatRateLimit,
} from "./playgroundBonus.js";
import { createBasePathStripMiddleware, normalizePlaygroundBasePath } from "./playgroundBasePath.js";
import { getWebSearchConfig, searchWeb, searchWebMulti } from "./webSearch.js";
import { fetchMittwaldFeatureRequests } from "./mittwaldFeatureRequests.js";
import { fetchMittwaldAiHostingDocs } from "./mittwaldAiHostingDocs.js";
import { fetchMittwaldAiHostingTariffAdvisor } from "./mittwaldAiHostingTariffAdvisor.js";
import {
  fetchWeekendVisitSources,
  prepareWeekendVisitCity,
} from "./weekendVisitData.js";
import {
  countUsefulPriceResults,
  isPriceCompareSufficient,
  runPriceCompareSearchRound,
} from "./priceCompareSearch.js";
import {
  pickWebSearchQueryModel,
  synthesizeGoogleSearchQuery,
} from "./webSearchQuerySynthesis.js";
import {
  resolveUpstreamApiKey,
  shouldSkipPublicRateLimit,
} from "./sessionApiKey.js";
import {
  buildNetworkPathCheck,
  NETWORK_PATH_TARGETS,
} from "./networkPathCheck.js";
import { getGridCarbonConfig, getGridCarbonSummary } from "./gridCarbonForecast.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "../..");
const serverRoot = path.join(__dirname, "..");

// npm workspaces starten Skripte mit cwd im Paketordner (server/) — .env liegt typischerweise im Repo-Root
dotenv.config({ path: path.join(repoRoot, ".env") });
dotenv.config({ path: path.join(serverRoot, ".env"), override: true });

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "0.0.0.0";
const API_KEY = process.env.MITTWALD_AI_API_KEY;
const BASE_URL = (
  process.env.MITTWALD_AI_BASE_URL || "https://llm.aihosting.mittwald.de/v1"
).replace(/\/$/, "");
const ALLOWED_MODELS = (process.env.PLAYGROUND_ALLOWED_MODELS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
/** Intern für Playground-Pipelines (z. B. Rechnungs-OCR), nicht im Modell-Dropdown. */
const INTERNAL_PLAYGROUND_MODELS = new Set(["GLM-OCR", "Qwen3-TTS-12Hz-1.7B-CustomVoice"]);
const MAX_BODY_BYTES = Math.min(
  Math.max(Number(process.env.MAX_BODY_BYTES || 10 * 1024 * 1024), 512 * 1024),
  25 * 1024 * 1024,
);
const BRAND_TITLE = process.env.PLAYGROUND_BRAND_TITLE || "Mittwald KI-Playground";
const PLAYGROUND_BASE_PATH = normalizePlaygroundBasePath(process.env.PLAYGROUND_BASE_PATH);
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";
const TRUST_PROXY = process.env.TRUST_PROXY === "1";
const APP_API_KEY = process.env.PLAYGROUND_APP_API_KEY?.trim() || "";
const REQUIRE_ORIGIN_CHECK = process.env.REQUIRE_ORIGIN_CHECK !== "0";

const RATE_LIMITS = getRateLimitConfig();
const RATE_WINDOW_MS = RATE_LIMITS.windowMs;
const RATE_MAX_CHAT = RATE_LIMITS.chat;
const RATE_MAX_MODELS = RATE_LIMITS.models;
const RATE_MAX_TRANSCRIBE = RATE_LIMITS.transcribe;
const RATE_MAX_WEB_SEARCH = RATE_LIMITS.webSearch;
const RATE_MAX_GLOBAL = RATE_LIMITS.global;

const DEFAULT_AI_HOSTING_URL = "https://www.mittwald.de/mstudio/ai-hosting";
const SELF_HOST_REPO_URL = "https://github.com/maikbehring/chatmittwaldai";

const WHISPER_MODEL =
  process.env.PLAYGROUND_WHISPER_MODEL || "whisper-large-v3-turbo";
const WHISPER_LANGUAGE = process.env.PLAYGROUND_WHISPER_LANGUAGE || "de";
const TTS_MODEL =
  process.env.PLAYGROUND_TTS_MODEL || "Qwen3-TTS-12Hz-1.7B-CustomVoice";
const TTS_MAX_INPUT_CHARS = Math.min(
  Math.max(Number(process.env.PLAYGROUND_TTS_MAX_INPUT_CHARS || 4000), 100),
  8000,
);
const EMBEDDING_MODEL =
  process.env.PLAYGROUND_EMBEDDING_MODEL || "Qwen3-Embedding-8B";
const RERANK_MODEL =
  process.env.PLAYGROUND_RERANK_MODEL || "Qwen3-VL-Reranker-2B";
const SEMANTIC_SEARCH_MAX_PASSAGES = Math.min(
  Math.max(Number(process.env.PLAYGROUND_SEMANTIC_SEARCH_MAX_PASSAGES || 20), 2),
  30,
);
const SEMANTIC_SEARCH_MAX_PASSAGE_CHARS = Math.min(
  Math.max(Number(process.env.PLAYGROUND_SEMANTIC_SEARCH_MAX_PASSAGE_CHARS || 2000), 200),
  8000,
);
const MAX_AUDIO_BYTES = Math.min(
  Math.max(Number(process.env.PLAYGROUND_MAX_AUDIO_BYTES || 25 * 1024 * 1024), 1024),
  25 * 1024 * 1024,
);
const AUDIO_JSON_LIMIT = "36mb";

const CHAT_ALLOWED_KEYS = new Set([
  "model",
  "messages",
  "temperature",
  "max_tokens",
  "stream",
  "top_p",
  "top_k",
  "stop",
  "frequency_penalty",
  "presence_penalty",
  "tools",
  "tool_choice",
  "response_format",
  "extra_body",
  "stream_options",
]);

const MAX_MESSAGES = Math.min(
  Math.max(Number(process.env.PLAYGROUND_MAX_MESSAGES || 60), 4),
  500,
);
const MAX_MESSAGE_CHARS = Math.min(
  Math.max(Number(process.env.PLAYGROUND_MAX_MESSAGE_CHARS || 48000), 4096),
  200_000,
);
/** Höheres Limit für AI-Hosting-Tarifberater (voller FAQ-/Tarif-Kontext). */
const MAX_MESSAGE_CHARS_TARIFF_ADVISOR = Math.min(
  Math.max(
    Number(process.env.PLAYGROUND_TARIFF_ADVISOR_MAX_MESSAGE_CHARS || 120_000),
    MAX_MESSAGE_CHARS,
  ),
  500_000,
);
const TARIFF_ADVISOR_USE_CASE = "ai-hosting-tarifberater";
const MAX_TOOLS = 16;

function parseCorsOrigins(raw) {
  if (raw === "*") return true;
  const list = raw.split(",").map((o) => o.trim()).filter(Boolean);
  if (list.length === 0) return false;
  return list;
}

function hasWildcardOrigin(raw) {
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .some((entry) => entry === "*" || entry.includes("*"));
}

function jsonError(res, status, code, message) {
  res.status(status).type("application/json").json({ error: { code, message } });
}

function normalizeOriginValue(value) {
  try {
    return new URL(String(value)).origin;
  } catch {
    return String(value).trim().toLowerCase();
  }
}

/** Gleicher Host wie Request (Frontend + API hinter einem Reverse-Proxy). */
function getRequestHost(req) {
  if (TRUST_PROXY) {
    const forwarded = req.get("x-forwarded-host");
    if (forwarded) return forwarded.split(",")[0].trim();
  }
  return req.get("host") ?? "";
}

function originMatchesRequestHost(req, origin) {
  const host = getRequestHost(req);
  if (!host || !origin) return false;
  try {
    const originUrl = new URL(origin);
    if (originUrl.host === host) return true;
    // nginx-Host oft ohne Port, Origin mit Standard-Port (https → kein :443)
    return originUrl.hostname === host.split(":")[0];
  } catch {
    return false;
  }
}

/** Versucht, aus einer Upstream-JSON-Fehlerantwort eine kurze Meldung zu lesen. */
function summarizeUpstreamError(raw) {
  const slice = String(raw ?? "").trim().slice(0, 4000);
  if (!slice) return "Upstream-Fehler (leere Antwort).";
  try {
    const j = JSON.parse(slice);
    const msg =
      (typeof j?.error === "object" &&
        j.error &&
        typeof j.error.message === "string" &&
        j.error.message) ||
      (typeof j?.message === "string" && j.message) ||
      null;
    if (msg) {
      const code = j?.error?.code != null && String(j.error.code) !== "None" ? ` (${String(j.error.code)})` : "";
      const type = j?.error?.type != null && String(j.error.type) !== "None" ? ` [${String(j.error.type)}]` : "";
      return `${msg}${type}${code}`;
    }
  } catch {
    /* kein JSON */
  }
  return slice;
}

const TTS_DOCS_URL =
  "https://developer.mittwald.de/de/docs/v2/platform/aihosting/models/qwen3-tts-customvoice/";

/** Hilfreiche Meldung, wenn die TTS-Route upstream 5xx liefert (häufig: Modell-Nutzungsbedingungen). */
function formatTtsUpstreamError(status, raw) {
  const base = summarizeUpstreamError(raw);
  const lower = base.toLowerCase();
  if (
    status >= 500 ||
    lower.includes("internal server error") ||
    lower.includes("internal_server_error")
  ) {
    return (
      `Text-to-Speech derzeit nicht erreichbar (${TTS_MODEL}). ` +
      `Im mStudio unter AI Hosting die Nutzungsbedingungen für dieses Modell akzeptieren — ` +
      `oder im Playground einen eigenen API-Key mit freigeschaltetem TTS hinterlegen. ` +
      `Details: ${TTS_DOCS_URL} · Upstream: ${base}`
    );
  }
  return base;
}

function isTariffAdvisorChatRequest(req, body) {
  const header = req?.get?.("x-playground-use-case") ?? req?.get?.("X-Playground-Use-Case");
  if (header === TARIFF_ADVISOR_USE_CASE) return true;
  const msgs = body?.messages;
  if (!Array.isArray(msgs)) return false;
  return msgs.some(
    (m) =>
      m?.role === "system" &&
      typeof m.content === "string" &&
      m.content.includes("Berater im mittwald-Kundenservice für AI Hosting"),
  );
}

function validateMessages(messages, maxMessageChars = MAX_MESSAGE_CHARS) {
  if (!Array.isArray(messages)) return "messages muss ein Array sein.";
  if (messages.length > MAX_MESSAGES)
    return `Maximal ${MAX_MESSAGES} Nachrichten erlaubt.`;
  const allowedRoles = new Set(["system", "user", "assistant", "tool"]);
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    if (!m || typeof m !== "object") return `Ungültige Nachricht an Index ${i}.`;
    if (!allowedRoles.has(m.role)) return `Ungültige Rolle an Index ${i}.`;
    const c = m.content;
    if (typeof c === "string") {
      if (c.length > maxMessageChars)
        return `Nachricht ${i} ist zu lang (>${maxMessageChars} Zeichen).`;
    } else if (Array.isArray(c)) {
      for (const part of c) {
        if (!part || typeof part !== "object") return `Ungültiger Multipart-Inhalt bei ${i}.`;
        if (part.type === "text" && typeof part.text === "string") {
          if (part.text.length > maxMessageChars)
            return `Textteil bei Nachricht ${i} ist zu lang.`;
        }
        if (part.type === "image_url" && part.image_url?.url) {
          const url = String(part.image_url.url);
          if (!url.startsWith("data:image/"))
            return "Bilder nur als Base64-Data-URL (data:image/…); HTTP-URLs sind nicht erlaubt.";
          if (url.length > 6_500_000)
            return "Bild-Data-URL ist zu groß (Server-Limit).";
        }
      }
    } else {
      return `Nachricht ${i}: content muss Text oder ein gültiges Multipart-Array sein.`;
    }
  }
  return null;
}

function sanitizeChatBody(body, req) {
  const out = {};
  for (const key of Object.keys(body)) {
    if (CHAT_ALLOWED_KEYS.has(key)) out[key] = body[key];
  }
  if (!out.model || typeof out.model !== "string") {
    return { error: "model fehlt oder ist ungültig." };
  }
  if (
    ALLOWED_MODELS.length &&
    !ALLOWED_MODELS.includes(out.model) &&
    !INTERNAL_PLAYGROUND_MODELS.has(out.model)
  ) {
    return { error: "Dieses Modell ist für diesen Playground nicht freigegeben." };
  }
  const maxMessageChars = isTariffAdvisorChatRequest(req, out)
    ? MAX_MESSAGE_CHARS_TARIFF_ADVISOR
    : MAX_MESSAGE_CHARS;
  const msgErr = validateMessages(out.messages, maxMessageChars);
  if (msgErr) return { error: msgErr };
  if (out.tools !== undefined) {
    if (!Array.isArray(out.tools)) return { error: "tools muss ein Array sein." };
    if (out.tools.length > MAX_TOOLS) return { error: `Maximal ${MAX_TOOLS} Tools.` };
  }
  out.stream = true;
  return { body: out };
}

function filterModelsPayload(json) {
  if (!json?.data || !Array.isArray(json.data)) return json;
  if (ALLOWED_MODELS.length === 0) return json;
  return {
    ...json,
    data: json.data.filter((m) => m?.id && ALLOWED_MODELS.includes(m.id)),
  };
}

async function main() {
  if (!API_KEY) {
    console.error("MITTWALD_AI_API_KEY fehlt. Bitte .env setzen.");
    process.exit(1);
  }

  const app = express();
  if (TRUST_PROXY) app.set("trust proxy", 1);
  app.use(createBasePathStripMiddleware(PLAYGROUND_BASE_PATH));

  if (process.env.NODE_ENV === "production" && hasWildcardOrigin(CORS_ORIGIN)) {
    console.error(
      "Unsichere CORS-Konfiguration in Produktion: CORS_ORIGIN darf keinen Wildcard-Wert enthalten.",
    );
    process.exit(1);
  }

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      // Auf HTTP-Staging (TLS noch nicht bereit) sonst Browser-Warnungen zu COOP/Origin-Agent-Cluster.
      crossOriginOpenerPolicy: false,
      originAgentCluster: false,
    }),
  );
  app.use(
    compression({
      // SSE darf nicht gzip’t werden — sonst erscheint die Antwort erst am Ende im Browser.
      filter: (req, res) => {
        if (req.method === "POST" && req.path === "/api/chat/completions") return false;
        return compression.filter(req, res);
      },
    }),
  );

  const corsOpts = parseCorsOrigins(CORS_ORIGIN);
  const sensitiveAllowedOrigins = parseCorsOrigins(CORS_ORIGIN);
  const allowedOriginSet =
    sensitiveAllowedOrigins === true
      ? null
      : new Set(sensitiveAllowedOrigins.map((origin) => normalizeOriginValue(origin)));

  function isAllowedRequestOrigin(req, origin) {
    if (!origin) return false;
    if (TRUST_PROXY && originMatchesRequestHost(req, origin)) return true;
    if (corsOpts === true) return true;
    if (allowedOriginSet instanceof Set && allowedOriginSet.has(normalizeOriginValue(origin))) {
      return true;
    }
    return false;
  }

  app.use("/api", (req, res, next) => {
    cors({
      origin(originHeader, callback) {
        if (!originHeader) return callback(null, true);
        if (isAllowedRequestOrigin(req, originHeader)) return callback(null, true);
        callback(null, false);
      },
      credentials: true,
    })(req, res, next);
  });

  const chatLimiter = rateLimit({
    windowMs: RATE_WINDOW_MS,
    max: RATE_MAX_CHAT,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => shouldSkipPublicRateLimit(req) || shouldSkipChatRateLimit(req.ip),
    handler: createRateLimitHandler("chat"),
  });

  const modelsLimiter = rateLimit({
    windowMs: RATE_WINDOW_MS,
    max: RATE_MAX_MODELS,
    standardHeaders: true,
    legacyHeaders: false,
    skip: shouldSkipPublicRateLimit,
    handler: createRateLimitHandler("models"),
  });

  const transcribeLimiter = rateLimit({
    windowMs: RATE_WINDOW_MS,
    max: RATE_MAX_TRANSCRIBE,
    standardHeaders: true,
    legacyHeaders: false,
    skip: shouldSkipPublicRateLimit,
    handler: createRateLimitHandler("transcribe"),
  });

  const globalLimiter = rateLimit({
    windowMs: RATE_WINDOW_MS,
    max: RATE_MAX_GLOBAL,
    standardHeaders: true,
    legacyHeaders: false,
    skip: shouldSkipPublicRateLimit,
    handler: createRateLimitHandler("global"),
  });

  function requireApiKey(req, res, next) {
    if (!APP_API_KEY) return next();
    const presented = req.get("x-playground-api-key");
    if (!presented || presented !== APP_API_KEY) {
      return jsonError(res, 401, "unauthorized", "Ungültiger oder fehlender API-Key.");
    }
    return next();
  }

  function requireAllowedOrigin(req, res, next) {
    if (!REQUIRE_ORIGIN_CHECK) return next();
    if (sensitiveAllowedOrigins === true) return next();
    const origin = req.get("origin");
    if (!origin) {
      return jsonError(res, 403, "origin_required", "Origin-Header fehlt.");
    }
    if (isAllowedRequestOrigin(req, origin)) return next();
    return jsonError(res, 403, "origin_forbidden", "Origin ist nicht erlaubt.");
  }

  app.use("/api", globalLimiter);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, title: BRAND_TITLE });
  });

  app.get("/api/config", (_req, res) => {
    res.json({
      title: BRAND_TITLE,
      allowedModelsConfigured: ALLOWED_MODELS.length > 0,
      maxMessages: MAX_MESSAGES,
      speechToText: {
        enabled: true,
        model: WHISPER_MODEL,
        language: WHISPER_LANGUAGE,
        maxAudioBytes: MAX_AUDIO_BYTES,
      },
      textToSpeech: {
        enabled: true,
        model: TTS_MODEL,
        maxInputChars: TTS_MAX_INPUT_CHARS,
      },
      semanticSearch: {
        enabled: true,
        embeddingModel: EMBEDDING_MODEL,
        rerankModel: RERANK_MODEL,
        maxPassages: SEMANTIC_SEARCH_MAX_PASSAGES,
      },
      webSearch: getWebSearchConfig(),
      links: getPlaygroundLinks(),
      rateLimits: RATE_LIMITS,
      bonusChat: getBonusChatConfig(),
      maxBodyBytes: MAX_BODY_BYTES,
      userSessionApiKey: true,
      aiHostingUrl:
        process.env.PLAYGROUND_LINK_AI_HOSTING_URL?.trim() || DEFAULT_AI_HOSTING_URL,
      selfHostRepoUrl: SELF_HOST_REPO_URL,
      gridCarbon: getGridCarbonConfig(),
    });
  });

  app.get("/api/carbon/grid-de", modelsLimiter, async (_req, res) => {
    const cfg = getGridCarbonConfig();
    if (!cfg.enabled) {
      return jsonError(res, 404, "not_enabled", "Strommix-Badge ist deaktiviert.");
    }
    try {
      const summary = await getGridCarbonSummary();
      res.json(summary);
    } catch (e) {
      console.error(e);
      return jsonError(
        res,
        502,
        "grid_forecast_failed",
        "Strommix-Prognose konnte nicht geladen werden.",
      );
    }
  });

  const webSearchLimiter = rateLimit({
    windowMs: RATE_WINDOW_MS,
    max: RATE_MAX_WEB_SEARCH,
    standardHeaders: true,
    legacyHeaders: false,
    skip: shouldSkipPublicRateLimit,
    handler: createRateLimitHandler("webSearch"),
  });

  const featureRequestsLimiter = rateLimit({
    windowMs: RATE_WINDOW_MS,
    max: RATE_MAX_MODELS,
    standardHeaders: true,
    legacyHeaders: false,
    skip: shouldSkipPublicRateLimit,
    handler: createRateLimitHandler("models"),
  });

  app.get(
    "/api/mittwald/feature-requests",
    featureRequestsLimiter,
    async (req, res) => {
      try {
        const limit = Number(req.query?.limit) || 10;
        const data = await fetchMittwaldFeatureRequests({ limit });
        res.json(data);
      } catch (e) {
        console.error(e);
        return jsonError(
          res,
          502,
          "feature_requests_failed",
          e instanceof Error ? e.message : "Feature Requests konnten nicht geladen werden.",
        );
      }
    },
  );

  app.get(
    "/api/mittwald/ai-hosting-docs",
    featureRequestsLimiter,
    async (_req, res) => {
      try {
        const data = await fetchMittwaldAiHostingDocs({
          allowedModelIds: ALLOWED_MODELS,
        });
        res.json(data);
      } catch (e) {
        console.error(e);
        return jsonError(
          res,
          502,
          "ai_hosting_docs_failed",
          e instanceof Error ? e.message : "AI-Hosting-Doku konnte nicht geladen werden.",
        );
      }
    },
  );

  app.get(
    "/api/mittwald/ai-hosting-tariff-advisor",
    featureRequestsLimiter,
    async (_req, res) => {
      try {
        const data = await fetchMittwaldAiHostingTariffAdvisor({
          allowedModelIds: ALLOWED_MODELS,
        });
        res.json(data);
      } catch (e) {
        console.error(e);
        return jsonError(
          res,
          502,
          "ai_hosting_tariff_advisor_failed",
          e instanceof Error ? e.message : "AI-Hosting-Tarifberatung konnte nicht geladen werden.",
        );
      }
    },
  );

  const networkPathLimiter = rateLimit({
    windowMs: RATE_WINDOW_MS,
    max: Math.min(RATE_MAX_MODELS, 12),
    standardHeaders: true,
    legacyHeaders: false,
    skip: shouldSkipPublicRateLimit,
    handler: createRateLimitHandler("models"),
  });

  app.get("/api/network/path-check", networkPathLimiter, async (req, res) => {
    const raw =
      typeof req.query?.targets === "string" && req.query.targets.trim()
        ? req.query.targets.split(",")
        : Object.keys(NETWORK_PATH_TARGETS);
    const targetKeys = raw
      .map((s) => s.trim().toLowerCase())
      .filter((key) => key in NETWORK_PATH_TARGETS);
    if (targetKeys.length === 0) {
      return jsonError(res, 400, "invalid_targets", "Keine gültigen Ziele (mittwald, openai).");
    }
    try {
      const data = await buildNetworkPathCheck(req, [...new Set(targetKeys)]);
      res.json(data);
    } catch (e) {
      console.error(e);
      return jsonError(
        res,
        502,
        "network_path_check_failed",
        e instanceof Error ? e.message : "Netzwerkpfad-Check fehlgeschlagen.",
      );
    }
  });

  app.get("/api/weekend-visit/prepare", featureRequestsLimiter, async (req, res) => {
    const city = typeof req.query?.city === "string" ? req.query.city : "";
    try {
      const data = await prepareWeekendVisitCity(city);
      res.json(data);
    } catch (e) {
      console.error(e);
      return jsonError(
        res,
        502,
        "weekend_visit_prepare_failed",
        e instanceof Error ? e.message : "Stadt konnte nicht ermittelt werden.",
      );
    }
  });

  app.post(
    "/api/weekend-visit/sources",
    featureRequestsLimiter,
    express.json({ limit: 4096 }),
    async (req, res) => {
      const body = req.body ?? {};
      const latitude = Number(body.latitude);
      const longitude = Number(body.longitude);
      const saturday = typeof body.saturday === "string" ? body.saturday : "";
      const sunday = typeof body.sunday === "string" ? body.sunday : "";
      const wikipediaTitle =
        typeof body.wikipediaTitle === "string" ? body.wikipediaTitle : "";
      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(saturday) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(sunday) ||
        !wikipediaTitle.trim()
      ) {
        return jsonError(res, 400, "validation_error", "Ungültige Parameter für Wikipedia/Wetter.");
      }
      try {
        const data = await fetchWeekendVisitSources({
          latitude,
          longitude,
          saturday,
          sunday,
          wikipediaTitle: wikipediaTitle.trim(),
        });
        res.json(data);
      } catch (e) {
        console.error(e);
        return jsonError(
          res,
          502,
          "weekend_visit_sources_failed",
          e instanceof Error ? e.message : "Wikipedia oder Wetter konnten nicht geladen werden.",
        );
      }
    },
  );

  app.post(
    "/api/price-compare/round",
    featureRequestsLimiter,
    express.json({ limit: 65536 }),
    async (req, res) => {
      const body = req.body ?? {};
      const product = typeof body.product === "string" ? body.product.trim() : "";
      const providerA = typeof body.providerA === "string" ? body.providerA.trim() : "";
      const providerB = typeof body.providerB === "string" ? body.providerB.trim() : "";
      const roundIndex = Number(body.roundIndex) || 0;
      const priorResults = Array.isArray(body.priorResults) ? body.priorResults : [];

      if (product.length < 2) {
        return jsonError(res, 400, "price_compare_invalid", "Bitte ein Produkt angeben.");
      }
      if (providerA.length < 2 || providerB.length < 2) {
        return jsonError(res, 400, "price_compare_invalid", "Bitte zwei Anbieter angeben.");
      }

      try {
        const step = await runPriceCompareSearchRound({
          product,
          providerA,
          providerB,
          roundIndex,
          excludeUrls: priorResults.map((r) => r?.url).filter(Boolean),
        });

        const seen = new Set(
          priorResults.map((r) => String(r?.url ?? "").toLowerCase()).filter(Boolean),
        );
        const newResults = [];
        for (const r of step.results) {
          const key = String(r.url ?? "").toLowerCase();
          if (!key || seen.has(key)) continue;
          seen.add(key);
          newResults.push({ ...r, searchRound: roundIndex + 1 });
        }

        const combined = [...priorResults, ...newResults];
        const sufficient = isPriceCompareSufficient(combined, providerA, providerB);
        const usefulCount = countUsefulPriceResults(combined);

        res.json({
          roundIndex,
          queries: step.queries,
          provider: step.provider,
          newResults,
          combined,
          sufficient,
          usefulCount,
        });
      } catch (e) {
        console.error(e);
        return jsonError(
          res,
          502,
          "price_compare_round_failed",
          e instanceof Error ? e.message : "Preisvergleich-Suche fehlgeschlagen.",
        );
      }
    },
  );

  app.post(
    "/api/rate-limit/continue-testing",
    requireApiKey,
    requireAllowedOrigin,
    express.json({ limit: 4096 }),
    (req, res) => {
      const result = grantBonusChat(req.ip);
      if (!result.ok) {
        return jsonError(
          res,
          429,
          result.code,
          `Test-Erweiterung wurde in diesem Zeitfenster bereits genutzt (noch ${result.remaining} Bonus-Anfragen übrig).`,
        );
      }
      res.json({
        granted: result.granted,
        remaining: result.remaining,
      });
    },
  );

  app.post(
    "/api/web/search",
    requireApiKey,
    requireAllowedOrigin,
    webSearchLimiter,
    express.json({ limit: 196608 }),
    async (req, res) => {
      const userMessage =
        typeof req.body?.userMessage === "string" ? req.body.userMessage.trim() : "";
      const chatExcerpt =
        typeof req.body?.chatExcerpt === "string" ? req.body.chatExcerpt.trim() : "";
      const legacyQ = typeof req.body?.q === "string" ? req.body.q.trim() : "";
      const directQueries = Array.isArray(req.body?.directQueries)
        ? req.body.directQueries
            .filter((x) => typeof x === "string")
            .map((x) => x.trim())
            .filter(Boolean)
            .slice(0, 5)
        : [];

      if (directQueries.length > 0) {
        try {
          const data = await searchWebMulti(directQueries, {
            maxResults: Number(req.body?.maxResults) || undefined,
          });
          return res.json(data);
        } catch (e) {
          console.error(e);
          return jsonError(
            res,
            502,
            "search_failed",
            e instanceof Error ? e.message : "Websuche fehlgeschlagen.",
          );
        }
      }

      let q;
      if (userMessage) {
        const model = pickWebSearchQueryModel(process.env.WEB_SEARCH_QUERY_MODEL ?? "", ALLOWED_MODELS);
        try {
          q = await synthesizeGoogleSearchQuery({
            apiKey: resolveUpstreamApiKey(req, API_KEY),
            baseUrl: BASE_URL,
            model,
            userMessage,
            chatExcerpt,
          });
        } catch (e) {
          console.error("Websuche Suchbegriff-Verdichtung:", e);
          q = (legacyQ || userMessage).replace(/\s+/g, " ").trim();
        }
      } else if (legacyQ) {
        q = legacyQ;
      } else {
        return jsonError(res, 400, "validation_error", "Suchanfrage fehlt (userMessage oder q).");
      }

      if (!q) {
        return jsonError(res, 400, "validation_error", "Suchbegriff ist leer.");
      }
      try {
        const data = await searchWeb(q, {
          maxResults: Number(req.body?.maxResults) || undefined,
        });
        res.json(data);
      } catch (e) {
        console.error(e);
        return jsonError(
          res,
          502,
          "search_failed",
          e instanceof Error ? e.message : "Websuche fehlgeschlagen.",
        );
      }
    },
  );

  app.post(
    "/api/audio/transcriptions",
    requireApiKey,
    requireAllowedOrigin,
    transcribeLimiter,
    express.json({ limit: AUDIO_JSON_LIMIT }),
    async (req, res) => {
      const audioB64 = req.body?.audio;
      if (typeof audioB64 !== "string" || !audioB64.trim()) {
        return jsonError(res, 400, "validation_error", "audio (Base64) fehlt.");
      }

      let buffer;
      try {
        buffer = Buffer.from(audioB64, "base64");
      } catch {
        return jsonError(res, 400, "validation_error", "Ungültige Base64-Audio-Daten.");
      }

      if (buffer.length < 100) {
        return jsonError(res, 400, "validation_error", "Audio-Aufnahme ist zu kurz.");
      }
      if (buffer.length > MAX_AUDIO_BYTES) {
        return jsonError(
          res,
          400,
          "validation_error",
          `Audio ist zu groß (max. ${Math.round(MAX_AUDIO_BYTES / (1024 * 1024))} MB).`,
        );
      }

      const langRaw = req.body?.language;
      const language =
        typeof langRaw === "string" && /^[a-z]{2}$/i.test(langRaw.trim())
          ? langRaw.trim().toLowerCase()
          : WHISPER_LANGUAGE;

      const form = new FormData();
      form.append("file", new Blob([buffer], { type: "audio/wav" }), "recording.wav");
      form.append("model", WHISPER_MODEL);
      form.append("language", language);
      form.append("response_format", "json");

      let upstream;
      try {
        upstream = await fetch(`${BASE_URL}/audio/transcriptions`, {
          method: "POST",
          headers: { Authorization: `Bearer ${resolveUpstreamApiKey(req, API_KEY)}` },
          body: form,
        });
      } catch (e) {
        console.error(e);
        return jsonError(res, 502, "upstream_unreachable", "Verbindung zu Whisper fehlgeschlagen.");
      }

      const text = await upstream.text();
      if (!upstream.ok) {
        return jsonError(
          res,
          upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502,
          "upstream_error",
          summarizeUpstreamError(text),
        );
      }

      try {
        const json = JSON.parse(text);
        const transcript =
          (typeof json?.text === "string" && json.text) ||
          (typeof json?.transcript === "string" && json.transcript) ||
          "";
        return res.json({
          text: transcript.trim(),
          usage: json?.usage ?? null,
          model: WHISPER_MODEL,
        });
      } catch {
        return jsonError(res, 502, "bad_upstream", "Ungültige Whisper-Antwort.");
      }
    },
  );

  app.post(
    "/api/audio/speech",
    requireApiKey,
    requireAllowedOrigin,
    transcribeLimiter,
    express.json({ limit: "512kb" }),
    async (req, res) => {
      const input = typeof req.body?.input === "string" ? req.body.input.trim() : "";
      if (!input) {
        return jsonError(res, 400, "validation_error", "input fehlt.");
      }
      if (input.length > TTS_MAX_INPUT_CHARS) {
        return jsonError(
          res,
          400,
          "validation_error",
          `Text zu lang (max. ${TTS_MAX_INPUT_CHARS} Zeichen).`,
        );
      }

      const voiceRaw = typeof req.body?.voice === "string" ? req.body.voice.trim() : "";
      const voice = voiceRaw || "vivian";

      const formatRaw =
        typeof req.body?.response_format === "string"
          ? req.body.response_format.trim().toLowerCase()
          : "opus";
      const allowedFormats = new Set(["wav", "pcm", "flac", "mp3", "opus"]);
      const responseFormat = allowedFormats.has(formatRaw) ? formatRaw : "opus";

      let speed = Number(req.body?.speed);
      if (!Number.isFinite(speed)) speed = 0.95;
      speed = Math.min(4, Math.max(0.25, speed));

      const instructions =
        typeof req.body?.instructions === "string" ? req.body.instructions.trim() : "";
      if (instructions.length > 500) {
        return jsonError(res, 400, "validation_error", "instructions max. 500 Zeichen.");
      }

      const language =
        typeof req.body?.language === "string" && req.body.language.trim()
          ? req.body.language.trim()
          : "German";

      // language gehört ins JSON-Body (SDK: extra_body — bei raw fetch top-level).
      const payload = {
        model: TTS_MODEL,
        input,
        voice,
        response_format: responseFormat,
        speed,
        language,
      };
      if (instructions && language === "English") payload.instructions = instructions;

      let upstream;
      try {
        upstream = await fetch(`${BASE_URL}/audio/speech`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resolveUpstreamApiKey(req, API_KEY)}`,
            "Content-Type": "application/json",
            Accept: "audio/*",
          },
          body: JSON.stringify(payload),
        });
      } catch (e) {
        console.error(e);
        return jsonError(res, 502, "upstream_unreachable", "Verbindung zur TTS-API fehlgeschlagen.");
      }

      if (!upstream.ok) {
        const errText = await upstream.text();
        const proxyStatus =
          upstream.status >= 500 ? 502 : upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502;
        return jsonError(res, proxyStatus, "upstream_error", formatTtsUpstreamError(upstream.status, errText));
      }

      const buffer = Buffer.from(await upstream.arrayBuffer());
      const contentType =
        upstream.headers.get("content-type") ||
        (responseFormat === "mp3"
          ? "audio/mpeg"
          : responseFormat === "opus"
            ? "audio/ogg"
            : `audio/${responseFormat}`);
      res.set("Content-Type", contentType);
      return res.send(buffer);
    },
  );

  const semanticSearchLimiter = rateLimit({
    windowMs: RATE_WINDOW_MS,
    max: RATE_MAX_CHAT,
    standardHeaders: true,
    legacyHeaders: false,
    skip: shouldSkipPublicRateLimit,
    handler: createRateLimitHandler("chat"),
  });

  function normalizeEmbeddingInputs(raw) {
    if (typeof raw === "string") {
      const t = raw.trim();
      return t ? [t] : [];
    }
    if (!Array.isArray(raw)) return [];
    return raw
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean)
      .slice(0, SEMANTIC_SEARCH_MAX_PASSAGES);
  }

  app.post(
    "/api/embeddings",
    requireApiKey,
    requireAllowedOrigin,
    semanticSearchLimiter,
    express.json({ limit: "4mb" }),
    async (req, res) => {
      const inputs = normalizeEmbeddingInputs(req.body?.input);
      if (inputs.length === 0) {
        return jsonError(res, 400, "validation_error", "input (String oder Array) fehlt.");
      }
      for (const item of inputs) {
        if (item.length > SEMANTIC_SEARCH_MAX_PASSAGE_CHARS) {
          return jsonError(
            res,
            400,
            "validation_error",
            `Text zu lang (max. ${SEMANTIC_SEARCH_MAX_PASSAGE_CHARS} Zeichen pro Eintrag).`,
          );
        }
      }

      const model =
        typeof req.body?.model === "string" && req.body.model.trim()
          ? req.body.model.trim()
          : EMBEDDING_MODEL;

      let upstream;
      try {
        upstream = await fetch(`${BASE_URL}/embeddings`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resolveUpstreamApiKey(req, API_KEY)}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            model,
            input: inputs.length === 1 ? inputs[0] : inputs,
            encoding_format: "float",
          }),
        });
      } catch (e) {
        console.error(e);
        return jsonError(res, 502, "upstream_unreachable", "Verbindung zur Embedding-API fehlgeschlagen.");
      }

      const text = await upstream.text();
      if (!upstream.ok) {
        return jsonError(
          res,
          upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502,
          "upstream_error",
          summarizeUpstreamError(text),
        );
      }

      try {
        return res.json(JSON.parse(text));
      } catch {
        return jsonError(res, 502, "bad_upstream", "Ungültige Embedding-Antwort.");
      }
    },
  );

  app.post(
    "/api/rerank",
    requireApiKey,
    requireAllowedOrigin,
    semanticSearchLimiter,
    express.json({ limit: "4mb" }),
    async (req, res) => {
      const query = typeof req.body?.query === "string" ? req.body.query.trim() : "";
      if (query.length < 3) {
        return jsonError(res, 400, "validation_error", "query fehlt oder ist zu kurz.");
      }
      if (query.length > SEMANTIC_SEARCH_MAX_PASSAGE_CHARS) {
        return jsonError(res, 400, "validation_error", "query ist zu lang.");
      }

      const documents = normalizeEmbeddingInputs(req.body?.documents);
      if (documents.length < 1) {
        return jsonError(res, 400, "validation_error", "documents (Array) fehlt.");
      }
      if (documents.length > SEMANTIC_SEARCH_MAX_PASSAGES) {
        return jsonError(
          res,
          400,
          "validation_error",
          `Zu viele Dokumente (max. ${SEMANTIC_SEARCH_MAX_PASSAGES}).`,
        );
      }

      const model =
        typeof req.body?.model === "string" && req.body.model.trim()
          ? req.body.model.trim()
          : RERANK_MODEL;
      const instruction =
        typeof req.body?.instruction === "string" && req.body.instruction.trim()
          ? req.body.instruction.trim()
          : undefined;

      const payload = { model, query, documents };
      if (instruction) payload.instruction = instruction;

      let upstream;
      try {
        upstream = await fetch(`${BASE_URL}/rerank`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resolveUpstreamApiKey(req, API_KEY)}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        });
      } catch (e) {
        console.error(e);
        return jsonError(res, 502, "upstream_unreachable", "Verbindung zur Rerank-API fehlgeschlagen.");
      }

      const text = await upstream.text();
      if (!upstream.ok) {
        return jsonError(
          res,
          upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502,
          "upstream_error",
          summarizeUpstreamError(text),
        );
      }

      try {
        return res.json(JSON.parse(text));
      } catch {
        return jsonError(res, 502, "bad_upstream", "Ungültige Rerank-Antwort.");
      }
    },
  );

  app.get("/api/models", modelsLimiter, async (_req, res) => {
    try {
      const upstream = await fetch(`${BASE_URL}/models`, {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          Accept: "application/json",
        },
      });
      const text = await upstream.text();
      if (!upstream.ok) {
        return jsonError(res, upstream.status, "upstream_error", text.slice(0, 500));
      }
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        return jsonError(res, 502, "bad_upstream", "Ungültige Antwort der Modell-API.");
      }
      res.json(filterModelsPayload(json));
    } catch (e) {
      console.error(e);
      return jsonError(res, 502, "models_fetch_failed", "Modellliste konnte nicht geladen werden.");
    }
  });

  app.post(
    "/api/chat/completions",
    requireApiKey,
    requireAllowedOrigin,
    chatLimiter,
    express.json({ limit: MAX_BODY_BYTES }),
    async (req, res) => {
    const parsed = sanitizeChatBody(req.body || {}, req);
    if (parsed.error) {
      return jsonError(res, 400, "validation_error", parsed.error);
    }

    let upstream;
    try {
      upstream = await fetch(`${BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resolveUpstreamApiKey(req, API_KEY)}`,
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify(parsed.body),
      });
    } catch (e) {
      console.error(e);
      return jsonError(res, 502, "upstream_unreachable", "Verbindung zum LLM fehlgeschlagen.");
    }

    const ct = upstream.headers.get("content-type") || "";
    if (!upstream.ok) {
      const errText = await upstream.text();
      return jsonError(
        res,
        upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502,
        "upstream_error",
        summarizeUpstreamError(errText),
      );
    }

    res.status(upstream.status);
    if (ct) res.setHeader("Content-Type", ct);
    const cache = upstream.headers.get("cache-control");
    if (cache) res.setHeader("Cache-Control", cache);
    else if (String(ct).includes("text/event-stream")) {
      res.setHeader("Cache-Control", "no-cache, no-transform");
    }
    res.setHeader("X-Accel-Buffering", "no");

    if (!upstream.body) {
      res.end();
      return;
    }

    const nodeReadable = Readable.fromWeb(upstream.body);
    try {
      await pipeline(nodeReadable, res);
    } catch (e) {
      if (!res.headersSent) {
        jsonError(res, 502, "stream_failed", "Streaming wurde unterbrochen.");
      } else {
        res.destroy(e);
      }
    }
  });

  app.use((err, req, res, next) => {
    if (res.headersSent) {
      next(err);
      return;
    }
    if (err?.type === "entity.too.large" || err?.name === "PayloadTooLargeError") {
      const mb = Math.round(MAX_BODY_BYTES / (1024 * 1024));
      jsonError(
        res,
        413,
        "payload_too_large",
        `Anfrage zu groß (max. ${mb} MB). Bild/PDF verkleinern oder MAX_BODY_BYTES in .env erhöhen.`,
      );
      return;
    }
    next(err);
  });

  const staticDir = path.join(__dirname, "../../client/dist");
  if (fs.existsSync(staticDir)) {
    // robots/sitemap explizit (korrektes Content-Type, kein SPA-Fallback)
    const seoFile = (name, type) => {
      const filePath = path.join(staticDir, name);
      if (!fs.existsSync(filePath)) return null;
      return (req, res) => {
        res.type(type);
        res.setHeader("Cache-Control", "public, max-age=3600");
        res.sendFile(filePath);
      };
    };
    const robotsHandler = seoFile("robots.txt", "text/plain; charset=utf-8");
    const sitemapHandler = seoFile("sitemap.xml", "application/xml; charset=utf-8");
    const llmsHandler = seoFile("llms.txt", "text/plain; charset=utf-8");
    const llmHandler = seoFile("llm.txt", "text/plain; charset=utf-8");
    if (robotsHandler) app.get("/robots.txt", robotsHandler);
    if (sitemapHandler) app.get("/sitemap.xml", sitemapHandler);
    if (llmsHandler) app.get("/llms.txt", llmsHandler);
    if (llmHandler) app.get("/llm.txt", llmHandler);

    app.use(express.static(staticDir, { index: false, maxAge: "1h" }));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) return next();
      // Keine HTML-SPA für Crawler-Dateien / Assets ohne Treffer
      if (/\.(txt|xml|ico|json|webmanifest|map)$/i.test(req.path)) return next();
      res.sendFile(path.join(staticDir, "index.html"));
    });
  }

  app.use((req, res) => {
    if (req.path.startsWith("/api")) {
      return jsonError(res, 404, "not_found", "Unbekannte API-Route.");
    }
    res.status(404).type("text/plain").send("Not found");
  });

  const server = app.listen(PORT, HOST, () => {
    console.log(`Playground-Server läuft auf http://${HOST}:${PORT}`);
    if (PLAYGROUND_BASE_PATH) {
      console.log(`Öffentlicher Basis-Pfad: ${PLAYGROUND_BASE_PATH}`);
    }
    if (fs.existsSync(staticDir)) {
      console.log(`Statische Dateien: ${staticDir}`);
    } else {
      console.log("Hinweis: client/dist fehlt — im Dev-Modus Vite-Proxy nutzen oder npm run build.");
    }
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `Port ${PORT} ist bereits belegt (EADDRINUSE). Alten Node-Prozess beenden, z. B.:\n` +
          `  lsof -nP -iTCP:${PORT} -sTCP:LISTEN\n` +
          `  kill <PID>\n` +
          `Oder in .env einen anderen PORT setzen.`,
      );
    } else {
      console.error(err);
    }
    process.exit(1);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
