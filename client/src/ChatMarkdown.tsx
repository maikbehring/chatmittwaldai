import { createContext, useCallback, useContext, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  children: string;
};

const MarkdownInPreContext = createContext(false);

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

/** Fenced code block mit Kopieren-Button (react-markdown: pre > code). */
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
    <div className="relative mb-3 max-w-full">
      <button
        type="button"
        onClick={copy}
        title={copied ? "Kopiert" : "In Zwischenablage kopieren"}
        aria-label={copied ? "Kopiert" : "Code in die Zwischenablage kopieren"}
        className="absolute right-2 top-2 z-10 flex h-8 min-w-[2rem] items-center justify-center rounded-lg border border-playground-border bg-playground-sidebar px-2 text-playground-muted shadow-sm transition hover:bg-playground-muted/5 hover:text-playground-ink"
      >
        {copied ? (
          <CheckIcon className="text-playground-send" />
        ) : (
          <CopyIcon className="opacity-80" />
        )}
      </button>
      <MarkdownInPreContext.Provider value={true}>
        <pre
          ref={preRef}
          className="chat-markdown-pre max-w-full overflow-x-auto rounded-xl border border-playground-border bg-playground-sidebar px-4 pb-4 pr-4 pt-10 font-mono text-sm leading-relaxed text-playground-ink shadow-sm"
        >
          {children}
        </pre>
      </MarkdownInPreContext.Provider>
    </div>
  );
}

export function ChatMarkdown({ children }: Props) {
  return (
    <div className="chat-markdown max-w-none text-sm leading-relaxed text-playground-ink [&_a]:text-playground-send [&_a]:underline [&_li>p]:mb-0 [&_li>p:last-child]:mb-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p({ children }) {
            return <p className="mb-2.5 leading-relaxed text-playground-ink last:mb-0">{children}</p>;
          },
          h1: ({ children }) => (
            <h3 className="mb-2 mt-4 text-base font-semibold text-playground-ink first:mt-0">{children}</h3>
          ),
          h2: ({ children }) => (
            <h3 className="mb-2 mt-4 text-base font-semibold text-playground-ink first:mt-0">{children}</h3>
          ),
          h3: ({ children }) => (
            <h4 className="mb-1.5 mt-3 text-[0.95rem] font-semibold text-playground-ink first:mt-0">{children}</h4>
          ),
          ul({ children }) {
            return <ul className="mb-2.5 list-disc space-y-1.5 pl-5 text-playground-ink">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="mb-2.5 list-decimal space-y-1.5 pl-5 text-playground-ink">{children}</ol>;
          },
          li({ children }) {
            return <li className="leading-relaxed">{children}</li>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="mb-2.5 border-l-4 border-playground-border pl-3 italic text-playground-muted">
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
              <div className="mb-2.5 max-w-full overflow-x-auto rounded-xl border border-playground-border bg-playground-sidebar">
                <table className="w-full min-w-[16rem] border-collapse text-left text-sm text-playground-ink">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return (
              <thead className="border-b border-playground-border bg-playground-muted/[0.06]">{children}</thead>
            );
          },
          tbody({ children }) {
            return <tbody className="divide-y divide-playground-border">{children}</tbody>;
          },
          tr({ children }) {
            return <tr className="align-top">{children}</tr>;
          },
          th({ children }) {
            return (
              <th className="max-w-[12rem] whitespace-normal px-3 py-2 font-semibold text-playground-ink">
                {children}
              </th>
            );
          },
          td({ children }) {
            return <td className="max-w-[14rem] whitespace-normal px-3 py-2 text-playground-ink">{children}</td>;
          },
          strong({ children }) {
            return <strong className="font-semibold text-playground-ink">{children}</strong>;
          },
          em({ children }) {
            return <em className="italic text-playground-ink">{children}</em>;
          },
          del({ children }) {
            return <del className="text-playground-muted line-through">{children}</del>;
          },
          pre({ children }) {
            return <MarkdownPreWithCopy>{children}</MarkdownPreWithCopy>;
          },
          code({ className, children, ...props }) {
            const inPre = useContext(MarkdownInPreContext);
            if (inPre) {
              return (
                <code
                  className={`block whitespace-pre-wrap font-mono text-sm font-normal leading-relaxed text-playground-ink ${className ?? ""}`.trim()}
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                className="rounded-md bg-playground-muted/[0.08] px-1.5 py-0.5 font-mono text-[0.9em] text-playground-ink"
                {...props}
              >
                {children}
              </code>
            );
          },
          hr() {
            return <hr className="my-4 border-playground-border" />;
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
