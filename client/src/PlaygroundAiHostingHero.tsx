import { PlaygroundAiHostingHeroIllustration } from "./PlaygroundAiHostingHeroIllustration";
import { assetUrl } from "./appPaths";
import { MITTWALD_AI_HOSTING_TARIFF_URL } from "./playgroundSalesLinks";

const MODEL_DOCS_URL =
  "https://developer.mittwald.de/de/docs/v2/platform/aihosting/models/";

const MODEL_LOGOS = {
  openai: "brand/models/openai.svg",
  qwen: "brand/models/qwen.svg",
  mistral: "brand/models/mistral.svg",
  zhipu: "brand/models/zhipu.svg",
  whisper: "brand/models/whisper.svg",
} as const;

type ModelLogoKey = keyof typeof MODEL_LOGOS;

type ShowcaseModel = {
  id: string;
  label: string;
  logo: ModelLogoKey;
  iconClass: string;
};

/** Über dedizierte Use Cases testbar (nicht zwingend im Chat-Dropdown). */
const USE_CASE_PLAYGROUND_MODEL_IDS = new Set([
  "Whisper",
  "Qwen3-Embedding-8B",
  "Qwen3-VL-Reranker-2B",
]);

function isPlaygroundTestable(modelId: string, playgroundModelIds: Set<string>): boolean {
  return playgroundModelIds.has(modelId) || USE_CASE_PLAYGROUND_MODEL_IDS.has(modelId);
}

const QWEN_SIZE_SHOWCASE_MODELS: ShowcaseModel[] = [
  {
    id: "Qwen3.5-0.8B",
    label: "Qwen3.5 0.8B",
    logo: "qwen",
    iconClass: "bg-indigo-500/10",
  },
  {
    id: "Qwen3.6-35B-A3B-FP8",
    label: "Qwen3.6 35B",
    logo: "qwen",
    iconClass: "bg-indigo-500/10",
  },
  {
    id: "Qwen3.5-122B-A10B-FP8",
    label: "Qwen3.5 122B",
    logo: "qwen",
    iconClass: "bg-indigo-500/10",
  },
];

const SHOWCASE_MODELS_LEADING: ShowcaseModel[] = [
  {
    id: "gpt-oss-120b",
    label: "gpt-oss-120b",
    logo: "openai",
    iconClass: "bg-violet-500/15",
  },
];

const SHOWCASE_MODELS_TRAILING: ShowcaseModel[] = [
  {
    id: "Mistral-Medium-3.5-128B",
    label: "Mistral Medium 128B",
    logo: "mistral",
    iconClass: "bg-orange-500/10",
  },
  {
    id: "Ministral-3-14B-Instruct-2512",
    label: "Ministral 3 14B",
    logo: "mistral",
    iconClass: "bg-orange-500/10",
  },
  {
    id: "Qwen3-Embedding-8B",
    label: "Qwen3-Embedding-8B",
    logo: "qwen",
    iconClass: "bg-emerald-500/10",
  },
  {
    id: "Whisper",
    label: "Whisper",
    logo: "whisper",
    iconClass: "bg-violet-500/15",
  },
  {
    id: "GLM-OCR",
    label: "GLM-OCR",
    logo: "zhipu",
    iconClass: "bg-sky-500/10",
  },
  {
    id: "Qwen3-VL-Reranker-2B",
    label: "Qwen3-VL-Reranker-2B",
    logo: "qwen",
    iconClass: "bg-sky-500/10",
  },
];

const SHOWCASE_MODELS: ShowcaseModel[] = [
  ...SHOWCASE_MODELS_LEADING,
  ...QWEN_SIZE_SHOWCASE_MODELS,
  ...SHOWCASE_MODELS_TRAILING,
];

const PILLAR_ICONS = {
  models: "brand/hero/pillar-open-models.svg",
  hosting: "brand/hero/pillar-hosting-de.svg",
  api: "brand/hero/pillar-api.svg",
  responsible: "brand/hero/pillar-responsible-ai.svg",
} as const;

const PILLARS = [
  {
    image: PILLAR_ICONS.models,
    iconClass: "bg-violet-500/10",
    title: "Open Weight Modelle",
    text: "Transparente, leistungsstarke KI",
  },
  {
    image: PILLAR_ICONS.hosting,
    iconClass: "bg-emerald-500/10",
    title: "Hosting in Deutschland",
    text: "DSGVO-konform & sicher",
  },
  {
    image: PILLAR_ICONS.api,
    iconClass: "bg-sky-500/10",
    title: "OpenAI-kompatible API",
    text: "Nahtlos in deine Anwendungen",
  },
  {
    image: PILLAR_ICONS.responsible,
    iconClass: "bg-amber-500/10",
    title: "KI verantwortungsvoll einsetzen",
    text: "Verschiedene Modellgrößen für jeden Anwendungsfall",
  },
] as const;

function PillarIcon({ image, iconClass }: { image: string; iconClass: string }) {
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl p-1.5 ${iconClass}`}
      aria-hidden
    >
      <img src={assetUrl(image)} alt="" className="h-5 w-5 object-contain" />
    </span>
  );
}

function ModelChip({
  model,
  inPlayground,
}: {
  model: ShowcaseModel;
  inPlayground: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border border-playground-border bg-playground-sidebar px-3 py-1.5 shadow-sm"
      title={inPlayground ? `${model.id} — im Playground testbar` : `${model.id} — über AI Hosting API`}
    >
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full p-0.5 ${model.iconClass}`}
        aria-hidden
      >
        <img
          src={assetUrl(MODEL_LOGOS[model.logo])}
          alt=""
          className={`h-4 w-4 object-contain ${model.logo === "openai" ? "dark:invert" : ""}`}
        />
      </span>
      <span className="playground-text-small whitespace-nowrap font-semibold text-playground-ink">
        {model.label}
      </span>
    </span>
  );
}

type Props = {
  aiHostingUrl?: string;
  className?: string;
  /** Chat-Dropdown aus /api/models (Allowlist); Use-Case-Modelle werden ergänzt gezählt. */
  playgroundModels?: { id: string }[];
};

export function PlaygroundAiHostingHero({
  aiHostingUrl = MITTWALD_AI_HOSTING_TARIFF_URL,
  className = "",
  playgroundModels = [],
}: Props) {
  const modelCount = SHOWCASE_MODELS.length;
  const playgroundModelIds = new Set(playgroundModels.map((m) => m.id));
  const playgroundCount = SHOWCASE_MODELS.filter((m) =>
    isPlaygroundTestable(m.id, playgroundModelIds),
  ).length;

  return (
    <section
      className={`w-full max-w-[960px] overflow-hidden rounded-2xl border border-playground-border bg-playground-sidebar sm:rounded-3xl ${className}`.trim()}
      aria-labelledby="playground-ai-hero-title"
    >
      <div className="relative px-4 py-5 sm:px-6 sm:py-7">
        <div
          className="pointer-events-none absolute -right-8 top-0 hidden h-40 w-40 rounded-full bg-playground-send/10 blur-3xl sm:block"
          aria-hidden
        />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_minmax(0,220px)] lg:items-start lg:gap-8">
          <div className="space-y-4 text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 playground-text-tiny font-semibold text-emerald-800 dark:text-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
              Live im Playground · mittwald AI Hosting
            </span>
            <div className="space-y-2">
              <h1
                id="playground-ai-hero-title"
                className="font-display text-[clamp(1.625rem,4vw,2.25rem)] font-semibold leading-[1.08] tracking-tight text-playground-ink"
              >
                Open Weight AI. Auf{" "}
                <span className="bg-gradient-to-r from-playground-send to-sky-500 bg-clip-text text-transparent">
                  deutscher Infrastruktur.
                </span>
              </h1>
              <p className="playground-text-body mx-auto max-w-xl font-medium text-playground-muted lg:mx-0">
                Teste Chat-Modelle direkt im Browser. Dieselben Open-Weight-Modelle stehen dir
                produktiv über unsere{" "}
                <a
                  href={MODEL_DOCS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-playground-link underline decoration-playground-link/30 underline-offset-2 hover:text-playground-link-hover"
                >
                  OpenAI-kompatible API
                </a>{" "}
                zur Verfügung.
              </p>
            </div>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 sm:text-left">
              {PILLARS.map((p) => (
                <li key={p.title} className="flex flex-col items-center gap-1.5 sm:items-start">
                  <PillarIcon image={p.image} iconClass={p.iconClass} />
                  <span className="playground-text-small font-bold text-playground-ink">{p.title}</span>
                  <span className="playground-text-tiny text-playground-muted">{p.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <PlaygroundAiHostingHeroIllustration />
        </div>
      </div>

      <div className="border-t border-playground-border bg-playground-main/40 px-4 py-4 sm:px-6 sm:py-5">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="playground-text-small text-center font-bold text-playground-ink sm:text-left">
            Heute verfügbar:{" "}
            <span className="text-playground-send">{modelCount} Open-Weight-Modelle</span>
            {playgroundModelIds.size > 0 ? (
              <span className="font-medium text-playground-muted">
                {" "}
                · {playgroundCount} im Playground testbar
              </span>
            ) : null}
          </p>
          <a
            href={MODEL_DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="playground-text-tiny text-center font-semibold text-playground-link underline decoration-playground-link/30 underline-offset-2 hover:text-playground-link-hover sm:text-right"
          >
            Alle Modelle über dieselbe OpenAI-kompatible API
          </a>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
          {SHOWCASE_MODELS_LEADING.map((m) => (
            <ModelChip
              key={m.id}
              model={m}
              inPlayground={isPlaygroundTestable(m.id, playgroundModelIds)}
            />
          ))}
          <div
            className="inline-flex flex-nowrap items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/[0.06] px-1.5 py-1"
            title="Qwen-Modelle nach Größe (aufsteigend)"
          >
            {QWEN_SIZE_SHOWCASE_MODELS.map((m) => (
              <ModelChip
                key={m.id}
                model={m}
                inPlayground={isPlaygroundTestable(m.id, playgroundModelIds)}
              />
            ))}
          </div>
          {SHOWCASE_MODELS_TRAILING.map((m) => (
            <ModelChip
              key={m.id}
              model={m}
              inPlayground={isPlaygroundTestable(m.id, playgroundModelIds)}
            />
          ))}
          <a
            href={aiHostingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-dashed border-playground-border bg-playground-sidebar/60 px-3 py-1.5 playground-text-small font-semibold text-playground-muted transition hover:border-playground-send/40 hover:text-playground-ink"
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full bg-playground-muted/10 text-xs"
              aria-hidden
            >
              +
            </span>
            und mehr…
          </a>
        </div>
      </div>
    </section>
  );
}
