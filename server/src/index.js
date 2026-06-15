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
import { getWebSearchConfig, searchWeb, searchWebMulti } from "./webSearch.js";
import { fetchMittwaldFeatureRequests } from "./mittwaldFeatureRequests.js";
import { fetchMittwaldAiHostingDocs } from "./mittwaldAiHostingDocs.js";
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
const INTERNAL_PLAYGROUND_MODELS = new Set(["GLM-OCR"]);
const MAX_BODY_BYTES = Math.min(
  Math.max(Number(process.env.MAX_BODY_BYTES || 10 * 1024 * 1024), 512 * 1024),
  25 * 1024 * 1024,
);
const BRAND_TITLE = process.env.PLAYGROUND_BRAND_TITLE || "Mittwald KI-Playground";
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
const MAX_MESSAGE_CHARS = 48000;
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

function validateMessages(messages) {
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
      if (c.length > MAX_MESSAGE_CHARS)
        return `Nachricht ${i} ist zu lang (>${MAX_MESSAGE_CHARS} Zeichen).`;
    } else if (Array.isArray(c)) {
      for (const part of c) {
        if (!part || typeof part !== "object") return `Ungültiger Multipart-Inhalt bei ${i}.`;
        if (part.type === "text" && typeof part.text === "string") {
          if (part.text.length > MAX_MESSAGE_CHARS)
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

function sanitizeChatBody(body) {
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
  const msgErr = validateMessages(out.messages);
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
      webSearch: getWebSearchConfig(),
      links: getPlaygroundLinks(),
      rateLimits: RATE_LIMITS,
      bonusChat: getBonusChatConfig(),
      maxBodyBytes: MAX_BODY_BYTES,
      userSessionApiKey: true,
      aiHostingUrl:
        process.env.PLAYGROUND_LINK_AI_HOSTING_URL?.trim() || DEFAULT_AI_HOSTING_URL,
      selfHostRepoUrl: SELF_HOST_REPO_URL,
    });
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
    const parsed = sanitizeChatBody(req.body || {});
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
    app.use(express.static(staticDir, { index: false, maxAge: "1h" }));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) return next();
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
