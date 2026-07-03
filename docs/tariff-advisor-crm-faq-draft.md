# Tarifberater — CRM-Nutzkontent (Entwurf zur Ansicht)

**Quelle:** `docs/customer.js` (Odoo-CRM-Export, ~50 AI-Hosting-Opportunities, Vertriebs-Mails & Notizen)  
**Stand:** Entwurf — **in FAQ #85–92 eingebaut** (anonymisiert, ohne Personendaten)  
**Prinzip:** Nur **anonymisierte Muster** — keine Namen, E-Mails oder Firmen. **Rohdatei** `docs/customer.js` ist in `.gitignore` und wird nicht deployed (`.dockerignore`: `docs/`).

---

## 1. Was wir aus dem CRM übernehmen — und was nicht

### Übernehmen

| Cluster | Mehrwert für Tarifberater |
|---------|---------------------------|
| **Gesamtkosten & Setup** | Nicht nur „welcher Tarif?“, sondern „was brauche ich drumherum?“ |
| **Token-Limits & Upgrade** | Erwartungsmanagement: kein harter Stop, wann Pro sinnvoll |
| **DSGVO / OpenAI-Ersatz** | Formulierungen aus echten Agentur-Anfragen (Paperless, DMS, SaaS) |
| **Stack-Muster** | OpenWebUI, n8n, Paperless, Konsolidierung von Tool-Zoos |
| **Agentur / Reselling** | POC → Upgrade, Mandanten-Trennung, kein formales White-Label |
| **Vertriebs-Ton** | AVV, Rechenzentrum DE, persönliche Beratung bei Dedicated |

### Nicht übernehmen

- Personenbezogene Daten (Namen, E-Mail-Adressen, Firmen)
- Interne CRM-Notizen („Anruf erledigt“, Stage-Updates)
- Buchungs-/Checkout-Fehler (Support-Thema, nicht Tarifberatung)
- Widersprüchliche Vertriebs-Aussagen ohne Abgleich (z. B. OCR-Modell — siehe Abschnitt 4)

---

## 2. Abgleich mit bestehender FAQ (IDs 1–84)

| CRM-Thema | Bereits abgedeckt? | Lücke |
|-----------|-------------------|-------|
| Token-Limit überschritten, kein Abbruch | ✅ FAQ #5 | — |
| Starter → Pro bei Agenturprojekten | ✅ FAQ #2, #3 | — |
| Paperless + OpenAI ersetzen | ✅ FAQ #67, #103-Bereich | Gesamtkosten „drumherum“ fehlt |
| Container + Open WebUI / n8n | ✅ FAQ #75, Container-Block | **Auto-API-Key / 9-€-Verknüpfung** fehlt explizit |
| White-Label / Reselling | ✅ FAQ #50 (allgemein) | **Partnerprogramm, Subdomain** konkret fehlt |
| Dedicated nach Events | ✅ FAQ #4, #52 | — |
| Hostinger/Hetzner/AWS → mittwald | ❌ | **neu** |
| Heroku-Migration | ❌ | **neu** |
| Mehrere LLM-Tools parallel (Token-Fresser) | teilweise #5 | **OpenClaw/neben n8n** explizit |
| Token für Wiederverkauf rechnen | ❌ | **neu** |
| OCR vs. Handschrift (Vertriebs-Mail) | ✅ GLM-OCR in FAQ | **Klarstellung Qwen vs. GLM** nötig |

**Fazit:** Ca. **8 neue FAQ-Einträge** (vorgeschlagene IDs **85–92**) + **1 Präzisierung** zu bestehendem OCR-Wissen; optional **System-Prompt-Ergänzung**.

---

## 3. Vorgeschlagene neue FAQ-Einträge (Volltext)

### FAQ 85 — Gesamtkosten

**Section:** Integration  
**Frage:** Was kostet AI Hosting insgesamt — brauche ich noch vServer, Webhosting oder Container?

**Antwort (Entwurf):**

AI Hosting ist **nur die KI-API** (OpenAI-kompatibel). Du buchst einen **Tarif** (Starter / Pro / Business) — das ist **nicht** die Hosting-Umgebung für deine App.

**Typische Gesamtkosten:**

| Szenario | AI Hosting | Zusätzlich | Wofür |
|----------|------------|------------|--------|
| **API in bestehender App** (Paperless, TYPO3, eigene Software woanders) | ab 9 €/Monat | — | Nur Modell-API ersetzen |
| **Chat-Oberfläche schnell** (Open WebUI) | Tarif nach Token | **vServer** + Container Hosting | UI + optional RAG |
| **Workflows / Agenten** (n8n) | Tarif nach Token | oft vServer + Container | Automation neben der API |
| **Klassische Website + KI** | Tarif | **Webhosting** (Shop/CMS) getrennt | Shop ≠ AI Hosting |

**mStudio** brauchst du für AI Hosting (Tarif, API-Keys, Verbrauch). **Webhosting** nur, wenn du zusätzlich eine Website/Shop betreibst.

Gesamtpreis = **AI-Hosting-Tarif** + optional **vServer/Dedicated** (Basis für Container) + optional **Webhosting** — nicht alles in einem Paket.

---

### FAQ 86 — Open WebUI ohne API-Key

**Section:** Integration  
**Frage:** Ich habe Open WebUI angelegt — musste keinen API-Key eingeben. Hängt das am 9-€-Tarif? Ist die Nutzung gedeckelt?

**Antwort (Entwurf):**

Bei **Container-Vorlagen** im mStudio (z. B. **Open WebUI**) sind **AI-Hosting-Zugangsdaten oft vorkonfiguriert** — du trägst keinen Key manuell ein. Das ersetzt **nicht** die Tarifbuchung: Verbrauch läuft über deinen **gebuchten AI-Hosting-Tarif** (Token-Kontingent).

**Kurz:**

- **Tarif** = Token-Kontingent + Rate Limits (Starter/Pro/Business)
- **Container** = Oberfläche/App — nutzt die API im Hintergrund
- **Gedeckelt?** Ja, über das **monatliche Token-Limit** deines Tarifs — nicht „unlimited“ nur weil Open WebUI sofort antwortet

Token-Verbrauch im **mStudio → AI Hosting** prüfen. Bei PoC reicht oft **Starter**; bei Dauerbetrieb oder mehreren Nutzern früh **Pro** einplanen.

---

### FAQ 87 — Token berechnen (Wiederverkauf)

**Section:** Agentur  
**Frage:** Wie rechne ich Tokenverbrauch — auch wenn ich AI Hosting an meine Kunden weitergebe?

**Antwort (Entwurf):**

**Grundlage:** Tokens = Ein- + Ausgabe des Modells (ca. 1 Token ≈ ¾ Wort DE). Verbrauch siehst du im **mStudio** (AI Hosting → Auslastung).

**Für Agentur / Wiederverkauf:**

1. **Eigenen AI-Hosting-Tarif** buchen (nicht pro Endkunde ein Shared-Tarif zwingend nötig — aber **eigene Integration/Mandant** pro Kunde bei API-Zugriff auf Kundendaten).
2. **PoC:** Starter testen, Verbrauch 2–4 Wochen messen.
3. **Kalkulation:** Monatliche Tokens ÷ Kundenprojekte; Puffer 30–50 % für Spitzen.
4. **Abrechnung an Kunden:** Pauschale im Wartungsvertrag oder nach gemessenem Volumen — **AVV** mit Endkunden klären.

Es gibt **kein** separates „Reseller-Token-Dashboard“ pro Mandant im Shared-Tarif — Messung läuft über **einen** Tarif; Mandanten-Trennung ist **technisch/vertraglich** eure Aufgabe.

Bei unsicherem Volumen oder vielen parallelen Projekten: **Pro/Business** oder Beratung (+49 5772 293 150).

---

### FAQ 88 — Partner / White Label / Subdomain

**Section:** Agentur  
**Frage:** Gibt es ein Partnerprogramm, White Label oder eigene Subdomain für AI Hosting?

**Antwort (Entwurf):**

**Formales White-Label-Programm** (eigene Marke, Subdomain der API, Mittwald unsichtbar) gibt es **nicht** als Standardprodukt.

**Was Agenturen typisch machen:**

- **AI Hosting** im eigenen Namen an Kunden verkaufen (Wartungsvertrag, Pauschale)
- **Endkunde** sieht eure App (Open WebUI, Portal, n8n) — nicht die Roh-API
- **Eigene Domain** für die **App** (Container/Webhosting) — nicht für `llm.aihosting.mittwald.de`
- **Ein Tarif** für die Agentur, **pro Kunde** eigene Keys/Configs/AVV

**Partnerprogramm:** Messe-/Vertriebskontakte laufen über **Beratung**; kein Self-Service-„Partner-Tier“ im mStudio.

Interesse an **vielen Kunden** → Tarif **Pro/Business**, Architektur (Container, Mandanten) mit Vertrieb besprechen.

---

### FAQ 89 — Tool-Zoo konsolidieren

**Section:** Integration  
**Frage:** n8n bei Hostinger, Nextcloud bei Hetzner — kann ich alles DSGVO-konform bei mittwald bündeln?

**Antwort (Entwurf):**

Ja — typisches **Agentur-Motiv** aus der Praxis: mehrere Tools bei verschiedenen Anbietern → **eine DSGVO-konforme Plattform**.

**Empfohlener Weg:**

1. **vServer** oder **Dedicated** als Basis
2. **Container Hosting** im mStudio — n8n, Nextcloud, Open WebUI, Qdrant etc. als Vorlagen
3. **AI Hosting** separat buchen — API-Key, Anbindung an n8n/Open WebUI (oft vorkonfiguriert)
4. **Webhosting** zusätzlich, wenn Kunden-Websites/Shops dazu gehören

**Vorteil:** Rechenzentrum DE, **AVV** mit mittwald, ein mStudio für Betrieb — statt Daten bei US-/EU-Mix-Anbietern zu verteilen.

Migration: schrittweise (z. B. zuerst n8n + AI Hosting, dann Nextcloud).

---

### FAQ 90 — Heroku / AWS / Cloud-Migration

**Section:** Integration  
**Frage:** Wir laufen auf Heroku oder AWS — passt mittwald Container Hosting + AI Hosting?

**Antwort (Entwurf):**

**AI Hosting** ersetzt **nicht** Heroku/AWS — es ersetzt **OpenAI & Co.** (LLM-API).

**Typische Migration:**

| Bisher | Bei mittwald |
|--------|--------------|
| Heroku (Build + Deploy) | **Container Hosting** (Docker, mStudio/CLI) |
| AWS LLM / OpenAI | **AI Hosting** (`https://llm.aihosting.mittwald.de/v1`) |
| AWS EC2/Container | **vServer/Dedicated** + Container |

Entwickler-Workflow: Docker-Image bauen, im mStudio deployen, AI Hosting per API-Key anbinden. **DSGVO**-Motiv aus CRM: Kunden fragen nach DE-Hosting statt US-Cloud.

Dedicated AI Hosting nur bei GPU-/Limit-Bedarf — nicht automatisch bei „wir kommen von AWS“.

---

### FAQ 91 — Mehrere KI-Tools parallel (Token-Spitzen)

**Section:** Tarifwahl  
**Frage:** n8n, Open WebUI und ein zweites LLM-Tool laufen parallel — warum ist mein Token-Limit so schnell voll?

**Antwort (Entwurf):**

Jede Anbindung an **dieselbe AI-Hosting-API** zählt auf **ein** Token-Kontingent:

- **n8n**-Workflows (viele kleine Calls)
- **Open WebUI** (Chat + ggf. RAG)
- **Externe Tools** (eigene Apps, Experimente, „nebenbei“ laufende LLMs)

**Praxis aus dem Vertrieb:** Kunden unterschätzen parallele Integrationen — Upgrade-Hinweise kommen oft bei **~5 Mio. (Starter)** oder **deutlicher Überschreitung**.

**Empfehlung:**

1. Im mStudio Verbrauch nach Zeitraum prüfen
2. Test-/Experiment-Tools temporär abklemmen
3. **Pro** einplanen, wenn n8n produktiv + UI parallel
4. API-Keys rotieren / getrennte Keys pro Umgebung (Prod vs. Test) — trotzdem ein Tarif

Bei Limit: **kein automatischer Stopp** — Hinweis + E-Mail + Tarifabstimmung (siehe FAQ #5).

---

### FAQ 92 — OCR, Handschrift & Texterkennung (Klarstellung)

**Section:** Modelle  
**Frage:** Welches Modell für OCR und Handschrift — Qwen oder GLM-OCR?

**Antwort (Entwurf):**

**Unterschiedlich je nach Aufgabe:**

| Aufgabe | Modell | Hinweis |
|---------|--------|---------|
| **OCR / Text aus PDF, Scan, Bild** | **GLM-OCR** | Speziell für Texterkennung — **nicht** Chat-Modelle als Ersatz |
| **Handschrift / schwierige Scans** | **GLM-OCR** testen; Qualität projektabhängig | Ggf. Nachbearbeitung mit Qwen auf **extrahiertem** Text |
| **Klassifikation, Tags, Zusammenfassung** nach OCR | **Qwen3.6**, **Ministral** | Auf bereits erkanntem Text |

**Paperless / DMS:** App hostet ihr **getrennt** (eigener Server/Container) — AI Hosting = **nur KI-API**. OpenAI (gpt-4o) durch mittwald ersetzen = Base-URL + API-Key tauschen, **GLM-OCR** für Erkennung.

Bei DMS mit personenbezogenen Dokumenten: **AVV** + Zweckbindung — unabhängig vom Tarif.

---

## 4. Präzisierung bestehender Inhalte (kein neues ID)

**Thema:** Vertriebs-Mail nannte „Qwen3.5/3.6 für OCR + Handschrift“ — Produkt-FAQ sagt **GLM-OCR**.

**Vorschlag:** In FAQ #67 / OCR-Antworten einen Satz ergänzen:

> Chat-Modelle (Qwen) eignen sich für Text **nach** der Erkennung, nicht als primäres OCR-Ersatzmodell für gpt-4o Vision/OCR.

---

## 5. System-Prompt-Ergänzung (Tarifberater)

**Block `[CRM-Vertrieb — anonymisierte Muster]`** (nur wenn Anfrage passt):

```
Bei Agentur-/Integrations-Fragen:
1. Zuerst klären: Nur API-Ersatz (OpenAI raus) ODER auch App/UI/Workflow hosten?
2. Gesamtkosten nennen: AI-Hosting-Tarif + optional vServer/Container + optional Webhosting — nicht alles in einem Tarif.
3. Bei Open WebUI/n8n: Container oft mit vorkonfiguriertem API-Zugang — Tarif trotzdem gebucht, Token-Limit gilt.
4. Bei Token-Limit: kein harter Abbruch; Upgrade Pro empfehlen wenn n8n+UI parallel (CRM-Muster).
5. Partner/White-Label: ehrlich — kein formales Programm; Reselling über eigenen Vertrag + Mandanten-Trennung.
6. DSGVO: DE-Rechenzentrum, AVV, kein US-Transfer bei mittwald-Modellen — kurz, nicht marketinglastig.
7. OCR/Paperless: GLM-OCR für Erkennung, App separat hosten.
8. Dedicated nicht vorschnell — Business zuerst bei hohem SaaS-Traffic.
Bei konkreten Kaufentscheidungen: Vertrieb +49 5772 293 150 — beratend, nicht abwehrend.
```

---

## 6. Antwort-Bausteine aus CRM (anonymisiert)

Für Ton & Struktur — **nicht** wörtlich als FAQ, sondern als Stilreferenz:

**Einstieg DSGVO (Paperless/DMS-Agentur):**
> „Sie ersetzen OpenAI in Ihrer bestehenden Lösung — AI Hosting ist die API-Schicht. Paperless/DMS bleibt auf Ihrer Infrastruktur; wir liefern DSGVO-konforme Modelle in DE.“

**Minimal-Setup (Vertrieb):**
> „Mit AI-Hosting-Tarif haben Sie mStudio, Token-Übersicht und API-Keys. Optional vServer: dann OpenWebUI-Container per Klick. Weitere Leistungen nicht zwingend.“

**Upgrade n8n (Limit nahe):**
> „Ihr Stack (n8n + AI Hosting) nähert sich dem Token-Limit — Pro (75 Mio.) gibt Reserve für produktive Workflows.“

**POC Agentur:**
> „Starter für den PoC, Verbrauch messen — bei mehreren Kundenprojekten früh Pro einplanen.“

**RAG/FAQ-Chatbot:**
> „Für deutschsprachigen FAQ-Chat (RAG): Ministral 14B oft guter Kompromiss Kosten/Qualität; bei mehr Last Qwen3.6 prüfen.“

---

## 7. Nächster Schritt (nach Freigabe)

1. FAQ **85–92** in `client/src/playgroundAiHostingTariffFaq.ts` einfügen  
2. OCR-Präzisierung in bestehende Einträge  
3. System-Prompt in `playgroundUseCases.ts` (`AI_HOSTING_TARIFF_ADVISOR_SYSTEM_PROMPT`) ergänzen  
4. Optional: Batch-Test mit 10 CRM-typischen Fragen (Paperless, n8n, Partner, Gesamtkosten)

---

## 8. Beispielfragen für manuellen Test (nach Einbau)

1. „Ich will Paperless mit DSGVO-KI statt OpenAI — was brauche ich alles und was kostet es?“  
2. „Open WebUI läuft ohne API-Key — bin ich am 9-€-Tarif und wie begrenzt?“  
3. „n8n + Open WebUI — Starter reicht nicht, was nun?“  
4. „Gibt es White Label für meine Agentur-Kunden?“  
5. „Nextcloud bei Hetzner, n8n woanders — alles zu euch?“  
6. „Wir kommen von Heroku — wie sieht der Stack aus?“  
7. „Wie rechne ich Tokens für Wiederverkauf?“  
8. „OCR für Handschrift — Qwen oder GLM-OCR?“

---

*Entwurf erstellt aus Auswertung von `docs/customer.js` — ohne personenbezogene Daten aus dem Export.*
