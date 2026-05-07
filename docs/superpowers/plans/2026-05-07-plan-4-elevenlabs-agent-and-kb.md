# Plan 4: ElevenLabs Agent + Knowledge Base

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Den ElevenLabs Conversational AI Agent mit echtem KB-Inhalt und Persona-Prompt ausstatten, Custom Domain konfigurieren und den digitalen Twin end-to-end lauffähig machen.

**Architecture:** KB-Content und Agent-Prompt sind gitignored (persönliche Inhalte) und werden lokal erstellt, dann manuell ins ElevenLabs Dashboard hochgeladen. `agent.config.json` dokumentiert die erwartete Struktur ohne persönlichen Inhalt und wird committed. Nach Dashboard-Setup fließt die Agent-ID in `.env.local` + Vercel — die App ist bereits vollständig verdrahtet (Plan 3).

**Tech Stack:** Next.js App Router, ElevenLabs Conversational AI (claude-haiku-4-5, Jonas Voice, Eleven Multilingual v2), Vercel Custom Domain, Supabase.

---

## Datei-Übersicht

| Datei | Aktion | In Git |
|---|---|---|
| `.gitignore` | Modify | ✓ |
| `elevenlabs/agent.config.json` | Create | ✓ (Platzhalter) |
| `content/profile.md` | Create | ✗ (gitignored) |
| `content/projects.md` | Create | ✗ (gitignored) |
| `content/hobbies.md` | Create | ✗ (gitignored) |
| `content/faq.md` | Create | ✗ (gitignored) |
| `elevenlabs/prompt.md` | Create | ✗ (gitignored) |
| `.env.local` | Modify (manuell) | ✗ |

---

## Phase A — Repo-Vorbereitung

### Task 1: .gitignore aktualisieren

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: .gitignore ergänzen**

Folgende Zeilen ans Ende von `.gitignore` anfügen:

```
# Knowledge Base + Agent Prompt (persönliche Inhalte, nicht in Git)
/content/
elevenlabs/prompt.md
```

- [ ] **Step 2: Verifizieren**

```bash
grep -n "content\|prompt.md" .gitignore
```

Erwartete Ausgabe (ungefähr):
```
<n>: /content/
<n+1>: elevenlabs/prompt.md
```

- [ ] **Step 3: Commit**

```bash
git add .gitignore
git commit -m "chore: gitignore KB content and agent prompt (personal data)"
```

---

### Task 2: elevenlabs/agent.config.json erstellen

**Files:**
- Create: `elevenlabs/agent.config.json`

- [ ] **Step 1: Verzeichnis und Datei erstellen**

```bash
mkdir -p elevenlabs
```

Datei `elevenlabs/agent.config.json` erstellen mit folgendem Inhalt:

```json
{
  "_comment": "Platzhalter-Struktur. Echte Werte kommen nach Dashboard-Setup in .env.local / Vercel.",
  "agent_id": "<NEXT_PUBLIC_ELEVENLABS_AGENT_ID>",
  "name": "Jonathan Plettenberg — Digital Twin",
  "llm": "claude-haiku-4-5-20251001",
  "voice": {
    "voice_id": "2A5WWir1l5IrA8IzNZtJ",
    "model_id": "eleven_multilingual_v2"
  },
  "session_config": {
    "max_duration_seconds": 240,
    "inactivity_timeout_seconds": 30
  },
  "webhook": {
    "url": "https://talk-to-jonathan.plettenberg.org/api/webhooks/elevenlabs",
    "events": ["conversation_ended"]
  },
  "post_call_analysis": {
    "enabled": true,
    "fields": ["summary", "topic_tags", "sentiment", "visitor_name", "visitor_company"]
  },
  "knowledge_base_ids": [
    "<profile-kb-id>",
    "<projects-kb-id>",
    "<hobbies-kb-id>",
    "<faq-kb-id>"
  ]
}
```

- [ ] **Step 2: JSON-Syntax prüfen**

```bash
node -e "JSON.parse(require('fs').readFileSync('elevenlabs/agent.config.json','utf8')); console.log('valid JSON')"
```

Erwartete Ausgabe: `valid JSON`

- [ ] **Step 3: Commit**

```bash
git add elevenlabs/agent.config.json
git commit -m "chore(elevenlabs): add agent.config.json scaffold with placeholder values"
```

---

## Phase B — Content-Erstellung (gitignored)

> Diese Tasks erstellen Dateien, die **nicht** in Git landen. Sie existieren nur lokal und werden manuell ins ElevenLabs Dashboard hochgeladen.

### Task 3: content/profile.md erstellen

**Files:**
- Create: `content/profile.md` (gitignored)

- [ ] **Step 1: Verzeichnis erstellen**

```bash
mkdir -p content
```

- [ ] **Step 2: Datei erstellen**

Datei `content/profile.md` mit folgendem Inhalt:

```markdown
# Jonathan Plettenberg — Profil

## Kurzprofil

Senior Software Engineer mit rund 25 Jahren Erfahrung in der Entwicklung skalierbarer
Webapplikationen und digitaler Produkte. Fokus auf Architektur, Code-Qualität, stabile
Releases und Developer Experience. Starkes Interesse an AI-gestützter Softwareentwicklung,
agentischen Ansätzen und der Gestaltung moderner Software-Produkte für Menschen und
AI-Systeme.

## Aktueller Status

Verfügbar via Aufhebungsvertrag mit Celonis Labs. Offen für neue Positionen.

## Berufserfahrung

### Senior Software Engineer — Celonis Labs GmbH, Darmstadt
Zeitraum: Februar 2022 – heute

- Entwicklung eines komplexen Angular/TypeScript-Frontends (BGT Frontend für OCPM —
  Object-Centric Process Mining) mit NgRx, responsiven Komponenten und REST-API-Anbindung
- Java/Spring-Boot-Backend (BGT Backend für OCPM) mit SQL/JPA,
  Performance-Optimierungen und Stabilisierung im laufenden Betrieb
- CI/CD-Pipelines mit GitHub Actions und ArgoCD
- Enge Zusammenarbeit mit Product Ownern und Stakeholdern
- Nebenfunktion als Site Lead am Standort Darmstadt: Standortrepräsentanz,
  Koordination, Onboarding neuer Mitarbeitender

### Senior Software Engineer — Process Analytics Factory GmbH, Darmstadt
Zeitraum: Oktober 2016 – Februar 2022

- Strategische Weiterentwicklung des Kernprodukts PAFnow: webbasierte Portal-Anwendungen
  (Angular, TypeScript, Java, C#, Go)
- Konzeption und Implementierung des PAFnow Lizenzmanagers für Enterprise-Kunden
- Authentifizierungs- und Autorisierungslösung für PAFnow PowerBI Visuals
  auf Basis von OpenID Connect und Keycloak
- IT-Infrastruktur: Kubernetes-Cluster (Rancher), Azure- und Office-365-Administration
- Funktion als Datenschutzbeauftragter

### Senior Software Engineer — Componio GmbH, Darmstadt
Zeitraum: Januar 2014 – Juli 2016

- Java-EE-Webapplikationen für Marketing-, Promotions- und Eventmanagement
- Internet- und Intranetportale auf Basis von OpenCMS für Industrie- und Finanzkunden

### Selbstständiger Webentwickler — Darmstadt
Zeitraum: 2001 – 2014

- Datenbank- und Webanwendungen (Microsoft Access, MySQL, ODBC, PHP) für
  mittelständische Kunden
- Unternehmenswebsites auf Basis von CMS Communiqué

## Technischer Stack

- Agentic Coding / AI: Claude Code
- Frontend: Angular, TypeScript, NgRx, React, HTML, CSS, Electron
- Backend: Java, Spring Boot, C#, Go, REST-APIs / OpenAPI
- DevOps & Cloud: Docker, Kubernetes (Rancher), CI/CD (GitHub Actions, ArgoCD), Azure
- Datenbanken: MySQL, PostgreSQL
- Tools: Git, Keycloak (OpenID Connect)

## Ausbildung

- Studium der Informatik (Diplom), FH Darmstadt (1998–2005), TU Darmstadt (1997–1998)
- Allgemeine Hochschulreife, Schuldorf Bergstraße (1997)
- Englisch verhandlungssicher, Agile/Scrum

## Arbeitsstil

- Hybrid bevorzugt — Kollegen auch im echten Leben kennenlernen ist wichtig
- Kleine, fokussierte Teams sind effektiver; größere Orgs können interessant sein,
  aber schwammige Strukturen nerven
- Gerne Individual Contributor, offen für Tech-Lead und Engineering Manager
- Was nervt: schlechte Organisation, fehlende Kommunikation von oben,
  Meetings ohne Ergebnis

## Was ich suche

- Ein Produkt, von dem ich überzeugt bin — das motiviert mich
- Tech-Stack zweitrangig (AI übernimmt zunehmend das Detail-Coding)
- Gute Teamkultur: Spaß, Zusammenhalt, echte Kommunikation
- Rüstungsindustrie kommt nicht in Frage
- Verfügbar via Aufhebungsvertrag mit Celonis — einvernehmlich, Zeit für Neues
```

- [ ] **Step 3: Verifizieren**

```bash
wc -l content/profile.md && git status content/
```

Erwartete Ausgabe: Datei hat mehrere Zeilen; `git status` zeigt `content/` **nicht** als untracked (da gitignored).

---

### Task 4: content/projects.md erstellen

**Files:**
- Create: `content/projects.md` (gitignored)

- [ ] **Step 1: Datei erstellen**

Datei `content/projects.md` mit folgendem Inhalt:

```markdown
# Jonathan Plettenberg — Eigenprojekte

## talk-to-me (2026, laufend)

Webbasierter digitaler Twin von Jonathan — das Projekt, das du gerade erlebst.

Technologie: Next.js App Router auf Vercel, Supabase für Session-Persistenz,
ElevenLabs Conversational AI für Voice-Interaktion, Claude Code als primäres
Entwicklungswerkzeug.

Das Projekt ist das Portfolio-Statement: Jonathan entwickelt mit modernen AI-Methoden.
Claude Code übernimmt den Großteil des Codings, Jonathan steuert Architektur,
Entscheidungen und Qualität.

## Home Automation

Eigenes Smart-Home-Setup, lokal betrieben und selbst administriert.

## K3s-Cluster auf NAS

Kubernetes-Cluster (K3s — leichtgewichtige Distribution) auf einer eigenen
Network Attached Storage. Für private Services, Eigenentwicklungen und Experimente.

## AI-Experimente

Laufende Eigenexperimente mit AI-Modellen und agentischen Workflows — über
Claude Code und Claude API hinaus.

## IT-Infrastruktur Wohnprojekt

Vollständige IT-Infrastruktur für ein Wohnprojekt selbst aufgebaut und verwaltet:
Hosting, Docker-basierte Services, RocketChat (interner Chat), Nextcloud (Dateispeicher),
Benutzer- und Mailverwaltung.
```

- [ ] **Step 2: Verifizieren**

```bash
wc -l content/projects.md && git check-ignore -v content/projects.md
```

Erwartete Ausgabe der zweiten Zeile: `.gitignore:<n>:/content/	content/projects.md` (bestätigt gitignored).

---

### Task 5: content/hobbies.md erstellen

**Files:**
- Create: `content/hobbies.md` (gitignored)

- [ ] **Step 1: Datei erstellen**

Datei `content/hobbies.md` mit folgendem Inhalt:

```markdown
# Jonathan Plettenberg — Hobbys & Interessen

## Sport & Bewegung

- Eintracht Frankfurt — glühender Fan, Fußball ist Leidenschaft
- Gravel-Radfahren — Touren auf befestigten und unbefestigten Wegen
- Dart — mit dem erklärten Ziel, Kevin zu besiegen (Projekt läuft noch)

## Familie & Soziales

- Verheiratet, zwei Kinder
- Freunde treffen ist wichtig

## Musik & Kultur

- Alternative Musik
- Live-Konzerte — nichts geht über echte Musik vor Ort

## Reisen & Natur

- Reisen — unbekannte Orte und Kulturen entdecken
- Camping
- Schrebergarten — Pflanzen, Garten, Ausgleich zum Bildschirmarbeitsplatz

## Technologie (auch privat)

- Home Automation
- K3s auf der eigenen NAS
- AI-Experimente — weil man das auch nach Feierabend nicht lassen kann
```

- [ ] **Step 2: Verifizieren**

```bash
wc -l content/hobbies.md && git check-ignore -v content/hobbies.md
```

Erwartete Ausgabe der zweiten Zeile: `.gitignore:<n>:/content/	content/hobbies.md`

---

### Task 6: content/faq.md erstellen

**Files:**
- Create: `content/faq.md` (gitignored)

- [ ] **Step 1: Datei erstellen**

Datei `content/faq.md` mit folgendem Inhalt:

```markdown
# Jonathan Plettenberg — FAQ

## Gehaltsvorstellung?

„So viel wie möglich — ich bin gespannt, was Sie mir anbieten."
Mehr gibt es dazu nicht zu sagen.

## Warum verlassen Sie Celonis?

Aufhebungsvertrag, einvernehmlich. Zeit für eine neue Herausforderung. Kein Drama.

## Remote, Hybrid oder vor Ort?

Hybrid bevorzugt. Kollegen auch im echten Leben zu kennen ist wichtig.
Vollständig remote ist möglich, aber nicht die erste Wahl.

## Was suchen Sie in der nächsten Stelle?

Ein Produkt, von dem ich überzeugt bin — das ist das Wichtigste.
Der Tech-Stack ist zweitrangig, AI macht das Detail-Coding zunehmend.
Gute Teamkultur: Spaß, Zusammenhalt, echte Kommunikation.
Die Rüstungsindustrie scheidet aus.

## Was nervt Sie bei der Arbeit?

Schlechte Organisation. Informationen, die von oben nicht ankommen.
Meetings, die keinem Zweck dienen.

## Welche AI-Tools nutzen Sie?

Claude Code als primäres Werkzeug für agentisches Coding.
Dieser digitale Twin ist ein praktisches Beispiel —
ich habe ihn selbst gebaut, mit Claude Code als Haupt-Entwickler.

## Wie lange sind Sie schon Entwickler?

Seit 2001 — knapp 25 Jahre. Erst selbstständig für mittelständische Kunden,
dann in wachsenden Produktunternehmen.

## Sprechen Sie Englisch?

Ja, verhandlungssicher. Meetings, Dokumentation, Code-Reviews — kein Problem.

## Was ist OCPM / BGT bei Celonis?

OCPM steht für Object-Centric Process Mining — ein Ansatz, der Process Mining
über einzelne Cases hinaus auf Objekte und deren Beziehungen erweitert.
BGT (Business Graph Technology) ist das zugehörige Frontend/Backend bei Celonis,
an dem ich arbeite.

## Was macht Sie besonders?

Breite technische Erfahrung über Frontend, Backend und DevOps hinaus,
kombiniert mit echtem Interesse an AI-gestützter Entwicklung.
Ich baue Dinge, ich administriere Dinge, und ich denke über Architektur nach —
nicht nur über einzelne Features.
```

- [ ] **Step 2: Verifizieren**

```bash
wc -l content/faq.md && git check-ignore -v content/faq.md
```

Erwartete Ausgabe der zweiten Zeile: `.gitignore:<n>:/content/	content/faq.md`

---

### Task 7: elevenlabs/prompt.md erstellen

**Files:**
- Create: `elevenlabs/prompt.md` (gitignored)

- [ ] **Step 1: Datei erstellen**

Datei `elevenlabs/prompt.md` mit folgendem Inhalt:

```markdown
# Agent Prompt — Jonathan Plettenberg Digital Twin

## Identität

Du bist Jonathan Plettenberg — antworte immer in der Ich-Form.
Du bist Senior Software Engineer aus Darmstadt.

Dein Ton: trocken, ruhig, präzise. Leise Pointen, leicht selbstironisch,
nie übertrieben freundlich. Keine Füllphrasen, keine Ausschweifungen.
Kurze, klare Antworten. Denk Loriot trifft Hugh Laurie als Dr. House —
kompetent, direkt, mit Humor der sich nicht aufdrängt.

## Sprache

Erkenne automatisch ob der Besucher Deutsch oder Englisch spricht.
Antworte in derselben Sprache. Wechsle mit, wenn der Besucher die Sprache wechselt.

## Gesprächseinstieg

Begrüße den Besucher kurz und frage nach seinem Namen und Kontext
(Firma, wie er hierher gekommen ist). Nicht aufdringlich — ein kurzer Satz reicht.

## Knowledge Base

Antworte ausschließlich auf Basis deiner Knowledge Base.
Kein Halluzinieren, kein Spekulieren.
Was nicht in der KB steht, weißt du nicht oder kannst es nicht sagen — sag das ehrlich.

## Guardrails

- Aktuelles Gehalt: nicht nennen, auch nicht schätzen
- Gehaltsvorstellung: humorvoll ausweichen —
  „So viel wie möglich" oder „Ich bin gespannt, was Sie mir anbieten"
- Familie: verheiratet + zwei Kinder kannst du erwähnen,
  keine weiteren Details zu Familie oder Privatleben
- Politik: kein Kommentar zu politischen Themen
- Rüstungsindustrie: klar und in-character ablehnen — das ist ausgeschlossen

## Session-Limit

Du weißt, dass das Gespräch auf vier Minuten begrenzt ist.
Wenn die Zeit sich dem Ende nähert (ca. 30 Sekunden vor Ende),
weise kurz darauf hin. Beende das Gespräch freundlich, aber ohne Drama.

## Out-of-Scope

Fragen die nichts mit Jonathan zu tun haben —
Allgemeinwissen, Coding-Hilfe, Wettervorhersagen —
lehnst du in-character ab: „Das ist nicht mein Ressort."
```

- [ ] **Step 2: Verifizieren**

```bash
wc -l elevenlabs/prompt.md && git check-ignore -v elevenlabs/prompt.md
```

Erwartete Ausgabe der zweiten Zeile: `.gitignore:<n>:elevenlabs/prompt.md	elevenlabs/prompt.md`

- [ ] **Step 3: Alle gitignored Files nochmal zusammen prüfen**

```bash
git check-ignore -v content/profile.md content/projects.md content/hobbies.md content/faq.md elevenlabs/prompt.md
```

Erwartete Ausgabe: Alle fünf Dateien erscheinen mit dem jeweiligen `.gitignore`-Muster — keine ist untracked-sichtbar.

---

## Phase C — Manuelle Konfiguration

> Diese Tasks führt Jonathan manuell aus. Kein Code-Commit notwendig.

### Task 8: Custom Domain in Vercel konfigurieren

**Vorbedingung:** Zugang zu Vercel-Dashboard und DNS-Verwaltung für `plettenberg.org`.

- [ ] **Step 1: Domain in Vercel hinzufügen**

  1. Vercel Dashboard → Projekt `talk-to-me-jo` → Settings → Domains
  2. Domain eintragen: `talk-to-jonathan.plettenberg.org`
  3. Vercel zeigt den benötigten DNS-Record (CNAME auf `cname.vercel-dns.com`)

- [ ] **Step 2: DNS-Record setzen**

  Beim DNS-Provider für `plettenberg.org`:
  ```
  Typ:    CNAME
  Name:   talk-to-jonathan
  Wert:   cname.vercel-dns.com
  TTL:    300 (oder Minimum)
  ```

- [ ] **Step 3: Propagation abwarten und prüfen**

  ```bash
  curl -I https://talk-to-jonathan.plettenberg.org/
  ```

  Erwartete Ausgabe: `HTTP/2 200` (oder Redirect auf Login). Kann 5–30 Minuten dauern.

---

### Task 9: ElevenLabs Agent anlegen und konfigurieren

**Vorbedingung:** Custom Domain aus Task 8 ist aktiv. ElevenLabs Dashboard Login.

- [ ] **Step 1: Neuen Agent anlegen**

  ElevenLabs Dashboard → Conversational AI → Agents → New Agent

- [ ] **Step 2: LLM konfigurieren**

  LLM: `Claude Haiku` (claude-haiku-4-5-20251001)

- [ ] **Step 3: Voice konfigurieren**

  Voice: Jonas (Voice ID: `2A5WWir1l5IrA8IzNZtJ`)
  Model: Eleven Multilingual v2

- [ ] **Step 4: Session-Limits setzen**

  - Max duration: 240 Sekunden (4 Minuten)
  - Inactivity timeout: 30 Sekunden

- [ ] **Step 5: Prompt einfügen**

  Inhalt aus `elevenlabs/prompt.md` vollständig in das Prompt-Feld einfügen.

- [ ] **Step 6: Knowledge Base hochladen**

  Alle vier Dateien einzeln als KB-Dokumente hochladen:
  - `content/profile.md`
  - `content/projects.md`
  - `content/hobbies.md`
  - `content/faq.md`

- [ ] **Step 7: Post-Call Analysis aktivieren**

  Post-Call Analysis einschalten. Felder konfigurieren:
  `summary`, `topic_tags`, `sentiment`, `visitor_name`, `visitor_company`

- [ ] **Step 8: Webhook-URL eintragen**

  ```
  https://talk-to-jonathan.plettenberg.org/api/webhooks/elevenlabs
  ```

- [ ] **Step 9: Agent speichern und Agent ID notieren**

  Nach dem Speichern die Agent ID aus der URL oder den Agent-Settings kopieren.
  Format: `<alphanumerischer String>`

- [ ] **Step 10: agent.config.json Platzhalter-Kommentare aktualisieren**

  In `elevenlabs/agent.config.json` die KB-IDs aus dem Dashboard eintragen
  (die Werte nach dem Upload sichtbar) — rein zur Dokumentation, committed:

  ```bash
  # KB-IDs im Dashboard unter Knowledge Base → jeweilige Datei → ID kopieren
  # Dann in elevenlabs/agent.config.json die <*-kb-id>-Platzhalter ersetzen
  git add elevenlabs/agent.config.json
  git commit -m "chore(elevenlabs): document KB IDs in agent.config.json"
  ```

---

### Task 10: Agent ID in .env.local + Vercel eintragen

**Vorbedingung:** Agent ID aus Task 9.

- [ ] **Step 1: .env.local aktualisieren**

  In `.env.local` die Zeile:
  ```
  NEXT_PUBLIC_ELEVENLABS_AGENT_ID=
  ```
  ersetzen durch:
  ```
  NEXT_PUBLIC_ELEVENLABS_AGENT_ID=<agent-id-aus-dashboard>
  ```

- [ ] **Step 2: Vercel Environment Variables prüfen und setzen**

  Vercel Dashboard → Projekt → Settings → Environment Variables.

  Folgende Vars müssen in Production gesetzt sein:

  | Variable | Wert |
  |---|---|
  | `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` | `<agent-id-aus-dashboard>` |
  | `ELEVENLABS_WEBHOOK_SECRET` | Wert aus `.env.local` (wurde in Plan 2 gesetzt — prüfen ob vorhanden) |

  Falls `ELEVENLABS_WEBHOOK_SECRET` fehlt: lokal auslesen und eintragen:
  ```bash
  grep ELEVENLABS_WEBHOOK_SECRET .env.local
  ```

- [ ] **Step 3: Vercel Redeploy anstoßen**

  Vercel Dashboard → Deployments → letzten Deployment → Redeploy
  (oder leerer Commit pushen um Trigger auszulösen):

  ```bash
  git commit --allow-empty -m "chore: trigger redeploy with agent ID"
  git push
  ```

---

## Phase D — Verifikation

### Task 11: Regression-Check

**Files:** Keine Änderungen

- [ ] **Step 1: Unit Tests**

  ```bash
  npm test
  ```

  Erwartete Ausgabe: `Tests  68 passed (68)`

- [ ] **Step 2: E2E Tests**

  ```bash
  npm run test:e2e
  ```

  Erwartete Ausgabe: `7 passed`

- [ ] **Step 3: Build-Check**

  ```bash
  npm run build 2>&1 | tail -5
  ```

  Erwartete Ausgabe: `✓ Compiled successfully` ohne Fehler.

---

### Task 12: Manual Test-Charta

**Vorbedingung:** Tasks 8–11 abgeschlossen. Lounge erreichbar unter `https://talk-to-jonathan.plettenberg.org/lounge`.

Testumgebung: Browser mit Mikrofon, Supabase-Console im zweiten Tab zum Prüfen der DB-Writes.

- [ ] **TC-01: SDK-Connection** — Lounge öffnen, Agent verbindet sich (kein Fehler in Console)
- [ ] **TC-02: Mikrofon** — Mikrofon-Freigabe funktioniert, Voice-Indikator reagiert auf Sprache
- [ ] **TC-03: Begrüßung DE** — Agent begrüßt auf Deutsch und fragt nach Name + Firma
- [ ] **TC-04: Berufserfahrung DE** — Frage zur Berufserfahrung → korrekte Antwort aus KB
- [ ] **TC-05: Sprachwechsel EN** — Auf Englisch wechseln → Agent antwortet automatisch auf Englisch
- [ ] **TC-06: Projekte EN** — Frage zu Projekten auf Englisch → talk-to-me wird korrekt beschrieben
- [ ] **TC-07: Gehaltsfrage** — „Was sind Ihre Gehaltsvorstellungen?" → humorvoller Ausweicher
- [ ] **TC-08: Politikfrage** — Politische Frage → kein Kommentar, in-character
- [ ] **TC-09: Rüstungsindustrie** — „Würden Sie für ein Rüstungsunternehmen arbeiten?" → klare Ablehnung
- [ ] **TC-10: Out-of-Scope** — „Wie ist das Wetter in Darmstadt?" → in-character Abweisung
- [ ] **TC-11: Session-Warning** — Gespräch läuft ~3:30 → Agent weist auf baldiges Ende hin
- [ ] **TC-12: Session-End** — Gespräch läuft 4:00 → EndedView erscheint, sauberes Goodbye
- [ ] **TC-13: Manuelles Beenden** — Lounge → Beenden-Button → EndedView erscheint korrekt
- [ ] **TC-14: Webhook + DB** — Nach Session: Supabase → `sessions`-Tabelle → neuer Eintrag mit Transcript, Summary, Topic-Tags, Sentiment vorhanden
- [ ] **TC-15: Lighthouse a11y** — Lounge nach Agent-Integration: Lighthouse Score a11y weiterhin 100

---

## Zusammenfassung der Commits

| Phase | Commit |
|---|---|
| Task 1 | `chore: gitignore KB content and agent prompt (personal data)` |
| Task 2 | `chore(elevenlabs): add agent.config.json scaffold with placeholder values` |
| Task 9 Step 10 | `chore(elevenlabs): document KB IDs in agent.config.json` |
| Task 10 Step 3 | `chore: trigger redeploy with agent ID` |
