# Offene Maßnahmen – Datenschutz, Recht & Betrieb

**Zweck:** Zentrale Liste dessen, was beim KI-Playground **noch nicht umgesetzt** oder **außerhalb des Repos** liegt – ergänzend zu `README.md` („Datenschutz & Sicherheit“, öffentlich betreiben) und optional zu einer internen technischen Notiz (`PRIVAT-DSGVO-Datenschutz.md`).

**Hinweis:** Keine Rechtsberatung. Konkrete Pflichten hängen von Rolle (privat / Team / öffentlich), Personenkreis und nationaler Praxis ab.

---

## Bereits technisch/inhaltlich im Projekt vorhanden (Kurzüberblick)

Zur Einordnung, was **nicht** als „fehlend“ unten steht:

| Thema | Umsetzung im Repo (Stand Prüfung) |
|--------|-----------------------------------|
| Chat-Speicher | Verlauf im Browser-`localStorage`, kein serverseitiges Chat-Archiv in der App |
| API-Schlüssel | Nur Server (`.env`), nicht im Frontend |
| Footer-/Rechts-Links | Konfigurierbar per `PLAYGROUND_LINK_*` → `GET /api/config` |
| Websuche | Opt-in-Dialog, lokale Speicherung der Zustimmung, **Widerruf** in Modell-Einstellungen, Hinweis auf KI-Verdichtung + Suchanbieter |
| Rate-Limits | Konfigurierbar, strukturierte 429-Antworten, UI-Hinweise |
| Dokumentation | README: Deployment-Hinweise, Kurzdatenschutz, Verweis auf mittwald-Doku |

---

## 1. Recht & Organisation (typisch außerhalb des Quellcodes)

Diese Punkte werden im Repository **nicht** „mitgeliefert“, sind für einen **verantwortungsvollen Betrieb** mit personenbezogenen Daten aber üblich:

- [ ] **Datenschutzerklärung** als **eigene Webseite** (Inhalt vom Verantwortlichen / juristische Prüfung); im Playground nur **Verlinkung** über `PLAYGROUND_LINK_PRIVACY_URL` möglich.
- [ ] **Impressum** (eigene Seite, Verlinkung `PLAYGROUND_LINK_IMPRESSUM_URL`).
- [ ] **Nutzungsbedingungen** optional (`PLAYGROUND_LINK_TERMS_URL`), je nach öffentlichem Zugang und Haftungswunsch.
- [ ] **Verzeichnis der Verarbeitungstätigkeiten (VVT)** führen und bei Änderungen aktualisieren.
- [ ] **Rechtsgrundlagen** je Verarbeitung dokumentieren (z. B. Art. 6 DSGVO), inkl. **Interessenabwägung** wo „berechtigtes Interesse“ (Betrieb, Sicherheit, Missbrauchsschutz, Mindest-Logging).
- [ ] **Auftragsverarbeitung:** Verträge bzw. **AVV/DPA** mit **mittwald**, **Such-API** (SerpAPI, Serper, o. Ä.) und weiteren relevanten Anbietern prüfen, abschließen, ablegen.
- [ ] **Drittlandübermittlungen** erfassen (je nach Anbieter/Schichten) und in der Datenschutzerklärung bzw. interner Doku abbilden (inkl. Garantien nach Art. 46 DSGVO, soweit zutreffend).
- [ ] **Betroffenenrechte** ohne Login: erreichbarer **Kontakt** (E-Mail/Ticket); intern klären, wie mit **nicht zuordenbaren** Anfragen umgegangen wird.
- [ ] **Vorfälle / Datenpanne:** interner Ablauf (inkl. ggf. Meldung an Aufsicht / Betroffene – mit externer Beratung).
- [ ] **Zugriff & Schulung:** Wer darf Produktion, Logs und Secrets einsehen?

---

## 2. Betrieb & Infrastruktur

Die App setzt Annahmen voraus; die **konkrete Produktions-Umsetzung** liegt beim Betreiber:

- [ ] **TLS/HTTPS** vor dem Proxy.
- [ ] **CORS:** `CORS_ORIGIN` auf die echte Frontend-URL setzen (siehe README).
- [ ] **Modell-Allowlist** (`PLAYGROUND_ALLOWED_MODELS`) absichern.
- [ ] **Rate-Limits** an Last und Budget anpassen.
- [ ] **Server-/Proxy-/Container-Logs:** Inhalte und **Aufbewahrungsfristen** definieren (keine vollständigen Chat-Inhalte loggen; technische Metadaten begrenzt).
- [ ] **Backups:** Falls der Hoster oder ihr automatisch sichert – prüfen, ob sensible Inhalte unbeabsichtigt länger vorliegen als beabsichtigt.
- [ ] **Zugriffsbegrenzung** für Test/Beta (VPN, Basic Auth, Firewall), wenn die Instanz **nicht** öffentlich sein soll.

---

## 3. Produkt/App – verbleibende Lücken (optional, falls gewünscht)

Funktionen, die für **stärkere Transparenz oder Rechtemanagement** sinnvoll sein können, aktuell aber **nicht** oder nur eingeschränkt vorhanden:

- [x] **Websuche-Einwilligung gezielt widerrufen** — Modell-Einstellungen (Zahnrad) → Websuche → „Einwilligung zurückziehen“ (löscht `localStorage`-Flag, deaktiviert Websuche in allen Chats).
- [ ] **Sichtbare Zielgruppen-/Alters-Hinweise** (z. B. nicht für Minderjährige, nur B2B-Demo) – nicht als feste UI vorgesehen.
- [ ] **Hinweis auf Kontakt für Datenschutzanfragen** in der Oberfläche – nur indirekt möglich über verlinkte **Datenschutz-Seite** mit Kontaktdaten.

---

## 4. Tracking, Cookies, Analytics

- [ ] Das Projekt enthält **kein** eingebautes Marketing-Analytics; ein **Cookie-Banner** ist nur nötig, wenn ihr **zusätzlich** Tools mit nicht notwendigen Cookies/eindeutigen IDs einbindet (separate Prüfung).

---

## 5. Abgleich mit interner Notiz `PRIVAT-DSGVO-Datenschutz.md`

Falls du lokal eine Datei `PRIVAT-DSGVO-Datenschutz.md` pflegst:

- Abschnitt „README vs. Realität“ (zusätzlicher **LLM-Schritt** vor dem Suchanbieter): Im **README** sind **Verdichtung** und Kurz-Anfragen bereits beschrieben; die interne Notiz ggf. **aktualisieren**, damit keine veraltete Lücke stehen bleibt.

---

## 6. Nächste Schritte (empfohlen)

1. Priorität **Rechtsseiten** verlinken oder erstellen, bevor die Instanz **öffentlich** erreichbar ist.  
2. **VVT + AVV-Doku** parallel zum Go-Live auffüllen.  
3. **Betrieb:** CORS, TLS, Limits, Logs festziehen.  
4. Bei Bedarf: **Zielgruppenhinweise** oder Kontakt für Datenschutzanfragen in der UI bzw. verlinkter Datenschutz-Seite.

---

*Diese Seite dokumentiert bewusst **Lücken**; sie ersetzt keine Datenschutzerklärung und kein Verzeichnis der Verarbeitungstätigkeiten.*
