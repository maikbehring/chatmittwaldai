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
    `• **Inhaber und Geschäftsführer** der **Tante Else GmbH** (Bioladen/Unternehmen in Bünde) — das ist eine **bestätigte** eigene Tätigkeit, nicht nur ein Register-Netzwerk-Hinweis.\n` +
    `• Öffentliches LinkedIn-Profil: https://de.linkedin.com/in/maikbehring\n` +
    `• Maintainer dieses Open-Source-Playgrounds: https://github.com/maikbehring/chatmittwaldai\n\n` +
    `## Nicht behaupten (häufige Websuche-Fehler)\n` +
    `• **Kein** Mitgründer/Co-Founder von **Lichtwart** — Snippets in LinkedIn-**Beiträgen** verwechseln oft Zitate anderer Personen mit dem Post-Autor.\n` +
    `• **Keine** Verbindung **Tante Else GmbH ↔ Robert Meyer Verwaltungs GmbH** — Register-Aggregatoren (z. B. North Data) zeigen das fälschlich als „vormals …“; das ist **falsch** und hat **nichts** mit Tante Else zu tun. Diese Formulierung **niemals** übernehmen oder vorsichtig paraphrasieren.\n` +
    `• Register-**Netzwerk**-Snippets nicht als „vielleicht keine direkte Tätigkeit“ relativieren, wenn **Tante Else** betroffen ist — die Rolle als Inhaber/GF ist oben bestätigt; nur die **Robert-Meyer-Firmenhistorie** ist falsch.\n\n` +
    `## Antwort-Regeln\n` +
    `• Kurzprofil aus den bestätigten Fakten (mittwald + optional Tante Else); LinkedIn verlinken.\n` +
    `• Widersprüchliche Snippets als **unsicher** kennzeichnen oder weglassen — nicht zu einer „Wahrheit“ fusionieren.\n` +
    `• LinkedIn-URL \`/in/\` = Profil; \`/posts/\` = Beitrag (Snippet kann fremden Text enthalten).`
  );
}
