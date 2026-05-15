const TZ = "Europe/Berlin";

/** Aktuelles Datum für Zeitbezüge („heute“, „dieses Jahr“, Festtermine). */
export function formatPlaygroundTodayContext(): string {
  const now = new Date();
  const formatted = new Intl.DateTimeFormat("de-DE", {
    timeZone: TZ,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(now);
  return (
    `[Playground — Zeitbezug]\n` +
    `Heutiges Datum (${TZ}): ${formatted}. ` +
    `Nutze dieses Datum für „heute“, „gerade“, „dieses Jahr“ und Termine — nicht dein Trainings-Wissensstand als Kalender.`
  );
}
