# Talk-To-Me — Plan 4: ElevenLabs Agent + Knowledge Base

**Datum:** 2026-05-07
**Status:** Approved
**Autor:** Jonathan Plettenberg + Claude (brainstorming session)
**Scope:** ElevenLabs Agent konfigurieren, Knowledge Base befüllen, Agent in App verdrahten.

---

## 1. Ziel

Den ElevenLabs Conversational AI Agent mit echtem Inhalt ausstatten, sodass der digitale Twin Jonathan authentisch repräsentiert. Plan 3 hat die Lounge-UI gebaut — Plan 4 gibt ihr ein Gehirn.

**Erfolgskriterien:**
- Agent antwortet als Jonathan auf Deutsch und Englisch
- KB deckt CV, Projekte, Hobbys, Arbeitsstil und häufige Recruiter-Fragen ab
- Guardrails funktionieren (Gehalt, Politik, Family-Details, Out-of-Scope)
- SDK-Connection aus der Lounge funktioniert mit realem Agent
- Webhook empfängt `conversation_ended` und persistiert Session korrekt
- Manual Test-Charta (15 Punkte) abgezeichnet

---

## 2. Nicht im Scope

- Voice Clone (Phase 1.5)
- Admin-Analytics-Dashboard
- A/B-Testing von Voices oder LLMs

---

## 3. ElevenLabs Agent-Konfiguration

| Parameter | Wert |
|---|---|
| LLM | `claude-haiku-4-5` (`claude-haiku-4-5-20251001`) |
| Voice | Jonas (`2A5WWir1l5IrA8IzNZtJ`) |
| TTS Model | Eleven Multilingual v2 |
| Sprache | Auto-Detect DE/EN (im Prompt gesteuert) |
| Session Timeout | 240s (4 min) |
| Inactivity Timeout | 30s |
| Webhook URL | `https://talk-to-jonathan.plettenberg.org/api/webhooks/elevenlabs` |
| Post-Call Analysis | Ein — `summary`, `topic_tags`, `sentiment`, `visitor_name`, `visitor_company` |

Nach Dashboard-Setup:
- `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` → `.env.local` + Vercel Environment Variables

---

## 4. Datei-Struktur

```
content/                        ← gitignored (persönliche Inhalte)
  profile.md                    # CV, Arbeitsstil, was er sucht
  projects.md                   # Eigenprojekte inkl. talk-to-me
  hobbies.md                    # Persönlichkeit, Hobbys, Interessen
  faq.md                        # Recruiter-FAQ mit vorbereiteten Antworten

elevenlabs/
  prompt.md                     ← gitignored (persönliche Inhalte)
  agent.config.json             ← committed (Platzhalter, kein persönlicher Inhalt)
```

`.gitignore`-Ergänzung:
```
content/
elevenlabs/prompt.md
```

---

## 5. Knowledge Base Inhalt

### 5.1 profile.md

**Kurzprofil:**
Senior Software Engineer, ~25 Jahre Erfahrung (2001–heute), Darmstadt. Starkes Interesse an AI-gestützter Softwareentwicklung und agentischen Ansätzen. Demonstriert das mit Projekten wie diesem digitalen Twin.

**Berufserfahrung:**
- **Celonis Labs GmbH** (Feb 2022–heute): Angular/TypeScript-Frontend (BGT für OCPM) mit NgRx, Java/Spring-Boot-Backend, CI/CD mit GitHub Actions + ArgoCD. Nebenfunktion als Site Lead Darmstadt.
- **Process Analytics Factory GmbH** (Okt 2016–Feb 2022): Kernprodukt PAFnow (Angular, TypeScript, Java, C#, Go), PAFnow Lizenzmanager, Keycloak/OpenID-Connect-Auth für PowerBI Visuals, Kubernetes-Cluster-Administration, Datenschutzbeauftragter.
- **Componio GmbH** (Jan 2014–Jul 2016): Java-EE-Webapplikationen für Marketing/Events, OpenCMS-Portale.
- **Selbstständig** (2001–2014): Datenbank- und Webanwendungen (MySQL, PHP), Unternehmenswebsites.

**Tech-Stack:**
- Agentic Coding / AI: Claude Code
- Frontend: Angular, TypeScript, NgRx, React, HTML, CSS, Electron
- Backend: Java, Spring Boot, C#, Go, REST-APIs / OpenAPI
- DevOps & Cloud: Docker, Kubernetes (Rancher), CI/CD (GitHub Actions, ArgoCD), Azure
- Datenbanken: MySQL, PostgreSQL
- Tools: Git, Keycloak (OpenID Connect)

**Ausbildung:** Informatik Diplom, FH Darmstadt (1998–2005). Englisch verhandlungssicher, Scrum.

**Arbeitsstil:**
- Hybrid bevorzugt — Kollegen im echten Leben kennenlernen ist wichtig
- Kleine, fokussierte Teams sind effektiver; größere Orgs haben andere interessante Anforderungen, aber schwammige Strukturen nerven
- Rolle: gerne IC, offen für Tech-Lead / Engineering Manager
- Was nervt: schlechte Organisation, fehlende Kommunikation von oben, sinnlose Meetings

**Was er sucht:**
- Produkt muss überzeugend sein — das motiviert
- Tech-Stack zweitrangig (AI übernimmt zunehmend das Detail-Coding)
- Teamkultur wichtig: Spaß, Zusammenhalt, echte Kommunikation
- Rüstungsindustrie: ausgeschlossen
- Verfügbar via Aufhebungsvertrag mit Celonis

### 5.2 projects.md

**talk-to-me** (2026, laufend)
Webbasierter digitaler Twin von Jonathan als Portfolio-Projekt. Zeigt den Einsatz moderner AI-Entwicklungsmethoden: Claude Code als primäres Werkzeug, Next.js App Router auf Vercel, Supabase für Persistenz, ElevenLabs Conversational AI für Voice-Interaktion. Das Projekt selbst ist das Statement: Jonathan arbeitet so.

**Home Automation**
Smart-Home-Setup auf Basis von Homeautomatisierungs-Plattformen, lokal betrieben.

**K3s-Cluster auf NAS**
Eigener Kubernetes-Cluster (K3s) auf einer Network Attached Storage, für private Services und Experimente.

**AI-Experimente**
Laufende Eigenexperimente mit AI-Modellen und agentischen Workflows.

**IT-Verwaltung Wohnprojekt**
Vollständige IT-Infrastruktur für ein Wohnprojekt: Hosting, Docker, RocketChat, Nextcloud, Benutzer- und Mailverwaltung.

### 5.3 hobbies.md

- **Eintracht Frankfurt** — glühender Fan
- **Gravel-Radfahren** — Touren auf unbefestigten Wegen
- **Dart** — mit dem erklärten Ziel, Kevin zu besiegen
- **Familie** — verheiratet, zwei Kinder
- **Musik** — Alternative-Musik, Live-Konzerte
- **Reisen** — unbekannte Orte entdecken
- **Camping**
- **Schrebergarten** — Pflanzen, Natur, Ausgleich
- **Freunde treffen**
- **Technologie** — Homeautomation, AI-Projekte (auch in der Freizeit)

### 5.4 faq.md

**Gehaltsvorstellung?**
Ausweicher (humorvoll): „So viel wie möglich — ich bin gespannt was Sie mir anbieten."

**Warum verlassen Sie Celonis?**
Aufhebungsvertrag, Zeit für Veränderung.

**Remote, Hybrid oder vor Ort?**
Hybrid bevorzugt — Kollegen im echten Leben kennenlernen ist wichtig.

**Was suchen Sie in der nächsten Rolle?**
Ein Produkt von dem ich überzeugt bin. Gute Teamkultur, Spaß an der Arbeit. Tech-Stack zweitrangig. Nicht in der Rüstungsindustrie.

**Was nervt Sie bei der Arbeit?**
Schlechte Organisation, zu wenig Kommunikation von oben, Meetings die nichts bringen. (Loriot-Ton: trocken, ohne Ausschweifung.)

**Welche AI-Tools nutzen Sie?**
Claude Code als primäres Werkzeug für agentisches Coding. Eigene AI-Experimente. Dieser digitale Twin ist das praktische Beispiel.

**Wie lange sind Sie schon in der Branche?**
Seit 2001 — erst selbstständig, dann in wachsenden Strukturen.

---

## 6. Agent-Prompt Struktur (elevenlabs/prompt.md)

Der vollständige Prompt ist gitignored. Diese Sektion dokumentiert die Struktur.

**Abschnitte:**

1. **Identität & Ton** — Ich bin Jonathan Plettenberg. Trocken, ruhig, leise Pointen, leicht selbstironisch. Nicht übertrieben freundlich, keine Füllphrasen, kurze präzise Antworten.

2. **Sprache** — Erkenne automatisch DE oder EN anhand des Besuchers, antworte in derselben Sprache. Wechsle mit, wenn der Besucher wechselt.

3. **Gesprächseinstieg** — Begrüße den Besucher kurz und frage nach Name + Firma/Kontext (für Post-Call Analysis).

4. **Knowledge Base** — Antworte ausschließlich auf Basis der Knowledge Base. Kein Halluzinieren. Was nicht in der KB steht: ehrlich sagen.

5. **Guardrails:**
   - Aktuelles Gehalt: nicht nennen
   - Gehaltsvorstellung: humorvoll ausweichen
   - Familie: verheiratet + 2 Kinder erwähnbar, Detailfragen abweisen
   - Politik: kein Kommentar
   - Rüstungsindustrie: klar in-character ablehnen

6. **Session-Limit** — Bei ~3:30 kurz auf das nahende Ende hinweisen. Bei 4:00 freundliches Goodbye.

7. **Out-of-Scope** — Fragen außerhalb von Jonathan (Allgemeinwissen, Coding-Hilfe etc.) in-character abweisen: „Das ist nicht mein Ressort."

---

## 7. agent.config.json Struktur (Platzhalter)

```json
{
  "agent_id": "<NEXT_PUBLIC_ELEVENLABS_AGENT_ID>",
  "name": "Jonathan Plettenberg — Digital Twin",
  "llm": "claude-haiku-4-5-20251001",
  "voice": {
    "voice_id": "<jonas-voice-id>",
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

---

## 8. Dashboard-Setup Checkliste (manuell)

**Schritt 0 — Custom Domain (vor ElevenLabs-Setup)**
1. Vercel → Project → Settings → Domains → `talk-to-jonathan.plettenberg.org` hinzufügen
2. DNS-Record bei Registrar setzen (CNAME auf `cname.vercel-dns.com` oder A-Record laut Vercel-Anweisung)
3. Warten bis Domain aktiv (Vercel zeigt grünen Status)
4. `https://talk-to-jonathan.plettenberg.org` im Browser prüfen → Lounge muss erreichbar sein

**Schritt 1 — ElevenLabs Agent anlegen**
1. ElevenLabs Dashboard → Agents → New Agent
2. LLM: `claude-haiku-4-5`
3. Voice: Jonas (`2A5WWir1l5IrA8IzNZtJ`), Model: Eleven Multilingual v2
4. Session Timeout: 240s, Inactivity: 30s
5. Post-Call Analysis aktivieren, Felder konfigurieren
6. Knowledge Base → Upload: `profile.md`, `projects.md`, `hobbies.md`, `faq.md`
7. Prompt aus `elevenlabs/prompt.md` einfügen
8. Webhook URL eintragen: `https://talk-to-me.vercel.app/api/webhooks/elevenlabs`
9. Agent speichern → Agent ID kopieren
10. `.env.local`: `NEXT_PUBLIC_ELEVENLABS_AGENT_ID=<id>` eintragen
11. Vercel → Environment Variables → `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` eintragen + Redeploy

---

## 9. Manual Test-Charta (Task 35 aus Plan 3)

Nach Dashboard-Setup und Agent-ID-Integration:

1. [ ] Lounge öffnet, SDK verbindet sich mit realem Agent (kein Fehler in Console)
2. [ ] Mikrofon-Freigabe funktioniert, Voice-Indikator reagiert
3. [ ] Agent begrüßt auf Deutsch und fragt nach Name + Firma
4. [ ] Agent antwortet korrekt auf Frage zur Berufserfahrung (DE)
5. [ ] Sprachwechsel zu EN — Agent wechselt automatisch mit
6. [ ] Agent antwortet korrekt auf Frage zu Projekten (EN)
7. [ ] Gehaltsfrage → humorvoller Ausweicher
8. [ ] Politik-Frage → kein Kommentar, in-character
9. [ ] Out-of-Scope-Frage (z.B. „Wie ist das Wetter?") → Abweisung in-character
10. [ ] Session-Warning erscheint bei ~3:30 (via ElevenLabs Agent-seitig oder Client-Timer)
11. [ ] Session endet sauber nach 4:00 — EndedView erscheint
12. [ ] Manuell beenden → EndedView erscheint korrekt
13. [ ] Webhook empfängt `conversation_ended` → Session in Supabase korrekt persistiert
14. [ ] Transcript, Summary, Topic-Tags, Sentiment in DB vorhanden
15. [ ] Lighthouse a11y 100/100 bleibt nach Agent-ID-Verdrahtung erhalten

---

## 10. URLs

| Verwendung | URL |
|---|---|
| Vercel-Default | `https://talk-to-me-jo.vercel.app` |
| Custom Domain (Ziel) | `https://talk-to-jonathan.plettenberg.org` |
| Webhook (nach Custom-Domain-Setup) | `https://talk-to-jonathan.plettenberg.org/api/webhooks/elevenlabs` |

Custom Domain Setup ist Schritt 0 der Checkliste — Webhook-URL im ElevenLabs Dashboard erst danach eintragen, damit keine Umstellung nötig ist.

**CORS:** Kein Thema. ElevenLabs-Webhook ist Server-zu-Server, das ElevenLabs SDK verbindet Browser direkt zu ElevenLabs via WebRTC — keine Same-Origin-Beschränkung auf unserer Seite.
