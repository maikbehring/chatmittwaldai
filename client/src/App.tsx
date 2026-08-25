import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiUrl } from "./appPaths";
import {
  getInferencePreset,
  getQwenVisionInference,
  getQwenVisionOcrInference,
  isQwen3Model,
  isQwen38Model,
  MODEL_GPT_OSS,
  MODEL_MINISTRAL,
  MODEL_QWEN_35,
  MODEL_QWEN_36,
  MODEL_QWEN_38,
  resolveQwen38InferenceParams,
  type GptOssReasoning,
  type Qwen38ReasoningEffort,
} from "./modelPresets";
import { TtsAudioPlayer } from "./TtsAudioPlayer";
import {
  blobToBase64,
  buildTtsResultMarkdown,
  resolveTtsFromBriefing,
  synthesizeSpeech,
  TTS_MAX_INPUT_CHARS,
  type TtsResultPayload,
} from "./textToSpeech";
import { PlaygroundUseCaseCards } from "./PlaygroundUseCaseCards";
import { PlaygroundUseCaseGuide } from "./PlaygroundUseCaseGuide";
import { NetworkPathCheckPanel } from "./NetworkPathCheckPanel";
import { GridCarbonForecastPanel } from "./GridCarbonForecastPanel";
import { UseCaseExperimentalBadge } from "./UseCaseExperimentalBadge";
import { UseCaseBetaBadge } from "./UseCaseBetaBadge";
import { ModelCompareMessageRow } from "./ModelCompareMessageRow";
import {
  buildCompareApiMessages,
  buildCompareChatBody,
  inferenceParamsForCompareModel,
  modelShortLabel,
  type ModelComparePayload,
} from "./modelCompare";
import {
  audioAttachmentLabel,
  AUDIO_FILE_ACCEPT,
  audioTranscribeStatusLine,
  buildAudioTranscribeStructureUserMessage,
  formatAudioTranscribeProgressDetail,
  isAudioUploadFile,
  transcribeUploadedAudioFile,
  type AudioTranscribeProgressState,
} from "./audioFileTranscription";
import { getBlobDurationSeconds } from "./blobToWav";
import {
  fileToOcrPageImages,
  ocrAttachmentLabel,
} from "./pdfToOcrImages";
import {
  buildInvoiceStructureUserMessage,
  extractTextWithGlmOcr,
} from "./invoiceOcr";
import {
  composeBriefingText,
  emptyBriefingValues,
  getUseCaseById,
  hasBriefingContent,
  isCopyableUseCase,
  PLAYGROUND_USE_CASES,
  useCaseIsolatesWebSearchContext,
  type PlaygroundUseCaseId,
} from "./playgroundUseCases";
import type { TranscribeProgress } from "./speechTranscription";
import { ModelSettingsDock } from "./ModelSettingsDock";
import { ChatImageAttachment, ChatImagePreviewThumb } from "./ChatImageAttachment";
import { SpeechInputButton, type SpeechInputHandle } from "./SpeechInputButton";
import { SpeechTranscribingIndicator } from "./SpeechTranscribingIndicator";
import { SpeechWaveform } from "./SpeechWaveform";
import { VoiceRecordingControls } from "./VoiceRecordingControls";
import { ChatMarkdown } from "./ChatMarkdown";
import { ImageLightbox } from "./ImageLightbox";
import { createRafStreamBatcher } from "./streamDeltaBatch";
import {
  MODEL_FIRST_TOKEN_TIMEOUT_MS,
  streamChatCompletion,
  streamChatCompletionWithFirstTokenTimeout,
} from "./streamChatCompletion";
import {
  CO2_FOOTPRINT_TOOLTIP,
  enrichUserMessageForPlaygroundCo2Question,
  estimateInferenceCo2Grams,
  formatCo2Grams,
  isPlaygroundCo2Question,
  stripHallucinatedCo2FromAssistantText,
  sumCo2GramsFromAssistantMessages,
} from "./inferenceFootprint";
import { isPlaygroundAuthorQuestion } from "./playgroundAuthorContext";
import { SessionCo2Footprint } from "./SessionCo2Footprint";
import { GridCarbonBadge } from "./GridCarbonBadge";
import {
  fetchGridCarbonSummary,
  formatGridCarbonForecastContext,
  gridCarbonRefreshIntervalMs,
  type GridCarbonSummary,
} from "./gridCarbonForecast";
import { getGridCarbonForecastStaticResponse } from "./gridCarbonForecastAdvice";
import {
  fetchWeekendVisitSources,
  formatWeekendVisitContext,
  prepareWeekendVisitCity,
  type WeekendVisitData,
} from "./weekendVisit";
import {
  formatPriceCompareContext,
  searchPriceCompareIterative,
  type PriceCompareSearchResponse,
} from "./priceCompare";
import {
  formatSemanticSearchPassagesText,
  parseSemanticSearchPassages,
  runSemanticSearchPipeline,
  SEMANTIC_SEARCH_DEMO_PASSAGES,
  SEMANTIC_SEARCH_DEMO_QUESTION,
  type SemanticSearchPhase,
  type SemanticSearchProgress,
} from "./semanticSearch";
import {
  getAiHostingGuideProgressSteps,
  getAiHostingTariffAdvisorProgressSteps,
  getAudioTranscribeProgressSteps,
  getPriceCompareProgressSteps,
  getSemanticSearchProgressSteps,
  getWeekendVisitProgressSteps,
  UseCaseProgressSteps,
} from "./UseCaseProgressSteps";
import {
  fetchMittwaldAiHostingDocs,
  formatMittwaldAiHostingDocsContext,
  type MittwaldAiHostingDocsResponse,
} from "./mittwaldAiHostingDocs";
import {
  fetchMittwaldAiHostingTariffAdvisor,
  formatMittwaldAiHostingTariffAdvisorContext,
  type MittwaldAiHostingTariffAdvisorResponse,
} from "./mittwaldAiHostingTariffAdvisor";
import {
  fetchMittwaldFeatureRequests,
  formatMittwaldFeatureRequestsContext,
  type MittwaldFeatureRequestsResponse,
} from "./mittwaldFeatureRequests";
import { formatPlaygroundBaseSystemContext, normalizeApiMessagesForModel, playgroundSystemContextMessages } from "./playgroundSystemContext";
import { WebSearchGlobeToggle, WebSearchModeChip } from "./WebSearchComposerControl";
import { WebSearchConsentDialog } from "./WebSearchConsentDialog";
import { DeleteAllChatsDialog } from "./DeleteAllChatsDialog";
import { ClearBrowserCacheDialog } from "./ClearBrowserCacheDialog";
import {
  clearSessionApiKey,
  hasSessionApiKey,
  setSessionApiKey,
} from "./playgroundSessionApiKey";
import {
  clearPlaygroundBrowserStorage,
  isBonusChatGrantUsed,
  markBonusChatGrantUsed,
  PLAYGROUND_THEME_STORAGE_KEY,
} from "./playgroundBrowserStorage";
import {
  clearWebSearchConsent,
  hasWebSearchConsent,
  setWebSearchConsent,
} from "./webSearchConsent";
import { CopyTextButton, extractCopySections } from "./CopyTextButton";
import {
  getSameTravelRouteStaticResponse,
  extractTravelCopySections,
  normalizeTravelTrainVsFlightOutput,
} from "./travelTrainVsFlightOutput";
import { PlaygroundLinksFooter } from "./PlaygroundExternalLinks";
import { MittwaldLogo } from "./MittwaldLogo";
import { PlaygroundHostingUpsell } from "./PlaygroundHostingUpsell";
import { PlaygroundAiHostingHero } from "./PlaygroundAiHostingHero";
import { PlaygroundSelect } from "./PlaygroundSelect";
import { trackPlaygroundUseCaseSend, trackPlaygroundUseCaseStart } from "./umami";
import { ArrowUpIcon, MenuIcon, PenIcon } from "./playgroundIcons";
import { mainFooterLinks, withDefaultBugLink, type PlaygroundLink } from "./playgroundLinks";
import {
  createEmptyThread,
  deriveThreadTitle,
  loadPlaygroundState,
  savePlaygroundState,
  sortThreadsByRecent,
  threadHasMessages,
  type ChatThread,
} from "./chatStorage";
import {
  appErrorFromSendFailure,
  appErrorFromUnknown,
  isAbortError,
  grantBonusChatRequests,
  type AppUiError,
  type PlaygroundBonusChatConfig,
  type PlaygroundRateLimits,
} from "./apiErrors";
import { RateLimitNotice } from "./RateLimitNotice";
import { isModelUnreachableError, resolveModelFallback } from "./modelFallback";
import { useIsMobileLayout } from "./useMobileLayout";
import {
  buildWebSearchChatExcerpt,
  fetchWebSearch,
  formatWebSearchContext,
  providerLabel,
  type WebSearchConfig,
  type WebSearchResponse,
} from "./webSearch";

const DEFAULT_AI_HOSTING_URL = "https://www.mittwald.de/mstudio/ai-hosting";

type ThemePreference = "light" | "dark" | "system";

function readThemePreference(): ThemePreference {
  try {
    const v = localStorage.getItem(PLAYGROUND_THEME_STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* ignore */
  }
  return "system";
}

type Role = "system" | "user" | "assistant";

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

type TokenMeter = {
  promptTokens: number | null;
  completionTokens: number | null;
  outputTokensPerSec: number | null;
  /** Sekunden vom ersten sichtbaren Ausgabe-Token bis Stream-Ende; ohne Ausgabe: vom Request-Start bis Stream-Ende */
  generationSeconds?: number;
  /** Geschätztes CO₂eq (g), siehe inferenceFootprint.ts */
  co2Grams?: number;
  source?: "api" | "heuristic";
};

export type MessageTokenStats = TokenMeter;

export type ChatMessage = {
  role: Exclude<Role, "system">;
  content: string | ContentPart[];
  /** Use Case, der die Nachricht erzeugt hat (für Formatierung/Kopieren). */
  playgroundUseCaseId?: PlaygroundUseCaseId;
  usage?: TokenMeter;
  webSearch?: WebSearchResponse;
  mittwaldFeatureRequests?: MittwaldFeatureRequestsResponse;
  mittwaldAiHostingDocs?: MittwaldAiHostingDocsResponse;
  mittwaldAiHostingTariffAdvisor?: MittwaldAiHostingTariffAdvisorResponse;
  weekendVisitData?: WeekendVisitData;
  priceCompareSearch?: PriceCompareSearchResponse;
  gridCarbonForecast?: GridCarbonSummary;
  compare?: ModelComparePayload;
  ttsResult?: TtsResultPayload;
};

const DEFAULT_MODEL = MODEL_GPT_OSS;
const DEFAULT_MAX_MESSAGES = 60;

function pickFreeChatDefaultModel(allowed: { id: string }[]): string | null {
  if (!allowed.length) return null;
  return allowed.find((m) => m.id === MODEL_GPT_OSS)?.id ?? allowed[0]!.id;
}

type ApiMessage = { role: Role; content: ChatMessage["content"] };

/** Behält System-Prompts, kürzt den Verlauf auf das Server-Limit. */
function trimMessagesForApi(
  messages: ApiMessage[],
  maxMessages: number,
): { messages: ApiMessage[]; trimmedCount: number } {
  if (messages.length <= maxMessages) return { messages, trimmedCount: 0 };

  const system: ApiMessage[] = [];
  const rest: ApiMessage[] = [];
  for (const m of messages) {
    if (m.role === "system") system.push(m);
    else rest.push(m);
  }

  const budget = Math.max(maxMessages - system.length, 1);
  if (rest.length <= budget) return { messages, trimmedCount: 0 };

  const kept = rest.slice(-budget);
  return {
    messages: [...system, ...kept],
    trimmedCount: rest.length - kept.length,
  };
}

function stripWebSearchWithoutConsent(state: ReturnType<typeof loadPlaygroundState>) {
  if (hasWebSearchConsent()) return state;
  return {
    ...state,
    settings: { ...state.settings, webSearchDefaultEnabled: false },
    threads: state.threads.map((t) => ({ ...t, webSearchEnabled: false })),
  };
}

const boot = stripWebSearchWithoutConsent(loadPlaygroundState());
const bootThread =
  boot.threads.find((t) => t.id === boot.activeThreadId) ?? boot.threads[0];

async function encodeImageFile(file: File, maxEdge = 1024, quality = 0.85): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas nicht verfügbar.");
  ctx.drawImage(bitmap, 0, 0, w, h);
  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  bitmap.close();
  return dataUrl;
}

function assistantPlainTextLength(content: string | ContentPart[]): number {
  if (typeof content === "string") return content.length;
  let n = 0;
  for (const part of content) {
    if (part.type === "text") n += part.text.length;
  }
  return n;
}

function AssistantTokenFooter({ stats }: { stats: TokenMeter }) {
  const fmt = (n: number | null) => (n == null ? "—" : n.toLocaleString("de-DE"));
  const tps =
    stats.outputTokensPerSec == null
      ? "—"
      : `${stats.outputTokensPerSec.toLocaleString("de-DE", { maximumFractionDigits: 1 })} tok/s`;
  const gen =
    stats.generationSeconds == null
      ? "—"
      : `${stats.generationSeconds.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} s`;

  const prompt = stats.promptTokens ?? 0;
  const completion = stats.completionTokens ?? 0;
  const total =
    stats.promptTokens != null || stats.completionTokens != null
      ? prompt + completion
      : null;

  const co2Fmt = stats.co2Grams == null ? null : formatCo2Grams(stats.co2Grams);

  const sep = (
    <span className="mx-1.5 text-neutral-300 dark:text-neutral-600" aria-hidden>
      ·
    </span>
  );

  return (
    <p className="mt-2 max-w-full text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-500">
      <span>Eingabe: {fmt(stats.promptTokens)} Token</span>
      {sep}
      <span>Ausgabe: {fmt(stats.completionTokens)} Token</span>
      {total != null && total > 0 ? (
        <>
          {sep}
          <span>Gesamt: {fmt(total)} Token</span>
        </>
      ) : null}
      {sep}
      <span>{tps}</span>
      {sep}
      <span>Generierung: {gen}</span>
      {co2Fmt != null ? (
        <>
          {sep}
          <span
            className="cursor-help underline decoration-dotted decoration-neutral-400 underline-offset-2 dark:decoration-neutral-600"
            title={CO2_FOOTPRINT_TOOLTIP}
          >
            ≈ {co2Fmt} g CO₂eq
          </span>
        </>
      ) : null}
      {stats.source === "heuristic" ? (
        <span className="ml-1.5 text-neutral-400 dark:text-neutral-600">
          (teilweise geschätzt)
        </span>
      ) : null}
    </p>
  );
}

/** Nutzer-Nachrichten als Plaintext (Paste/Logs ohne Markdown-Artefakte). */
function renderUserMessageContent(
  content: string | ContentPart[],
  onImageOpen: (src: string, alt: string) => void,
) {
  if (typeof content === "string") {
    return (
      <div className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
        {content}
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {content.map((part, j) =>
        part.type === "text" ? (
          <div key={j} className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
            {part.text}
          </div>
        ) : (
          <ChatImageAttachment
            key={j}
            src={part.image_url.url}
            alt="Anhang"
            onOpen={onImageOpen}
          />
        ),
      )}
    </div>
  );
}

function renderMessageContent(
  content: string | ContentPart[],
  streaming: boolean,
  onImageOpen: (src: string, alt: string) => void,
) {
  if (typeof content === "string") {
    if (streaming) {
      return (
        <div className="playground-text-chat max-w-none whitespace-pre-wrap break-words text-playground-muted">
          {content}
        </div>
      );
    }
    return <ChatMarkdown>{content}</ChatMarkdown>;
  }
  return (
    <div className="space-y-2">
      {content.map((part, j) =>
        part.type === "text" ? (
          streaming ? (
            <div
              key={j}
              className="playground-text-chat max-w-none whitespace-pre-wrap break-words text-playground-muted"
            >
              {part.text}
            </div>
          ) : (
            <ChatMarkdown key={j}>{part.text}</ChatMarkdown>
          )
        ) : (
          <ChatImageAttachment
            key={j}
            src={part.image_url.url}
            alt="Anhang"
            onOpen={onImageOpen}
          />
        ),
      )}
    </div>
  );
}

function assistantMessagePlainText(content: string | ContentPart[]): string {
  if (typeof content === "string") return content;
  return content
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("\n");
}

function resolveMessageUseCaseId(
  message: ChatMessage,
  activeUseCaseId: PlaygroundUseCaseId | null | undefined,
): PlaygroundUseCaseId | null {
  return message.playgroundUseCaseId ?? activeUseCaseId ?? null;
}

function polishAssistantMarkdown(
  content: string | ContentPart[],
  useCaseId: PlaygroundUseCaseId | null,
): string {
  const plain = assistantMessagePlainText(content);
  if (useCaseId === "travel-train-vs-flight") {
    return normalizeTravelTrainVsFlightOutput(stripHallucinatedCo2FromAssistantText(plain));
  }
  return stripHallucinatedCo2FromAssistantText(plain);
}

function UseCaseCopyActions({
  content,
  useCaseId,
}: {
  content: string;
  useCaseId?: PlaygroundUseCaseId | null;
}) {
  const sections =
    useCaseId === "travel-train-vs-flight"
      ? extractTravelCopySections(content)
      : extractCopySections(content);
  if (sections.length === 0) {
    const plain = content.trim();
    if (!plain) return null;
    return (
      <div className="mb-3 flex flex-wrap gap-2">
        <CopyTextButton text={plain} label="Antwort kopieren" />
      </div>
    );
  }
  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {sections.map((section, i) => (
        <CopyTextButton
          key={`${i}-${section.label}`}
          text={section.text}
          label={`${section.label} kopieren`}
        />
      ))}
      {sections.length > 1 ? (
        <CopyTextButton
          text={sections.map((s) => s.text).join("\n\n")}
          label="Alles kopieren"
        />
      ) : null}
    </div>
  );
}

const ChatMessageRow = memo(function ChatMessageRow({
  message,
  streaming,
  webSearchPending,
  featureRequestsPending,
  aiHostingDocsPending,
  aiHostingTariffAdvisorPending,
  weekendVisitPhase,
  priceComparePhase,
  priceCompareRound,
  webSearchProviderLabel,
  activeUseCaseId,
  onImageOpen,
}: {
  message: ChatMessage;
  streaming: boolean;
  webSearchPending?: boolean;
  featureRequestsPending?: boolean;
  aiHostingDocsPending?: boolean;
  aiHostingTariffAdvisorPending?: boolean;
  weekendVisitPhase?: "prepare" | "sources" | "generate" | null;
  priceComparePhase?: "search" | "generate" | null;
  priceCompareRound?: { round: number; total: number } | null;
  webSearchProviderLabel?: string;
  activeUseCaseId?: PlaygroundUseCaseId | null;
  onImageOpen: (src: string, alt: string) => void;
}) {
  if (message.role === "user") {
    return (
      <div className="flex w-full justify-end">
        <div className="flex w-full max-w-full flex-col items-end gap-1">
          {message.priceCompareSearch && message.priceCompareSearch.results.length > 0 ? (
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
              Preisvergleich · {message.priceCompareSearch.roundsCompleted}/
              {message.priceCompareSearch.totalRounds} Runden · {message.priceCompareSearch.results.length} Treffer
              {message.priceCompareSearch.sufficient ? " · ausreichend" : ""}
            </p>
          ) : null}
          {message.weekendVisitData ? (
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
              {message.weekendVisitData.city}
              {message.weekendVisitData.admin1 ? `, ${message.weekendVisitData.admin1}` : ""} · Wochenende{" "}
              {message.weekendVisitData.weekend.saturday.slice(8, 10)}.–
              {message.weekendVisitData.weekend.sunday.slice(8, 10)}. · Wikipedia · Open-Meteo
            </p>
          ) : null}
          {message.mittwaldAiHostingDocs &&
          message.mittwaldAiHostingDocs.modelsPage.models.length > 0 ? (
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
              Developer-Doku · {message.mittwaldAiHostingDocs.modelsPage.models.length} Modelle ·{" "}
              {message.mittwaldAiHostingDocs.apiPage.endpoints.length} API-Endpunkte
            </p>
          ) : null}
          {message.mittwaldAiHostingTariffAdvisor &&
          message.mittwaldAiHostingTariffAdvisor.modelsPage.models.length > 0 ? (
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
              {message.mittwaldAiHostingTariffAdvisor.tariffs.plans.length > 0
                ? `Live-Tarife · ${message.mittwaldAiHostingTariffAdvisor.tariffs.plans.length} Pakete · `
                : "FAQ · Dedicated · "}
              {message.mittwaldAiHostingTariffAdvisor.modelsPage.models.length} Modelle · FAQ
            </p>
          ) : null}
          {message.mittwaldFeatureRequests &&
          message.mittwaldFeatureRequests.issues.length > 0 ? (
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
              GitHub · {message.mittwaldFeatureRequests.issues.length} Feature Requests (
              {message.mittwaldFeatureRequests.repo})
            </p>
          ) : null}
          {message.webSearch && message.webSearch.results.length > 0 ? (
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
              Websuche ({message.webSearch.provider}) · {message.webSearch.results.length} Treffer
            </p>
          ) : null}
          <div className="playground-user-prompt-bubble playground-text-user-prompt">
            {renderUserMessageContent(message.content, onImageOpen)}
          </div>
        </div>
      </div>
    );
  }
  const useCaseIdForMessage = resolveMessageUseCaseId(message, activeUseCaseId);
  const assistantPlain = polishAssistantMarkdown(message.content, useCaseIdForMessage).trim();
  const assistantDisplayContent =
    !streaming && message.role === "assistant" && useCaseIdForMessage === "travel-train-vs-flight"
      ? assistantPlain
      : message.content;
  const isAiHostingGuide = activeUseCaseId === "ai-hosting-guide";
  const isAiHostingTariffAdvisor = activeUseCaseId === "ai-hosting-tarifberater";
  const isClientWeekendUseCase = activeUseCaseId === "client-weekend";
  const isPriceCompareUseCase = activeUseCaseId === "price-compare";
  const aiHostingGuideGenerating =
    isAiHostingGuide && streaming && assistantPlain.length === 0;
  const aiHostingTariffAdvisorGenerating =
    isAiHostingTariffAdvisor && streaming && assistantPlain.length === 0;
  const clientWeekendGenerating =
    isClientWeekendUseCase && streaming && assistantPlain.length === 0;
  const showAiHostingProgress =
    isAiHostingGuide && (aiHostingDocsPending || aiHostingGuideGenerating);
  const showAiHostingTariffProgress =
    isAiHostingTariffAdvisor &&
    (aiHostingTariffAdvisorPending || aiHostingTariffAdvisorGenerating);
  const showWeekendVisitProgress =
    isClientWeekendUseCase &&
    (weekendVisitPhase != null || clientWeekendGenerating);
  const priceCompareGenerating =
    isPriceCompareUseCase && streaming && assistantPlain.length === 0 && priceComparePhase === "generate";
  const showPriceCompareProgress =
    isPriceCompareUseCase && (priceComparePhase === "search" || priceCompareGenerating);
  const showCopyActions =
    isCopyableUseCase(useCaseIdForMessage) &&
    !streaming &&
    !webSearchPending &&
    !featureRequestsPending &&
    !aiHostingDocsPending &&
    !aiHostingTariffAdvisorPending &&
    !aiHostingGuideGenerating &&
    !aiHostingTariffAdvisorGenerating &&
    !clientWeekendGenerating &&
    !priceCompareGenerating &&
    priceComparePhase == null &&
    weekendVisitPhase == null &&
    assistantPlain.length > 0;

  return (
    <div className="flex w-full justify-start">
      <div className="flex max-w-full flex-col items-start">
        {showCopyActions ? (
          <UseCaseCopyActions content={assistantPlain} useCaseId={useCaseIdForMessage} />
        ) : null}
        <div className="playground-text-chat max-w-full text-playground-muted">
          {webSearchPending ? (
            <p className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400" role="status">
              <span
                className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-sky-500 border-t-transparent dark:border-sky-400"
                aria-hidden
              />
              Suche im Internet
              {webSearchProviderLabel ? (
                <span className="text-neutral-400 dark:text-neutral-500"> · {webSearchProviderLabel}</span>
              ) : null}
              …
            </p>
          ) : featureRequestsPending ? (
            <p className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400" role="status">
              <span
                className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent dark:border-emerald-400"
                aria-hidden
              />
              Lade Feature Requests von GitHub …
            </p>
          ) : showPriceCompareProgress ? (
            <UseCaseProgressSteps
              steps={getPriceCompareProgressSteps(
                priceComparePhase === "search"
                  ? priceCompareRound ?? { round: 1, total: 4 }
                  : null,
                priceCompareGenerating,
              )}
              ariaLabel="Preisvergleich — Fortschritt"
              accentClassName="sky"
            />
          ) : showWeekendVisitProgress ? (
            <UseCaseProgressSteps
              steps={getWeekendVisitProgressSteps(
                weekendVisitPhase ?? (clientWeekendGenerating ? "generate" : null),
              )}
              ariaLabel="Wochenende mit Kunde — Fortschritt"
              accentClassName="amber"
            />
          ) : showAiHostingProgress ? (
            <UseCaseProgressSteps
              steps={getAiHostingGuideProgressSteps(
                Boolean(aiHostingDocsPending),
                aiHostingGuideGenerating,
              )}
              ariaLabel="AI Hosting Guide — Fortschritt"
              accentClassName="violet"
            />
          ) : showAiHostingTariffProgress ? (
            <UseCaseProgressSteps
              steps={getAiHostingTariffAdvisorProgressSteps(
                Boolean(aiHostingTariffAdvisorPending),
                aiHostingTariffAdvisorGenerating,
              )}
              ariaLabel="AI Hosting Tarifberater — Fortschritt"
              accentClassName="emerald"
            />
          ) : (
            <>
              {message.ttsResult ? <TtsAudioPlayer result={message.ttsResult} /> : null}
              {renderMessageContent(assistantDisplayContent, streaming, onImageOpen)}
            </>
          )}
        </div>
        {message.usage ? <AssistantTokenFooter stats={message.usage} /> : null}
      </div>
    </div>
  );
});

function applyPresetToState(
  modelId: string,
  setters: {
    setTemperature: (n: number) => void;
    setTopP: (n: number | null) => void;
    setTopK: (n: number | null) => void;
    setPresencePenalty: (n: number | null) => void;
    setExtraBody: (b: Record<string, unknown> | null) => void;
    setMaxTokens: (n: number | null) => void;
  },
) {
  const p = getInferencePreset(modelId);
  setters.setTemperature(p.temperature);
  setters.setTopP(typeof p.topP === "number" ? p.topP : null);
  setters.setTopK(typeof p.topK === "number" ? p.topK : null);
  setters.setPresencePenalty(typeof p.presencePenalty === "number" ? p.presencePenalty : null);
  setters.setExtraBody(p.extraBody);
  setters.setMaxTokens(p.maxTokens);
}

export function App() {
  const initial = boot.settings;
  const initialModel = initial.model ?? DEFAULT_MODEL;
  const initialPreset = getInferencePreset(initialModel);

  const [title, setTitle] = useState("Mittwald KI-Playground");
  const [maxMessages, setMaxMessages] = useState(DEFAULT_MAX_MESSAGES);
  const [contextTrimNotice, setContextTrimNotice] = useState<string | null>(null);
  const [speechBusy, setSpeechBusy] = useState(false);
  const [speechTranscribeStatus, setSpeechTranscribeStatus] = useState<string | null>(null);
  const [compareModelB, setCompareModelB] = useState(MODEL_QWEN_36);
  const [ocrProgress, setOcrProgress] = useState<string | null>(null);
  const [audioTranscribePhase, setAudioTranscribePhase] = useState<
    "transcribe" | "format" | null
  >(null);
  const [audioTranscribeProgress, setAudioTranscribeProgress] =
    useState<AudioTranscribeProgressState | null>(null);
  const [semanticSearchPhase, setSemanticSearchPhase] =
    useState<SemanticSearchPhase | null>(null);
  const [semanticSearchProgress, setSemanticSearchProgress] =
    useState<SemanticSearchProgress | null>(null);
  const [ttsPhase, setTtsPhase] = useState<"synthesize" | null>(null);
  const [audioFileDurationSec, setAudioFileDurationSec] = useState<number | null>(null);
  const [voiceRecording, setVoiceRecording] = useState<{
    active: boolean;
    stream: MediaStream | null;
  }>({ active: false, stream: null });
  const [speechToText, setSpeechToText] = useState({
    enabled: true,
    model: "whisper-large-v3-turbo",
    language: "de",
    maxAudioBytes: 25 * 1024 * 1024,
  });
  const [models, setModels] = useState<{ id: string }[]>([]);
  const [model, setModel] = useState(initialModel);
  const [temperature, setTemperature] = useState(
    typeof initial.temperature === "number" ? initial.temperature : initialPreset.temperature,
  );
  const [topP, setTopP] = useState<number | null>(
    typeof initial.topP === "number" ? initial.topP : (initialPreset.topP ?? null),
  );
  const [topK, setTopK] = useState<number | null>(
    typeof initial.topK === "number" ? initial.topK : (initialPreset.topK ?? null),
  );
  const [presencePenalty, setPresencePenalty] = useState<number | null>(
    typeof initial.presencePenalty === "number"
      ? initial.presencePenalty
      : (initialPreset.presencePenalty ?? null),
  );
  const [extraBody, setExtraBody] = useState<Record<string, unknown> | null>(
    initial.extraBody && typeof initial.extraBody === "object"
      ? (initial.extraBody as Record<string, unknown>)
      : initialPreset.extraBody,
  );
  const [gptOssReasoning, setGptOssReasoning] = useState<GptOssReasoning>(
    initial.gptOssReasoning === "low" ||
      initial.gptOssReasoning === "medium" ||
      initial.gptOssReasoning === "high"
      ? initial.gptOssReasoning
      : "medium",
  );
  const [qwen38ThinkingEnabled, setQwen38ThinkingEnabled] = useState(
    initial.qwen38ThinkingEnabled !== false,
  );
  const [qwen38ReasoningEffort, setQwen38ReasoningEffort] = useState<Qwen38ReasoningEffort>(
    initial.qwen38ReasoningEffort === "medium" ||
      initial.qwen38ReasoningEffort === "xhigh" ||
      initial.qwen38ReasoningEffort === "low"
      ? initial.qwen38ReasoningEffort
      : "low",
  );
  const [qwenVisionOcr, setQwenVisionOcr] = useState(Boolean(initial.qwenVisionOcr));
  const [maxTokens, setMaxTokens] = useState<number | null>(() => {
    if (initial.maxTokens === null) return null;
    if (typeof initial.maxTokens === "number") return initial.maxTokens;
    return initialPreset.maxTokens;
  });
  const [systemPrompt, setSystemPrompt] = useState(() => initial.systemPrompt ?? "");
  const [activeUseCaseId, setActiveUseCaseId] = useState<PlaygroundUseCaseId | null>(null);
  const [activeModelFallback, setActiveModelFallback] = useState<{
    modelId: string;
    label: string;
  } | null>(null);
  const [briefingValues, setBriefingValues] = useState<Record<string, string>>({});
  const activeUseCase = useMemo(() => getUseCaseById(activeUseCaseId), [activeUseCaseId]);
  const [playgroundLinks, setPlaygroundLinks] = useState<PlaygroundLink[]>([]);
  const footerLinks = useMemo(() => withDefaultBugLink(playgroundLinks), [playgroundLinks]);
  const pageFooterLinks = useMemo(() => mainFooterLinks(footerLinks), [footerLinks]);
  const [webSearchConfig, setWebSearchConfig] = useState<WebSearchConfig | null>(null);
  const [webSearchDefaultEnabled, setWebSearchDefaultEnabled] = useState(
    () => Boolean(initial.webSearchDefaultEnabled),
  );
  const [webSearchBusy, setWebSearchBusy] = useState(false);
  const [featureRequestsBusy, setFeatureRequestsBusy] = useState(false);
  const [aiHostingDocsBusy, setAiHostingDocsBusy] = useState(false);
  const [aiHostingTariffAdvisorBusy, setAiHostingTariffAdvisorBusy] = useState(false);
  const [weekendVisitPhase, setWeekendVisitPhase] = useState<
    "prepare" | "sources" | "generate" | null
  >(null);
  const [priceCompareSearchBusy, setPriceCompareSearchBusy] = useState(false);
  const [priceCompareRound, setPriceCompareRound] = useState<{
    round: number;
    total: number;
  } | null>(null);
  const [webSearchConsentOpen, setWebSearchConsentOpen] = useState(false);
  const [webSearchConsentGranted, setWebSearchConsentGranted] = useState(() =>
    hasWebSearchConsent(),
  );
  const [pendingWebSearchEnable, setPendingWebSearchEnable] = useState<
    "thread" | "default" | null
  >(null);
  const [threads, setThreads] = useState<ChatThread[]>(() => boot.threads);
  const [activeThreadId, setActiveThreadId] = useState(() => boot.activeThreadId);
  const [messages, setMessages] = useState<ChatMessage[]>(
    () => (bootThread?.messages ?? []) as ChatMessage[],
  );
  const [input, setInput] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [appError, setAppError] = useState<AppUiError | null>(null);
  const [playgroundRateLimits, setPlaygroundRateLimits] = useState<PlaygroundRateLimits | null>(
    null,
  );
  const [bonusChatConfig, setBonusChatConfig] = useState<PlaygroundBonusChatConfig | null>(null);
  const [continueTestingBusy, setContinueTestingBusy] = useState(false);
  const [bonusGrantUsed, setBonusGrantUsed] = useState(false);
  const [sessionApiKeyActive, setSessionApiKeyActive] = useState(() => hasSessionApiKey());
  const [aiHostingUrl, setAiHostingUrl] = useState(DEFAULT_AI_HOSTING_URL);
  const [gridCarbonEnabled, setGridCarbonEnabled] = useState(true);
  const [gridCarbonSummary, setGridCarbonSummary] = useState<GridCarbonSummary | null>(null);
  const [deleteAllChatsOpen, setDeleteAllChatsOpen] = useState(false);
  const [clearBrowserCacheOpen, setClearBrowserCacheOpen] = useState(false);
  const [showModelSettings, setShowModelSettings] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const isMobileLayout = useIsMobileLayout();
  const closeMobileSidebar = useCallback(() => setMobileSidebarOpen(false), []);
  const openMobileSidebar = useCallback(() => setMobileSidebarOpen(true), []);
  const toggleSidebar = useCallback(() => {
    if (isMobileLayout) {
      setMobileSidebarOpen((v) => !v);
    } else {
      setSidebarCollapsed((v) => !v);
    }
  }, [isMobileLayout]);
  const sidebarExpanded = isMobileLayout ? mobileSidebarOpen : !sidebarCollapsed;

  useEffect(() => {
    if (!isMobileLayout) setMobileSidebarOpen(false);
  }, [isMobileLayout]);

  useEffect(() => {
    if (!playgroundRateLimits) return;
    setBonusGrantUsed(isBonusChatGrantUsed(playgroundRateLimits.windowMs));
  }, [playgroundRateLimits]);
  const [themePreference, setThemePreference] = useState<ThemePreference>(() => readThemePreference());
  const [imageLightbox, setImageLightbox] = useState<{ src: string; alt: string } | null>(null);
  const openImageLightbox = useCallback((src: string, alt: string) => {
    setImageLightbox({ src, alt });
  }, []);
  const closeImageLightbox = useCallback(() => setImageLightbox(null), []);
  const abortRef = useRef<AbortController | null>(null);
  const sendLockRef = useRef(false);
  /** Tarifberater: Live-Tarife/Modelle einmal pro Thread laden, dann wiederverwenden. */
  const aiHostingTariffAdvisorSessionRef = useRef<{
    threadId: string;
    data: MittwaldAiHostingTariffAdvisorResponse;
  } | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const speechInputRef = useRef<SpeechInputHandle | null>(null);
  const activeBriefingFieldIdRef = useRef<string | null>(null);
  const [activeBriefingFieldId, setActiveBriefingFieldId] = useState<string | null>(null);
  const inputValueRef = useRef(input);
  const imageFileRef = useRef(imageFile);
  inputValueRef.current = input;
  imageFileRef.current = imageFile;

  const INPUT_MAX_HEIGHT_PX = 208; // entspricht max-h-52
  const [composerTall, setComposerTall] = useState(false);

  const adjustInputHeight = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    const minHeight = isMobileLayout ? 36 : 40;
    el.style.height = "0px";
    const scrollH = el.scrollHeight;
    const next = Math.min(Math.max(scrollH, minHeight), INPUT_MAX_HEIGHT_PX);
    el.style.height = `${next}px`;
    el.style.overflowY = scrollH > INPUT_MAX_HEIGHT_PX ? "auto" : "hidden";
    const tall =
      el.value.length > 0 && (el.value.includes("\n") || scrollH > minHeight + 1);
    setComposerTall((prev) => (prev === tall ? prev : tall));
  }, [isMobileLayout]);

  /** Clipboard-Bild wie in ChatGPT (Capture: greift vor Textfeld, verhindert Müll-Einfügen bei Screenshots). */
  const handleComposerPasteCapture = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      if (busy || speechBusy || webSearchBusy || featureRequestsBusy || aiHostingDocsBusy || aiHostingTariffAdvisorBusy || weekendVisitPhase || priceCompareSearchBusy || voiceRecording.active) {
        return;
      }
      const items = e.clipboardData?.items;
      if (!items?.length) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind !== "file" || !item.type.startsWith("image/")) continue;
        const file = item.getAsFile();
        if (!file || file.size === 0) continue;
        e.preventDefault();
        e.stopPropagation();
        setImageFile(file);
        window.requestAnimationFrame(() => adjustInputHeight());
        inputRef.current?.focus();
        return;
      }
    },
    [adjustInputHeight, busy, speechBusy, webSearchBusy, featureRequestsBusy, aiHostingDocsBusy, aiHostingTariffAdvisorBusy, weekendVisitPhase, priceCompareSearchBusy, voiceRecording.active],
  );
  const modelRef = useRef(model);
  modelRef.current = model;

  const activeThreadWebSearch = useMemo(
    () => threads.find((t) => t.id === activeThreadId)?.webSearchEnabled ?? false,
    [threads, activeThreadId],
  );
  const prevActiveThreadWebSearchRef = useRef(false);

  const sessionCo2Grams = useMemo(() => {
    let sum = 0;
    for (const t of threads) {
      const msgs = (t.id === activeThreadId ? messages : t.messages) as ChatMessage[];
      sum += sumCo2GramsFromAssistantMessages(msgs);
    }
    return sum;
  }, [threads, activeThreadId, messages]);

  const setActiveThreadWebSearch = useCallback(
    (enabled: boolean) => {
      setThreads((prev) =>
        prev.map((t) => (t.id === activeThreadId ? { ...t, webSearchEnabled: enabled } : t)),
      );
    },
    [activeThreadId],
  );

  const applyWebSearchEnable = useCallback(
    (target: "thread" | "default") => {
      if (target === "thread") setActiveThreadWebSearch(true);
      else setWebSearchDefaultEnabled(true);
    },
    [setActiveThreadWebSearch],
  );

  const requestEnableWebSearch = useCallback(
    (target: "thread" | "default") => {
      if (hasWebSearchConsent()) {
        applyWebSearchEnable(target);
        return;
      }
      setPendingWebSearchEnable(target);
      setWebSearchConsentOpen(true);
    },
    [applyWebSearchEnable],
  );

  const confirmWebSearchConsent = useCallback(() => {
    setWebSearchConsent();
    setWebSearchConsentGranted(true);
    setWebSearchConsentOpen(false);
    const target = pendingWebSearchEnable;
    setPendingWebSearchEnable(null);
    if (target) applyWebSearchEnable(target);
  }, [pendingWebSearchEnable, applyWebSearchEnable]);

  const revokeWebSearchConsent = useCallback(() => {
    clearWebSearchConsent();
    setWebSearchConsentGranted(false);
    setWebSearchDefaultEnabled(false);
    setThreads((prev) => prev.map((t) => ({ ...t, webSearchEnabled: false })));
    setWebSearchConsentOpen(false);
    setPendingWebSearchEnable(null);
  }, []);

  const cancelWebSearchConsent = useCallback(() => {
    setWebSearchConsentOpen(false);
    setPendingWebSearchEnable(null);
  }, []);

  const toggleThreadWebSearch = useCallback(() => {
    if (activeThreadWebSearch) {
      setActiveThreadWebSearch(false);
      return;
    }
    requestEnableWebSearch("thread");
  }, [activeThreadWebSearch, setActiveThreadWebSearch, requestEnableWebSearch]);

  const applyPreset = useCallback((modelId: string) => {
    applyPresetToState(modelId, {
      setTemperature,
      setTopP,
      setTopK,
      setPresencePenalty,
      setExtraBody,
      setMaxTokens,
    });
    if (modelId === MODEL_GPT_OSS) {
      setGptOssReasoning("medium");
    }
    if (modelId === MODEL_QWEN_38) {
      setQwen38ThinkingEnabled(true);
      setQwen38ReasoningEffort("low");
    }
    setQwenVisionOcr(false);
  }, []);

  useEffect(() => {
    const sc = chatScrollRef.current;
    if (!sc) return;

    if (messages.length === 0) {
      sc.scrollTop = 0;
      return;
    }

    if (busy || webSearchBusy || featureRequestsBusy || aiHostingDocsBusy || aiHostingTariffAdvisorBusy || weekendVisitPhase || priceCompareSearchBusy) {
      // Während des Streams / Websuche: sofort ans Ende — kein smooth, sonst kämpft die Animation
      // mit wachsendem Inhalt und der Text „springt“.
      const id = requestAnimationFrame(() => {
        sc.scrollTop = sc.scrollHeight;
      });
      return () => cancelAnimationFrame(id);
    }

    const id = requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
    return () => cancelAnimationFrame(id);
  }, [messages, busy, webSearchBusy, featureRequestsBusy, aiHostingDocsBusy, aiHostingTariffAdvisorBusy, weekendVisitPhase, priceCompareSearchBusy]);

  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");

    const resolveDark = () =>
      themePreference === "dark" ||
      (themePreference === "system" && mq.matches);

    const apply = () => {
      const isDark = resolveDark();
      root.classList.toggle("dark", isDark);
      root.style.colorScheme = isDark ? "dark" : "light";
    };

    apply();
    try {
      localStorage.setItem(PLAYGROUND_THEME_STORAGE_KEY, themePreference);
    } catch {
      /* ignore */
    }

    if (themePreference !== "system") return;

    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [themePreference]);

  useEffect(() => {
    document.title = title;
  }, [title]);

  useEffect(() => {
    if (busy) return;
    setThreads((prev) => {
      const next = sortThreadsByRecent(
        prev.map((t) =>
          t.id === activeThreadId
            ? {
                ...t,
                messages,
                title:
                  messages.length > 0
                    ? deriveThreadTitle(messages as ChatMessage[])
                    : "Neuer Chat",
                updatedAt: Date.now(),
              }
            : t,
        ),
      );
      savePlaygroundState({
        v: 3,
        activeThreadId,
        threads: next,
        model,
        temperature,
        topP,
        topK,
        presencePenalty,
        extraBody,
        gptOssReasoning,
        qwen38ThinkingEnabled,
        qwen38ReasoningEffort,
        maxTokens,
        systemPrompt,
        qwenVisionOcr,
        webSearchDefaultEnabled,
      });
      return next;
    });
  }, [
    messages,
    activeThreadId,
    busy,
    model,
    temperature,
    topP,
    topK,
    presencePenalty,
    extraBody,
    gptOssReasoning,
    qwen38ThinkingEnabled,
    qwen38ReasoningEffort,
    maxTokens,
    systemPrompt,
    qwenVisionOcr,
    webSearchDefaultEnabled,
  ]);

  useEffect(() => {
    (async () => {
      try {
        const [cfgRes, modRes] = await Promise.all([
          fetch(apiUrl("/api/config")),
          fetch(apiUrl("/api/models")),
        ]);
        if (cfgRes.ok) {
          const c = (await cfgRes.json()) as {
            title?: string;
            maxMessages?: number;
            rateLimits?: PlaygroundRateLimits;
            bonusChat?: PlaygroundBonusChatConfig;
            aiHostingUrl?: string;
            gridCarbon?: { enabled?: boolean };
            speechToText?: {
              enabled?: boolean;
              model?: string;
              language?: string;
              maxAudioBytes?: number;
            };
          };
          if (c.title) setTitle(c.title);
          if (c.rateLimits) setPlaygroundRateLimits(c.rateLimits);
          if (c.bonusChat) setBonusChatConfig(c.bonusChat);
          if (typeof c.aiHostingUrl === "string" && c.aiHostingUrl.trim()) {
            setAiHostingUrl(c.aiHostingUrl.trim());
          }
          if (c.gridCarbon && c.gridCarbon.enabled === false) {
            setGridCarbonEnabled(false);
          }
          if (typeof c.maxMessages === "number" && c.maxMessages >= 4) {
            setMaxMessages(c.maxMessages);
          }
          if (c.speechToText) {
            setSpeechToText({
              enabled: c.speechToText.enabled !== false,
              model: c.speechToText.model ?? "whisper-large-v3-turbo",
              language: c.speechToText.language ?? "de",
              maxAudioBytes: c.speechToText.maxAudioBytes ?? 25 * 1024 * 1024,
            });
          }
          const cWeb = (c as { webSearch?: WebSearchConfig }).webSearch;
          if (cWeb?.enabled) setWebSearchConfig(cWeb);
          const cLinks = (c as { links?: PlaygroundLink[] }).links;
          if (Array.isArray(cLinks)) setPlaygroundLinks(cLinks);
        }
        if (!modRes.ok) {
          const t = await modRes.text();
          throw new Error(t.slice(0, 400));
        }
        const m = (await modRes.json()) as { data?: { id: string }[] };
        const list = m.data ?? [];
        setModels(list);
        const current = modelRef.current;
        if (list.length && !list.some((x) => x.id === current)) {
          const next = pickFreeChatDefaultModel(list);
          if (next) {
            applyPreset(next);
            setModel(next);
          }
        }
      } catch (e) {
        console.error(e);
        setModels([]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- nur einmal beim Mount
  }, []);

  useEffect(() => {
    if (!gridCarbonEnabled) return;
    let cancelled = false;
    const load = () => {
      void fetchGridCarbonSummary()
        .then((s) => {
          if (!cancelled) setGridCarbonSummary(s);
        })
        .catch((e) => {
          console.error(e);
        });
    };
    load();
    const id = window.setInterval(load, gridCarbonRefreshIntervalMs());
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [gridCarbonEnabled]);

  useEffect(() => {
    adjustInputHeight();
  }, [input, adjustInputHeight]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }
    if (isAudioUploadFile(imageFile)) {
      setImagePreview(null);
      return;
    }
    const isPdf =
      imageFile.type === "application/pdf" ||
      imageFile.name.toLowerCase().endsWith(".pdf");
    if (isPdf) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  useEffect(() => {
    if (!imageFile || !isAudioUploadFile(imageFile)) {
      setAudioFileDurationSec(null);
      return;
    }
    let cancelled = false;
    void getBlobDurationSeconds(imageFile)
      .then((d) => {
        if (!cancelled) setAudioFileDurationSec(d);
      })
      .catch(() => {
        if (!cancelled) setAudioFileDurationSec(null);
      });
    return () => {
      cancelled = true;
    };
  }, [imageFile]);

  const attachmentIsPdf = useMemo(() => {
    if (!imageFile) return false;
    return (
      imageFile.type === "application/pdf" ||
      imageFile.name.toLowerCase().endsWith(".pdf")
    );
  }, [imageFile]);

  const attachmentIsAudio = useMemo(
    () => (imageFile ? isAudioUploadFile(imageFile) : false),
    [imageFile],
  );

  const isInvoiceOcrUseCase = activeUseCaseId === "invoice-ocr";
  const isAudioTranscribeUseCase = activeUseCaseId === "audio-transcribe";
  const isModelCompareUseCase = activeUseCaseId === "model-compare";
  const isAiHostingGuideUseCase = activeUseCaseId === "ai-hosting-guide";
  const isAiHostingTariffAdvisorUseCase = activeUseCaseId === "ai-hosting-tarifberater";
  const isClientWeekendUseCase = activeUseCaseId === "client-weekend";
  const isPriceCompareUseCase = activeUseCaseId === "price-compare";
  const isSemanticSearchUseCase = activeUseCaseId === "semantic-search";
  const isTextToSpeechUseCase = activeUseCaseId === "text-to-speech";
  const isNetworkPathCheckUseCase = activeUseCaseId === "network-path-check";
  const isGridCarbonForecastUseCase = activeUseCaseId === "grid-carbon-forecast";
  const aiHostingGuideComposerProgress = useMemo(() => {
    if (!isAiHostingGuideUseCase || messages.length === 0) return null;
    const last = messages[messages.length - 1];
    if (last.role !== "assistant" || typeof last.content !== "string") return null;
    const guideGenerating = !aiHostingDocsBusy && busy && last.content === "";
    if (!aiHostingDocsBusy && !guideGenerating) return null;
    return getAiHostingGuideProgressSteps(aiHostingDocsBusy, guideGenerating);
  }, [isAiHostingGuideUseCase, messages, aiHostingDocsBusy, busy]);
  const aiHostingTariffAdvisorComposerProgress = useMemo(() => {
    if (!isAiHostingTariffAdvisorUseCase || messages.length === 0) return null;
    const last = messages[messages.length - 1];
    if (last.role !== "assistant" || typeof last.content !== "string") return null;
    const advisoryGenerating = !aiHostingTariffAdvisorBusy && busy && last.content === "";
    if (!aiHostingTariffAdvisorBusy && !advisoryGenerating) return null;
    return getAiHostingTariffAdvisorProgressSteps(
      aiHostingTariffAdvisorBusy,
      advisoryGenerating,
    );
  }, [isAiHostingTariffAdvisorUseCase, messages, aiHostingTariffAdvisorBusy, busy]);
  const clientWeekendComposerProgress = useMemo(() => {
    if (!isClientWeekendUseCase || messages.length === 0) return null;
    if (weekendVisitPhase == null && !busy) return null;
    const last = messages[messages.length - 1];
    if (last.role !== "assistant" || typeof last.content !== "string") return null;
    const generating = !weekendVisitPhase && busy && last.content === "";
    if (!weekendVisitPhase && !generating) return null;
    return getWeekendVisitProgressSteps(
      weekendVisitPhase ?? (generating ? "generate" : null),
    );
  }, [isClientWeekendUseCase, messages, weekendVisitPhase, busy]);
  const priceCompareComposerProgress = useMemo(() => {
    if (!isPriceCompareUseCase || messages.length === 0) return null;
    if (!priceCompareSearchBusy && priceCompareRound == null && !busy) return null;
    const last = messages[messages.length - 1];
    if (last.role !== "assistant" || typeof last.content !== "string") return null;
    const searching = priceCompareSearchBusy || priceCompareRound != null;
    const generating = !searching && busy && last.content === "";
    if (!searching && !generating) return null;
    return getPriceCompareProgressSteps(
      searching ? priceCompareRound ?? { round: 1, total: 4 } : null,
      generating,
    );
  }, [isPriceCompareUseCase, messages, priceCompareRound, priceCompareSearchBusy, busy]);
  const semanticSearchComposerProgress = useMemo(() => {
    if (!isSemanticSearchUseCase || messages.length === 0) return null;
    if (semanticSearchPhase == null && !busy) return null;
    const last = messages[messages.length - 1];
    if (last.role !== "assistant" || typeof last.content !== "string") return null;
    if (!semanticSearchPhase && !(busy && last.content.length > 0)) return null;
    return getSemanticSearchProgressSteps(semanticSearchPhase);
  }, [isSemanticSearchUseCase, messages, semanticSearchPhase, busy]);
  const semanticSearchProgressDetail = semanticSearchProgress?.detail ?? null;
  const audioTranscribeComposerProgress = useMemo(() => {
    if (!isAudioTranscribeUseCase || messages.length === 0) return null;
    if (audioTranscribePhase == null && !busy) return null;
    const last = messages[messages.length - 1];
    if (last.role !== "assistant" || typeof last.content !== "string") return null;
    const preparing = audioTranscribeProgress?.phase === "prepare";
    const transcribing =
      audioTranscribePhase === "transcribe" && audioTranscribeProgress?.phase !== "prepare";
    const formatting =
      audioTranscribePhase === "format" ||
      (!transcribing && !preparing && busy && last.content === "");
    if (!preparing && !transcribing && !formatting) return null;
    const chunk =
      audioTranscribeProgress?.chunk != null && audioTranscribeProgress.total != null
        ? { current: audioTranscribeProgress.chunk, total: audioTranscribeProgress.total }
        : null;
    return getAudioTranscribeProgressSteps(transcribing, formatting, chunk, preparing);
  }, [
    isAudioTranscribeUseCase,
    messages,
    audioTranscribePhase,
    audioTranscribeProgress,
    busy,
  ]);
  const audioTranscribeProgressDetail = useMemo(
    () => formatAudioTranscribeProgressDetail(audioTranscribeProgress, audioTranscribePhase),
    [audioTranscribeProgress, audioTranscribePhase],
  );
  const ocrPipelineBusy = ocrProgress !== null;
  const audioPipelineBusy = audioTranscribePhase !== null;
  const semanticSearchPipelineBusy = semanticSearchPhase !== null;
  const attachmentPipelineBusy = ocrPipelineBusy || audioPipelineBusy;
  const ttsPipelineBusy = ttsPhase !== null;
  const composerPipelineBusy =
    attachmentPipelineBusy || semanticSearchPipelineBusy || ttsPipelineBusy;
  const attachmentPipelineStatus = audioPipelineBusy
    ? audioTranscribeProgress
      ? audioTranscribeStatusLine(audioTranscribeProgress)
      : speechTranscribeStatus ??
        (audioTranscribePhase === "format"
          ? "Qwen bereinigt Volltranskript …"
          : "Transkribiere …")
    : ocrProgress ?? "Rechnung wird verarbeitet …";
  const composerPipelineStatus = ttsPipelineBusy
    ? "Qwen3-TTS synthetisiert Audio …"
    : semanticSearchPipelineBusy
      ? semanticSearchProgress?.detail
        ? `${semanticSearchProgress.message} — ${semanticSearchProgress.detail}`
        : semanticSearchProgress?.message ?? "Semantische Suche …"
      : attachmentPipelineStatus;

  const composerFileAccept = useMemo(() => {
    if (activeUseCase?.prefersAudioFile) return AUDIO_FILE_ACCEPT;
    if (activeUseCase?.prefersDocument) return "image/*,application/pdf,.pdf";
    return "image/*";
  }, [activeUseCase?.prefersAudioFile, activeUseCase?.prefersDocument]);

  const speechTranscribing = speechBusy && !voiceRecording.active;

  const focusComposer = useCallback(() => {
    if (voiceRecording.active || speechTranscribing || ocrPipelineBusy || audioPipelineBusy) return;
    window.requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus({ preventScroll: true });
      adjustInputHeight();
    });
  }, [adjustInputHeight, ocrPipelineBusy, audioPipelineBusy, speechTranscribing, voiceRecording.active]);

  const composerPlaceholder = useMemo(() => {
    if (activeUseCase) return activeUseCase.composerPlaceholder;
    return isMobileLayout
      ? "Nachricht…"
      : "Stelle irgendeine Frage (Bild: einfügen oder +)";
  }, [activeUseCase, isMobileLayout]);

  const sendButtonTitle = activeUseCase?.sendButtonLabel ?? "Senden";

  const showSpeechInComposer =
    speechToText?.enabled && !activeUseCase?.prefersAudioFile;

  const semanticSearchPassageCount = useMemo(
    () => parseSemanticSearchPassages(briefingValues.passagen ?? "").length,
    [briefingValues.passagen],
  );

  const canSend = useMemo(() => {
    const t = input.trim();
    const hasFile = imageFile !== null;
    const hasBriefing = hasBriefingContent(activeUseCase?.briefingFields, briefingValues);
    const contentOk = isInvoiceOcrUseCase
      ? hasFile
      : isAudioTranscribeUseCase
        ? attachmentIsAudio
        : isSemanticSearchUseCase
          ? semanticSearchPassageCount >= 2 && t.length > 0
          : isTextToSpeechUseCase
            ? t.length > 0
            : hasBriefing || t.length > 0 || hasFile;
    return (
      contentOk &&
      !busy &&
      !webSearchBusy &&
      !featureRequestsBusy &&
      !aiHostingDocsBusy &&
      !aiHostingTariffAdvisorBusy &&
      !weekendVisitPhase &&
      !priceCompareSearchBusy &&
      !voiceRecording.active &&
      !speechTranscribing &&
      !ocrPipelineBusy &&
      !audioPipelineBusy &&
      !semanticSearchPipelineBusy &&
      !ttsPipelineBusy
    );
  }, [
    input,
    imageFile,
    briefingValues,
    activeUseCase?.briefingFields,
    busy,
    webSearchBusy,
    featureRequestsBusy,
    aiHostingDocsBusy,
    aiHostingTariffAdvisorBusy,
    weekendVisitPhase,
    priceCompareSearchBusy,
    voiceRecording.active,
    speechTranscribing,
    ocrPipelineBusy,
    audioPipelineBusy,
    semanticSearchPipelineBusy,
    ttsPipelineBusy,
    isInvoiceOcrUseCase,
    isAudioTranscribeUseCase,
    isSemanticSearchUseCase,
    isTextToSpeechUseCase,
    semanticSearchPassageCount,
    attachmentIsAudio,
  ]);

  const composerTextareaVisible =
    !voiceRecording.active &&
    !speechTranscribing &&
    !ocrPipelineBusy &&
    !audioPipelineBusy &&
    !semanticSearchPipelineBusy &&
    !ttsPipelineBusy;
  const composerTextareaWasHiddenRef = useRef(false);
  useEffect(() => {
    if (!composerTextareaVisible) {
      composerTextareaWasHiddenRef.current = true;
      return;
    }
    if (composerTextareaWasHiddenRef.current) {
      composerTextareaWasHiddenRef.current = false;
      focusComposer();
    }
  }, [composerTextareaVisible, focusComposer]);

  const handleVoiceRecordingChange = useCallback((active: boolean, stream: MediaStream | null) => {
    setVoiceRecording({ active, stream });
  }, []);

  const handleSpeechTranscript = useCallback(
    (text: string) => {
      const briefingFields = activeUseCase?.briefingFields;
      const fieldId = activeBriefingFieldIdRef.current;
      if (briefingFields?.length && fieldId) {
        setBriefingValues((prev) => {
          const cur = prev[fieldId]?.trim() ?? "";
          const next = !cur ? text : `${cur} ${text}`;
          return { ...prev, [fieldId]: next };
        });
        return;
      }

      setInput((prev) => {
        const next =
          activeUseCase?.prefersLongSpeech || !prev.trim()
            ? text
            : `${prev.trimEnd()} ${text}`;
        inputValueRef.current = next;
        return next;
      });
      window.requestAnimationFrame(() => {
        adjustInputHeight();
        inputRef.current?.focus();
      });
    },
    [activeUseCase?.briefingFields, activeUseCase?.prefersLongSpeech, adjustInputHeight],
  );

  const handleSpeechTranscriptSegment = useCallback(
    (_segment: string, fullText: string) => {
      setInput(fullText);
      inputValueRef.current = fullText;
      window.requestAnimationFrame(() => adjustInputHeight());
    },
    [adjustInputHeight],
  );

  const handleSpeechTranscribeProgress = useCallback((progress: TranscribeProgress | null) => {
    if (!progress) {
      setSpeechTranscribeStatus(null);
      return;
    }
    if (progress.phase === "segment") {
      setSpeechTranscribeStatus(`Transkribiere Besprechungs-Abschnitt ${progress.chunk} …`);
      return;
    }
    setSpeechTranscribeStatus(`Transkribiere Teil ${progress.chunk} von ${progress.total} …`);
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setBusy(false);
    setWebSearchBusy(false);
    setAiHostingTariffAdvisorBusy(false);
    setWeekendVisitPhase(null);
    setPriceCompareSearchBusy(false);
    setPriceCompareRound(null);
  }, []);

  const changeModel = useCallback(
    (modelId: string) => {
      if (busy || webSearchBusy || featureRequestsBusy || aiHostingDocsBusy || aiHostingTariffAdvisorBusy || weekendVisitPhase || priceCompareSearchBusy) stop();
      if (modelId !== model) setModel(modelId);
      applyPreset(modelId);
    },
    [applyPreset, busy, model, stop, webSearchBusy, featureRequestsBusy, aiHostingDocsBusy, aiHostingTariffAdvisorBusy, weekendVisitPhase, priceCompareSearchBusy],
  );

  useEffect(() => {
    const wasOff = !prevActiveThreadWebSearchRef.current;
    prevActiveThreadWebSearchRef.current = activeThreadWebSearch;
    if (!wasOff || !activeThreadWebSearch) return;
    if (!models.some((m) => m.id === MODEL_QWEN_35)) return;
    changeModel(MODEL_QWEN_35);
  }, [activeThreadWebSearch, models, changeModel]);

  const clearUseCase = useCallback(() => {
    aiHostingTariffAdvisorSessionRef.current = null;
    setActiveUseCaseId(null);
    setActiveModelFallback(null);
    setSystemPrompt("");
    setBriefingValues({});
    activeBriefingFieldIdRef.current = null;
    setActiveBriefingFieldId(null);
    const next = pickFreeChatDefaultModel(models);
    if (next && next !== model) changeModel(next);
  }, [changeModel, model, models]);

  const handleBriefingChange = useCallback((id: string, value: string) => {
    setBriefingValues((prev) => ({ ...prev, [id]: value }));
  }, []);

  const handleBriefingFieldFocus = useCallback((id: string) => {
    activeBriefingFieldIdRef.current = id;
    setActiveBriefingFieldId(id);
  }, []);

  const activateUseCase = useCallback(
    (id: PlaygroundUseCaseId) => {
      const uc = getUseCaseById(id);
      if (!uc) return;
      trackPlaygroundUseCaseStart(uc);
      stop();
      setAppError(null);
      setContextTrimNotice(null);
      setActiveModelFallback(null);
      aiHostingTariffAdvisorSessionRef.current = null;
      setActiveUseCaseId(id);
      setMessages([]);
      setImageFile(null);
      if (uc.prefersWebSearch) {
        requestEnableWebSearch("thread");
      } else {
        setActiveThreadWebSearch(false);
        if (!uc.prefersTextToSpeech) {
          changeModel(uc.modelId);
        }
      }
      if (uc.defaultCompareModelB) setCompareModelB(uc.defaultCompareModelB);
      setSystemPrompt(uc.systemPrompt);
      if (uc.briefingFields?.length) {
        const values = emptyBriefingValues(uc.briefingFields);
        if (uc.id === "semantic-search") {
          values.passagen = formatSemanticSearchPassagesText(SEMANTIC_SEARCH_DEMO_PASSAGES);
          setInput(SEMANTIC_SEARCH_DEMO_QUESTION);
          inputValueRef.current = SEMANTIC_SEARCH_DEMO_QUESTION;
        } else {
          setInput("");
          inputValueRef.current = "";
        }
        setBriefingValues(values);
        const firstId = uc.briefingFields[0]?.id ?? null;
        activeBriefingFieldIdRef.current = firstId;
        setActiveBriefingFieldId(firstId);
      } else {
        setBriefingValues({});
        activeBriefingFieldIdRef.current = null;
        setActiveBriefingFieldId(null);
        const starter = uc.starterInput ?? "";
        setInput(starter);
        inputValueRef.current = starter;
      }
      window.requestAnimationFrame(() => {
        adjustInputHeight();
        inputRef.current?.focus();
      });
    },
    [adjustInputHeight, changeModel, requestEnableWebSearch, setActiveThreadWebSearch, stop],
  );

  const openGridCarbonForecastUseCase = useCallback(() => {
    if (activeUseCaseId === "grid-carbon-forecast") return;
    activateUseCase("grid-carbon-forecast");
  }, [activeUseCaseId, activateUseCase]);

  const newChat = useCallback(() => {
    stop();
    setAppError(null);
    setContextTrimNotice(null);
    setInput("");
    setImageFile(null);
    clearUseCase();

    if (messages.length === 0) {
      closeMobileSidebar();
      return;
    }

    const fresh = createEmptyThread(webSearchDefaultEnabled);
    const withCurrent = threads.map((t) =>
      t.id === activeThreadId
        ? {
            ...t,
            messages,
            title: deriveThreadTitle(messages as ChatMessage[]),
            updatedAt: Date.now(),
          }
        : t,
    );
    const pruned = withCurrent.filter((t) => threadHasMessages(t, activeThreadId, messages));
    setThreads(sortThreadsByRecent([fresh, ...pruned]));
    setActiveThreadId(fresh.id);
    setMessages([]);
    closeMobileSidebar();
  }, [activeThreadId, clearUseCase, closeMobileSidebar, messages, stop, threads, webSearchDefaultEnabled]);

  const goToDashboard = useCallback(() => {
    if (busy || speechBusy) return;
    newChat();
    window.requestAnimationFrame(() => {
      chatScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    });
  }, [busy, newChat, speechBusy]);

  const selectThread = useCallback(
    (id: string) => {
      if (id === activeThreadId) return;
      stop();
      setAppError(null);
      setContextTrimNotice(null);

      /** Gleiche Merge-Logik wie im Persist-Effekt — vor setState berechnen (React batched Updates). */
      const mergeActiveIntoList = (list: ChatThread[]) =>
        sortThreadsByRecent(
          list.map((t) =>
            t.id === activeThreadId
              ? {
                  ...t,
                  messages,
                  title:
                    messages.length > 0
                      ? deriveThreadTitle(messages as ChatMessage[])
                      : t.title,
                  updatedAt: Date.now(),
                }
              : t,
          ),
        );

      const updated = mergeActiveIntoList(threads);
      const nextMessages = (updated.find((t) => t.id === id)?.messages ?? []) as ChatMessage[];

      setThreads(updated);
      setActiveThreadId(id);
      setMessages(nextMessages);
      closeMobileSidebar();
    },
    [activeThreadId, closeMobileSidebar, messages, stop, threads],
  );

  const deleteThread = useCallback(
    (id: string) => {
      if (busy) return;
      stop();

      const mergeActiveIntoList = (list: ChatThread[]) =>
        sortThreadsByRecent(
          list.map((t) =>
            t.id === activeThreadId
              ? {
                  ...t,
                  messages,
                  title:
                    messages.length > 0
                      ? deriveThreadTitle(messages as ChatMessage[])
                      : t.title,
                  updatedAt: Date.now(),
                }
              : t,
          ),
        );

      const withCurrent = mergeActiveIntoList(threads);
      let filtered = withCurrent.filter((t) => t.id !== id);
      if (filtered.length === 0) filtered = [createEmptyThread()];
      const sorted = sortThreadsByRecent(filtered);

      let nextActive = activeThreadId;
      let nextMessages: ChatMessage[] = [];
      if (id === activeThreadId || !sorted.some((t) => t.id === activeThreadId)) {
        nextActive = sorted[0].id;
        nextMessages = sorted[0].messages as ChatMessage[];
      } else {
        nextMessages = (sorted.find((t) => t.id === activeThreadId)?.messages ??
          []) as ChatMessage[];
      }

      setThreads(sorted);
      setActiveThreadId(nextActive);
      setMessages(nextMessages);
      setAppError(null);
      setContextTrimNotice(null);
    },
    [activeThreadId, busy, messages, stop, threads],
  );

  const deleteAllChats = useCallback(() => {
    if (busy) return;
    stop();
    setAppError(null);
    setContextTrimNotice(null);
    setInput("");
    setImageFile(null);
    setDeleteAllChatsOpen(false);
    const fresh = createEmptyThread(webSearchDefaultEnabled);
    setThreads([fresh]);
    setActiveThreadId(fresh.id);
    setMessages([]);
  }, [busy, stop, webSearchDefaultEnabled]);

  const clearBrowserCache = useCallback(() => {
    if (busy) return;
    stop();
    setClearBrowserCacheOpen(false);
    clearPlaygroundBrowserStorage();
    closeMobileSidebar();
    window.location.reload();
  }, [busy, closeMobileSidebar, stop]);

  const handleSaveSessionApiKey = useCallback((key: string) => {
    const trimmed = key.trim();
    if (trimmed.length < 8) {
      setAppError({
        kind: "plain",
        message: "Bitte einen gültigen mittwald API-Key eingeben.",
      });
      return;
    }
    setSessionApiKey(trimmed);
    setSessionApiKeyActive(true);
    setAppError(null);
  }, []);

  const handleClearSessionApiKey = useCallback(() => {
    clearSessionApiKey();
    setSessionApiKeyActive(false);
  }, []);

  const handleContinueTesting = useCallback(async () => {
    setContinueTestingBusy(true);
    try {
      await grantBonusChatRequests();
      const windowMs = playgroundRateLimits?.windowMs ?? 900_000;
      markBonusChatGrantUsed(windowMs);
      setBonusGrantUsed(true);
      setAppError(null);
    } catch (e) {
      setAppError(appErrorFromUnknown(e, playgroundRateLimits));
    } finally {
      setContinueTestingBusy(false);
    }
  }, [playgroundRateLimits]);

  const send = useCallback(async (options?: { force?: boolean }) => {
    const textNow = inputValueRef.current.trim();
    const invoiceOcr = activeUseCaseId === "invoice-ocr";
    const audioTranscribe = activeUseCaseId === "audio-transcribe";
    const textToSpeech = activeUseCaseId === "text-to-speech";
    const semanticSearch = activeUseCaseId === "semantic-search";
    const hasBriefing = hasBriefingContent(activeUseCase?.briefingFields, briefingValues);
    const hasContent = invoiceOcr
      ? imageFileRef.current !== null
      : audioTranscribe
        ? imageFileRef.current !== null && isAudioUploadFile(imageFileRef.current)
        : semanticSearch
          ? parseSemanticSearchPassages(briefingValues.passagen ?? "").length >= 2 &&
            textNow.length > 0
          : textToSpeech
            ? textNow.length > 0
            : hasBriefing || textNow.length > 0 || imageFileRef.current !== null;
    if (!options?.force && !canSend) return;
    if (options?.force && (!hasContent || busy || speechBusy || webSearchBusy || featureRequestsBusy || aiHostingDocsBusy || aiHostingTariffAdvisorBusy || weekendVisitPhase || priceCompareSearchBusy || ocrPipelineBusy || audioPipelineBusy || semanticSearchPipelineBusy || ttsPipelineBusy))
      return;
    if (sendLockRef.current) return;

    sendLockRef.current = true;
    try {
    setAppError((prev) => (prev?.kind === "rate_limit" ? prev : null));
    let text = textNow;
    if (
      activeUseCaseId !== "semantic-search" &&
      activeUseCaseId !== "text-to-speech" &&
      activeUseCase?.briefingFields?.length
    ) {
      const composed = composeBriefingText(activeUseCase.briefingFields, briefingValues);
      text = textNow ? `${composed}\n\nZusatz:\n${textNow}` : composed;
    }
    const file = imageFile;
    const messagesBeforeSend = messages;

    if (activeUseCaseId === "model-compare") {
      const modelA = model;
      const modelB = compareModelB;
      if (modelA === modelB) {
        setAppError({
          kind: "plain",
          message: "Bitte zwei verschiedene Modelle wählen (A und B).",
        });
        return;
      }

      let userContent: string | ContentPart[];
      if (file) {
        const dataUrl = await encodeImageFile(file);
        const parts: ContentPart[] = [];
        const visionText = text.length > 0 ? text : "Beschreibe dieses Bild kurz.";
        parts.push({ type: "text", text: visionText });
        parts.push({ type: "image_url", image_url: { url: dataUrl } });
        userContent = parts;
      } else {
        if (!text) return;
        userContent = text;
      }

      const ctrl = new AbortController();
      abortRef.current = ctrl;

      const userMessage: ChatMessage = { role: "user", content: userContent };
      const nextThread = [...messagesBeforeSend, userMessage];
      const compareAssistant: ChatMessage = {
        role: "assistant",
        content: "",
        compare: {
          modelA: { modelId: modelA, content: "" },
          modelB: { modelId: modelB, content: "" },
        },
      };

      setInput("");
      setImageFile(null);
      inputValueRef.current = "";
      setMessages([...nextThread, compareAssistant]);
      setBusy(true);
      trackPlaygroundUseCaseSend(activeUseCase);
      focusComposer();

      const hasVision =
        Array.isArray(userContent) &&
        userContent.some((p) => p.type === "image_url");

      const appendCompareDelta = (side: "a" | "b", delta: string) => {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (!last?.compare) return prev;
          const slot = side === "a" ? "modelA" : "modelB";
          const prevText =
            typeof last.compare[slot].content === "string"
              ? last.compare[slot].content
              : assistantMessagePlainText(last.compare[slot].content);
          const copy = prev.slice();
          copy[copy.length - 1] = {
            ...last,
            compare: {
              ...last.compare,
              [slot]: {
                ...last.compare[slot],
                content: prevText + delta,
              },
            },
          };
          return copy;
        });
      };

      const deltaBatchA = createRafStreamBatcher((chunk) => {
        if (chunk.length > 0) appendCompareDelta("a", chunk);
      });
      const deltaBatchB = createRafStreamBatcher((chunk) => {
        if (chunk.length > 0) appendCompareDelta("b", chunk);
      });

      const streamStart = performance.now();
      let firstContentAt: number | null = null;

      const runSide = async (side: "a" | "b", modelId: string) => {
        const historyForApi = [...nextThread];
        let apiMessages = buildCompareApiMessages({
          history: historyForApi,
          targetModelId: modelId,
          modelAId: modelA,
          modelBId: modelB,
          systemPrompt,
          gptOssReasoning,
          todayContext: formatPlaygroundBaseSystemContext({
            includeCo2Guide: isPlaygroundCo2Question(
              typeof userContent === "string" ? userContent : text,
            ),
            includeAuthorGuide: isPlaygroundAuthorQuestion(
              typeof userContent === "string" ? userContent : text,
            ),
          }),
        });

        const { messages: trimmed, trimmedCount } = trimMessagesForApi(apiMessages, maxMessages);
        apiMessages = trimmed;
        if (trimmedCount > 0) {
          setContextTrimNotice(
            `Langer Chatverlauf: ${trimmedCount} ältere Nachricht${trimmedCount === 1 ? "" : "en"} werden nicht mehr an die KI gesendet (Limit ${maxMessages}).`,
          );
        } else {
          setContextTrimNotice(null);
        }

        const params = inferenceParamsForCompareModel(
          modelId,
          hasVision,
          qwenVisionOcr,
          maxTokens,
          isQwen38Model(modelId)
            ? { thinkingEnabled: qwen38ThinkingEnabled, reasoningEffort: qwen38ReasoningEffort }
            : undefined,
        );
        const body = buildCompareChatBody(modelId, apiMessages, params);
        const batch = side === "a" ? deltaBatchA : deltaBatchB;

        const usageSnap = await streamChatCompletion(
          body,
          (delta) => {
            if (delta.length > 0) {
              firstContentAt ??= performance.now();
              batch.push(delta);
            }
          },
          ctrl.signal,
          playgroundRateLimits,
        );
        batch.flush();
        return { side, usageSnap, modelId };
      };

      try {
        const [resultA, resultB] = await Promise.all([
          runSide("a", modelA),
          runSide("b", modelB),
        ]);

        const streamEnd = performance.now();
        const genSec =
          firstContentAt != null
            ? Math.max((streamEnd - firstContentAt) / 1000, 0.001)
            : Math.max((streamEnd - streamStart) / 1000, 0.001);

        const finalizeSide = (
          side: "a" | "b",
          usageSnap: TokenMeter | null,
          modelId: string,
        ) => {
          const hasApiCounts =
            usageSnap != null &&
            (usageSnap.promptTokens != null || usageSnap.completionTokens != null);
          const slot = side === "a" ? "modelA" : "modelB";
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (!last?.compare) return prev;
            const content = last.compare[slot].content;
            const len = assistantPlainTextLength(content);
            const roughOutTok = Math.max(1, Math.ceil(len / 4));
            let outputTokensPerSec: number | null = null;
            const comp = usageSnap?.completionTokens;
            if (typeof comp === "number") {
              outputTokensPerSec = Math.round((comp / genSec) * 10) / 10;
            } else if (len > 0) {
              outputTokensPerSec = Math.round((roughOutTok / genSec) * 10) / 10;
            }
            const co2Grams = hasApiCounts
              ? estimateInferenceCo2Grams(
                  usageSnap?.promptTokens ?? 0,
                  usageSnap?.completionTokens ?? 0,
                  modelId,
                )
              : estimateInferenceCo2Grams(0, roughOutTok, modelId);
            const prevSlot = last.compare![slot];
            const cleanedContent =
              typeof prevSlot.content === "string"
                ? stripHallucinatedCo2FromAssistantText(prevSlot.content)
                : prevSlot.content;
            const copy = prev.slice();
            copy[copy.length - 1] = {
              ...last,
              compare: {
                ...last.compare!,
                [slot]: {
                  ...prevSlot,
                  content: cleanedContent,
                  usage: {
                    promptTokens: usageSnap?.promptTokens ?? null,
                    completionTokens: usageSnap?.completionTokens ?? null,
                    outputTokensPerSec,
                    generationSeconds: genSec,
                    co2Grams,
                    source: hasApiCounts ? "api" : "heuristic",
                  },
                },
              },
            };
            return copy;
          });
        };

        finalizeSide("a", resultA.usageSnap as TokenMeter | null, modelA);
        finalizeSide("b", resultB.usageSnap as TokenMeter | null, modelB);
      } catch (e) {
        deltaBatchA.cancel();
        deltaBatchB.cancel();
        const sendErr = appErrorFromSendFailure(e, playgroundRateLimits);
        if (sendErr) setAppError(sendErr);
        setMessages((prev) => {
          if (prev.length === 0) return prev;
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last.compare) {
            const emptyA = assistantMessagePlainText(last.compare.modelA.content).trim() === "";
            const emptyB = assistantMessagePlainText(last.compare.modelB.content).trim() === "";
            if (emptyA && emptyB) return prev.slice(0, -1);
          }
          return prev;
        });
      } finally {
        setBusy(false);
        abortRef.current = null;
        focusComposer();
      }
      return;
    }

    if (textToSpeech) {
      const spokenText = textNow.trim();
      if (!spokenText) {
        setAppError({ kind: "plain", message: "Bitte Text zum Vorlesen ins Eingabefeld schreiben." });
        return;
      }

      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const ttsParams = resolveTtsFromBriefing({ ...briefingValues, text: spokenText });
      if (!ttsParams.input) {
        setAppError({ kind: "plain", message: "Text zum Vorlesen fehlt." });
        return;
      }
      if (ttsParams.input.length > TTS_MAX_INPUT_CHARS) {
        setAppError({
          kind: "plain",
          message: `Text zu lang (max. ${TTS_MAX_INPUT_CHARS} Zeichen laut Doku/Server).`,
        });
        return;
      }
      const { voice, language, speed, responseFormat: format, instructions, prepared } = ttsParams;
      const userMessage: ChatMessage = {
        role: "user",
        content: spokenText,
        playgroundUseCaseId: "text-to-speech",
      };
      const nextThread = [...messagesBeforeSend, userMessage];
      setMessages([...nextThread, { role: "assistant", content: "", playgroundUseCaseId: "text-to-speech" }]);
      setBusy(true);
      setTtsPhase("synthesize");
      trackPlaygroundUseCaseSend(activeUseCase);
      setInput("");
      inputValueRef.current = "";

      try {
        const { blob, mimeType, fileName } = await synthesizeSpeech({
          input: ttsParams.input,
          voice,
          language,
          speed,
          responseFormat: format,
          instructions,
          rateLimits: playgroundRateLimits,
          signal: ctrl.signal,
        });
        const audioBase64 = await blobToBase64(blob);
        const ttsResult: TtsResultPayload = {
          audioBase64,
          mimeType,
          fileName,
          voice,
          language,
          speed,
          format,
          inputChars: ttsParams.input.length,
          preparedInput: prepared,
        };
        const assistantContent = buildTtsResultMarkdown({
          voice,
          language,
          speed,
          format,
          inputChars: ttsParams.input.length,
          fileName,
          preparedInput: prepared,
        });
        setMessages((prev) => {
          const copy = prev.slice();
          const last = copy[copy.length - 1];
          if (last?.role === "assistant") {
            copy[copy.length - 1] = {
              role: "assistant",
              content: assistantContent,
              playgroundUseCaseId: "text-to-speech",
              ttsResult,
            };
          }
          return copy;
        });
      } catch (e) {
        const sendErr = appErrorFromSendFailure(e, playgroundRateLimits);
        if (sendErr) setAppError(sendErr);
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && assistantMessagePlainText(last.content).trim() === "") {
            return prev.slice(0, -1);
          }
          return prev;
        });
      } finally {
        setBusy(false);
        setTtsPhase(null);
        abortRef.current = null;
        focusComposer();
      }
      return;
    }

    if (audioTranscribe) {
      if (!file || !isAudioUploadFile(file)) {
        setAppError({
          kind: "plain",
          message: "Bitte eine Audiodatei (MP3, WAV, FLAC, OGG, …) per + anhängen.",
        });
        return;
      }
      if (!speechToText?.enabled) {
        setAppError({
          kind: "plain",
          message: "Spracheingabe/Whisper ist auf diesem Server nicht aktiv.",
        });
        return;
      }

      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const userNotes = text;
      const fileLabel = audioAttachmentLabel(file, audioFileDurationSec);

      setInput("");
      setImageFile(null);
      setAudioFileDurationSec(null);

      const userDisplay =
        userNotes.length > 0
          ? `${userNotes}\n\n🎙️ ${fileLabel}`
          : `Audio transkribieren: ${fileLabel}`;

      const userMessage: ChatMessage = { role: "user", content: userDisplay };
      const nextThread = [...messagesBeforeSend, userMessage];
      setMessages([...nextThread, { role: "assistant", content: "" }]);
      setBusy(true);
      trackPlaygroundUseCaseSend(activeUseCase);
      setAudioTranscribePhase("transcribe");
      setAudioTranscribeProgress(null);
      setSpeechTranscribeStatus(null);

      const streamStart = performance.now();
      let firstContentAt: number | null = null;
      const deltaBatch = createRafStreamBatcher((chunk) => {
        if (chunk.length > 0) firstContentAt ??= performance.now();
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (!last || last.role !== "assistant") return prev;
          const prevText = typeof last.content === "string" ? last.content : "";
          const copy = prev.slice();
          copy[copy.length - 1] = { role: "assistant", content: prevText + chunk };
          return copy;
        });
      });

      try {
        const { transcript } = await transcribeUploadedAudioFile(file, {
          language: speechToText.language,
          maxAudioBytes: speechToText.maxAudioBytes,
          rateLimits: playgroundRateLimits,
          signal: ctrl.signal,
          onProgress: (state) => {
            setAudioTranscribeProgress(state);
            setSpeechTranscribeStatus(audioTranscribeStatusLine(state));
          },
        });

        setAudioTranscribePhase("format");
        setAudioTranscribeProgress({
          phase: "format",
          message: "Qwen bereinigt Volltranskript",
        });
        setSpeechTranscribeStatus("Qwen bereinigt Volltranskript …");

        const structureUserText = buildAudioTranscribeStructureUserMessage(
          transcript,
          userNotes,
          fileLabel,
        );

        let apiMessages: ApiMessage[] = [...playgroundSystemContextMessages()];
        if (systemPrompt.trim().length > 0) {
          apiMessages.push({ role: "system", content: systemPrompt.trim() });
        }
        for (const m of nextThread) {
          apiMessages.push(
            m === userMessage
              ? { role: "user", content: structureUserText }
              : m,
          );
        }

        const { messages: trimmedApiMessages, trimmedCount } = trimMessagesForApi(
          apiMessages,
          maxMessages,
        );
        apiMessages = trimmedApiMessages;
        apiMessages = normalizeApiMessagesForModel(apiMessages, model);
        if (trimmedCount > 0) {
          setContextTrimNotice(
            `Langer Chatverlauf: ${trimmedCount} ältere Nachricht${trimmedCount === 1 ? "" : "en"} werden nicht mehr an die KI gesendet (Limit ${maxMessages}). „Clear chat“ setzt den Verlauf zurück.`,
          );
        } else {
          setContextTrimNotice(null);
        }

        const qwenPreset = getInferencePreset(model);
        const body: Record<string, unknown> = {
          model,
          messages: apiMessages,
          temperature: qwenPreset.temperature,
          stream: true,
          stream_options: { include_usage: true },
        };
        if (typeof qwenPreset.topP === "number") body.top_p = qwenPreset.topP;
        if (typeof qwenPreset.topK === "number") body.top_k = qwenPreset.topK;
        if (typeof qwenPreset.presencePenalty === "number") {
          body.presence_penalty = qwenPreset.presencePenalty;
        }
        if (qwenPreset.extraBody) body.extra_body = qwenPreset.extraBody;
        const cap = qwenPreset.maxTokens ?? 8192;
        body.max_tokens = maxTokens === null ? cap : Math.min(maxTokens, cap);

        const usageSnap = await streamChatCompletion(
          body,
          (delta) => {
            if (delta.length > 0) deltaBatch.push(delta);
          },
          ctrl.signal,
          playgroundRateLimits,
        );
        deltaBatch.flush();

        const streamEnd = performance.now();
        const genSec =
          firstContentAt != null
            ? Math.max((streamEnd - firstContentAt) / 1000, 0.001)
            : Math.max((streamEnd - streamStart) / 1000, 0.001);
        const hasApiCounts =
          usageSnap != null &&
          (usageSnap.promptTokens != null || usageSnap.completionTokens != null);

        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (!last || last.role !== "assistant") return prev;
          const len = assistantPlainTextLength(last.content);
          const roughOutTok = Math.max(1, Math.ceil(len / 4));
          let outputTokensPerSec: number | null = null;
          const comp = usageSnap?.completionTokens;
          if (typeof comp === "number") {
            outputTokensPerSec = Math.round((comp / genSec) * 10) / 10;
          } else if (len > 0) {
            outputTokensPerSec = Math.round((roughOutTok / genSec) * 10) / 10;
          }
          const co2Grams = hasApiCounts
            ? estimateInferenceCo2Grams(
                usageSnap?.promptTokens ?? 0,
                usageSnap?.completionTokens ?? 0,
                model,
              )
            : estimateInferenceCo2Grams(0, roughOutTok, model);
          copy[copy.length - 1] = {
            ...last,
            usage: {
              promptTokens: usageSnap?.promptTokens ?? null,
              completionTokens: usageSnap?.completionTokens ?? null,
              outputTokensPerSec,
              generationSeconds: genSec,
              co2Grams,
              source: hasApiCounts ? "api" : "heuristic",
            },
          };
          return copy;
        });
      } catch (e) {
        deltaBatch.cancel();
        const sendErr = appErrorFromSendFailure(e, playgroundRateLimits);
        if (sendErr) setAppError(sendErr);
        setMessages((prev) => {
          if (prev.length === 0) return prev;
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last.content === "") {
            return prev.slice(0, -1);
          }
          return prev;
        });
      } finally {
        setBusy(false);
        setAudioTranscribePhase(null);
        setAudioTranscribeProgress(null);
        setSpeechTranscribeStatus(null);
        abortRef.current = null;
        focusComposer();
      }
      return;
    }

    if (semanticSearch) {
      const passages = parseSemanticSearchPassages(briefingValues.passagen ?? "");
      const question = textNow;
      if (passages.length < 2) {
        setAppError({
          kind: "plain",
          message: "Bitte mindestens 2 Textpassagen im Briefing (Leerzeile zwischen Absätzen).",
        });
        return;
      }
      if (question.length < 3) {
        setAppError({
          kind: "plain",
          message: "Bitte eine Frage im Eingabefeld stellen.",
        });
        return;
      }

      const ctrl = new AbortController();
      abortRef.current = ctrl;

      setInput("");
      inputValueRef.current = "";

      const userDisplay = `🔎 ${question}\n\n${passages.length} Textpassagen`;
      const userMessage: ChatMessage = { role: "user", content: userDisplay };
      const nextThread = [...messagesBeforeSend, userMessage];
      setMessages([...nextThread, { role: "assistant", content: "" }]);
      setBusy(true);
      trackPlaygroundUseCaseSend(activeUseCase);
      setSemanticSearchPhase("embed");
      setSemanticSearchProgress(null);

      const streamStart = performance.now();
      let firstContentAt: number | null = null;
      const deltaBatch = createRafStreamBatcher((chunk) => {
        if (chunk.length > 0) firstContentAt ??= performance.now();
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (!last || last.role !== "assistant") return prev;
          const prevText = typeof last.content === "string" ? last.content : "";
          const copy = prev.slice();
          copy[copy.length - 1] = { role: "assistant", content: prevText + chunk };
          return copy;
        });
      });

      try {
        const pipeline = await runSemanticSearchPipeline(question, passages, {
          rateLimits: playgroundRateLimits,
          signal: ctrl.signal,
          onProgress: (progress) => {
            setSemanticSearchPhase(progress.phase);
            setSemanticSearchProgress(progress);
          },
        });

        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (!last || last.role !== "assistant") return prev;
          copy[copy.length - 1] = {
            role: "assistant",
            content: `${pipeline.reportMarkdown}`,
          };
          return copy;
        });

        let apiMessages: ApiMessage[] = [...playgroundSystemContextMessages()];
        if (systemPrompt.trim().length > 0) {
          apiMessages.push({ role: "system", content: systemPrompt.trim() });
        }
        apiMessages.push({ role: "user", content: userDisplay });
        apiMessages.push({ role: "user", content: pipeline.answerUserMessage });

        const { messages: trimmedApiMessages, trimmedCount } = trimMessagesForApi(
          apiMessages,
          maxMessages,
        );
        apiMessages = trimmedApiMessages;
        apiMessages = normalizeApiMessagesForModel(apiMessages, model);
        if (trimmedCount > 0) {
          setContextTrimNotice(
            `Langer Chatverlauf: ${trimmedCount} ältere Nachricht${trimmedCount === 1 ? "" : "en"} werden nicht mehr an die KI gesendet (Limit ${maxMessages}). „Clear chat“ setzt den Verlauf zurück.`,
          );
        } else {
          setContextTrimNotice(null);
        }

        const qwenPreset = getInferencePreset(model);
        const body: Record<string, unknown> = {
          model,
          messages: apiMessages,
          temperature: qwenPreset.temperature,
          stream: true,
          stream_options: { include_usage: true },
        };
        if (typeof qwenPreset.topP === "number") body.top_p = qwenPreset.topP;
        if (typeof qwenPreset.topK === "number") body.top_k = qwenPreset.topK;
        if (typeof qwenPreset.presencePenalty === "number") {
          body.presence_penalty = qwenPreset.presencePenalty;
        }
        if (qwenPreset.extraBody) body.extra_body = qwenPreset.extraBody;
        const cap = qwenPreset.maxTokens ?? 8192;
        body.max_tokens = maxTokens === null ? cap : Math.min(maxTokens, cap);

        const usageSnap = await streamChatCompletion(
          body,
          (delta) => {
            if (delta.length > 0) deltaBatch.push(delta);
          },
          ctrl.signal,
          playgroundRateLimits,
        );
        deltaBatch.flush();

        const streamEnd = performance.now();
        const genSec =
          firstContentAt != null
            ? Math.max((streamEnd - firstContentAt) / 1000, 0.001)
            : Math.max((streamEnd - streamStart) / 1000, 0.001);
        const hasApiCounts =
          usageSnap != null &&
          (usageSnap.promptTokens != null || usageSnap.completionTokens != null);

        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (!last || last.role !== "assistant") return prev;
          const len = assistantPlainTextLength(last.content);
          const roughOutTok = Math.max(1, Math.ceil(len / 4));
          let outputTokensPerSec: number | null = null;
          const comp = usageSnap?.completionTokens;
          if (typeof comp === "number") {
            outputTokensPerSec = Math.round((comp / genSec) * 10) / 10;
          } else if (len > 0) {
            outputTokensPerSec = Math.round((roughOutTok / genSec) * 10) / 10;
          }
          const co2Grams = hasApiCounts
            ? estimateInferenceCo2Grams(
                usageSnap?.promptTokens ?? 0,
                usageSnap?.completionTokens ?? 0,
                model,
              )
            : estimateInferenceCo2Grams(0, roughOutTok, model);
          copy[copy.length - 1] = {
            ...last,
            usage: {
              promptTokens: usageSnap?.promptTokens ?? null,
              completionTokens: usageSnap?.completionTokens ?? null,
              outputTokensPerSec,
              generationSeconds: genSec,
              co2Grams,
              source: hasApiCounts ? "api" : "heuristic",
            },
          };
          return copy;
        });
      } catch (e) {
        deltaBatch.cancel();
        const sendErr = appErrorFromSendFailure(e, playgroundRateLimits);
        if (sendErr) setAppError(sendErr);
        setMessages((prev) => {
          if (prev.length === 0) return prev;
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last.content === "") {
            return prev.slice(0, -1);
          }
          return prev;
        });
      } finally {
        setBusy(false);
        setSemanticSearchPhase(null);
        setSemanticSearchProgress(null);
        abortRef.current = null;
        focusComposer();
      }
      return;
    }

    if (invoiceOcr) {
      if (!file) {
        setAppError({
          kind: "plain",
          message: "Bitte eine Rechnungs-PDF oder ein Bild per + anhängen.",
        });
        return;
      }

      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const userNotes = text;
      const fileLabel = ocrAttachmentLabel(file);

      setInput("");
      setImageFile(null);

      const userDisplay =
        userNotes.length > 0
          ? `${userNotes}\n\n📎 ${fileLabel}`
          : `Rechnung extrahieren: ${fileLabel}`;

      const userMessage: ChatMessage = { role: "user", content: userDisplay };
      const nextThread = [...messagesBeforeSend, userMessage];
      setMessages([...nextThread, { role: "assistant", content: "" }]);
      setBusy(true);
      trackPlaygroundUseCaseSend(activeUseCase);
      setOcrProgress("Dokument wird vorbereitet …");

      const streamStart = performance.now();
      let firstContentAt: number | null = null;
      const deltaBatch = createRafStreamBatcher((chunk) => {
        if (chunk.length > 0) firstContentAt ??= performance.now();
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (!last || last.role !== "assistant") return prev;
          const prevText = typeof last.content === "string" ? last.content : "";
          const copy = prev.slice();
          copy[copy.length - 1] = { role: "assistant", content: prevText + chunk };
          return copy;
        });
      });

      try {
        const pages = await fileToOcrPageImages(file);
        const ocrText = await extractTextWithGlmOcr(pages, {
          signal: ctrl.signal,
          rateLimits: playgroundRateLimits,
          onProgress: setOcrProgress,
          streamChat: streamChatCompletion,
        });

        setOcrProgress("Strukturierung (Qwen) …");

        const structureUserText = buildInvoiceStructureUserMessage(
          ocrText,
          userNotes,
          fileLabel,
        );

        let apiMessages: ApiMessage[] = [...playgroundSystemContextMessages()];
        if (systemPrompt.trim().length > 0) {
          apiMessages.push({ role: "system", content: systemPrompt.trim() });
        }
        for (const m of nextThread) {
          apiMessages.push(
            m === userMessage
              ? { role: "user", content: structureUserText }
              : m,
          );
        }

        const { messages: trimmedApiMessages, trimmedCount } = trimMessagesForApi(
          apiMessages,
          maxMessages,
        );
        apiMessages = trimmedApiMessages;
        apiMessages = normalizeApiMessagesForModel(apiMessages, model);
        if (trimmedCount > 0) {
          setContextTrimNotice(
            `Langer Chatverlauf: ${trimmedCount} ältere Nachricht${trimmedCount === 1 ? "" : "en"} werden nicht mehr an die KI gesendet (Limit ${maxMessages}). „Clear chat“ setzt den Verlauf zurück.`,
          );
        } else {
          setContextTrimNotice(null);
        }

        const qwenPreset = getInferencePreset(model);
        const body: Record<string, unknown> = {
          model,
          messages: apiMessages,
          temperature: qwenPreset.temperature,
          stream: true,
          stream_options: { include_usage: true },
        };
        if (typeof qwenPreset.topP === "number") body.top_p = qwenPreset.topP;
        if (typeof qwenPreset.topK === "number") body.top_k = qwenPreset.topK;
        if (typeof qwenPreset.presencePenalty === "number") {
          body.presence_penalty = qwenPreset.presencePenalty;
        }
        if (qwenPreset.extraBody) body.extra_body = qwenPreset.extraBody;
        const cap = qwenPreset.maxTokens ?? 8192;
        body.max_tokens = maxTokens === null ? cap : Math.min(maxTokens, cap);

        const usageSnap = await streamChatCompletion(
          body,
          (delta) => {
            if (delta.length > 0) deltaBatch.push(delta);
          },
          ctrl.signal,
          playgroundRateLimits,
        );
        deltaBatch.flush();

        const streamEnd = performance.now();
        const genSec =
          firstContentAt != null
            ? Math.max((streamEnd - firstContentAt) / 1000, 0.001)
            : Math.max((streamEnd - streamStart) / 1000, 0.001);
        const hasApiCounts =
          usageSnap != null &&
          (usageSnap.promptTokens != null || usageSnap.completionTokens != null);

        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (!last || last.role !== "assistant") return prev;
          const len = assistantPlainTextLength(last.content);
          const roughOutTok = Math.max(1, Math.ceil(len / 4));
          let outputTokensPerSec: number | null = null;
          const comp = usageSnap?.completionTokens;
          if (typeof comp === "number") {
            outputTokensPerSec = Math.round((comp / genSec) * 10) / 10;
          } else if (len > 0) {
            outputTokensPerSec = Math.round((roughOutTok / genSec) * 10) / 10;
          }
          const co2Grams = hasApiCounts
            ? estimateInferenceCo2Grams(
                usageSnap?.promptTokens ?? 0,
                usageSnap?.completionTokens ?? 0,
                model,
              )
            : estimateInferenceCo2Grams(0, roughOutTok, model);
          copy[copy.length - 1] = {
            ...last,
            usage: {
              promptTokens: usageSnap?.promptTokens ?? null,
              completionTokens: usageSnap?.completionTokens ?? null,
              outputTokensPerSec,
              generationSeconds: genSec,
              co2Grams,
              source: hasApiCounts ? "api" : "heuristic",
            },
          };
          return copy;
        });
      } catch (e) {
        deltaBatch.cancel();
        const sendErr = appErrorFromSendFailure(e, playgroundRateLimits);
        if (sendErr) setAppError(sendErr);
        setMessages((prev) => {
          if (prev.length === 0) return prev;
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last.content === "") {
            return prev.slice(0, -1);
          }
          return prev;
        });
      } finally {
        setBusy(false);
        setOcrProgress(null);
        abortRef.current = null;
        focusComposer();
      }
      return;
    }

    const rawTextBeforeFormat = text;

    const apiSubmissionText =
      activeUseCase?.formatSubmissionMessage &&
      rawTextBeforeFormat.length > 0 &&
      !file
        ? activeUseCase.formatSubmissionMessage(rawTextBeforeFormat)
        : rawTextBeforeFormat;

    const includeCo2Guide =
      !activeUseCase?.prefersGridCarbonForecast && isPlaygroundCo2Question(rawTextBeforeFormat);
    const includeAuthorGuide = isPlaygroundAuthorQuestion(rawTextBeforeFormat);
    const skipMittwaldProfile = activeUseCase?.prefersGridCarbonForecast === true;

    const webSearchDirectQueries =
      activeUseCase?.webSearchDirectQueries?.(rawTextBeforeFormat);

    const webSearchUserMessage =
      activeUseCase?.formatWebSearchUserMessage?.(rawTextBeforeFormat) ??
      rawTextBeforeFormat;

    let userContent: string | ContentPart[];
    if (file) {
      const dataUrl = await encodeImageFile(file);
      const parts: ContentPart[] = [];
      const visionText =
        rawTextBeforeFormat.length > 0
          ? rawTextBeforeFormat
          : "Beschreibe dieses Bild kurz.";
      parts.push({ type: "text", text: visionText });
      parts.push({ type: "image_url", image_url: { url: dataUrl } });
      userContent = parts;
    } else {
      userContent = rawTextBeforeFormat;
    }

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    let webSearchPayload: WebSearchResponse | undefined;
    const wantsWebSearch =
      !isModelCompareUseCase &&
      !activeUseCase?.prefersPriceCompareSearch &&
      !activeUseCase?.prefersSemanticSearch &&
      activeThreadWebSearch &&
      typeof userContent === "string" &&
      rawTextBeforeFormat.length > 0 &&
      !file &&
      webSearchConfig?.enabled !== false;

    if (wantsWebSearch && !hasWebSearchConsent()) {
      requestEnableWebSearch("thread");
      return;
    }

    const useWebSearch = wantsWebSearch && hasWebSearchConsent();

    setInput("");
    setImageFile(null);
    inputValueRef.current = "";
    focusComposer();

    const isolateWebSearch = useCaseIsolatesWebSearchContext(activeUseCase);

    const wantsMittwaldFeatureRequests =
      activeUseCase?.prefersMittwaldFeatureRequests &&
      typeof userContent === "string" &&
      rawTextBeforeFormat.length > 0 &&
      !file;

    const wantsMittwaldAiHostingDocs =
      activeUseCase?.prefersMittwaldAiHostingDocs &&
      typeof userContent === "string" &&
      rawTextBeforeFormat.length > 0 &&
      !file;

    const wantsAiHostingTariffAdvisor =
      activeUseCase?.prefersAiHostingTariffAdvisor &&
      typeof userContent === "string" &&
      rawTextBeforeFormat.length > 0 &&
      !file;

    const tariffAdvisorSessionCache =
      wantsAiHostingTariffAdvisor &&
      aiHostingTariffAdvisorSessionRef.current?.threadId === activeThreadId
        ? aiHostingTariffAdvisorSessionRef.current.data
        : undefined;
    const needsTariffAdvisorFetch = wantsAiHostingTariffAdvisor && !tariffAdvisorSessionCache;
    const injectTariffAdvisorContext =
      wantsAiHostingTariffAdvisor &&
      !messagesBeforeSend.some((m) => m.mittwaldAiHostingTariffAdvisor);

    const wantsWeekendVisit =
      activeUseCase?.prefersWeekendVisitData &&
      typeof userContent === "string" &&
      !file;
    const weekendCity = (briefingValues.stadt ?? "").trim();

    if (wantsWeekendVisit && weekendCity.length < 2) {
      setAppError({
        kind: "plain",
        message: "Bitte eine Stadt im Briefing-Feld eintragen.",
      });
      return;
    }

    const wantsPriceCompare =
      activeUseCase?.prefersPriceCompareSearch &&
      typeof userContent === "string" &&
      !file;
    const priceProduct = (briefingValues.produkt ?? "").trim();
    const priceProviderA = (briefingValues.anbieter1 ?? "").trim();
    const priceProviderB = (briefingValues.anbieter2 ?? "").trim();

    if (wantsPriceCompare && priceProduct.length < 2) {
      setAppError({
        kind: "plain",
        message: "Bitte ein Produkt im Briefing eintragen.",
      });
      return;
    }
    if (wantsPriceCompare && (priceProviderA.length < 2 || priceProviderB.length < 2)) {
      setAppError({
        kind: "plain",
        message: "Bitte beide Anbieter im Briefing eintragen.",
      });
      return;
    }

    if (activeUseCase?.id === "travel-train-vs-flight" && typeof userContent === "string" && !file) {
      const sameRouteResponse = getSameTravelRouteStaticResponse(rawTextBeforeFormat);
      if (sameRouteResponse) {
        trackPlaygroundUseCaseSend(activeUseCase);
        setMessages([
          ...messagesBeforeSend,
          { role: "user", content: userContent, playgroundUseCaseId: "travel-train-vs-flight" },
          {
            role: "assistant",
            content: sameRouteResponse,
            playgroundUseCaseId: "travel-train-vs-flight",
          },
        ]);
        return;
      }
    }

    if (
      activeUseCase?.id === "grid-carbon-forecast" &&
      typeof userContent === "string" &&
      !file &&
      rawTextBeforeFormat.trim().length > 0
    ) {
      try {
        const summaryForStatic =
          gridCarbonSummary ?? (await fetchGridCarbonSummary());
        const staticGridCarbonResponse = getGridCarbonForecastStaticResponse(
          rawTextBeforeFormat,
          summaryForStatic,
        );
        if (staticGridCarbonResponse) {
          if (summaryForStatic && !gridCarbonSummary) {
            setGridCarbonSummary(summaryForStatic);
          }
          trackPlaygroundUseCaseSend(activeUseCase);
          setMessages([
            ...messagesBeforeSend,
            {
              role: "user",
              content: userContent,
              playgroundUseCaseId: "grid-carbon-forecast",
            },
            {
              role: "assistant",
              content: staticGridCarbonResponse,
              playgroundUseCaseId: "grid-carbon-forecast",
            },
          ]);
          return;
        }
      } catch (e) {
        if (isAbortError(e)) throw e;
        const sendErr = appErrorFromSendFailure(e, playgroundRateLimits);
        if (sendErr) setAppError(sendErr);
        return;
      }
    }

    let mittwaldFeatureRequestsPayload: MittwaldFeatureRequestsResponse | undefined;
    let mittwaldAiHostingDocsPayload: MittwaldAiHostingDocsResponse | undefined;
    let mittwaldAiHostingTariffAdvisorPayload: MittwaldAiHostingTariffAdvisorResponse | undefined;
    let weekendVisitPayload: WeekendVisitData | undefined;
    let priceComparePayload: PriceCompareSearchResponse | undefined;
    let gridCarbonForecastPayload: GridCarbonSummary | undefined;

    const wantsGridCarbonForecastChat =
      activeUseCase?.prefersGridCarbonForecast &&
      typeof userContent === "string" &&
      rawTextBeforeFormat.length > 0 &&
      !file;

    trackPlaygroundUseCaseSend(activeUseCase);

    if (wantsGridCarbonForecastChat) {
      try {
        const data = gridCarbonSummary ?? (await fetchGridCarbonSummary());
        if (!data?.series24h?.length) {
          setAppError({
            kind: "plain",
            message:
              "Strommix-Forecast konnte nicht geladen werden. Bitte „Aktualisieren“ im Panel und erneut versuchen.",
          });
          return;
        }
        gridCarbonForecastPayload = data;
        if (!gridCarbonSummary) setGridCarbonSummary(data);
      } catch (e) {
        if (isAbortError(e)) throw e;
        const sendErr = appErrorFromSendFailure(e, playgroundRateLimits);
        if (sendErr) setAppError(sendErr);
        return;
      }
    }

    const wantsExternalPrefetch =
      wantsMittwaldFeatureRequests ||
      wantsMittwaldAiHostingDocs ||
      needsTariffAdvisorFetch ||
      wantsWeekendVisit ||
      wantsPriceCompare ||
      useWebSearch;

    if (wantsExternalPrefetch) {
      const optimisticUser: ChatMessage = { role: "user", content: userContent };
      setMessages([
        ...messagesBeforeSend,
        optimisticUser,
        { role: "assistant", content: "" },
      ]);
    }

    if (wantsMittwaldFeatureRequests) {
      setFeatureRequestsBusy(true);
      try {
        mittwaldFeatureRequestsPayload = await fetchMittwaldFeatureRequests(
          ctrl.signal,
          playgroundRateLimits,
        );
      } catch (e) {
        setFeatureRequestsBusy(false);
        setMessages(messagesBeforeSend);
        if (isAbortError(e)) throw e;
        const sendErr = appErrorFromSendFailure(e, playgroundRateLimits);
        if (sendErr) setAppError(sendErr);
        return;
      }
      setFeatureRequestsBusy(false);
      if (mittwaldFeatureRequestsPayload.issues.length === 0) {
        setMessages(messagesBeforeSend);
        setAppError({
          kind: "plain",
          message: "Feature Requests: keine Issues von GitHub geladen. Bitte erneut versuchen.",
        });
        return;
      }
    }

    if (wantsMittwaldAiHostingDocs) {
      setAiHostingDocsBusy(true);
      try {
        mittwaldAiHostingDocsPayload = await fetchMittwaldAiHostingDocs(
          ctrl.signal,
          playgroundRateLimits,
        );
      } catch (e) {
        setAiHostingDocsBusy(false);
        setMessages(messagesBeforeSend);
        if (isAbortError(e)) throw e;
        const sendErr = appErrorFromSendFailure(e, playgroundRateLimits);
        if (sendErr) setAppError(sendErr);
        return;
      }
      setAiHostingDocsBusy(false);
      if (mittwaldAiHostingDocsPayload.modelsPage.models.length === 0) {
        setMessages(messagesBeforeSend);
        setAppError({
          kind: "plain",
          message: "AI-Hosting-Doku: keine Modelle geladen. Bitte erneut versuchen.",
        });
        return;
      }
    }

    if (wantsAiHostingTariffAdvisor) {
      if (tariffAdvisorSessionCache) {
        mittwaldAiHostingTariffAdvisorPayload = tariffAdvisorSessionCache;
      } else {
        setAiHostingTariffAdvisorBusy(true);
        try {
          mittwaldAiHostingTariffAdvisorPayload = await fetchMittwaldAiHostingTariffAdvisor(
            ctrl.signal,
            playgroundRateLimits,
          );
        } catch (e) {
          setAiHostingTariffAdvisorBusy(false);
          setMessages(messagesBeforeSend);
          if (isAbortError(e)) throw e;
          const sendErr = appErrorFromSendFailure(e, playgroundRateLimits);
          if (sendErr) setAppError(sendErr);
          return;
        }
        setAiHostingTariffAdvisorBusy(false);
        if (mittwaldAiHostingTariffAdvisorPayload.modelsPage.models.length === 0) {
          setMessages(messagesBeforeSend);
          setAppError({
            kind: "plain",
            message:
              "AI-Hosting-Tarifberatung: Modellliste konnte nicht geladen werden. Bitte erneut versuchen.",
          });
          return;
        }
        aiHostingTariffAdvisorSessionRef.current = {
          threadId: activeThreadId,
          data: mittwaldAiHostingTariffAdvisorPayload,
        };
      }
    }

    if (wantsWeekendVisit) {
      setWeekendVisitPhase("prepare");
      try {
        const prepare = await prepareWeekendVisitCity(
          weekendCity,
          ctrl.signal,
          playgroundRateLimits,
        );
        setWeekendVisitPhase("sources");
        const sources = await fetchWeekendVisitSources(
          prepare,
          ctrl.signal,
          playgroundRateLimits,
        );
        weekendVisitPayload = { ...prepare, ...sources };
        setWeekendVisitPhase("generate");
      } catch (e) {
        setWeekendVisitPhase(null);
        setMessages(messagesBeforeSend);
        if (isAbortError(e)) throw e;
        const sendErr = appErrorFromSendFailure(e, playgroundRateLimits);
        if (sendErr) setAppError(sendErr);
        return;
      }
    }

    if (wantsPriceCompare) {
      setPriceCompareSearchBusy(true);
      setPriceCompareRound({ round: 1, total: 4 });
      try {
        priceComparePayload = await searchPriceCompareIterative(
          {
            product: priceProduct,
            providerA: priceProviderA,
            providerB: priceProviderB,
          },
          {
            signal: ctrl.signal,
            rateLimits: playgroundRateLimits,
            onRound: (round, total) => setPriceCompareRound({ round, total }),
          },
        );
      } catch (e) {
        setPriceCompareSearchBusy(false);
        setPriceCompareRound(null);
        setMessages(messagesBeforeSend);
        if (isAbortError(e)) throw e;
        const sendErr = appErrorFromSendFailure(e, playgroundRateLimits);
        if (sendErr) setAppError(sendErr);
        return;
      }
      setPriceCompareSearchBusy(false);
      setPriceCompareRound(null);
    }

    if (useWebSearch) {
      if (!wantsExternalPrefetch) {
        const optimisticUser: ChatMessage = { role: "user", content: userContent };
        setMessages([
          ...messagesBeforeSend,
          optimisticUser,
          { role: "assistant", content: "" },
        ]);
      }
      setWebSearchBusy(true);
      try {
        webSearchPayload = await fetchWebSearch(
          {
            userMessage: webSearchDirectQueries?.length
              ? rawTextBeforeFormat
              : webSearchUserMessage,
            directQueries: webSearchDirectQueries,
            chatExcerpt: isolateWebSearch
              ? ""
              : buildWebSearchChatExcerpt(messagesBeforeSend),
            maxResults: webSearchDirectQueries?.length
              ? 12
              : webSearchConfig?.maxResults,
          },
          ctrl.signal,
          playgroundRateLimits,
        );
      } catch (e) {
        setWebSearchBusy(false);
        setMessages(messagesBeforeSend);
        if (isAbortError(e)) throw e;
        const sendErr = appErrorFromSendFailure(e, playgroundRateLimits);
        if (sendErr) setAppError(sendErr);
        return;
      }
      setWebSearchBusy(false);
      if (webSearchPayload.results.length === 0) {
        setMessages(messagesBeforeSend);
        setAppError({
          kind: "plain",
          message:
            "Websuche: keine Treffer (DuckDuckGo blockiert evtl. die Anfrage). Erneut versuchen oder in .env Serper nutzen.",
        });
        return;
      }
    }

    const userMessage: ChatMessage = {
      role: "user",
      content: userContent,
      ...(activeUseCase ? { playgroundUseCaseId: activeUseCase.id } : {}),
      ...(webSearchPayload ? { webSearch: webSearchPayload } : {}),
      ...(mittwaldFeatureRequestsPayload
        ? { mittwaldFeatureRequests: mittwaldFeatureRequestsPayload }
        : {}),
      ...(mittwaldAiHostingDocsPayload
        ? { mittwaldAiHostingDocs: mittwaldAiHostingDocsPayload }
        : {}),
      ...(injectTariffAdvisorContext && mittwaldAiHostingTariffAdvisorPayload
        ? { mittwaldAiHostingTariffAdvisor: mittwaldAiHostingTariffAdvisorPayload }
        : {}),
      ...(weekendVisitPayload ? { weekendVisitData: weekendVisitPayload } : {}),
      ...(priceComparePayload ? { priceCompareSearch: priceComparePayload } : {}),
      ...(gridCarbonForecastPayload ? { gridCarbonForecast: gridCarbonForecastPayload } : {}),
    };
    const nextThread = [...messagesBeforeSend, userMessage];

    setMessages([...nextThread, { role: "assistant", content: "" }]);
    setBusy(true);
    setActiveModelFallback(null);

    const hasVision =
      Array.isArray(userContent) &&
      userContent.some((p) => p.type === "image_url");

    const threadForApi = isolateWebSearch ? [userMessage] : nextThread;

    const buildApiMessages = (streamModelId: string): ApiMessage[] => {
      const api: ApiMessage[] = [
        ...playgroundSystemContextMessages({
          includeCo2Guide,
          includeAuthorGuide,
          skipMittwaldProfile,
        }),
      ];
      if (streamModelId === MODEL_GPT_OSS) {
        const line = `Reasoning: ${gptOssReasoning}`;
        const rest = systemPrompt.trim();
        api.push({ role: "system", content: rest ? `${line}\n\n${rest}` : line });
      } else if (systemPrompt.trim().length > 0) {
        api.push({ role: "system", content: systemPrompt.trim() });
      }
      for (const m of threadForApi) {
        if (m.role === "user" && m === userMessage && typeof m.content === "string") {
          let enriched = skipMittwaldProfile
            ? apiSubmissionText
            : enrichUserMessageForPlaygroundCo2Question(
                rawTextBeforeFormat,
                apiSubmissionText,
              );
          if (mittwaldFeatureRequestsPayload) {
            enriched = `${enriched}\n\n${formatMittwaldFeatureRequestsContext(mittwaldFeatureRequestsPayload)}`;
          }
          if (mittwaldAiHostingDocsPayload) {
            enriched = `${enriched}\n\n${formatMittwaldAiHostingDocsContext(mittwaldAiHostingDocsPayload)}`;
          }
          if (injectTariffAdvisorContext && mittwaldAiHostingTariffAdvisorPayload) {
            enriched = `${enriched}\n\n${formatMittwaldAiHostingTariffAdvisorContext(mittwaldAiHostingTariffAdvisorPayload)}`;
          }
          if (weekendVisitPayload) {
            enriched = `${enriched}\n\n${formatWeekendVisitContext(weekendVisitPayload)}`;
          }
          if (priceComparePayload) {
            enriched = `${enriched}\n\n${formatPriceCompareContext(priceComparePayload)}`;
          }
          if (gridCarbonForecastPayload) {
            enriched = `${enriched}\n\n${formatGridCarbonForecastContext(gridCarbonForecastPayload)}`;
          }
          if (webSearchPayload) {
            enriched = `${enriched}\n\n${formatWebSearchContext(webSearchPayload)}`;
          }
          if (enriched !== m.content) {
            api.push({ role: "user", content: enriched });
            continue;
          }
        }
        api.push(m);
      }
      return api;
    };

    const trimNoticeRef = { count: 0 };
    const buildChatStreamBody = (streamModelId: string): Record<string, unknown> => {
      let effTemp = temperature;
      let effTopP = topP;
      let effTopK = topK;
      let effPresence = presencePenalty;
      let effMax = maxTokens;
      let effExtra =
        extraBody && Object.keys(extraBody).length > 0 ? { ...extraBody } : null;

      if (hasVision) {
        if (streamModelId === MODEL_MINISTRAL) {
          effTemp = 0.1;
        } else if (isQwen3Model(streamModelId)) {
          const qv = qwenVisionOcr ? getQwenVisionOcrInference() : getQwenVisionInference();
          effTemp = qv.temperature;
          effTopP = typeof qv.topP === "number" ? qv.topP : effTopP;
          effTopK = typeof qv.topK === "number" ? qv.topK : effTopK;
          effExtra = qv.extraBody ? { ...qv.extraBody } : effExtra;
          const cap = qv.maxTokens ?? 2048;
          effMax = effMax === null ? cap : Math.min(effMax, cap);
        }
      } else if (isQwen38Model(streamModelId)) {
        const q38 = resolveQwen38InferenceParams({
          thinkingEnabled: qwen38ThinkingEnabled,
          reasoningEffort: qwen38ReasoningEffort,
          hasVision: false,
          qwenVisionOcr,
          userMaxTokens: maxTokens,
        });
        effTemp = q38.temperature;
        effTopP = typeof q38.topP === "number" ? q38.topP : effTopP;
        effTopK = typeof q38.topK === "number" ? q38.topK : effTopK;
        effPresence =
          typeof q38.presencePenalty === "number" ? q38.presencePenalty : effPresence;
        effExtra = q38.extraBody ? { ...q38.extraBody } : effExtra;
        if (typeof q38.maxTokens === "number") {
          effMax = q38.maxTokens;
        }
      }

      let apiMessages = buildApiMessages(streamModelId);
      const { messages: trimmedApiMessages, trimmedCount } = trimMessagesForApi(
        apiMessages,
        maxMessages,
      );
      apiMessages = normalizeApiMessagesForModel(trimmedApiMessages, streamModelId);
      trimNoticeRef.count = trimmedCount;

      const body: Record<string, unknown> = {
        model: streamModelId,
        messages: apiMessages,
        temperature: effTemp,
        stream: true,
      };
      if (typeof effTopP === "number") body.top_p = effTopP;
      if (typeof effTopK === "number") body.top_k = effTopK;
      if (typeof effPresence === "number") body.presence_penalty = effPresence;
      if (effMax !== null && effMax > 0) body.max_tokens = effMax;
      if (effExtra && Object.keys(effExtra).length > 0) body.extra_body = effExtra;
      body.stream_options = { include_usage: true };
      return body;
    };

    const streamStart = performance.now();
    let firstContentAt: number | null = null;
    let streamReceivedContent = false;
    let usedModelFallback = false;

    const appendAssistantDelta = (delta: string) => {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (!last || last.role !== "assistant") return prev;
        const prevText = typeof last.content === "string" ? last.content : "";
        const nextText = prevText + delta;
        if (nextText === prevText) return prev;
        const copy = prev.slice();
        copy[copy.length - 1] = { role: "assistant", content: nextText };
        return copy;
      });
    };

    const deltaBatch = createRafStreamBatcher((chunk) => {
      if (chunk.length > 0) {
        streamReceivedContent = true;
        firstContentAt ??= performance.now();
      }
      appendAssistantDelta(chunk);
    });

    const allowedModelIds = models.map((m) => m.id);
    let effectiveModelId = model;
    const primaryFallbackId = resolveModelFallback(
      model,
      allowedModelIds,
      activeUseCase?.fallbackModelId,
    );

    const applyTrimNotice = (fallbackSuffix?: string) => {
      const trimMsg =
        trimNoticeRef.count > 0
          ? `Langer Chatverlauf: ${trimNoticeRef.count} ältere Nachricht${trimNoticeRef.count === 1 ? "" : "en"} werden nicht mehr an die KI gesendet (Limit ${maxMessages}). „Clear chat“ setzt den Verlauf zurück.`
          : null;
      if (fallbackSuffix) {
        setContextTrimNotice(trimMsg ? `${trimMsg} ${fallbackSuffix}` : fallbackSuffix);
        return;
      }
      setContextTrimNotice(trimMsg);
    };

    const streamUseCase =
      activeUseCaseId === "ai-hosting-tarifberater"
        ? { useCaseId: "ai-hosting-tarifberater" as const }
        : undefined;

    const runStream = async (streamModelId: string, useFirstTokenTimeout: boolean) => {
      const body = buildChatStreamBody(streamModelId);
      if (!usedModelFallback) applyTrimNotice();
      const onDelta = (delta: string) => {
        if (delta.length > 0) deltaBatch.push(delta);
      };
      if (useFirstTokenTimeout) {
        return streamChatCompletionWithFirstTokenTimeout(
          body,
          onDelta,
          ctrl.signal,
          playgroundRateLimits,
          MODEL_FIRST_TOKEN_TIMEOUT_MS,
          streamUseCase,
        );
      }
      return streamChatCompletion(body, onDelta, ctrl.signal, playgroundRateLimits, streamUseCase);
    };

    try {
      let usageSnap: TokenMeter | null;
      try {
        usageSnap = await runStream(effectiveModelId, primaryFallbackId !== null);
      } catch (firstErr) {
        if (isAbortError(firstErr)) throw firstErr;
        const fallbackId = resolveModelFallback(
          effectiveModelId,
          allowedModelIds,
          activeUseCase?.fallbackModelId,
        );
        if (
          !fallbackId ||
          !isModelUnreachableError(firstErr) ||
          streamReceivedContent
        ) {
          throw firstErr;
        }
        effectiveModelId = fallbackId;
        usedModelFallback = true;
        const fallbackLabel = modelShortLabel(fallbackId);
        setActiveModelFallback({ modelId: fallbackId, label: fallbackLabel });
        applyTrimNotice(
          `${modelShortLabel(model)} war nicht erreichbar — Antwort mit ${fallbackLabel} (Fallback).`,
        );
        usageSnap = await runStream(effectiveModelId, false);
      }

      deltaBatch.flush();
      const streamEnd = performance.now();
      const genSec =
        firstContentAt != null
          ? Math.max((streamEnd - firstContentAt) / 1000, 0.001)
          : Math.max((streamEnd - streamStart) / 1000, 0.001);

      const hasApiCounts =
        usageSnap != null &&
        (usageSnap.promptTokens != null || usageSnap.completionTokens != null);

      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (!last || last.role !== "assistant") return prev;
        const len = assistantPlainTextLength(last.content);
        const roughOutTok = Math.max(1, Math.ceil(len / 4));

        let outputTokensPerSec: number | null = null;
        const comp = usageSnap?.completionTokens;
        if (typeof comp === "number") {
          outputTokensPerSec = Math.round((comp / genSec) * 10) / 10;
        } else if (len > 0) {
          outputTokensPerSec = Math.round((roughOutTok / genSec) * 10) / 10;
        }

        const co2Grams = hasApiCounts
          ? estimateInferenceCo2Grams(
              usageSnap?.promptTokens ?? 0,
              usageSnap?.completionTokens ?? 0,
              effectiveModelId,
            )
          : estimateInferenceCo2Grams(0, roughOutTok, effectiveModelId);

        const cleanedContent =
          typeof last.content === "string"
            ? polishAssistantMarkdown(last.content, activeUseCase?.id ?? null)
            : last.content;

        copy[copy.length - 1] = {
          ...last,
          content: cleanedContent,
          ...(activeUseCase ? { playgroundUseCaseId: activeUseCase.id } : {}),
          usage: {
            promptTokens: usageSnap?.promptTokens ?? null,
            completionTokens: usageSnap?.completionTokens ?? null,
            outputTokensPerSec,
            generationSeconds: genSec,
            co2Grams,
            source: hasApiCounts ? "api" : "heuristic",
          },
        };
        return copy;
      });
    } catch (e) {
      deltaBatch.cancel();
      const sendErr = appErrorFromSendFailure(e, playgroundRateLimits);
      if (sendErr) setAppError(sendErr);
      setMessages((prev) => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.content === "") {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setBusy(false);
      setWebSearchBusy(false);
      setWeekendVisitPhase(null);
      setPriceCompareSearchBusy(false);
      setPriceCompareRound(null);
      abortRef.current = null;
      focusComposer();
    }
    } finally {
      sendLockRef.current = false;
    }
  }, [
    canSend,
    input,
    imageFile,
    messages,
    model,
    systemPrompt,
    temperature,
    topP,
    topK,
    presencePenalty,
    extraBody,
    maxTokens,
    gptOssReasoning,
    qwen38ThinkingEnabled,
    qwen38ReasoningEffort,
    qwenVisionOcr,
    maxMessages,
    busy,
    speechBusy,
    activeThreadWebSearch,
    webSearchConfig,
    playgroundRateLimits,
    activeUseCase,
    briefingValues,
    compareModelB,
    activeUseCaseId,
    gridCarbonSummary,
    requestEnableWebSearch,
    models,
    focusComposer,
  ]);

  useEffect(() => {
    if (!voiceRecording.active) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.shiftKey) return;
      const target = e.target;
      if (target instanceof HTMLElement && target.closest("[role='dialog']")) return;

      e.preventDefault();
      // Enter beendet Aufnahme und transkribiert; Senden erst beim nächsten Enter im Eingabefeld.
      speechInputRef.current?.stopRecording();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [voiceRecording.active]);

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-playground-main text-playground-ink antialiased">
      {isMobileLayout && mobileSidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-neutral-900/45 md:hidden"
          aria-label="Chat-Verlauf schließen"
          onClick={closeMobileSidebar}
        />
      ) : null}
      <aside
        className={`flex shrink-0 flex-col border-r border-playground-border bg-playground-sidebar px-2 transition-[width,transform] duration-200 ease-out ${
          isMobileLayout
            ? `fixed inset-y-0 left-0 z-50 w-[min(100vw,329px)] max-w-[min(100vw,329px)] shadow-xl ${
                mobileSidebarOpen
                  ? "translate-x-0"
                  : "pointer-events-none -translate-x-full"
              }`
            : sidebarCollapsed
              ? "w-[52px]"
              : "w-[329px]"
        }`}
      >
        <div
          className={`flex shrink-0 border-b border-playground-border ${
            sidebarExpanded
              ? "h-[56px] items-center gap-3 p-2.5"
              : "items-center justify-center py-2.5"
          }`}
        >
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-playground-ink hover:bg-playground-muted/5"
            onClick={toggleSidebar}
            title={
              isMobileLayout
                ? mobileSidebarOpen
                  ? "Chat-Verlauf schließen"
                  : "Chat-Verlauf öffnen"
                : sidebarCollapsed
                  ? "Sidebar ausklappen"
                  : "Sidebar einklappen"
            }
            aria-label={
              isMobileLayout
                ? mobileSidebarOpen
                  ? "Chat-Verlauf schließen"
                  : "Chat-Verlauf öffnen"
                : "Sidebar umschalten"
            }
          >
            <MenuIcon />
          </button>
          {sidebarExpanded ? (
            <button
              type="button"
              onClick={goToDashboard}
              disabled={busy || speechBusy}
              title="Zur Startseite"
              className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left transition hover:bg-playground-muted/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <MittwaldLogo size="md" className="text-playground-ink" />
              <div className="min-w-0">
                <p className="playground-text-body truncate font-bold leading-tight text-playground-ink">
                  Playground
                </p>
              </div>
            </button>
          ) : null}
        </div>

        {sidebarExpanded ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <button
              type="button"
              onClick={newChat}
              disabled={busy || speechBusy}
              className="flex items-center gap-3 rounded-lg p-3 hover:bg-playground-muted/5 disabled:cursor-not-allowed disabled:opacity-40"
              title="Neuer Chat"
            >
              <span
                className="playground-surface-glass-strong flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-playground-ink"
                aria-hidden
              >
                <PenIcon />
              </span>
              <span className="playground-text-new-chat text-playground-muted">Neuer Chat</span>
            </button>
            <div className="flex min-h-0 flex-1 flex-col border-t border-playground-border py-3">
            <p className="playground-text-small px-3 py-2 font-bold text-playground-ink">
              Aktuelle
            </p>
            <nav
              className="min-h-0 flex-1 overflow-y-auto px-1.5"
              aria-label="Chat-Verlauf"
            >
              {threads
                .filter((t) => threadHasMessages(t, activeThreadId, messages))
                .map((t) => {
                const active = t.id === activeThreadId;
                return (
                  <div
                    key={t.id}
                    className={`group mb-0.5 flex items-center rounded-lg ${
                      active ? "bg-playground-muted/[0.08]" : "hover:bg-playground-muted/5"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => selectThread(t.id)}
                      disabled={busy}
                      className={`playground-text-body min-w-0 flex-1 overflow-hidden rounded-lg px-3 py-2 text-left disabled:cursor-not-allowed ${
                        active
                          ? "font-bold text-playground-ink"
                          : "font-medium text-playground-muted"
                      }`}
                      title={
                        t.webSearchEnabled
                          ? `${t.title} (Websuche aktiv)`
                          : t.title
                      }
                    >
                      <span className="flex min-w-0 items-center gap-1">
                        {t.webSearchEnabled ? (
                          <span className="shrink-0 text-sky-600 dark:text-sky-400" aria-hidden>
                            ◉
                          </span>
                        ) : null}
                        <span className="min-w-0 truncate">{t.title}</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteThread(t.id)}
                      disabled={busy}
                      className="mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-neutral-400 opacity-0 transition hover:bg-neutral-300/80 hover:text-neutral-700 group-hover:opacity-100 disabled:opacity-0 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
                      title="Chat löschen"
                      aria-label={`„${t.title}“ löschen`}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </nav>
            </div>
          </div>
        ) : null}

        {!isMobileLayout && sidebarCollapsed ? (
          <div className="mt-2 flex flex-col items-center gap-1 px-1">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-200/80 dark:text-neutral-400 dark:hover:bg-neutral-800"
              onClick={newChat}
              disabled={busy || speechBusy}
              title="Neuer Chat"
              aria-label="Neuer Chat"
            >
              ✎
            </button>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-200/80 dark:text-neutral-400 dark:hover:bg-neutral-800"
              onClick={() => setSidebarCollapsed(false)}
              title="Sidebar ausklappen"
            >
              →
            </button>
          </div>
        ) : null}

        <div className="mt-auto shrink-0 space-y-0 border-t border-playground-border py-3">
          {sidebarExpanded ? (
            <SessionCo2Footprint grams={sessionCo2Grams} className="px-3 pb-2" />
          ) : (
            <SessionCo2Footprint grams={sessionCo2Grams} compact className="pb-1" />
          )}
          <button
            type="button"
            onClick={() => setDeleteAllChatsOpen(true)}
            disabled={busy || speechBusy}
            className={`playground-text-tiny w-full rounded-lg px-3 py-2 text-left font-medium text-playground-muted hover:bg-playground-muted/5 hover:text-playground-ink disabled:cursor-not-allowed disabled:opacity-40 ${
              sidebarExpanded ? "" : "px-0"
            }`}
            title="Alle Chats löschen"
            aria-label="Alle Chats löschen"
          >
            {sidebarExpanded ? "Alle Chats löschen" : "🗑"}
          </button>
          <button
            type="button"
            onClick={() => setClearBrowserCacheOpen(true)}
            disabled={busy || speechBusy}
            className={`playground-text-tiny w-full rounded-lg px-3 py-2 text-left font-medium text-playground-muted hover:bg-playground-muted/5 hover:text-playground-ink disabled:cursor-not-allowed disabled:opacity-40 ${
              sidebarExpanded ? "" : "px-0"
            }`}
            title="Browsercache löschen"
            aria-label="Browsercache löschen"
          >
            {sidebarExpanded ? "Browsercache löschen" : "⌫"}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col bg-playground-main">
        <div className="relative z-20 flex h-[56px] shrink-0 items-center justify-between gap-2 overflow-visible border-b border-playground-border px-3 sm:px-5">
          <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
            {isMobileLayout ? (
              <button
                type="button"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                onClick={openMobileSidebar}
                aria-label="Chat-Verlauf öffnen"
                title="Chat-Verlauf"
              >
                <span className="text-lg leading-none">≡</span>
              </button>
            ) : null}
            <label htmlFor="model-select" className="sr-only">
              {isModelCompareUseCase ? "Modell A" : "Modell"}
            </label>
            <PlaygroundSelect
              id="model-select"
              value={model}
              onChange={changeModel}
              aria-label={isModelCompareUseCase ? "Modell A" : "Modell"}
              title={
                busy || webSearchBusy || featureRequestsBusy || aiHostingDocsBusy || aiHostingTariffAdvisorBusy || weekendVisitPhase || priceCompareSearchBusy
                  ? "Modell wechseln (bricht die laufende Anfrage ab)"
                  : isModelCompareUseCase
                    ? "Modell A"
                    : "Modell"
              }
              options={
                models.length === 0
                  ? [{ value: model, label: model }]
                  : models.map((m) => ({
                      value: m.id,
                      label: isModelCompareUseCase ? `A: ${m.id}` : m.id,
                    }))
              }
            />
            {isModelCompareUseCase ? (
              <>
                <span
                  className="playground-text-small shrink-0 px-0.5 font-bold text-playground-muted"
                  aria-hidden
                >
                  vs
                </span>
                <label htmlFor="model-select-b" className="sr-only">
                  Modell B
                </label>
                <PlaygroundSelect
                  id="model-select-b"
                  value={compareModelB}
                  onChange={setCompareModelB}
                  disabled={busy || webSearchBusy || featureRequestsBusy || aiHostingDocsBusy || aiHostingTariffAdvisorBusy || priceCompareSearchBusy}
                  title="Modell B"
                  aria-label="Modell B"
                  options={
                    models.length === 0
                      ? [{ value: compareModelB, label: compareModelB }]
                      : models.map((m) => ({
                          value: m.id,
                          label: `B: ${m.id}`,
                        }))
                  }
                />
              </>
            ) : null}
            <ModelSettingsDock
              open={showModelSettings}
              onOpenChange={setShowModelSettings}
              busy={busy}
              panelMode={isMobileLayout ? "fixed" : "docked"}
              buttonClassName="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-playground-muted transition hover:bg-playground-muted/5 hover:text-playground-ink disabled:opacity-40"
              modelId={model}
              onReapplyPreset={() => applyPreset(model)}
              temperature={temperature}
              setTemperature={setTemperature}
              topP={topP}
              setTopP={setTopP}
              topK={topK}
              setTopK={setTopK}
              presencePenalty={presencePenalty}
              setPresencePenalty={setPresencePenalty}
              maxTokens={maxTokens}
              setMaxTokens={setMaxTokens}
              extraBody={extraBody}
              setExtraBody={setExtraBody}
              gptOssReasoning={gptOssReasoning}
              setGptOssReasoning={setGptOssReasoning}
              qwenVisionOcr={qwenVisionOcr}
              setQwenVisionOcr={setQwenVisionOcr}
              qwen38ThinkingEnabled={qwen38ThinkingEnabled}
              setQwen38ThinkingEnabled={setQwen38ThinkingEnabled}
              qwen38ReasoningEffort={qwen38ReasoningEffort}
              setQwen38ReasoningEffort={setQwen38ReasoningEffort}
              systemPrompt={systemPrompt}
              setSystemPrompt={setSystemPrompt}
              webSearchConfig={webSearchConfig}
              webSearchDefaultEnabled={webSearchDefaultEnabled}
              onWebSearchDefaultChange={(enabled) => {
                if (!enabled) setWebSearchDefaultEnabled(false);
                else requestEnableWebSearch("default");
              }}
              webSearchConsentGranted={webSearchConsentGranted}
              onRevokeWebSearchConsent={revokeWebSearchConsent}
            />
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <GridCarbonBadge
              summary={gridCarbonSummary}
              onOpenUseCase={openGridCarbonForecastUseCase}
              active={isGridCarbonForecastUseCase}
            />
            {sessionApiKeyActive ? (
              <span className="playground-text-tiny hidden items-center gap-1.5 font-semibold text-playground-muted sm:inline-flex">
                Eigener API-Key
                <button
                  type="button"
                  onClick={handleClearSessionApiKey}
                  className="rounded px-1 hover:text-playground-ink"
                  title="API-Key aus dieser Session entfernen"
                  aria-label="API-Key entfernen"
                >
                  ×
                </button>
              </span>
            ) : null}
            <label htmlFor="theme-select" className="sr-only">
              Design
            </label>
            <PlaygroundSelect
              id="theme-select"
              compact
              value={themePreference}
              onChange={(v) => setThemePreference(v as ThemePreference)}
              aria-label="Design"
              options={[
                { value: "system", label: "System" },
                { value: "light", label: "Hell" },
                { value: "dark", label: "Dunkel" },
              ]}
            />
          </div>
        </div>
        <div className="relative flex min-h-0 flex-1 flex-col">
          <div ref={chatScrollRef} className="min-h-0 flex-1 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="flex min-h-full flex-col items-center justify-start gap-4 px-4 py-5 sm:gap-5 sm:px-6 sm:py-6">
                {activeUseCase ? (
                  <div className="flex max-w-5xl flex-col items-center gap-2.5 text-center sm:gap-3">
                    <p className="playground-text-hero-label font-bold text-playground-ink">
                      mittwald Playground
                    </p>
                    <h1 className="playground-text-hero max-w-5xl text-playground-ink">
                      {activeUseCase.title}
                    </h1>
                    <p className="playground-text-subtitle max-w-4xl font-medium text-playground-ink">
                      {activeUseCase.description}
                    </p>
                  </div>
                ) : null}
                {isNetworkPathCheckUseCase ? <NetworkPathCheckPanel /> : null}
                {isGridCarbonForecastUseCase ? <GridCarbonForecastPanel /> : null}
                {activeUseCase ? (
                  <PlaygroundUseCaseGuide
                    useCase={activeUseCase}
                    onBack={clearUseCase}
                    speechEnabled={speechToText?.enabled}
                    recording={voiceRecording.active}
                    transcribeProgress={ocrProgress ?? speechTranscribeStatus}
                    briefingValues={briefingValues}
                    activeBriefingFieldId={activeBriefingFieldId}
                    onBriefingChange={handleBriefingChange}
                    onBriefingFieldFocus={handleBriefingFieldFocus}
                    onStartRecording={
                      activeUseCase.prefersSpeech
                        ? () => speechInputRef.current?.startRecording()
                        : undefined
                    }
                  />
                ) : (
                  <>
                    <PlaygroundAiHostingHero
                      aiHostingUrl={aiHostingUrl}
                      playgroundModels={models}
                    />
                    <p className="playground-text-small max-w-2xl text-center font-medium text-playground-muted">
                      {PLAYGROUND_USE_CASES.length} Use Cases für Agenturen — oder stelle eine eigene
                      Frage im Chat.
                    </p>
                    <PlaygroundUseCaseCards
                      cases={PLAYGROUND_USE_CASES}
                      activeId={activeUseCaseId}
                      disabled={busy || speechBusy}
                      onSelect={activateUseCase}
                    />
                    <PlaygroundHostingUpsell aiHostingUrl={aiHostingUrl} className="mt-1" />
                  </>
                )}
              </div>
            ) : (
              <div className="mx-auto w-full max-w-playground space-y-5 px-4 py-6">
                {messages.map((m, i) =>
                  m.role === "assistant" && m.compare ? (
                    <ModelCompareMessageRow
                      key={i}
                      compare={m.compare}
                      streaming={busy && i === messages.length - 1}
                    />
                  ) : (
                    <ChatMessageRow
                      key={i}
                      message={m}
                      streaming={busy && m.role === "assistant" && i === messages.length - 1}
                      webSearchPending={
                        webSearchBusy &&
                        m.role === "assistant" &&
                        i === messages.length - 1 &&
                        typeof m.content === "string" &&
                        m.content === ""
                      }
                      featureRequestsPending={
                        featureRequestsBusy &&
                        m.role === "assistant" &&
                        i === messages.length - 1 &&
                        typeof m.content === "string" &&
                        m.content === ""
                      }
                      aiHostingDocsPending={
                        aiHostingDocsBusy &&
                        m.role === "assistant" &&
                        i === messages.length - 1 &&
                        typeof m.content === "string" &&
                        m.content === ""
                      }
                      aiHostingTariffAdvisorPending={
                        aiHostingTariffAdvisorBusy &&
                        m.role === "assistant" &&
                        i === messages.length - 1 &&
                        typeof m.content === "string" &&
                        m.content === ""
                      }
                      weekendVisitPhase={
                        activeUseCaseId === "client-weekend" &&
                        m.role === "assistant" &&
                        i === messages.length - 1 &&
                        typeof m.content === "string" &&
                        m.content === ""
                          ? weekendVisitPhase ?? (busy ? "generate" : null)
                          : null
                      }
                      priceComparePhase={
                        activeUseCaseId === "price-compare" &&
                        m.role === "assistant" &&
                        i === messages.length - 1 &&
                        typeof m.content === "string" &&
                        m.content === ""
                          ? priceCompareSearchBusy || priceCompareRound
                            ? "search"
                            : busy
                              ? "generate"
                              : null
                          : null
                      }
                      priceCompareRound={priceCompareRound}
                      webSearchProviderLabel={providerLabel(webSearchConfig)}
                      activeUseCaseId={activeUseCaseId}
                      onImageOpen={openImageLightbox}
                    />
                  ),
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {appError?.kind === "rate_limit" ? (
            <div
              className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-neutral-900/30 px-4 py-6 backdrop-blur-[1px] dark:bg-black/45 sm:px-6"
              role="dialog"
              aria-modal="true"
              aria-labelledby="rate-limit-title"
            >
              <div className="pointer-events-auto w-full max-w-[907px]">
                <RateLimitNotice
                  waitMinutes={appError.waitMinutes}
                  scope={appError.scope}
                  scopeLabel={appError.scopeLabel}
                  maxRequests={appError.maxRequests}
                  windowMinutes={appError.windowMinutes}
                  rateLimits={playgroundRateLimits}
                  aiHostingUrl={aiHostingUrl}
                  bonusChat={bonusChatConfig}
                  bonusGrantAvailable={!bonusGrantUsed}
                  sessionApiKeyActive={sessionApiKeyActive}
                  onSaveApiKey={handleSaveSessionApiKey}
                  onClearApiKey={handleClearSessionApiKey}
                  onContinueTesting={handleContinueTesting}
                  continueTestingBusy={continueTestingBusy}
                />
              </div>
            </div>
          ) : null}

          <div className="playground-main-glow shrink-0 border-t border-transparent bg-gradient-to-t from-playground-main via-playground-main to-transparent px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:px-4 sm:pb-3">
            {contextTrimNotice && (
              <div
                className="mx-auto mb-2 max-w-3xl rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100"
                role="status"
              >
                {contextTrimNotice}
              </div>
            )}
            {appError?.kind === "plain" ? (
              <div
                className="mx-auto mb-2 max-w-3xl rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-100"
                role="alert"
              >
                {appError.message}
              </div>
            ) : null}
            {activeUseCase && messages.length > 0 ? (
              <div
                className="mx-auto mb-2 flex max-w-playground flex-col gap-2 rounded-2xl border border-playground-border bg-playground-sidebar px-4 py-2"
                role="status"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="playground-text-small flex items-center gap-2 font-medium text-playground-ink">
                    <span className="text-base" aria-hidden>
                      {activeUseCase.icon}
                    </span>
                    <span>
                      Use Case:{" "}
                      <span className="inline-flex flex-wrap items-center gap-1.5">
                        <span className="font-bold">{activeUseCase.title}</span>
                        {activeUseCase.experimental ? <UseCaseExperimentalBadge /> : null}
                        {activeUseCase.beta ? <UseCaseBetaBadge /> : null}
                      </span>
                      <span className="text-playground-muted">
                        {" "}
                        ·{" "}
                      {isModelCompareUseCase
                        ? `${model} vs ${compareModelB}`
                        : activeModelFallback ? (
                          <>
                            <span className="text-amber-800 dark:text-amber-200">
                              {activeModelFallback.label}
                            </span>
                            <span className="font-normal text-playground-muted">
                              {" "}
                              (Fallback)
                            </span>
                          </>
                        ) : (
                          activeUseCase.modelLabel
                        )}
                      </span>
                    </span>
                  </span>
                  <button
                    type="button"
                    className="playground-text-tiny font-medium text-playground-muted underline decoration-playground-border underline-offset-2 hover:text-playground-ink"
                    onClick={clearUseCase}
                  >
                    Use Case beenden
                  </button>
                </div>
                {priceCompareComposerProgress ? (
                  <UseCaseProgressSteps
                    variant="compact"
                    steps={priceCompareComposerProgress}
                    ariaLabel="Preisvergleich — Fortschritt"
                    accentClassName="sky"
                  />
                ) : null}
                {clientWeekendComposerProgress ? (
                  <UseCaseProgressSteps
                    variant="compact"
                    steps={clientWeekendComposerProgress}
                    ariaLabel="Wochenende mit Kunde — Fortschritt"
                    accentClassName="amber"
                  />
                ) : null}
                {aiHostingGuideComposerProgress ? (
                  <UseCaseProgressSteps
                    variant="compact"
                    steps={aiHostingGuideComposerProgress}
                    ariaLabel="AI Hosting Guide — Fortschritt"
                    accentClassName="violet"
                  />
                ) : null}
                {aiHostingTariffAdvisorComposerProgress ? (
                  <UseCaseProgressSteps
                    variant="compact"
                    steps={aiHostingTariffAdvisorComposerProgress}
                    ariaLabel="AI Hosting Tarifberater — Fortschritt"
                    accentClassName="emerald"
                  />
                ) : null}
                {semanticSearchComposerProgress ? (
                  <UseCaseProgressSteps
                    variant="compact"
                    steps={semanticSearchComposerProgress}
                    detail={semanticSearchProgressDetail}
                    ariaLabel="Semantische Suche — Fortschritt"
                    accentClassName="violet"
                  />
                ) : null}
                {audioTranscribeComposerProgress ? (
                  <UseCaseProgressSteps
                    variant="compact"
                    steps={audioTranscribeComposerProgress}
                    detail={audioTranscribeProgressDetail}
                    ariaLabel="Audio transkribieren — Fortschritt"
                    accentClassName="emerald"
                  />
                ) : null}
              </div>
            ) : null}
            {imageFile && (
              <div className="mx-auto mb-2 flex max-w-3xl items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                {imagePreview ? (
                  <ChatImagePreviewThumb src={imagePreview} onOpen={openImageLightbox} />
                ) : attachmentIsPdf ? (
                  <span
                    className="flex h-9 shrink-0 items-center rounded-lg bg-playground-muted/10 px-2.5 font-medium text-playground-ink ring-1 ring-playground-border"
                    aria-hidden
                  >
                    PDF
                  </span>
                ) : attachmentIsAudio ? (
                  <span
                    className="flex h-9 shrink-0 items-center rounded-lg bg-playground-muted/10 px-2.5 font-medium text-playground-ink ring-1 ring-playground-border"
                    aria-hidden
                  >
                    🎙️
                  </span>
                ) : null}
                <span className="min-w-0 truncate text-playground-muted">
                  {attachmentIsAudio
                    ? audioAttachmentLabel(imageFile, audioFileDurationSec)
                    : imageFile.name}
                </span>
                <button type="button" className="shrink-0 underline" onClick={() => setImageFile(null)} disabled={busy}>
                  Anhang entfernen
                </button>
              </div>
            )}
            <div className="mx-auto w-full max-w-playground">
              <div
                className={`flex gap-2 sm:gap-4 ${
                  isMobileLayout ? "items-end" : composerTall ? "items-end" : "items-center"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <WebSearchModeChip
                    config={webSearchConfig}
                    active={activeThreadWebSearch}
                    searching={webSearchBusy}
                    disabled={busy || voiceRecording.active || speechTranscribing || composerPipelineBusy}
                    onDeactivate={() => setActiveThreadWebSearch(false)}
                  />
                  {isMobileLayout ? (
                    <div
                      className={`playground-surface-glass flex w-full min-w-0 flex-col overflow-hidden rounded-[22px] border border-transparent px-0 py-0 ${
                        voiceRecording.active ? "overflow-hidden" : ""
                      } ${
                        activeThreadWebSearch ? "ring-1 ring-sky-300/50 dark:ring-sky-400/30" : ""
                      }`}
                      onPasteCapture={handleComposerPasteCapture}
                    >
                      <div className="w-full min-w-0 px-3 pt-2.5">
                        {voiceRecording.active ? (
                          <SpeechWaveform stream={voiceRecording.stream} compact />
                        ) : composerPipelineBusy ? (
                          <p
                            className="playground-text-small min-w-0 py-1 font-medium text-playground-muted"
                            role="status"
                          >
                            {composerPipelineStatus}
                          </p>
                        ) : speechTranscribing ? (
                          <SpeechTranscribingIndicator />
                        ) : (
                          <textarea
                            ref={inputRef}
                            className={`playground-composer-input w-full min-w-0 max-h-40 resize-none overflow-hidden bg-transparent py-0.5 text-left text-playground-ink outline-none placeholder:text-playground-muted ${
                              composerTall ? "leading-normal" : "min-h-[1.375rem] leading-snug"
                            }`}
                            rows={1}
                            placeholder={composerPlaceholder}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                void send();
                              }
                            }}
                          />
                        )}
                      </div>
                      <div className="flex min-w-0 items-center gap-0.5 px-2 pb-2 pt-1">
                        <label
                          className={`flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-playground-ink hover:bg-playground-muted/5 ${
                            voiceRecording.active || speechTranscribing || composerPipelineBusy
                              ? "pointer-events-none opacity-40"
                              : ""
                          }`}
                        >
                          <span className="text-xl font-light leading-none">+</span>
                          <input
                            type="file"
                            accept={composerFileAccept}
                            className="hidden"
                            disabled={busy}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              e.target.value = "";
                              setImageFile(f ?? null);
                            }}
                          />
                        </label>
                        <WebSearchGlobeToggle
                          config={webSearchConfig}
                          active={activeThreadWebSearch}
                          searching={webSearchBusy}
                          disabled={
                            busy || voiceRecording.active || speechTranscribing || composerPipelineBusy
                          }
                          onToggle={toggleThreadWebSearch}
                          compact
                        />
                        <div className="min-w-0 flex-1" aria-hidden />
                        {voiceRecording.active ? (
                          <VoiceRecordingControls
                            compact
                            disabled={busy}
                            onCancel={() =>
                              speechInputRef.current?.stopRecording({ skipTranscribe: true })
                            }
                            onConfirm={() => speechInputRef.current?.stopRecording()}
                          />
                        ) : busy ? (
                          <button
                            type="button"
                            onClick={stop}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-playground-border bg-playground-sidebar text-xs font-medium text-playground-ink hover:bg-playground-muted/5"
                            title="Stoppen"
                          >
                            ■
                          </button>
                        ) : (
                          <>
                            {showSpeechInComposer ? (
                              <SpeechInputButton
                                ref={speechInputRef}
                                disabled={busy}
                                language={speechToText.language}
                                maxAudioBytes={speechToText.maxAudioBytes}
                                longRecording={Boolean(activeUseCase?.prefersLongSpeech)}
                                onTranscript={handleSpeechTranscript}
                                onTranscriptSegment={handleSpeechTranscriptSegment}
                                onTranscribeProgress={handleSpeechTranscribeProgress}
                                onError={setAppError}
                                rateLimits={playgroundRateLimits}
                                onBusyChange={setSpeechBusy}
                                onRecordingChange={handleVoiceRecordingChange}
                                className="h-9 w-9 shrink-0 rounded-full border-0 bg-playground-muted/10 text-playground-ink shadow-none hover:bg-playground-muted/15 dark:border-0 dark:bg-playground-muted/15 dark:hover:bg-playground-muted/20"
                              />
                            ) : null}
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => void send()}
                              disabled={!canSend}
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-playground-send text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35"
                              title={sendButtonTitle}
                            >
                              <ArrowUpIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                  <div
                    className={`playground-surface-glass flex w-full min-w-0 border border-transparent min-h-12 gap-1.5 py-1.5 pl-4 pr-1.5 sm:min-h-14 sm:gap-2 sm:py-2 sm:pr-2 ${
                      composerTall ? "items-end rounded-[28px]" : "items-center rounded-full"
                    } ${
                      voiceRecording.active ? "overflow-hidden" : ""
                    } ${
                      activeThreadWebSearch ? "ring-1 ring-sky-300/50 dark:ring-sky-400/30" : ""
                    }`}
                    onPasteCapture={handleComposerPasteCapture}
                  >
                  <label
                    className={`flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-playground-ink hover:bg-playground-muted/5 sm:h-9 sm:w-9 ${
                      voiceRecording.active || speechTranscribing || composerPipelineBusy
                        ? "pointer-events-none opacity-40"
                        : ""
                    }`}
                  >
                    <span className="text-lg font-light leading-none sm:text-xl">+</span>
                    <input
                      type="file"
                      accept={composerFileAccept}
                      className="hidden"
                      disabled={busy}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        e.target.value = "";
                        setImageFile(f ?? null);
                      }}
                    />
                  </label>
                  <WebSearchGlobeToggle
                    config={webSearchConfig}
                    active={activeThreadWebSearch}
                    searching={webSearchBusy}
                    disabled={busy || voiceRecording.active || speechTranscribing || composerPipelineBusy}
                    onToggle={toggleThreadWebSearch}
                    compact={false}
                  />
                  {showSpeechInComposer ? (
                    <SpeechInputButton
                      ref={speechInputRef}
                      disabled={busy}
                      language={speechToText.language}
                      maxAudioBytes={speechToText.maxAudioBytes}
                      longRecording={Boolean(activeUseCase?.prefersLongSpeech)}
                      onTranscript={handleSpeechTranscript}
                      onTranscriptSegment={handleSpeechTranscriptSegment}
                      onTranscribeProgress={handleSpeechTranscribeProgress}
                      onError={setAppError}
                      rateLimits={playgroundRateLimits}
                      onBusyChange={setSpeechBusy}
                      onRecordingChange={handleVoiceRecordingChange}
                      className={
                        voiceRecording.active ? "sr-only" : "h-8 w-8 sm:h-9 sm:w-9"
                      }
                    />
                  ) : null}
                  {voiceRecording.active ? (
                    <>
                      <SpeechWaveform stream={voiceRecording.stream} />
                      <VoiceRecordingControls
                        disabled={busy}
                        onCancel={() =>
                          speechInputRef.current?.stopRecording({ skipTranscribe: true })
                        }
                        onConfirm={() => speechInputRef.current?.stopRecording()}
                      />
                    </>
                  ) : composerPipelineBusy ? (
                    <p
                      className="playground-text-small min-w-0 flex-1 px-1 font-medium text-playground-muted"
                      role="status"
                    >
                      {composerPipelineStatus}
                    </p>
                  ) : speechTranscribing ? (
                    <SpeechTranscribingIndicator />
                  ) : (
                    <textarea
                      ref={inputRef}
                      className={`playground-composer-input min-w-0 max-h-52 flex-1 resize-none overflow-hidden bg-transparent text-left text-playground-ink outline-none placeholder:text-playground-muted ${
                        composerTall
                          ? "py-1.5 leading-normal"
                          : "playground-composer-input--single min-h-10"
                      } ${composerTall ? "self-stretch" : "self-center"}`}
                      rows={1}
                      placeholder={composerPlaceholder}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          void send();
                        }
                      }}
                    />
                  )}
                  </div>
                  )}
                </div>
                <div
                  className={`flex shrink-0 items-center justify-center ${
                    isMobileLayout || voiceRecording.active
                      ? "hidden"
                      : "h-14 w-14"
                  }`}
                >
                  {busy ? (
                    <button
                      type="button"
                      onClick={stop}
                      className={`flex shrink-0 items-center justify-center rounded-full border border-playground-border bg-playground-sidebar font-medium text-playground-ink hover:bg-playground-muted/5 ${
                        isMobileLayout ? "h-10 w-10 text-xs" : "h-14 w-14 text-sm"
                      }`}
                      title="Stoppen"
                    >
                      ■
                    </button>
                  ) : (
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => void send()}
                      disabled={!canSend}
                      className={`flex shrink-0 items-center justify-center rounded-full bg-playground-send text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35 ${
                        isMobileLayout ? "h-10 w-10" : "h-14 w-14"
                      }`}
                      title={sendButtonTitle}
                    >
                      <ArrowUpIcon className={isMobileLayout ? "h-4 w-4" : "h-5 w-5"} />
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="mx-auto mt-4 max-w-playground px-2 text-center">
              <div className="playground-text-tiny font-medium text-playground-ink">
                {sessionCo2Grams > 0 ? (
                  <p className="mb-0">
                    <SessionCo2Footprint grams={sessionCo2Grams} compact inline />
                  </p>
                ) : null}
                {isMobileLayout ? (
                  <details className="mx-auto inline-block max-w-2xl text-left">
                    <summary className="cursor-pointer list-none text-playground-muted underline [&::-webkit-details-marker]:hidden">
                      Hinweis zum Test-Playground
                    </summary>
                    <p className="mt-2 text-playground-muted">
                      Dies ist ein reiner Test-Playground: Du kannst die Modelle ausprobieren und dir einen ersten
                      Eindruck verschaffen. Der Chat wird nicht serverseitig gespeichert und ist weder für den
                      produktiven Einsatz noch für vertrauliche oder geschäftskritische Inhalte vorgesehen.
                    </p>
                  </details>
                ) : (
                  <p className="mx-auto inline-block max-w-2xl">
                    Dies ist ein reiner Test-Playground: Du kannst die Modelle ausprobieren und dir einen ersten Eindruck
                    verschaffen. Der Chat wird nicht serverseitig gespeichert und ist weder für den produktiven Einsatz
                    noch für vertrauliche oder geschäftskritische Inhalte vorgesehen.
                  </p>
                )}
              </div>
              {pageFooterLinks.length > 0 ? (
                <p className="playground-text-tiny mt-4 font-medium">
                  <PlaygroundLinksFooter links={pageFooterLinks} />
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <WebSearchConsentDialog
        open={webSearchConsentOpen}
        webSearchConfig={webSearchConfig}
        onConfirm={confirmWebSearchConsent}
        onCancel={cancelWebSearchConsent}
      />
      <DeleteAllChatsDialog
        open={deleteAllChatsOpen}
        chatCount={threads.length}
        onConfirm={deleteAllChats}
        onCancel={() => setDeleteAllChatsOpen(false)}
      />
      <ClearBrowserCacheDialog
        open={clearBrowserCacheOpen}
        onConfirm={clearBrowserCache}
        onCancel={() => setClearBrowserCacheOpen(false)}
      />
      <ImageLightbox
        open={imageLightbox !== null}
        src={imageLightbox?.src ?? ""}
        alt={imageLightbox?.alt ?? ""}
        onClose={closeImageLightbox}
      />
    </div>
  );
}
