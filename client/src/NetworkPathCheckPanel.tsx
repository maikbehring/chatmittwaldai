import { useCallback, useState } from "react";
import {
  countryFlagEmoji,
  fetchNetworkPathCheck,
  formatClientLocation,
  formatHopLocation,
  formatPathSummary,
  formatResolvedTargetGeo,
  isDomesticOrInternalPath,
  localTracerouteCommands,
  measureBrowserLatencies,
  type BrowserLatencyProbe,
  type NetworkHop,
  type NetworkPathCheckResponse,
  type NetworkPathTargetResult,
} from "./networkPathCheck";

function formatRtt(ms: number | null): string {
  if (ms == null || !Number.isFinite(ms)) return "—";
  return `${ms.toFixed(ms >= 10 ? 0 : 1)} ms`;
}

function HopRow({ hop, isLast }: { hop: NetworkHop; isLast: boolean }) {
  const location = formatHopLocation(hop);
  const flag =
    hop.scope === "private"
      ? "🏢"
      : hop.geo?.countryCode
        ? countryFlagEmoji(hop.geo.countryCode)
        : "";
  const isForeign = hop.foreign === true;

  return (
    <li className="relative flex gap-3 pb-4 last:pb-0">
      {!isLast ? (
        <span
          className={`absolute left-[0.6875rem] top-6 bottom-0 w-px ${
            isForeign ? "bg-amber-400/60" : "bg-playground-border"
          }`}
          aria-hidden
        />
      ) : null}
      <span
        className={`relative z-[1] flex h-6 w-6 shrink-0 items-center justify-center rounded-full border playground-text-tiny font-bold ${
          isForeign
            ? "border-amber-500/50 bg-amber-500/15 text-amber-900 dark:text-amber-100"
            : hop.scope === "private"
              ? "border-playground-border bg-playground-muted/10 text-playground-muted"
              : "border-playground-border bg-playground-sidebar text-playground-ink"
        }`}
        aria-hidden
      >
        {hop.n}
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="playground-text-small font-mono font-medium text-playground-ink break-all">
            {hop.host}
          </p>
          {flag ? (
            <span className="playground-text-tiny shrink-0" aria-hidden>
              {flag}
            </span>
          ) : null}
        </div>
        {location ? (
          <p
            className={`playground-text-tiny ${
              isForeign ? "font-medium text-amber-800 dark:text-amber-200" : "text-playground-muted"
            }`}
          >
            {location}
            {isForeign
              ? " · Ausland"
              : hop.geo?.countryCode === "DE"
                ? " · Deutschland"
                : ""}
          </p>
        ) : null}
        <p className="playground-text-tiny text-playground-muted">
          RTT {formatRtt(hop.rttMs)}
          {hop.note ? ` · ${hop.note}` : ""}
        </p>
      </div>
    </li>
  );
}

function PathSummaryBadge({ target }: { target: NetworkPathTargetResult }) {
  const summary = formatPathSummary(target);
  const abroad = target.pathSummary.crossesAbroad;
  const internalOnly = isDomesticOrInternalPath(target) && !target.pathSummary.staysDomestic;
  return (
    <p
      className={`playground-text-tiny rounded-lg px-2.5 py-1.5 font-medium ${
        abroad
          ? "border border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100"
          : internalOnly
            ? "border border-emerald-500/25 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100"
            : "border border-emerald-500/25 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100"
      }`}
    >
      {summary}
    </p>
  );
}

function TargetPathCard({ target }: { target: NetworkPathTargetResult }) {
  const resolvedGeo = formatResolvedTargetGeo(target);

  return (
    <article className="flex min-w-0 flex-1 flex-col rounded-2xl border border-playground-border bg-playground-sidebar p-4 sm:p-5">
      <header className="mb-4 space-y-2">
        <h3 className="playground-text-body font-display font-semibold text-playground-ink">
          {target.label}
        </h3>
        <PathSummaryBadge target={target} />
        <p className="playground-text-tiny font-mono text-playground-muted break-all">{target.host}</p>
        {target.resolvedIp ? (
          <p className="playground-text-tiny text-playground-muted">
            Ziel-IP: <span className="font-mono text-playground-ink">{target.resolvedIp}</span>
            {resolvedGeo ? ` · ${resolvedGeo}` : ""}
          </p>
        ) : null}
      </header>

      {target.error && target.hops.length === 0 ? (
        <p className="playground-text-small rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-amber-900 dark:text-amber-100">
          {target.error}
        </p>
      ) : (
        <ol className="m-0 list-none p-0">
          {target.hops.map((hop, i) => (
            <HopRow key={`${hop.n}-${hop.host}-${i}`} hop={hop} isLast={i === target.hops.length - 1} />
          ))}
        </ol>
      )}
    </article>
  );
}

function LatencyBar({ probe }: { probe: BrowserLatencyProbe }) {
  const max = 1200;
  const width =
    probe.latencyMs == null ? 0 : Math.min(100, Math.round((probe.latencyMs / max) * 100));
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="playground-text-small font-medium text-playground-ink">{probe.label}</span>
        <span className="playground-text-tiny font-mono text-playground-muted">
          {probe.latencyMs != null ? `${probe.latencyMs} ms` : "Timeout"}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-playground-muted/10">
        <div
          className="h-full rounded-full bg-playground-send transition-all duration-500"
          style={{ width: `${Math.max(width, probe.latencyMs != null ? 4 : 0)}%` }}
        />
      </div>
    </div>
  );
}

export function NetworkPathCheckPanel() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NetworkPathCheckResponse | null>(null);
  const [browserLatency, setBrowserLatency] = useState<BrowserLatencyProbe[] | null>(null);

  const runCheck = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pathData, latency] = await Promise.all([
        fetchNetworkPathCheck(["mittwald", "openai"]),
        measureBrowserLatencies(),
      ]);
      setResult(pathData);
      setBrowserLatency(latency);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Netzwerk-Check fehlgeschlagen.");
      setResult(null);
      setBrowserLatency(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const location = result ? formatClientLocation(result.client.geo) : null;
  const mittwaldTarget = result?.targets.find((t) => t.key === "mittwald");
  const openaiTarget = result?.targets.find((t) => t.key === "openai");
  const showAbroadCallout =
    mittwaldTarget &&
    isDomesticOrInternalPath(mittwaldTarget) &&
    openaiTarget?.pathSummary.crossesAbroad;

  return (
    <div className="w-full max-w-5xl space-y-4 text-left">
      <div className="rounded-2xl border border-playground-border bg-playground-sidebar px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h3 className="playground-text-body font-display font-semibold text-playground-ink">
              Routing & Latenz
            </h3>
            <p className="playground-text-small max-w-prose text-playground-muted">
              Vergleicht den Netzwerkpfad zum mittwald AI Hosting mit dem Weg zur OpenAI-API. Die
              Hop-Liste kommt vom Playground-Server; die Latenzbalken messen die Verbindung von{" "}
              <strong className="font-semibold text-playground-ink">deinem Browser</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void runCheck()}
            disabled={loading}
            className="shrink-0 rounded-xl bg-playground-send px-4 py-2.5 playground-text-small font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Messung läuft …" : "Traceroute starten"}
          </button>
        </div>

        {error ? (
          <p className="mt-3 playground-text-small rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-red-800 dark:text-red-100">
            {error}
          </p>
        ) : null}
      </div>

      {result ? (
        <>
          <section className="grid gap-4 rounded-2xl border border-playground-border bg-playground-sidebar p-4 sm:grid-cols-2 sm:p-5">
            <div>
              <h4 className="playground-text-small font-bold text-playground-ink">Dein Standort</h4>
              <p className="mt-1 playground-text-tiny text-playground-muted">
                IP: <span className="font-mono text-playground-ink">{result.client.ip || "—"}</span>
              </p>
              {location ? (
                <p className="playground-text-tiny text-playground-muted">{location}</p>
              ) : (
                <p className="playground-text-tiny text-playground-muted">
                  Geo-Standort nicht verfügbar (lokal/privat).
                </p>
              )}
            </div>
            <div className="space-y-3">
              <h4 className="playground-text-small font-bold text-playground-ink">
                Latenz von deinem Browser
              </h4>
              {(browserLatency ?? []).map((probe) => (
                <LatencyBar key={probe.key} probe={probe} />
              ))}
            </div>
          </section>

          <p className="playground-text-tiny text-playground-muted">{result.probeOrigin.note}</p>

          {showAbroadCallout ? (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 sm:px-5">
              <p className="playground-text-small font-semibold text-amber-950 dark:text-amber-50">
                OpenAI-Route verlässt Deutschland
              </p>
              <p className="mt-1 playground-text-tiny text-amber-900/90 dark:text-amber-100/90">
                mittwald AI Hosting bleibt im internen/deutschen Pfad (
                {mittwaldTarget?.pathSummary.hopCount ?? 0} Hops). Die OpenAI-API läuft über{" "}
                {openaiTarget?.pathSummary.foreignHops ?? 0} Auslands-Hop(s)
                {openaiTarget?.pathSummary.countries.length
                  ? ` (${openaiTarget.pathSummary.countries.join(" → ")})`
                  : ""}
                — typisch US/Cloudflare-Anbindung, nicht DE-Hosting.
              </p>
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            {result.targets.map((target) => (
              <TargetPathCard key={target.key} target={target} />
            ))}
          </div>

          <section className="rounded-2xl border border-dashed border-playground-border bg-playground-muted/[0.03] px-4 py-4 sm:px-5">
            <h4 className="playground-text-small font-bold text-playground-ink">
              Traceroute von deinem Gerät (Terminal)
            </h4>
            <p className="mt-1 playground-text-tiny text-playground-muted">
              Für echte Hops ab deinem Netzwerk: Befehle lokal ausführen (macOS/Linux).
            </p>
            <ul className="mt-3 space-y-2">
              {localTracerouteCommands().map((item) => (
                <li key={item.command}>
                  <p className="playground-text-tiny font-medium text-playground-muted">{item.label}</p>
                  <code className="mt-0.5 block overflow-x-auto rounded-lg bg-playground-muted/10 px-3 py-2 playground-text-tiny font-mono text-playground-ink">
                    {item.command}
                  </code>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}
    </div>
  );
}
