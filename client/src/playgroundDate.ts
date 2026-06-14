const TZ = "Europe/Berlin";

/** Aktuelles Datum und Uhrzeit für Zeitbezüge („heute“, „gerade“, Festtermine). */
export function formatPlaygroundTodayContext(): string {
  const now = new Date();
  const formatted = new Intl.DateTimeFormat("de-DE", {
    timeZone: TZ,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);
  return (
    `[Playground — Zeitbezug]\n` +
    `Aktuelles Datum und Uhrzeit (${TZ}): ${formatted} Uhr. ` +
    `Nutze diese Angaben für „heute“, „gerade“, „jetzt“, „dieses Jahr“ und Termine — nicht dein Trainings-Wissensstand als Kalender oder Uhr.`
  );
}
