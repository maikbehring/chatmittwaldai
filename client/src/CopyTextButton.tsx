import { useCallback, useState } from "react";

type CopyTextButtonProps = {
  text: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
};

export function extractMarkdownCodeBlocks(markdown: string): string[] {
  const blocks: string[] = [];
  const re = /```[^\n]*\n([\s\S]*?)```/g;
  let match = re.exec(markdown);
  while (match) {
    const block = match[1].trim();
    if (block) blocks.push(block);
    match = re.exec(markdown);
  }
  return blocks;
}

export type CopySection = {
  label: string;
  text: string;
};

/** Paart **Überschrift** mit dem nächsten Codeblock — für kontextuelle Kopieren-Labels. */
export function extractCopySections(markdown: string): CopySection[] {
  const sections: CopySection[] = [];
  const re = /\*\*([^*]+)\*\*\s*\n```[^\n]*\n([\s\S]*?)```/g;
  let match = re.exec(markdown);
  while (match) {
    const text = match[2].trim();
    if (text) sections.push({ label: match[1].trim(), text });
    match = re.exec(markdown);
  }
  if (sections.length > 0) return sections;

  return extractMarkdownCodeBlocks(markdown).map((text, i) => ({
    label: `Block ${i + 1}`,
    text,
  }));
}

export function CopyTextButton({
  text,
  label = "Kopieren",
  copiedLabel = "Kopiert",
  className = "",
}: CopyTextButtonProps) {
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* Clipboard kann z. B. ohne Berechtigung fehlschlagen */
    }
  }, [text]);

  return (
    <button
      type="button"
      onClick={() => void onCopy()}
      title={copied ? copiedLabel : label}
      className={`playground-text-small inline-flex h-9 items-center gap-1.5 rounded-full border border-playground-border bg-playground-sidebar px-3 font-bold text-playground-ink transition hover:bg-playground-muted/5 ${className}`.trim()}
    >
      {copied ? (
        <>
          <span aria-hidden>✓</span>
          {copiedLabel}
        </>
      ) : (
        <>
          <span aria-hidden className="text-playground-muted">
            ⧉
          </span>
          {label}
        </>
      )}
    </button>
  );
}
