import { useEffect } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
};

const GLOSSARY: { term: string; simple: string }[] = [
  {
    term: "Modell-Einstellungen (Zahnrad)",
    simple:
      "Das kleine Zahnrad unten links neben dem Eingabefeld öffnet die Inferenz-Optionen für das aktuelle Modell: Temperatur, top_p, top_k, presence_penalty, max_tokens, Systemanweisung, extra_body (JSON) sowie — je nach Modell — Reasoning (gpt-oss) oder OCR-Modus bei Qwen-Bildern.",
  },
  {
    term: "Modell",
    simple:
      "Welche Künstliche-Intelligenz-Variante gerade antwortet. Jedes Modell hat eigene Stärken (zum Beispiel eher schnell und günstig oder eher gründlich).",
  },
  {
    term: "Mehr Optionen / Weniger Optionen",
    simple:
      "Früher ein eigener Klappbereich in der Seitenleiste — dieselben Inhalte (z. B. Systemanweisung, Spezial-Einstellungen) erreichst du jetzt über das Zahnrad unten links.",
  },
  {
    term: "Aktive Inferenz",
    simple:
      "Hier stellst du ein, wie die KI rechnet und formuliert. „Inferenz“ heißt in diesem Zusammenhang grob: Aus deiner Eingabe wird eine Antwort erzeugt.",
  },
  {
    term: "Reasoning (low / medium / high)",
    simple:
      "Nur bei einem bestimmten Modell (gpt-oss): Wie tief die KI mitdenken soll. „Low“ = eher kurz und flott, „high“ = eher ausführlich und schrittweise. Wird als erste Zeile an die KI geschickt.",
  },
  {
    term: "Temperatur",
    simple:
      "Wie verlässlich oder abwechslungsreich die Antworten sind. Niedrig = eher sachlich und ähnlich jedes Mal. Höher = eher kreativ und variabel — kann aber auch mehr danebenliegen.",
  },
  {
    term: "top_p",
    simple:
      "Steuert, aus wie vielen wahrscheinlichen nächsten Wörtern gewählt wird (Zahl zwischen 0 und 1). Kleiner = enger, größer = mehr Spielraum. Leer lassen = der Server nutzt dann seinen Standard.",
  },
  {
    term: "top_k",
    simple:
      "Nur die k wahrscheinlichsten nächsten Wörter dürfen gewählt werden. Klein = strenger, groß = mehr Variation. Leer lassen = Standard.",
  },
  {
    term: "presence_penalty",
    simple:
      "Soll die KI Themen lieber wiederholen oder wechseln? Positiv = eher neue Winkel, weniger Wiederholung. Negativ = eher Wiederholungen möglich. Leer lassen = Standard.",
  },
  {
    term: "max_tokens",
    simple:
      "Ungefähre Maximallänge der Antwort. „Tokens“ sind kleine Textbausteine — du musst sie nicht zählen: höher = längere Antworten möglich, oft auch langsamer und teurer. Leer lassen = kein eigenes Limit setzen.",
  },
  {
    term: "Inferenz auf Doku-Defaults … zurücksetzen",
    simple:
      "Setzt alle Schalter in diesem Bereich auf die Werte aus der offiziellen mittwald-Anleitung für das gerade gewählte Modell zurück — praktisch, wenn du dich „verstellt“ hast.",
  },
  {
    term: "Grauer Hinweis unter den Schaltern („Doku: …“)",
    simple:
      "Kurz erklärt, was die Hersteller-Doku empfiehlt — ohne dass du die Fachseite lesen musst.",
  },
  {
    term: "System & Vision",
    simple:
      "System = feste Regeln an die KI (zum Beispiel „Antworte auf Deutsch“). Vision = Umgang mit Bildern; die Checkbox betrifft nur bestimmte Modelle (Qwen) und hilft beim Texterkennen auf Fotos.",
  },
  {
    term: "Zusätzliche Systemanweisung",
    simple:
      "Text, der vor jeder Antwort mitgegeben wird, damit die KI sich an deine Regeln hält. Bei gpt-oss steht darüber noch die Reasoning-Zeile.",
  },
  {
    term: "Qwen Vision … OCR / Texterkennung",
    simple:
      "Wenn du ein Bild mitschickst: Diese Option legt den Fokus auf genaues Auslesen von Schrift auf dem Bild (zum Beispiel Foto von einem Zettel oder Screenshot).",
  },
  {
    term: "Vision",
    simple:
      "Die KI kann nicht nur Text, sondern auch Bilder einbeziehen — etwa um etwas auf dem Foto zu beschreiben oder Text darauf zu lesen.",
  },
  {
    term: "OCR",
    simple:
      "„Optische Zeichenerkennung“: Schrift aus einem Bild in normalen Text verwandeln.",
  },
  {
    term: "extra_body (in Hinweisen / technisch)",
    simple:
      "Ein Zusatz-Kasten für besondere Schalter, die nicht in die normalen Felder passen. Wird hier automatisch gesetzt, wenn die Doku es für ein Modell vorschreibt — du musst nichts eintippen.",
  },
  {
    term: "localStorage (im Einleitungstext)",
    simple:
      "Der Chat wird nur in deinem Browser auf deinem Gerät gespeichert, nicht auf unserem Playground-Server.",
  },
];

export function SettingsGlossaryOverlay({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]"
        aria-label="Erklärungen schließen"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="glossary-title"
        className="relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-600 dark:bg-slate-900"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-600">
          <h2 id="glossary-title" className="text-base font-semibold text-ink">
            Einstellungen — einfach erklärt
          </h2>
          <button
            type="button"
            className="shrink-0 rounded-lg px-2 py-1 text-sm text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={onClose}
          >
            Schließen
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-3 text-sm leading-relaxed">
          <p className="mb-4 text-ink-muted">
            Hier stehen die Fachbegriffe aus den Einstellungen in Alltagssprache. Tarife und
            Überblick:{" "}
            <a
              className="text-accent underline"
              href="https://www.mittwald.de/mstudio/ai-hosting"
              target="_blank"
              rel="noreferrer"
            >
              AI Hosting bei mittwald
            </a>
            . Technische Details in der{" "}
            <a
              className="text-accent underline"
              href="https://developer.mittwald.de/de/docs/v2/platform/aihosting/"
              target="_blank"
              rel="noreferrer"
            >
              Developer-Dokumentation
            </a>
            .{" "}
            <a
              className="text-accent underline"
              href="https://www.mittwald.de/impressum"
              target="_blank"
              rel="noreferrer"
            >
              Impressum (mittwald.de)
            </a>
            .
          </p>
          <p className="mb-4 rounded-lg border border-emerald-200/80 bg-emerald-50/80 px-3 py-2.5 text-xs leading-snug text-ink-muted dark:border-emerald-900/50 dark:bg-emerald-950/40">
            <span className="font-semibold text-ink">CO₂ bei KI einsparen:</span> Modell zur Aufgabe
            passend wählen (kleiner reicht oft).{" "}
            <span className="whitespace-nowrap">max_tokens</span> und Ausgabelänge begrenzen. Prompts
            knapp halten und Nacharbeit-Runden vermeiden. Bilder/Vision nur bei Bedarf. Bei gpt-oss:
            Reasoning-Stufe nicht höher als nötig.
          </p>
          <dl className="space-y-4">
            {GLOSSARY.map(({ term, simple }) => (
              <div key={term}>
                <dt className="font-medium text-ink">{term}</dt>
                <dd className="mt-0.5 text-ink-muted">{simple}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
