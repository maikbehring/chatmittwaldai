/**
 * Öffentliche Feature Requests aus github.com/mittwald/feature-requests (Issues, keine PRs).
 */

const REPO = "mittwald/feature-requests";
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 20;
const FETCH_PER_PAGE = 30;
const BODY_PREVIEW_CHARS = 400;

function githubHeaders() {
  const token = process.env.GITHUB_TOKEN?.trim() || process.env.GITHUB_API_TOKEN?.trim();
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "mittwald-ai-playground",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function stripMarkdownPreview(body) {
  return String(body ?? "")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/[#>*_`~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, BODY_PREVIEW_CHARS);
}

function normalizeIssue(item) {
  const labels = Array.isArray(item.labels)
    ? item.labels.map((l) => (typeof l === "string" ? l : l?.name)).filter(Boolean)
    : [];
  return {
    number: item.number,
    title: String(item.title ?? "").slice(0, 300),
    state: item.state === "closed" ? "closed" : "open",
    createdAt: String(item.created_at ?? ""),
    updatedAt: String(item.updated_at ?? ""),
    url: String(item.html_url ?? ""),
    labels: labels.slice(0, 12),
    author: String(item.user?.login ?? "unbekannt"),
    comments: Number(item.comments) || 0,
    bodyPreview: stripMarkdownPreview(item.body),
  };
}

/**
 * @param {{ limit?: number }} [options]
 */
export async function fetchMittwaldFeatureRequests(options = {}) {
  const limit = Math.min(
    Math.max(Number(options.limit) || DEFAULT_LIMIT, 1),
    MAX_LIMIT,
  );

  const url = `https://api.github.com/repos/${REPO}/issues?state=all&sort=created&direction=desc&per_page=${FETCH_PER_PAGE}`;
  const res = await fetch(url, {
    headers: githubHeaders(),
    signal: AbortSignal.timeout(12_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let msg = `GitHub API ${res.status}`;
    if (res.status === 403) {
      msg =
        "GitHub Rate-Limit erreicht — optional GITHUB_TOKEN in .env setzen für höhere Limits.";
    }
    throw new Error(text ? `${msg}: ${text.slice(0, 200)}` : msg);
  }

  const json = await res.json();
  if (!Array.isArray(json)) {
    throw new Error("Unerwartete GitHub-Antwort.");
  }

  const issues = json
    .filter((item) => item && !item.pull_request)
    .slice(0, limit)
    .map(normalizeIssue);

  return {
    repo: REPO,
    repoUrl: `https://github.com/${REPO}`,
    fetchedAt: new Date().toISOString(),
    limit,
    issues,
  };
}
