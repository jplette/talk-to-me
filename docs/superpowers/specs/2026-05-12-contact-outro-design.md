# Design: Contact Outro — Spoken + Text

**Datum:** 2026-05-12  
**Status:** Approved

## Ziel

Am Ende jeder Konversation wird der Besucher — gesprochen und als Text — darauf hingewiesen, wie er Jonathan für weitere Fragen erreichen kann: `jonathan@plettenberg.org`.

## Scope

Vier Dateien, ~15 Zeilen Änderung. Keine neuen Abhängigkeiten.

---

## Teil 1 — Text: EndedView

**Änderung:** `lounge.ended_caption` wird durch eine Kontaktzeile ersetzt.

| Sprache | Neuer Wert |
|---------|-----------|
| DE | `Weitere Fragen? → jonathan@plettenberg.org` |
| EN | `More questions? → jonathan@plettenberg.org` |

Die E-Mail wird als `<a href="mailto:jonathan@plettenberg.org">` gerendert (direkter Klick). Style bleibt `text-sm text-muted-foreground`.

**Betroffene Dateien:**
- `lib/i18n/de.ts` — `ended_caption` Wert ersetzen
- `lib/i18n/en.ts` — `ended_caption` Wert ersetzen
- `components/lounge/EndedView.tsx` — `<p>` mit `t('lounge.ended_caption')` durch `<p>` mit mailto-Link ersetzen

---

## Teil 2 — Spoken: Agent Prompt

**Änderung:** Die Goodbye-Beispiele in `elevenlabs/prompt.md` werden um die E-Mail erweitert.

```
Beispiel DE: „Danke fürs Gespräch. Für weitere Fragen erreichst du mich
             unter jonathan@plettenberg.org — tschüss."
Beispiel EN: „Thanks for stopping by. For more questions, reach me at
             jonathan@plettenberg.org — take care."
```

Der Agent empfängt das Signal `[system: session ending now — please say goodbye]` bereits heute vom Timer (`onGoodbye`). Mit den aktualisierten Beispielen weiß er, die E-Mail in den Abschlusssatz einzubauen.

**Betroffene Datei:** `elevenlabs/prompt.md`

---

## Teil 3 — Signal-before-manual-end

**Problem:** Bei manuellem Abbruch (Nutzer bestätigt den End-Dialog) wird heute direkt `endSession('manual')` aufgerufen — kein System-Signal an den Agent.

**Lösung:** Vor `endSession('manual')` das Goodbye-Signal senden und 500 ms warten, damit der Agent Zeit hat den Abschlusssatz (inkl. E-Mail) zu sprechen:

```ts
conv.sendUserMessage('[system: session ending now — please say goodbye]');
await new Promise(r => setTimeout(r, 500));
await conv.endSession('manual');
```

**Betroffene Datei:** `app/(gated)/lounge/page.tsx` — im `onClick` des „Ja, beenden"-Buttons im Confirm-Dialog

---

## Exit-Pfade und Verhalten

| Pfad | Spoken | Text |
|------|--------|------|
| Timer-Goodbye + Hard-Limit | ✅ Agent sagt E-Mail (Prompt-Beispiel) | ✅ EndedView |
| Manueller Abbruch (Dialog bestätigt) | ✅ Signal → Agent sagt E-Mail → 500 ms → disconnect | ✅ EndedView |
| Inactivity-Timeout (Agent beendet selbst) | ✅ Agent sagt E-Mail (Prompt-Beispiel) | ✅ EndedView |

---

## Nicht im Scope

- Kein neues i18n-Key (bestehender `ended_caption`-Key wird wiederverwendet)
- Keine neuen Komponenten
- Kein TTS-Fallback
