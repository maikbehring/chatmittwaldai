const TZ = "Europe/Berlin";

/** Kalenderdatum in Europe/Berlin (optional mit Tages-Offset für „gestern“). */
export function formatPlaygroundDateBerlin(offsetDays = 0): string {
  const now = new Date();
  if (offsetDays !== 0) {
    now.setDate(now.getDate() + offsetDays);
  }
  return new Intl.DateTimeFormat("de-DE", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);
}

/** Kurzes Datum DD.MM.YYYY — für Suchanfragen. */
export function formatPlaygroundShortDateBerlin(offsetDays = 0): string {
  const now = new Date();
  if (offsetDays !== 0) {
    now.setDate(now.getDate() + offsetDays);
  }
  return new Intl.DateTimeFormat("de-DE", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(now);
}

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
