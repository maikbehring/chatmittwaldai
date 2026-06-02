# Playground-Texte (zentral gesammelt)

Stand: aus den UI-Komponenten unter `client/src` extrahiert.

Hinweis: Variablenwerte (z. B. Modellnamen, Link-Labels aus Server-Konfiguration, dynamische Zahlen) sind als Platzhalter markiert.

## Allgemein / App-Rahmen

- `Mittwald KI-Playground`
- `Öffentliche Beta — Funktion und Modelle können sich ändern.`
- `Beta`
- `System`
- `Hell`
- `Dunkel`
- `Design`
- `Modell`
- `Modell wechseln (bricht die laufende Anfrage ab)`

## Startscreen (ohne Nachrichten)

- `Bereit loszulegen?`
- `Stelle eine Frage oder nutze + für ein Bild. Nur in diesem Browser gespeichert.`
- `Modellübersicht`

## Sidebar / Chat-Verlauf

- `Chat-Verlauf`
- `Chat-Verlauf öffnen`
- `Chat-Verlauf schließen`
- `Sidebar einklappen`
- `Sidebar ausklappen`
- `Sidebar umschalten`
- `Neuer Chat`
- `Aktuelle`
- `Websuche aktiv`
- `Chat löschen`
- `„{chatTitel}“ löschen`
- `Alle Chats löschen`
- `Browsercache löschen`
- `Begriffe erklärt`
- `Einfach erklärt`

## Composer / Eingabe

- `Nachricht…`
- `Stelle irgendeine Frage (Bild: einfügen oder +)`
- `Senden`
- `Stoppen`
- `Bild entfernen`
- `Suche im Internet`
- `Websuche ({provider}) · {anzahl} Treffer`
- `Im Web suchen · {provider}`
- `Suche · {provider}…`
- `Websuche für diesen Chat deaktivieren`
- `Websuche deaktivieren`
- `Websuche für diesen Chat deaktivieren`
- `Anhang`
- `Anhang vergrößern`
- `Anhang-Vorschau`
- `Bildvorschau vergrößern`

## Spracheingabe

- `Spracheingabe (Whisper)`
- `Aufnahme stoppen`
- `Wird transkribiert…`
- `Wird verarbeitet…`
- `Aufnahme verwerfen`
- `Aufnahme beenden und transkribieren`
- `Aufnahme ist zu lang. Bitte kürzer sprechen (max. ca. 25 MB).`
- `Keine Sprache erkannt.`
- `Mikrofon wird von diesem Browser nicht unterstützt.`
- `Aufnahme zu kurz.`
- `Aufnahme fehlgeschlagen.`
- `Mikrofon-Zugriff verweigert. Bitte in den Browser-Einstellungen erlauben.`
- `Mikrofon konnte nicht gestartet werden.`

## Chat / Antwort-Metadaten

- `Eingabe: {n} Token`
- `Ausgabe: {n} Token`
- `Gesamt: {n} Token`
- `Generierung: {sekunden} s`
- `≈ {gramm} g CO₂eq`
- `(teilweise geschätzt)`
- `≈ {gramm} g CO₂eq gesamt (alle Chats)`
- `≈ {gramm} g CO₂`
- `gesamt (alle Chats)`

## Hinweise unter dem Composer

- `Test-Playground — Chats nur im Browser, nicht für Produktion oder vertrauliche Inhalte.`
- `Dies ist ein reiner Test-Playground: Du kannst die Modelle ausprobieren und dir einen ersten Eindruck verschaffen. Der Chat wird nicht serverseitig gespeichert und ist weder für den produktiven Einsatz noch für vertrauliche oder geschäftskritische Inhalte vorgesehen.`

## Verlauf-/Kontext-Hinweis

- `Langer Chatverlauf: {anzahl} ältere Nachricht(en) werden nicht mehr an die KI gesendet (Limit {maxMessages}). „Clear chat“ setzt den Verlauf zurück.`

## Dialog: Websuche-Einwilligung

- `Websuche im Playground ausprobieren?`
- `Mit der Websuche sollst du erleben, wie sich eine gut eingebundene Live-Suche im Chat anfühlt — das ist Teil der Demo dieses Playgrounds, kein Produktiv-Feature.`
- `Aus deiner aktuellen Eingabe und einem kurzen Auszug des Chats formuliert die mittwald-KI serverseitig eine kompakte Suchzeile. Nur diese Kurzanfrage geht an {provider} — nicht dein gesamter Verlauf. Die Chats selbst bleiben wie gewohnt nur in deinem Browser.`
- `Diese Bestätigung speichern wir einmalig in diesem Browser. Du kannst die Websuche jederzeit wieder ausschalten oder die Einwilligung unter Modell-Einstellungen (Zahnrad) → Websuche zurückziehen.`
- Anbieter-abhängige Datenschutzhinweise:
  - `In diesem Playground kann bereits ein SerpAPI-Schlüssel hinterlegt sein, damit du die Websuche direkt ausprobieren kannst. Suchanfragen werden dabei an SerpAPI (Google-Ergebnisse) übermittelt und können dort gemäß den Bedingungen von SerpAPI gespeichert oder protokolliert werden.`
  - `In diesem Playground kann bereits ein Serper-Schlüssel hinterlegt sein, damit du die Websuche direkt ausprobieren kannst. Suchanfragen werden dabei an Serper (Google-Ergebnisse) übermittelt und können dort gemäß den Bedingungen des Anbieters gespeichert oder protokolliert werden.`
  - `Die Suche läuft über {provider}. Auch dort können technische Daten der Anfrage (z. B. IP-Adresse) verarbeitet werden.`
  - `Suchanfragen gehen an {provider} und können beim jeweiligen Anbieter verarbeitet oder gespeichert werden.`
- Buttons:
  - `Abbrechen`
  - `Verstanden, Websuche aktivieren`

## Dialog: Alle Chats löschen

- `Alle Chats löschen?`
- `{n} Chat(s) in diesem Browser werden unwiderruflich gelöscht. Der Verlauf liegt nur lokal in deinem Browser — auf dem Server werden keine Chats gespeichert.`
- `Abbrechen`
- `Alle löschen`

## Dialog: Browsercache löschen

- `Browsercache löschen?`
- `In diesem Browser werden alle gespeicherten Playground-Daten entfernt: Chatverläufe, Modell-Einstellungen, Design-Auswahl und die Einwilligung zur Websuche. Auf dem Server werden keine Chats gespeichert — betroffen ist nur der lokale Speicher (localStorage).`
- `Die Seite wird danach neu geladen.`
- `Abbrechen`
- `Cache löschen`

## Overlay: Einstellungen einfach erklärt

- Titel: `Einstellungen — einfach erklärt`
- Intro: `Hier stehen die Fachbegriffe aus den Einstellungen in Alltagssprache.`
- CTA: `Schließen`
- CO2-Hinweis:
  - `CO₂ bei KI einsparen: Modell zur Aufgabe passend wählen (kleiner reicht oft). max_tokens und Ausgabelänge begrenzen. Prompts knapp halten und Nacharbeit-Runden vermeiden. Bilder/Vision nur bei Bedarf. Bei gpt-oss: Reasoning-Stufe nicht höher als nötig.`

### Glossar-Einträge

- `Modell-Einstellungen (Zahnrad)`
- `Modell`
- `Mehr Optionen / Weniger Optionen`
- `Aktive Inferenz`
- `Reasoning (low / medium / high)`
- `Temperatur`
- `top_p`
- `top_k`
- `presence_penalty`
- `max_tokens`
- `Inferenz auf Doku-Defaults … zurücksetzen`
- `Grauer Hinweis unter den Schaltern („Doku: …“)`
- `System & Vision`
- `Zusätzliche Systemanweisung`
- `Qwen Vision … OCR / Texterkennung`
- `Vision`
- `OCR`
- `extra_body (in Hinweisen / technisch)`
- `localStorage (im Einleitungstext)`

## Overlay: Modellübersicht

- Titel: `Modelle im Playground`
- Intro: `Kurzüberblick über die im Dropdown wählbaren Modelle. Technische Details und Tarife in der Modell‑Dokumentation (mittwald Developer).`
- CTA: `Schließen`
- Modellzeilen:
  - `Ministral 3 (14B Instruct)`
  - `Kompaktes Allround-Modell für Text und Vision; in der Regel eher nüchtern und konsistent eingestellt.`
  - `Devstral Small (24B Instruct)`
  - `Stärker auf Code und technische Aufgaben ausgerichtet; freundlicher Parameter‑Mix für Chat und Umsetzung.`
  - `gpt-oss (120B)`
  - `Großes Modell mit einstellbarem Reasoning (low / medium / high). Reasoning wird bei diesem Modell über die Systemzeile mitgeschickt.`
  - `Qwen 3.5 (122B)`
  - `Sehr großes Kontext‑ und Chat‑Modell im Non‑Thinking‑Preset; Vision nutzt bei Bedarf eigene Parameter.`
  - `Qwen 3.6 (35B)`
  - `Effizientes Qwen‑Modell mit hohem Kontext; gleiche Instruct‑Logik wie 3.5, andere Modellgröße.`
- Zusatz:
  - `Preset‑Hinweis:`
  - `Welche IDs im Dropdown erscheinen, kann auf dem Server über PLAYGROUND_ALLOWED_MODELS eingeschränkt sein.`

## Modell-Einstellungen (Dock)

- `Modell-Einstellungen`
- `Vorgaben für aktuelles Modell übernehmen`
- `Temperatur`
- `top_p`
- `top_k`
- `presence_penalty`
- `max_tokens`
- `Reasoning`
- `OCR-Modus bei Qwen-Bildern`
- `Websuche (Server)`
- `Standard: DuckDuckGo (kostenlos, ohne API-Key). Pro Chat im Header mit „Websuche“ ein-/ausschalten.`
- `Aktiv: Google (SerpAPI).`
- `Aktiv: Google (Serper).`
- `Neue Chats starten mit aktivierter Websuche`
- `Einwilligung zurückziehen`
- Confirm-Dialog-Text:
  - `Websuche-Einwilligung für diesen Browser zurückziehen? Die Websuche wird in allen Chats deaktiviert. Beim nächsten Aktivieren erscheint der Hinweis-Dialog erneut.`
- `Systemanweisung`
- `Optional — Leer lassen für keine zusätzliche Systemzeile.`
- `extra_body (JSON-Objekt)`
- `extra_body anwenden`
- Fehler:
  - `extra_body muss ein JSON-Objekt sein.`
  - `Ungültiges JSON.`

## Fehlermeldungen / Limits

- `Kurz Pause — Limit erreicht`
- `Dieser öffentliche Playground schützt sich vor Überlastung`
- `— aktuell gilt: {quota}`
- `— Limit für {scopeLabel}`
- `In etwa {waitMinutes} Minute(n) kannst du hier normal weitermachen.`
- `Ohne Wartezeit — drei Wege mit eigenem mittwald API-Key`
- `AI Hosting im mStudio buchen und API-Key holen — Basis für alles Weitere.`
- `LibreChat oder Open WebUI — am einfachsten im mStudio per Container Hosting starten (Open WebUI u. a. in wenigen Minuten, fully managed). Alternativ selbst installieren; als OpenAI-API {baseUrl} und deinen mittwald-Key — ChatGPT-ähnlich, deine Limits.`
- `Diesen Playground selbst hosten (GitHub) — derselbe Key in der .env, Rate-Limits stellst du selbst ein.`
- Buttons/Links:
  - `AI Hosting & API-Key →`
  - `Container Hosting`
  - `LibreChat`
  - `Open WebUI`
  - `Playground (GitHub)`
- Quota-Bausteine:
  - `Chat-Nachricht(en)`
  - `Websuche(n)`
  - `Spracheingabe(n)`
  - `Modell-Abruf(e)`
  - `{max} {Einheit} pro {min} Minute(n) (pro IP)`

## Technische Hinweise mit User-Bezug (Tooltip-/Hilfetexte)

- `Schätzung aus Benchmark-Energie (kWh pro 1 Mio. gewichtete Token): Eingabe-Token × 1/4 + Ausgabe-Token, dann × deutscher Strommix (UBA 2025) 344 g CO₂/kWh. kWh/Mio.: Qwen3.6 0,55 · gpt-oss 0,73 · Qwen3.5 1,31 · Ministral 1,50 · Devstral 2,50. Ohne API-Nutzungsdaten nur Ausgabe-Token grob geschätzt.`
- `{obenstehender Text} Summe aller Antworten über alle Chats in diesem Browser.`

## Preset-Hinweise (modellabhängig in der UI sichtbar)

- `Doku: Chat & Vision — temperature 0.1; Bilder max. 1024 px.`
- `Doku: temperature 0.7, top_p 0.8, top_k 20, repetition_penalty 1.05 (extra_body); Vision oft 0.1.`
- `Doku: temperature & top_p 1.0; Reasoning-Stufe per Systemzeile „Reasoning: …“.`
- `Doku: Non-Thinking (enable_thinking false), Allgemein 0.7/0.8/20, presence_penalty 1.5; Vision separat.`
- `Kein festes Doku-Preset — Werte manuell anpassen.`

## Standard-Linklabel (falls nicht serverseitig überschrieben)

- `Bug melden`

