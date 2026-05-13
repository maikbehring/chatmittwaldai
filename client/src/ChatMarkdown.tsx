import { useCallback, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  children: string;
};

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/** Fenced code block mit Kopieren-Button (react-markdown: pre > code.language-*). */
function MarkdownPreWithCopy({ children }: { children: React.ReactNode }) {
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    const root = preRef.current;
    if (!root) return;
    const codeEl = root.querySelector("code");
    const raw = codeEl?.textContent ?? root.textContent ?? "";
    const text = raw.replace(/\s+$/, "");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* Clipboard kann z. B. ohne Berechtigung fehlschlagen */
    }
  }, []);

  return (
    <div className="relative mb-2 max-w-full">
      <button
        type="button"
        onClick={copy}
        title={copied ? "Kopiert" : "In Zwischenablage kopieren"}
        aria-label={copied ? "Kopiert" : "Code in die Zwischenablage kopieren"}
        className="absolute right-2 top-2 z-10 flex h-8 min-w-[2rem] items-center justify-center rounded-md border border-neutral-600/70 bg-neutral-800/95 px-2 text-neutral-200 shadow-sm backdrop-blur-[2px] transition hover:border-neutral-500 hover:bg-neutral-700 hover:text-white dark:border-neutral-500/60 dark:bg-neutral-950/95 dark:hover:bg-neutral-800"
      >
        {copied ? (
          <CheckIcon className="text-emerald-400" />
        ) : (
          <CopyIcon className="opacity-90" />
        )}
      </button>
      <pre
        ref={preRef}
        className="max-w-full overflow-x-auto rounded-lg border border-neutral-300 bg-neutral-900 pb-3 pl-3 pr-3 pt-10 text-xs leading-relaxed text-neutral-100 shadow-inner dark:border-neutral-600"
      >
        {children}
      </pre>
    </div>
  );
}

export function ChatMarkdown({ children }: Props) {
  return (
    <div className="chat-markdown max-w-none text-[15px] leading-relaxed text-ink [&_a]:text-accent [&_a]:underline [&_li>p]:mb-0 [&_li>p:last-child]:mb-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p({ children }) {
            return <p className="mb-2 last:mb-0">{children}</p>;
          },
          h1: ({ children }) => (
            <h3 className="mb-2 mt-3 text-[1.05rem] font-semibold first:mt-0">{children}</h3>
          ),
          h2: ({ children }) => (
            <h3 className="mb-2 mt-3 text-[1.05rem] font-semibold first:mt-0">{children}</h3>
          ),
          h3: ({ children }) => (
            <h4 className="mb-1 mt-2 text-[0.95rem] font-semibold first:mt-0">{children}</h4>
          ),
          ul({ children }) {
            return <ul className="mb-2 list-disc space-y-1 pl-5">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="mb-2 list-decimal space-y-1 pl-5">{children}</ol>;
          },
          li({ children }) {
            return <li className="leading-snug">{children}</li>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="mb-2 border-l-4 border-neutral-300 pl-3 text-ink-muted italic dark:border-neutral-600">
                {children}
              </blockquote>
            );
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="break-words underline underline-offset-2"
              >
                {children}
              </a>
            );
          },
          table({ children }) {
            return (
              <div className="mb-2 max-w-full overflow-x-auto rounded-lg border border-neutral-200 bg-neutral-50/80 dark:border-neutral-700 dark:bg-neutral-900/50">
                <table className="w-full min-w-[16rem] border-collapse text-left text-[13px]">{children}</table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className="border-b border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800/80">{children}</thead>;
          },
          tbody({ children }) {
            return <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">{children}</tbody>;
          },
          tr({ children }) {
            return <tr className="align-top">{children}</tr>;
          },
          th({ children }) {
            return (
              <th className="max-w-[12rem] whitespace-normal px-2.5 py-2 font-semibold text-ink">
                {children}
              </th>
            );
          },
          td({ children }) {
            return <td className="max-w-[14rem] whitespace-normal px-2.5 py-2 text-ink">{children}</td>;
          },
          strong({ children }) {
            return <strong className="font-semibold text-ink">{children}</strong>;
          },
          em({ children }) {
            return <em className="italic text-ink">{children}</em>;
          },
          del({ children }) {
            return <del className="text-ink-muted line-through">{children}</del>;
          },
          pre({ children }) {
            return <MarkdownPreWithCopy>{children}</MarkdownPreWithCopy>;
          },
          code({ className, children, ...props }) {
            const isFence = typeof className === "string" && className.startsWith("language-");
            if (!isFence) {
              return (
                <code
                  className="rounded bg-neutral-200 px-1.5 py-0.5 font-mono text-[0.88em] text-ink dark:bg-neutral-700 dark:text-neutral-100"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code className={`block font-mono text-neutral-100 ${className ?? ""}`} {...props}>
                {children}
              </code>
            );
          },
          hr() {
            return <hr className="my-3 border-neutral-200 dark:border-neutral-600" />;
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
