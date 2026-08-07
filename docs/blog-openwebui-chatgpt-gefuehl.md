# Open WebUI bei mittwald: ChatGPT-Gefühl – aber unter deiner Kontrolle

**Meta-Titel:** Open WebUI bei mittwald – souveräne KI mit ChatGPT-Gefühl  
**Meta-Description:** Open WebUI mit mittwald AI Hosting aufsetzen: Modelle wählen, Websuche und RAG einrichten. Ehrlicher Vergleich zu ChatGPT – und warum Kontrolle oft mehr zählt.  
**Kategorie:** Hosting / mStudio / AI Hosting  
**Zielgruppe:** Agenturen, Freelancer, Entscheider ohne Deep-Tech-Hintergrund  
**Status:** Entwurf für mittwald.de/blog

---

Du kennst das: Das Team nutzt ChatGPT, die Kunden fragen nach „unserer KI“, und irgendwann kommt die Frage: *Wo landen eigentlich unsere Firmendaten?*

Genau dafür gibt es einen anderen Weg. Mit **Open WebUI** und **mittwald AI Hosting** bekommst du eine Chat-Oberfläche, die sich anfühlt wie das, was viele aus dem Alltag kennen – betrieben in deinem Projekt, mit Modellen auf deutscher Infrastruktur.

Dieser Beitrag zeigt dir, was dahintersteckt, wo ChatGPT weiterhin vorne liegt – und wie du in wenigen Minuten eine eigene Instanz startklar bekommst.

## Erst ehrlich: ChatGPT ist oft die stärkere Allzweck-KI

OpenAI steckt enorme Mittel in sehr große Modelle und in ein Nutzererlebnis, das über Jahre poliert wurde. In reiner Sprachqualität, Kreativität und „es klappt einfach“ liegt ChatGPT deshalb häufig vorne. Wer das erwartet, sollte damit rechnen.

Open WebUI bei mittwald ersetzt ChatGPT nicht eins zu eins. Es gibt euch etwas anderes: **souveräne KI unter eurer Kontrolle**, mit vertrautem Chat-Workflow – ohne dass Firmengespräche und Kundendokumente durch eine öffentliche Konsum-Cloud wandern müssen.

Kurz gesagt:

| ChatGPT oft stärker bei … | Open WebUI stärker bei … |
|---|---|
| Spitzenqualität großer Closed Models | Datenstandort & Kontrolle |
| Poliertem Massen-UX | Team- & Kundeninstanzen |
| „Einfach Account aufmachen“ | Eigenes Wissen (RAG), eigene Nutzer |

Mit den richtigen Modellen und Einstellungen kommt ihr dem bekannten Chat-Gefühl sehr nahe – und behaltet das Steuer.

## Was ist Open WebUI?

Open WebUI ist eine selbst gehostete Chat-Oberfläche. Du betreibst sie als Container, die KI-Antworten kommen über eine OpenAI-kompatible API – bei uns über **mittwald AI Hosting**.

Für dich heißt das praktisch:

- Chat, Texte, Analysen – wie gewohnt
- Optional Websuche für aktuelle Infos
- Optional Antworten aus euren PDFs und Handbüchern (RAG)
- Eigene Nutzerverwaltung statt eines öffentlichen Massen-Accounts

Voraussetzungen: ein mStudio-Projekt mit **Container Hosting**, ein **AI-Hosting**-Tarif (Starter reicht zum Testen) und ein API-Key.

## In etwa zehn Minuten startklar

Der schnellste Weg führt über den API-Key-Dialog im mStudio – ohne Terminal:

1. **AI Hosting** im mStudio aktivieren.
2. API-Key anlegen und **Open WebUI mitinstallieren** (Container-fähiges Produkt vorausgesetzt).
3. Im **selben Dialog den Admin-Benutzer** setzen. So steht die Oberfläche nicht blank und ungeschützt im Netz – der erste Zugang ist schon da, bevor du die Domain öffnest.
4. Domain bzw. Subdomain verbinden und mit dem Admin-Zugang anmelden.
5. Als Standardmodell z. B. `Qwen3.6-35B-A3B-FP8` wählen und eine Testfrage stellen.

Wenn eine Antwort kommt, steht die Verbindung. Ab hier kannst du produktiv chatten – Websuche und Wissensdatenbank machen daraus später das „Plus-Gefühl“.

> **Warum der Admin im Dialog?**  
> Ohne vorab gesetzten Admin könnte Open WebUI kurz mit offener Erst-Registrierung erreichbar sein. Der Dialog verhindert genau das: zuerst Admin, dann öffentlich erreichbar.

Wer lieber manuell deployt, startet das Image `ghcr.io/open-webui/open-webui:main`, legt ein Volume auf `/app/backend/data` und setzt unter anderem:

```text
OPENAI_API_BASE_URL=https://llm.aihosting.mittwald.de/v1
OPENAI_API_KEY=dein_api_key_hier
WEBUI_NAME=mittwald AI Chat
ENABLE_SIGNUP=false
```

Details zu CLI und Compose findest du in unserem [Developer Portal](https://developer.mittwald.de/de/docs/v2/guides/apps/openwebui/).

## Welches Modell wofür?

Das ChatGPT-Gefühl kommt nicht nur von der Oberfläche – sondern davon, das **richtige Modell für die Aufgabe** zu wählen. Faustregel: mit dem kleinsten ausreichenden Modell starten.

| Aufgabe | Empfehlung | Kurz warum |
|---|---|---|
| Alltags-Chat, Texte, E-Mails | `Qwen3.6-35B-A3B-FP8` | Starkes Allrounder-Modell mit Reasoning und Vision – guter Default |
| Schwere Analysen, höchste Qualität | `gpt-oss-120b` oder `Qwen3.5-122B-A10B-FP8` | Große Modelle; 122B zusätzlich Vision |
| Bilder / Screenshots verstehen | `Qwen3.5-122B-A10B-FP8` oder `Ministral-3-14B-Instruct-2512` | Vision |
| Massenaufgaben, Routing | `Qwen3.5-0.8B` | Schnell und sparsam |
| Diktieren | `whisper-large-v3-turbo` | Speech-to-Text – aus der Chat-Liste ausblenden |
| Wissensdatenbank | `Qwen3-Embedding-8B` | Embedding, kein Chat-Modell |
| PDF/Scan → Text | `GLM-OCR` | Dokument-OCR |

In Open WebUI unter **Models** solltest du Whisper, Embedding, OCR und Reranker per „Hide model“ aus der Chat-Auswahl nehmen. Sonst landen Spezialmodelle versehentlich im normalen Chat.

Unter **Advanced Params** lohnt sich ein Blick auf die empfohlenen Werte für `temperature`, `top_p` und `top_k` – dokumentiert je Modell im Developer Portal.

## Websuche: aktuelle Infos im Chat

Damit die KI nicht nur aus dem Trainingswissen antwortet, aktivierst du Websuche:

- **Einfach:** Brave Search API im Admin unter Tools → Web Search. Engine `brave`, Concurrent Requests auf **1** (wichtig fürs Free Tier).
- **Souverän:** SearXNG als zweiten Container im selben Projekt, JSON-Format aktivieren, Query-URL über den internen DNS-Namen.

Im Chat schaltest du die Suche über das Globus-Symbol bzw. den Web-Search-Toggle ein.

## Eigene Dokumente: kleines RAG in Open WebUI

RAG heißt: erst relevante Stellen aus euren Dokumenten holen, dann antworten. In Open WebUI geht das so:

1. **Admin Settings → Documents:** Embedding-Engine „OpenAI“, Endpunkt `https://llm.aihosting.mittwald.de/v1`, Key eintragen, Modell `Qwen3-Embedding-8B`, **Embedding-Stapelgröße 32**.
2. **Workspace → Knowledge:** neue Wissensdatenbank anlegen, PDFs hochladen.
3. Im Chat **Attach knowledge** nutzen und eine Frage stellen, die nur aus dem Dokument beantwortbar ist.

Wenn die eingebaute Knowledge-Funktion irgendwann nicht mehr reicht, kannst du im mStudio Richtung AnythingLLM und Qdrant wachsen – weiterhin über AI Hosting und Container, ohne Extra-RAG-Tarif.

## Speech-to-Text mit Whisper

Unter **Admin Settings → Audio**: Engine „OpenAI“, dieselbe Base-URL und denselben Key, STT-Modell `whisper-large-v3-turbo`. Sprache in den Benutzereinstellungen explizit setzen (z. B. `de`). Whisper danach in der Modellliste ausblenden – es gehört hinters Mikrofon, nicht in die Chat-Auswahl.

## Checkliste vor dem Team-Link

Bevor du die URL an Kollegen oder Kunden gibst:

- Domain mit HTTPS erreichbar  
- Admin im AI-Hosting-Dialog gesetzt (oder manuell: erster Account + Signup gesperrt)  
- Default-Modell gesetzt, Spezialmodelle ausgeblendet  
- Testchat ok  
- Optional: Websuche und ein Testdokument in Knowledge geprüft  
- Volume auf `/app/backend/data` vorhanden (Projekt-Backup sichert mit)

## Fazit

ChatGPT bleibt für viele der Maßstab bei reiner Antwortqualität. Open WebUI bei mittwald beantwortet eine andere Frage: *Wie bekommen wir ein vertrautes Chat-Erlebnis – mit Modellen in Deutschland, eigenen Nutzern und unserem Firmenwissen?*

Wenn du genau das brauchst, ist der Weg kurz: API-Key anlegen, Open WebUI mitinstallieren, Admin setzen, Domain verbinden – und dann Modelle, Suche und Knowledge so einstellen, dass es sich nach „unserer KI“ anfühlt.

**Weiterlesen / starten**

- [AI Hosting im mStudio](https://www.mittwald.de/mstudio/ai-hosting)  
- [Open WebUI betreiben (Developer Portal)](https://developer.mittwald.de/de/docs/v2/guides/apps/openwebui/)  
- [Open WebUI mit mittwald AI Hosting](https://developer.mittwald.de/de/docs/v2/platform/aihosting/examples/openwebui/)  
- [Verfügbare Modelle](https://developer.mittwald.de/de/docs/v2/platform/aihosting/models/)  
- [RAG bei mittwald](https://www.mittwald.de/mstudio/ai-hosting/rag)

---

### Redaktionsnotizen (nicht veröffentlichen)

- Ton angelehnt an Beiträge wie [Container 101](https://www.mittwald.de/blog/hosting/container-101-1-was-ist-ein-container-und-was-ist-docker): du-Ansprache, kurze Absätze, ehrliche Einordnung, weicher CTA.
- Ausführliche Klickstrecke inkl. Compose/FAQ: `docs/openwebui-anleitung.html`
- Autor: bitte intern festlegen (Produkt / AI / Redaktion).
- Optional Hero: Screenshot Open WebUI mit mittwald-Modellen (ohne echte Kundendaten).
