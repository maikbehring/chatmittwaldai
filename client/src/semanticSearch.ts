import { apiUrl } from "./appPaths";
import { ensureOkApiResponse, type PlaygroundRateLimits } from "./apiErrors";
import { playgroundApiHeaders } from "./playgroundSessionApiKey";

export const EMBEDDING_MODEL = "Qwen3-Embedding-8B";
export const RERANK_MODEL = "Qwen3-VL-Reranker-2B";

export const SEMANTIC_SEARCH_MAX_PASSAGES = 20;
export const SEMANTIC_SEARCH_MIN_PASSAGES = 2;
export const SEMANTIC_SEARCH_EMBED_TOP_K = 10;
export const SEMANTIC_SEARCH_RERANK_TOP_K = 3;

export const SEMANTIC_SEARCH_DEMO_PASSAGES = [
  "Unsere Standard-Zahlungsziel beträgt 30 Tage netto ab Rechnungsdatum.",
  "Lieferungen erfolgen in der Regel innerhalb von 14 Werktagen nach Auftragsbestätigung.",
  "Bei Zahlungsverzug können wir Verzugszinsen in Höhe von 8 Prozent über dem Basiszinssatz berechnen.",
  "Für Hosting-Verträge gilt eine Kündigungsfrist von 4 Wochen zum Monatsende.",
  "Support-Anfragen per E-Mail beantworten wir werktags innerhalb von 24 Stunden.",
  "API-Keys für AI Hosting erzeugst du im mStudio unter AI Hosting → API-Keys.",
  "Whisper-Transkription unterstützt MP3, WAV, FLAC und OGG — bis ca. 25 MB pro Anfrage.",
  "Embeddings erzeugst du über POST /v1/embeddings mit dem Modell Qwen3-Embedding-8B.",
  "Reranking verbessert die Treffer nach der Vektorsuche — Endpunkt POST /v1/rerank.",
  "Der Playground speichert Chatverläufe nur im localStorage des Browsers, nicht auf dem Server.",
  "Für öffentliche Demos empfiehlt sich eine Modell-Allowlist und Rate-Limits in der .env.",
  "Rechnungen werden als PDF oder Bild per OCR mit GLM-OCR und Qwen strukturiert extrahiert.",
];

export const SEMANTIC_SEARCH_DEMO_QUESTION =
  "Wie sind die Zahlungsbedingungen und was passiert bei Verspätung?";

export function formatSemanticSearchPassagesText(passages: string[]): string {
  return passages.join("\n\n");
}

export function parseSemanticSearchPassages(raw: string): string[] {
  return String(raw ?? "")
    .split(/\n\s*\n+/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length >= 8)
    .slice(0, SEMANTIC_SEARCH_MAX_PASSAGES);
}

export type SemanticSearchPhase = "embed" | "retrieve" | "rerank" | "answer";

export type SemanticSearchProgress = {
  phase: SemanticSearchPhase;
  message: string;
  detail?: string;
};

export type SemanticSearchRankedRow = {
  passageIndex: number;
  excerpt: string;
  embedRank: number;
  embedScore: number;
  rerankScore: number | null;
  rerankRank: number | null;
};

export type SemanticSearchPipelineResult = {
  query: string;
  passages: string[];
  embedTopK: SemanticSearchRankedRow[];
  rerankTopK: SemanticSearchRankedRow[];
  reportMarkdown: string;
  answerUserMessage: string;
};

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-9);
}

function formatQueryForEmbedding(query: string): string {
  return `Instruct: Finde die relevantesten Textpassagen zur Nutzerfrage.\nQuery: ${query.trim()}`;
}

function excerpt(text: string, max = 72): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

async function fetchEmbeddings(
  input: string | string[],
  options: {
    rateLimits?: PlaygroundRateLimits | null;
    signal?: AbortSignal;
    model?: string;
  },
): Promise<number[][]> {
  const res = await fetch(apiUrl("/api/embeddings"), {
    method: "POST",
    headers: playgroundApiHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      model: options.model ?? EMBEDDING_MODEL,
      input,
      encoding_format: "float",
    }),
    signal: options.signal,
  });
  await ensureOkApiResponse(res, options.rateLimits);
  const data = (await res.json()) as {
    data?: Array<{ embedding?: number[]; index?: number }>;
  };
  const rows = Array.isArray(data.data) ? data.data : [];
  if (rows.length === 0) throw new Error("Embedding-API lieferte keine Vektoren.");
  const sorted = [...rows].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  return sorted.map((row) => {
    if (!Array.isArray(row.embedding) || row.embedding.length === 0) {
      throw new Error("Embedding-API lieferte ungültige Vektoren.");
    }
    return row.embedding;
  });
}

async function fetchRerank(
  query: string,
  documents: string[],
  options: {
    rateLimits?: PlaygroundRateLimits | null;
    signal?: AbortSignal;
    model?: string;
  },
): Promise<Array<{ index: number; relevance_score: number }>> {
  const res = await fetch(apiUrl("/api/rerank"), {
    method: "POST",
    headers: playgroundApiHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      model: options.model ?? RERANK_MODEL,
      query,
      documents,
      instruction:
        "Given a search query, retrieve relevant passages that best answer the query.",
    }),
    signal: options.signal,
  });
  await ensureOkApiResponse(res, options.rateLimits);
  const data = (await res.json()) as {
    results?: Array<{ index?: number; relevance_score?: number }>;
  };
  const results = Array.isArray(data.results) ? data.results : [];
  if (results.length === 0) throw new Error("Rerank-API lieferte keine Ergebnisse.");
  return results.map((r, i) => ({
    index: typeof r.index === "number" ? r.index : i,
    relevance_score: typeof r.relevance_score === "number" ? r.relevance_score : 0,
  }));
}

export function buildSemanticSearchReportMarkdown(
  query: string,
  embedTop: SemanticSearchRankedRow[],
  rerankTop: SemanticSearchRankedRow[],
): string {
  const lines = [
    "## Embedding vs. Reranking",
    "",
    `**Frage:** ${query}`,
    "",
    "### Top nach Rerank (präzise)",
    "",
    "| Rang | Embed-Rang | Rerank-Score | Auszug |",
    "| --- | --- | --- | --- |",
  ];

  for (let i = 0; i < rerankTop.length; i++) {
    const row = rerankTop[i];
    lines.push(
      `| ${i + 1} | #${row.embedRank} | ${row.rerankScore?.toFixed(3) ?? "—"} | ${row.excerpt} |`,
    );
  }

  lines.push(
    "",
    "### Top nach Embedding (Vektorsuche)",
    "",
    "| Rang | Embed-Score | Auszug |",
    "| --- | --- | --- |",
  );

  for (let i = 0; i < embedTop.length; i++) {
    const row = embedTop[i];
    lines.push(`| ${i + 1} | ${row.embedScore.toFixed(3)} | ${row.excerpt} |`);
  }

  lines.push("", "---", "");
  return lines.join("\n");
}

export function buildSemanticSearchAnswerUserMessage(
  query: string,
  rerankTop: SemanticSearchRankedRow[],
  passages: string[],
): string {
  const context = rerankTop
    .map((row, i) => `[Passage ${i + 1}]\n${passages[row.passageIndex]}`)
    .join("\n\n");
  return (
    `Beantworte die Frage **nur** anhand der folgenden Passagen. Wenn die Passagen nicht reichen, sage das ehrlich.\n\n` +
    `**Frage:** ${query}\n\n` +
    `**Relevante Passagen (nach Rerank):**\n${context}`
  );
}

export async function runSemanticSearchPipeline(
  query: string,
  passages: string[],
  options: {
    rateLimits?: PlaygroundRateLimits | null;
    signal?: AbortSignal;
    embeddingModel?: string;
    rerankModel?: string;
    onProgress?: (progress: SemanticSearchProgress) => void;
  },
): Promise<SemanticSearchPipelineResult> {
  const q = query.trim();
  if (q.length < 3) throw new Error("Bitte eine Frage mit mindestens 3 Zeichen stellen.");
  if (passages.length < SEMANTIC_SEARCH_MIN_PASSAGES) {
    throw new Error(
      `Bitte mindestens ${SEMANTIC_SEARCH_MIN_PASSAGES} Textpassagen (getrennt durch Leerzeile) einfügen.`,
    );
  }

  options.onProgress?.({
    phase: "embed",
    message: `Embeddings für ${passages.length} Passagen …`,
    detail: `Modell: ${options.embeddingModel ?? EMBEDDING_MODEL}`,
  });

  const [passageVectors, queryVector] = await Promise.all([
    fetchEmbeddings(passages, options),
    fetchEmbeddings(formatQueryForEmbedding(q), options),
  ]);

  if (passageVectors.length !== passages.length) {
    throw new Error("Embedding-Anzahl stimmt nicht mit Passagen überein.");
  }

  options.onProgress?.({
    phase: "retrieve",
    message: "Vektorsuche (Cosine Similarity) …",
    detail: `Top ${SEMANTIC_SEARCH_EMBED_TOP_K} Kandidaten für Rerank`,
  });

  const queryVec = queryVector[0];
  const scored = passages.map((text, index) => ({
    passageIndex: index,
    excerpt: excerpt(text),
    embedScore: cosineSimilarity(queryVec, passageVectors[index]),
  }));
  scored.sort((a, b) => b.embedScore - a.embedScore);

  const embedTop = scored.slice(0, SEMANTIC_SEARCH_EMBED_TOP_K).map((row, i) => ({
    passageIndex: row.passageIndex,
    excerpt: row.excerpt,
    embedRank: i + 1,
    embedScore: row.embedScore,
    rerankScore: null,
    rerankRank: null,
  }));

  const embedRankByIndex = new Map(
    embedTop.map((row) => [row.passageIndex, row.embedRank]),
  );

  options.onProgress?.({
    phase: "rerank",
    message: `Rerank: ${embedTop.length} Kandidaten …`,
    detail: `Modell: ${options.rerankModel ?? RERANK_MODEL}`,
  });

  const candidateTexts = embedTop.map((row) => passages[row.passageIndex]);
  const rerankResults = await fetchRerank(q, candidateTexts, options);
  const rerankSorted = [...rerankResults].sort(
    (a, b) => b.relevance_score - a.relevance_score,
  );

  const rerankTop: SemanticSearchRankedRow[] = rerankSorted
    .slice(0, SEMANTIC_SEARCH_RERANK_TOP_K)
    .map((result, i) => {
      const embedRow = embedTop[result.index];
      return {
        passageIndex: embedRow.passageIndex,
        excerpt: embedRow.excerpt,
        embedRank: embedRankByIndex.get(embedRow.passageIndex) ?? result.index + 1,
        embedScore: embedRow.embedScore,
        rerankScore: result.relevance_score,
        rerankRank: i + 1,
      };
    });

  const reportMarkdown = buildSemanticSearchReportMarkdown(q, embedTop, rerankTop);
  const answerUserMessage = buildSemanticSearchAnswerUserMessage(q, rerankTop, passages);

  options.onProgress?.({
    phase: "answer",
    message: "Antwort mit Qwen …",
    detail: `${rerankTop.length} Passagen als Kontext`,
  });

  return {
    query: q,
    passages,
    embedTopK: embedTop,
    rerankTopK: rerankTop,
    reportMarkdown,
    answerUserMessage,
  };
}
