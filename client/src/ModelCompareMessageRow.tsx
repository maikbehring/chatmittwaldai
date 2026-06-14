import { ChatMarkdown } from "./ChatMarkdown";
import { CopyTextButton } from "./CopyTextButton";
import { modelShortLabel, type ModelComparePayload, type ModelCompareUsage } from "./modelCompare";

function AssistantTokenFooter({ stats }: { stats: ModelCompareUsage }) {
  const fmt = (n: number | null) => (n == null ? "—" : n.toLocaleString("de-DE"));
  const tps =
    stats.outputTokensPerSec == null
      ? "—"
      : `${stats.outputTokensPerSec.toLocaleString("de-DE", { maximumFractionDigits: 1 })} tok/s`;

  return (
    <p className="mt-2 text-[10px] leading-relaxed text-playground-muted">
      <span>Eingabe: {fmt(stats.promptTokens)}</span>
      <span className="mx-1" aria-hidden>
        ·
      </span>
      <span>Ausgabe: {fmt(stats.completionTokens)}</span>
      <span className="mx-1" aria-hidden>
        ·
      </span>
      <span>{tps}</span>
    </p>
  );
}

function plainText(content: string | ModelComparePayload["modelA"]["content"]): string {
  if (typeof content === "string") return content;
  return content
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("\n");
}

function CompareColumn({
  label,
  modelId,
  content,
  usage,
  streaming,
}: {
  label: string;
  modelId: string;
  content: string;
  usage?: ModelCompareUsage;
  streaming: boolean;
}) {
  const text = content.trim();
  return (
    <div className="flex min-w-0 flex-1 flex-col rounded-2xl border border-playground-border bg-playground-sidebar p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-playground-border pb-3">
        <div className="min-w-0">
          <p className="playground-text-tiny font-bold uppercase tracking-wide text-playground-muted">
            {label}
          </p>
          <p className="playground-text-small truncate font-bold text-playground-ink" title={modelId}>
            {modelShortLabel(modelId)}
          </p>
        </div>
        {text && !streaming ? (
          <CopyTextButton text={text} label="Kopieren" className="shrink-0" />
        ) : null}
      </div>
      <div className="playground-text-chat min-h-[2rem] text-playground-muted">
        {streaming && !text ? (
          <p className="flex items-center gap-2 text-playground-muted" role="status">
            <span
              className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-playground-send border-t-transparent"
              aria-hidden
            />
            Generiert …
          </p>
        ) : text ? (
          <ChatMarkdown>{text}</ChatMarkdown>
        ) : null}
      </div>
      {usage ? <AssistantTokenFooter stats={usage} /> : null}
    </div>
  );
}

type Props = {
  compare: ModelComparePayload;
  streaming: boolean;
};

export function ModelCompareMessageRow({ compare, streaming }: Props) {
  const textA = plainText(compare.modelA.content);
  const textB = plainText(compare.modelB.content);

  return (
    <div className="flex w-full justify-start">
      <div className="grid w-full max-w-full gap-3 sm:grid-cols-2 sm:gap-4">
        <CompareColumn
          label="Modell A"
          modelId={compare.modelA.modelId}
          content={textA}
          usage={compare.modelA.usage}
          streaming={streaming && !textA}
        />
        <CompareColumn
          label="Modell B"
          modelId={compare.modelB.modelId}
          content={textB}
          usage={compare.modelB.usage}
          streaming={streaming && !textB}
        />
      </div>
    </div>
  );
}
