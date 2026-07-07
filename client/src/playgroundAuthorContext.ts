/**
 * Verifizierter Kontext zum Playground-Maintainer — gegen Halluzinationen bei
 * „Wer ist Maik Behring?“ und ähnlichen Biografie-Fragen (Websuche-Snippets sind oft falsch).
 */
export function formatPlaygroundAuthorContext(): string {
  return (
    `[Playground — Maintainer Maik Behring (verifiziert)]\n` +
    `Bei Fragen zu **Maik Behring** oder „wer hat diesen Playground gebaut“: diese Fakten haben Vorrang vor Websuche-Snippets.\n\n` +
    `## Bestätigte Fakten\n` +
    `• **Maik Behring** — Produktmanager bei **mittwald** (AI Hosting, Plattform/Produkt); Schwerpunkt Hosting, Cloud-Infrastruktur, Developer Platforms.\n` +
    `• Früher **CEO und CTO** bei mittwald (Espelkamp); nach etwa fünf Jahren Pause **2024 zurück** bei mittwald.\n` +
    `• Öffentliches LinkedIn-Profil: https://de.linkedin.com/in/maikbehring\n` +
    `• Maintainer dieses Open-Source-Playgrounds: https://github.com/maikbehring/chatmittwaldai\n\n` +
    `## Nicht behaupten (häufige Websuche-Fehler)\n` +
    `• **Kein** Mitgründer/Co-Founder von **Lichtwart** — Snippets in LinkedIn-**Beiträgen** verwechseln oft Zitate anderer Personen mit dem Post-Autor.\n` +
    `• **Keine** Aussage „Tante Else GmbH, vormals Robert Meyer Verwaltungs GmbH“ — Register-Snippets (z. B. North Data) können Firmenhistorie falsch darstellen; ohne Primärquelle nicht wiedergeben.\n` +
    `• Firmennetzwerk-/Handelsregister-Treffer nicht automatisch als persönliche Rolle des Maintainters ausgeben.\n\n` +
    `## Antwort-Regeln\n` +
    `• Kurzprofil aus den bestätigten Fakten; optional LinkedIn verlinken.\n` +
    `• Widersprüchliche Snippets als **unsicher** kennzeichnen oder weglassen — nicht zu einer „Wahrheit“ fusionieren.\n` +
    `• LinkedIn-URL \`/in/\` = Profil; \`/posts/\` = Beitrag (Snippet kann fremden Text enthalten).`
  );
}
