# Talk-To-Me — Visual Design Spec (Landing + Lounge)

**Datum:** 2026-05-05
**Status:** Draft, awaiting user review
**Autor:** Jonathan Plettenberg + Claude (frontend-design brainstorming session)
**Scope:** Visuelle Spec für Phase-1-MVP. Ergänzt die Architektur-Spec
[`2026-05-04-talk-to-me-digital-twin-design.md`](./2026-05-04-talk-to-me-digital-twin-design.md)
um Layout, Tokens, Komponenten, Animation und Edge-State-Treatments. Keine
Architektur-Änderungen.

---

## 1. Eckpfeiler-Entscheidungen

| # | Thema | Entscheidung |
|---|---|---|
| 1 | Brand-Direction | Modernist / Bauhaus-streng (Direction B). Professionell-zuerst; Persönlichkeit bleibt am Voice-Agenten, UI ist ruhig. |
| 2 | Foundation | Jakumba Design System 1:1 als Basis (Inter + JetBrains Mono, Spacing, Radii, Shadows, Motion). Eigenes Wordmark statt Jakumba-Logo. |
| 3 | Akzentfarbe | Jakumba Flame Orange `#EF8354` erstmal beibehalten, sparsam eingesetzt. Iteration auf andere Akzentfarbe explizit offen. |
| 4 | Themes | Light + Dark mit Toggle. Default = `prefers-color-scheme`. Manuelle Override via `localStorage["tt_theme"]`. |
| 5 | i18n | Deutsch + Englisch. Default = `Accept-Language` Cookie-detect. Footer-Switch `DE | EN`, lightweight in-house, kein `next-intl`. |
| 6 | Landing | Minimal Gate (~½ Viewport, kein Scroll). Wordmark + Headline + Lede + Login-Button + Footer. |
| 7 | Lounge | Center-Stage Layout. Voice-Indikator vertikal zentriert, Transcript darunter, Status-Strip oben. |
| 8 | Voice-Indikator | „Tinten-Linie" — SVG-Path-Oszilloskop. Idle flach, Listening Halbwelle oben, Speaking symmetrisch. Prototyp angenommen. |
| 9 | Wordmark | Initialen-Monogram „JP" + Wortmarke „Jonathan Plettenberg". |
| 10 | Komponenten | shadcn/ui mit gemappten CSS-Variablen auf Jakumba-Tokens. Lucide-Icons. |
| 11 | Mobile vs Desktop | Mobile-First. `max-width 640 px` Lounge, `max-width 560 px` Landing. |

---

## 2. Foundation (Tokens & Themes)

### 2.1 Source-of-Truth

`colors_and_type.css` aus dem Jakumba-Design-System wird in das Repo kopiert
nach `app/styles/tokens.css` und via Tailwind-4-`@theme` ins globale CSS
exposed. Keine Modifikation der Jakumba-Tokens — Erweiterungen leben in
einem separaten `app/styles/tokens.dark.css`-Block, damit Updates am
Jakumba-System sauber abgleichbar bleiben.

### 2.2 Übernommene Tokens (unverändert)

- **Typografie:** Inter (UI, 400–800), JetBrains Mono (Numerics/Timer/Code).
  Exo 2 wird **nicht** importiert (war Jakumba-Brand-only).
- **Spacing-Scale:** 8 px base — 1, 2, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96, 144.
- **Radii:** `r-xs 4`, `r-sm 6` (Buttons/Inputs), `r-md 8` (Cards), `r-lg 16`,
  `r-xl 24`, `r-2xl 32`, `r-pill 9999`.
- **Shadows:** Whisper-Philosophie. `sh-0` Hairline + zwei-Layer-Soft-Shadows.
  Kein heavy depth.
- **Motion:** `ease-out cubic-bezier(0.22, 1, 0.36, 1)`. Durations 120/200/320/520 ms.
  `ease-spring` nur für Toggles und Sheet-Open.
- **Akzent:** `--jk-flame #EF8354`. Sparsam: Status-Marker (Speaking),
  Focus-Ring (40% Opacity), Primary-CTA. Nicht für Chrome.

### 2.3 Eigene Erweiterungen

#### Dark-Mode-Tokens (neu)

```css
[data-theme="dark"] {
  --jk-bg:        #14151C;   /* deep ink-derived; nicht reines Schwarz */
  --jk-bg-elev-1: #1D1F29;   /* Cards, Surfaces */
  --jk-bg-elev-2: #232532;   /* Modals, Elevated */

  --fg-1: #F0F0F3;            /* primary text — Jakumba-canvas inverted */
  --fg-2: #A8AAB6;            /* secondary */
  --fg-3: #6E7180;            /* tertiary */

  --line:        #2A2C39;
  --line-strong: #353748;

  --jk-flame-deep: #D67043;   /* slightly cooler on dark */

  /* Status semantic — heller auf dark für Lesbarkeit */
  --warn: #E29A2D;
  --err:  #EF6E55;
  --ok:   #58BC92;
}
```

#### shadcn-Variable-Mapping

shadcn nutzt eigene CSS-Variablen. Wir mappen sie auf Jakumba-Tokens, statt
parallel zu pflegen:

```css
:root {
  --background:           var(--jk-canvas);
  --foreground:           var(--jk-ink);
  --primary:              var(--jk-ink);
  --primary-foreground:   var(--fg-on-ink);
  --secondary:            var(--jk-canvas-2);
  --secondary-foreground: var(--jk-ink);
  --accent:               var(--jk-flame);
  --accent-foreground:    var(--fg-on-flame);
  --muted:                var(--jk-ink-05);
  --muted-foreground:     var(--jk-ink-70);
  --border:               var(--jk-ink-15);
  --input:                var(--jk-ink-20);
  --ring:                 var(--jk-flame);
  --radius:               0.375rem;     /* 6 px = r-sm — matcht Jakumba-Button-Intent */
  --destructive:          var(--err);
}
[data-theme="dark"] {
  --background:           var(--jk-bg);
  --foreground:           var(--fg-1);
  --primary:              var(--fg-1);
  --primary-foreground:   var(--jk-bg);
  --border:               var(--line);
  /* etc. — siehe `tokens.dark.css` */
}
```

**Radius-Hinweis:** `--radius` ist auf 6 px (= `--r-sm`) gesetzt, weil shadcn-Buttons
die Hauptkonsumenten sind und Jakumba-Buttons 6 px haben. Cards/Panels nutzen
in ihren Class-Overrides explizit `var(--r-md)` (8 px), nicht das shadcn-Default.

### 2.4 Theme-Switch-Mechanik

- LocalStorage-Key `tt_theme` mit Werten `light` | `dark` | `null` (= System-Default).
- Toggle wechselt nur `light` ↔ `dark` (kein dreistufiges Cycling). Power-User können
  LocalStorage löschen, um auf System-Default zurückzufallen.
- Klassen-basiert via `<html data-theme="dark">`.
- Tailwind 4 Dark-Variant: `@variant dark (&:where([data-theme=dark], [data-theme=dark] *))`.
- Server-Side: Cookie `tt_theme` wird in `app/layout.tsx` gelesen, damit das
  initiale Render keine Hydration-Mismatches produziert (Flash-of-wrong-theme).

### 2.5 Iconography

**Lucide.** Übernommen aus Jakumba-Standard. 1.5 px Stroke, 24×24 Grid.
Konkret im MVP:

- `mic`, `mic-off` — Mic-Permission, Recovery
- `phone-off` — End-Button
- `loader-2` — Connecting
- `sun`, `moon` — Theme-Toggle
- `arrow-right` — CTAs (Login, „Konversation starten")
- `x` — Close-Buttons
- `check` — Form-Success-States (falls überhaupt relevant)

### 2.6 Bewusste Abweichungen von Jakumba

- **Keine Liquid-Glass-Komponenten im MVP.** Liquid setzt voraus, dass
  visuell etwas dahinter ist (Foto, Gradient). Unsere Lounge ist puristisch
  monochrom. Tokens behalten wir für Phase-1.5+.
- **Kein Jakumba-Logo / Exo-2-Wordmark.** Eigenes „JP"-Monogram.

---

## 3. Landing-Page

### 3.1 Layout

Eine Bildschirmhöhe, kein Scroll. Zentrierte Komposition,
`max-width: 560 px` Content-Block, vertikal zentriert via Flexbox-Parent
(`min-height: 100dvh - header - footer`).

Mobile (375 px):

```
┌──────────────────────────────────┐
│  ●● JP   Jonathan Plettenberg ☼  │ ← Header 56 px sticky
├──────────────────────────────────┤
│                                  │
│  Sprich mit                      │
│  meinem digitalen                │ ← Display: Inter 800,
│  Zwilling.                       │   36 px Mobile, 48 px ≥md
│                                  │
│  Eine kuratierte Voice-          │
│  Konversation über meinen        │ ← Lede: Inter 400, 18 px,
│  Werdegang, meine Projekte,      │   color --fg-2
│  und wie ich arbeite.            │
│  Vier Minuten, deine Fragen.     │
│                                  │
│  ┌──────────────────────────┐   │
│  │  Login →                 │   │ ← shadcn Button primary,
│  └──────────────────────────┘   │   r-sm, full-width Mobile
│                                  │
├──────────────────────────────────┤
│  Hinweis zur Audio-Verarbeitung  │
│  · Impressum · DE | EN · 2026    │ ← Footer 12 px, --fg-3
└──────────────────────────────────┘
```

Desktop (≥ 768 px):
- Selbe Komposition, breiter atmend (Content bleibt 560 px max-width).
- Padding-Top vergrößert auf 25vh.
- Display 48 px (`md`) → 56 px (`lg`).
- Login-Button verliert `w-full`, wird ~200 px breit, links-aligned.

### 3.2 Komponenten

| Element | Spezifikation |
|---|---|
| **Header** | `sticky top-0 z-50`, 56 px Höhe, Padding `0 24px` Mobile / `0 40px` Desktop, Border-bottom `--line` Hairline. Inhalt: Wordmark links, Theme-Toggle rechts. |
| **Display-Headline** | Inter 800, 36/48/56 px responsive, `letter-spacing: -0.04em`, `line-height: 1.1`, color `--fg-1`. Manueller `<br>` zwischen Wörtern für rhythmischen Umbruch. |
| **Lede** | Inter 400, 18 px, color `--fg-2`, `line-height: 1.4`. Ein Absatz, ~30 Wörter. |
| **Login-Button** | shadcn `<Button>` variant=`default`, mit `<ArrowRight />` rechts, Padding `12px 20px`, `r-sm 6px`. Hover `translateY(-1px)` + Shadow-Bump. Press `scale(0.985)`. |
| **Footer** | Inter 400, 12 px, color `--fg-3`, Padding `16px 24px`. Trennzeichen `·`. Hinweis-Link öffnet shadcn `<Dialog>` mit Datenschutz-Text (~150 Wörter, Final-Wording beim Build). Mobile: zwei Zeilen (oben Links, unten DE|EN + Year), Desktop: eine Zeile. |

### 3.3 Content-Texte (initial, iterierbar)

| Key | DE | EN |
|---|---|---|
| `landing.headline` | „Sprich mit\nmeinem digitalen\nZwilling." | „Talk to\nmy digital\ntwin." |
| `landing.lede` | „Eine kuratierte Voice-Konversation über meinen Werdegang, meine Projekte, und wie ich arbeite. Vier Minuten, deine Fragen." | „A curated voice conversation about my work history, projects, and how I operate. Four minutes, your questions." |
| `landing.login_cta` | „Login" | „Login" |
| `footer.privacy` | „Hinweis zur Audio-Verarbeitung" | „How we handle audio" |
| `footer.imprint` | „Impressum" | „Imprint" |

### 3.4 Login-Page (`/login`)

Selbes Header- und Footer-Layout wie Landing. Im Content-Bereich eine
zentrierte Card:

- `max-width: 400 px`, `r-md 8px`, BG `--jk-bg-elev-1`, Padding 32 px
- H3 Inter 600 24 px: „Zugang" / „Access"
- Lede Inter 400 16 px `--fg-2`: „Du brauchst das geteilte Passwort, das du
  per Email/Slack erhalten hast." / engl. analog
- shadcn `<Input>` type=password, autofocus, Placeholder „Passwort" / „Password"
- shadcn `<Button>` Submit, full-width, Inter 600 14 px

Error-States siehe Sektion 7.4.

---

## 4. Lounge-Page

### 4.1 Layout

Center-Stage. Vertikale Komposition, `max-width: 640 px` Content,
mobile-first. Header sticky oben, Lounge-Content vertikal zentriert.

Mobile (375 px):

```
┌──────────────────────────────────┐
│  ●● JP   Jonathan Plettenberg ☼  │ ← Header 56 px sticky
├──────────────────────────────────┤
│  03:42                  [End ✕]  │ ← Status-Strip Mobile-only,
│  Antwortet                       │   sticky unter Header, 56 px
├──────────────────────────────────┤
│                                  │
│         ──╱╲╱╲──                 │ ← Voice-Indikator,
│                                  │   240 px Mobile / 320 px Desktop
│                                  │
│  ─────────────────────────────  │
│                                  │
│  ──── Du                         │ ← Transcript-Stream,
│  Wo hast du zuletzt              │   autoscroll bottom
│  gearbeitet?                     │
│                                  │
│  ──── Jonathan                   │
│  Bei einem Berliner SaaS-        │
│  Studio. Drei Jahre …  ▌         │ ← Cursor während Speaking
│                                  │
└──────────────────────────────────┘
```

Desktop (≥ 1024 px):
- Status-Strip wandert in den Header (Timer + End-Button rechts neben dem
  Theme-Toggle). Lounge-Content gewinnt vertikalen Atem.
- Voice-Indikator wächst auf 320 px Breite.
- Transcript-Gap wechselt von `gap-4` auf `gap-6`.

### 4.2 Komponenten-Inventar

| Komponente | Datei (Plan-3-Skelett) | Verantwortung |
|---|---|---|
| `<LoungeShell>` | `components/lounge/LoungeShell.tsx` | Layout-Container, max-width, vertikales Center |
| `<SessionHeader>` | `components/lounge/SessionHeader.tsx` | Timer + End-Button. Desktop: in `<AppHeader>`; Mobile: separater Strip |
| `<VoiceIndicator>` | `components/lounge/VoiceIndicator.tsx` | Tinten-Linie. Props: `state`, `amplitude`, `width`, `reducedMotion` |
| `<TranscriptStream>` | `components/lounge/TranscriptStream.tsx` | Render der SDK-Messages, Autoscroll, Cursor während Speaking |
| `<TranscriptTurn>` | `components/lounge/TranscriptTurn.tsx` | Eine Turn-Box (Role-Label + Text) |
| `<EndButton>` | `components/lounge/EndButton.tsx` | shadcn-Button-Wrapper, secondary, mit `phone-off` |
| `<StatusLine>` | `components/lounge/StatusLine.tsx` | Status-Text + Status-Dot, role=status aria-live=polite |
| `<AppHeader>` | `components/AppHeader.tsx` | Globaler Header mit Wordmark + Theme-Toggle (+ optional SessionHeader-Slot) |
| `<Wordmark>` | `components/Wordmark.tsx` | Monogram + Name, responsive |
| `<ThemeToggle>` | `components/ThemeToggle.tsx` | Sun/Moon Icon-Button |
| `<LangToggle>` | `components/LangToggle.tsx` | DE | EN Footer-Switch |

### 4.3 Lounge-States

| State | Status-Text (DE) | Status-Text (EN) | Indikator | Cursor | End-Button |
|---|---|---|---|---|---|
| `idle` (pre-start) | „Bereit" | „Ready" | flach + Tinten-Punkt | — | hidden |
| `connecting` | „Verbinde…" | „Connecting…" | Lucide `loader-2` | — | hidden |
| `active.listening` | „Hört zu …" | „Listening …" | Halbwelle oben | — | sichtbar |
| `active.speaking` | „Antwortet" | „Replying" | symmetrisch | sichtbar nach letztem Wort | sichtbar |
| `warning` | „Noch 30 Sekunden" | „30 seconds left" | wie active, Stroke amber | — | sichtbar |
| `inactivity-prompt` | „Noch da?" | „Still there?" | wie active | — | sichtbar |
| `ending` (graceful) | „Bis dann." | „Until then." | dimmt 25 % opacity | — | hidden |
| `ended` | (Display-Text) | (Display-Text) | hidden | — | hidden |

### 4.4 Idle-Pre-Start

Wenn die Lounge mit `state=idle` rendert (also nach Login), kein
Indikator. Stattdessen:

```
                  03:42 (greyed out)
                [zukünftige Session]

           Sprich mit Jonathan.
         (Display H2, Inter 700 32 px)

   Wir reden 4 Minuten — über meinen Werdegang,
   Projekte, und wie ich arbeite.
                       (Lede)

   ┌────────────────────────────────┐
   │  Konversation starten   ▶      │
   └────────────────────────────────┘
   Mic-Permission wird gleich gefragt.
                       (Caption)
```

Klick → `state=connecting` (Spinner) → `state=active.listening`
(Indikator ersetzt Display-Layout, Transkript wächst von oben).

### 4.5 Ended-State

Großer Display-Text „Bis dann." / „Until then." Inter 800 48 px,
zentriert. Darunter:

- Volltranskript scrollbar (`max-height: 50vh`, `overflow-y: auto`)
- Sekundär-Buttons:
  - shadcn primary „Neue Session" / „New session" → `/lounge` (resetet State auf `idle`)
  - shadcn ghost „Transkript kopieren" / „Copy transcript" — kopiert formatierten Text in Clipboard, Toast „Transkript kopiert" / „Transcript copied"
- Optional 1 Satz Caption: „Hast du gefunden, was du wolltest?" / „Did you find what you needed?" — kein Form, nur Hint.

### 4.6 Inactivity-Handling

Aus Architektur-Spec §8.2: Bei 20 s ohne User-Speech sagt der Agent
„Noch da?" (Prompt-Verhalten, keine UI-Verantwortung). Bei 30 s ohne
Reaktion endet die Session via `inactivity`-Reason.

UI: Status-Line wechselt auf „Noch da?" / „Still there?" in der UI-Sprache,
Indikator bleibt aktiv-listening (technisch ist der Agent in
speaking → listening). Kein Visual-Drama.

### 4.7 Anti-Patterns

Folgende Patterns nehmen wir bewusst **nicht**:

- Floating-Action-Buttons (lenken ab)
- Bottom-Tab-Bars (Lounge ist eine einzige Aktion)
- Hamburger-Menü (es gibt nichts zum Aufklappen)
- Skeleton-Loaders (Lounge hat kein Inhalt-Loading-Pattern)

---

## 5. Wordmark-System (Identity Kit)

### 5.1 Monogram-Konstruktion

```
   ┌──────────┐
   │   JP     │  28×28 px @1× / 56×56 @2×
   │          │  r-md (8 px)
   └──────────┘  Inter 800, 14 px, letter-spacing -0.04em
                 Asymmetrisches Padding
                 (links 7, rechts 5; optisch zentriert)
```

### 5.2 Theme-Varianten

| Variant | BG | FG | Use-Case |
|---|---|---|---|
| `monogram-light` | `--jk-ink #2D3142` | `--fg-on-ink #F7F3EE` | Header in Light-Mode, Email-Sig auf weißem BG |
| `monogram-dark` | `--fg-1 #F0F0F3` | `--jk-bg #14151C` | Header in Dark-Mode |
| `monogram-flame` | `--jk-flame #EF8354` | `#FFFFFF` | Favicon, OG-Image-Akzent |

### 5.3 Asset-Output

| Datei | Format | Dimensionen | Variante |
|---|---|---|---|
| `app/icon.svg` | SVG | viewBox 0 0 100 100 | `monogram-flame` |
| `app/apple-icon.png` | PNG | 180×180 | `monogram-flame` |
| `app/opengraph-image.png` | PNG | 1200×630 | siehe 5.4 |
| `public/favicon.ico` | ICO | 32 + 16 | `monogram-flame` |

Next.js 16 generiert Favicon, Apple-Icon, OG aus den Files in `app/`
automatisch — keine manuelle `<meta>`-Pflege. SVG ist Source-of-truth,
PNGs werden via build-time-Skript regeneriert (`scripts/generate-brand-assets.ts`).

### 5.4 Open-Graph-Image (1200×630, eine Sprach-Variante DE)

Layout:

```
┌─────────────────────────────────────────────────┐
│   ●● JP                                         │
│                                                 │
│   Sprich mit                                    │
│   meinem digitalen                              │
│   Zwilling.                                     │
│                                                 │
│   Jonathan Plettenberg · 4 Min Voice            │
└─────────────────────────────────────────────────┘
   BG       --jk-canvas
   Headline Inter 800, 80 px, --jk-ink
   Footer   Inter 500, 22 px, --jk-ink-70
   Border   bottom 4 px --jk-flame (subtle hairline)
```

### 5.5 Header-Bar Final

Public (Landing/Login):

```
┌──────────────────────────────────────────────────┐
│  ●● JP   Jonathan Plettenberg            ☼      │
└──────────────────────────────────────────────────┘
```

Lounge Desktop:

```
┌──────────────────────────────────────────────────┐
│  ●● JP   Jonathan Plettenberg     03:42 [✕]  ☼   │
└──────────────────────────────────────────────────┘
```

Lounge Mobile: Selber Header + separater 56-px-Status-Strip darunter.

### 5.6 Klick-Verhalten

- Monogram-Klick auf inaktiver Page → Navigation zu `/`.
- Monogram-Klick auf `/lounge` mit aktiver Session (`active.listening`,
  `active.speaking`, `warning`) → shadcn `<Dialog>` öffnet
  Bestätigungs-Modal: „Konversation jetzt beenden? Du landest auf der
  Startseite." Kein Modal in `idle`, `ended`, `connecting`, `ending`.

---

## 6. Voice-Indikator — Technische Spec

### 6.1 Komponenten-API

```typescript
type VoiceState =
  | 'idle' | 'connecting'
  | 'listening' | 'speaking'
  | 'warning'   | 'ending';

interface VoiceIndicatorProps {
  state: VoiceState;
  amplitude?: number;           // 0..1; null → synthetic fallback
  width?: number;               // default 240 mobile / 320 desktop
  reducedMotion?: boolean;      // default reads prefers-reduced-motion
}
```

**App-State vs. Indikator-State:** `VoiceState` ist die *Render-State* des
Indikators. App-Level-States wie `inactivity-prompt` (logisch) und `ended`
(Indikator unmounted) werden vom Parent in den passenden `VoiceState` übersetzt:
`inactivity-prompt` → folgt dem realen Audio-Verhalten (`speaking` während Agent
„Noch da?" sagt, danach `listening`); `ended` → der Indikator wird unmounted,
nicht mit speziellem State gerendert.

### 6.2 Amplitude-Source

**Listening (User spricht):**
- Web Audio API: `AudioContext` + `AnalyserNode` + `MediaStream` (geteilt
  mit ElevenLabs-SDK-`getUserMedia`-Track)
- `AnalyserNode.getByteTimeDomainData()` → RMS → 0..1
- Smoothing: exponential moving average α=0.2
- Sample-Rate 60 Hz, gedrosselt auf 30 Hz

**Speaking (Agent spricht):**
- Primärer Pfad: `onAudioDataReceived` o. ä. SDK-Event mit Audio-Chunks
  (Detail beim Plan-3-SDK-Spike verifiziert)
- Sekundärer Pfad: `<audio>`-Element des SDK + `MediaElementAudioSourceNode`
  + AnalyserNode-Pattern wie oben
- Tertiärer Pfad: synthetisches Pulse-Pattern aus `speech_started/ended`-Events

**Pre-Build-Verifikation:** Erste Plan-3-Story = „SDK-Audio-Tap-Spike"
(30 min). Definitiver Pfad festgelegt vor dem Indikator-Build.

### 6.3 Render-Loop

```typescript
const N = 80;        // sample points
const W = props.width;
const ampMax = 36;   // px max amplitude
const lerp = 0.18;   // smoothing toward target
// Targets ~30 Hz, requestAnimationFrame ~60 Hz
```

State → Amplitude:

| State | Quelle | Visual |
|---|---|---|
| `idle` | konstant 0.04 | flach mit kaum-merklicher Atmung |
| `connecting` | n/a | `loader-2` Spinner, SVG hidden |
| `listening` | live Mic-RMS | Halbwelle nur oberhalb (negative SVG-Y) |
| `speaking` | live Agent-Output-RMS | symmetrisch oben+unten |
| `warning` | live RMS (aktive Quelle) | wie aktiv, Stroke wechselt zu `--warn` |
| `ending` | konstant 0.02, fadet aus | dimmt auf 25 % Opacity |

Halbwelle: `y = -Math.abs(amp * env * sin) * ampMax`. Negative SVG-Y =
visuell oberhalb der Mittellinie.

### 6.4 Stroke-Color-Tokens

| Theme | Default | Speaking-active | Warning |
|---|---|---|---|
| Light | `--jk-ink` | `--jk-ink` (Status-Dot wird Flame) | `--warn` |
| Dark | `--fg-1` | `--fg-1` | `#E29A2D` |

Linie selbst bekommt **keinen** Flame-Stroke beim Speaking. Status-Dot
daneben markiert Flame-Farbe.

### 6.5 Reduced-Motion-Verhalten

`prefers-reduced-motion: reduce` ist non-negotiable:

- Statt Linie: statischer Indikator
  - `idle` → grauer 8-px-Kreis
  - `listening` → halbgefüllter Kreis (oben)
  - `speaking` → voll gefüllter Kreis (Flame)
  - `warning` → Amber-Kreis
  - `ending` → leerer Outline-Kreis
- Status-Dot pausiert das Pulsing
- Status-Line bleibt unverändert

### 6.6 Accessibility

- `<svg role="img" aria-label="Voice activity: listening">` — `aria-label`
  state-bezogen
- `<div role="status" aria-live="polite">` für Status-Line — Screenreader
  sagen jeden State-Wechsel an
- Kein `aria-busy` — Status-Text-Wechsel reicht

### 6.7 Edge-Cases

| Szenario | Behavior |
|---|---|
| Mic abgelehnt | Component rendert nicht; Recovery-UI siehe 7.1 |
| MediaStream verloren | Amplitude → idle, Status-Line „Verbindung neu aufbauen…", SDK-Reconnect |
| Frame-Drops > 50 % | Linie reagiert verzögert, kein Crash. Sentry-Hook in Phase 1.5 |
| Tab-Background | RAF pausiert, SDK pausiert — kein Issue |

---

## 7. Mikro-Animationen & Motion

### 7.1 Bindende Prinzipien

1. No bounces on layout. Springs nur für Toggles und Sheet-Open.
2. No parallax. Niemals.
3. Fades + gentle scale (0.98 → 1) + slide-up (8 px max). Kein Zoom, kein 3D.
4. Hover lift = 1 px translateY + Shadow-Bump. Press = `scale(0.985)`.
5. Focus-Ring = 2 px outline `--jk-flame` @ 40 % opacity, offset 2 px.
6. Voice-Indikator State-Transitions = 320 ms Stroke-Color-Lerp via CSS;
   Linie selbst hat eigenen RAF-Loop, keine CSS-Transition.

### 7.2 Page-Transitions

Keine. Ausnahme: Login → Lounge bekommt 200 ms opacity 0→1 Welcome-Fade-In,
damit der Übergang nicht wie ein Page-Reload knallt.

### 7.3 Lounge-State-Transitions

| Übergang | Animation | Total |
|---|---|---|
| `idle → connecting` | CTA fadet aus 120 ms, Spinner fadet ein 200 ms | 320 ms |
| `connecting → active.listening` | Spinner aus 120 ms; Indikator + Status-Line slide-up 320 ms | 440 ms gestaffelt |
| `listening ↔ speaking` | Status-Dot Color-Crossfade 200 ms; Indikator Mode-Wechsel ohne Transition | 200 ms |
| `active → warning` | Stroke + Timer Color-Lerp 320 ms; Toast „Letzte 30 Sekunden" slide-up | 320 ms |
| `* → ending` | Indikator fadet auf 25 % Opacity 520 ms, Status-Line wechselt 200 ms | 520 ms |
| `ending → ended` | Indikator aus 320 ms, Display-Text + Volltranskript ein 320 ms | 640 ms gestaffelt |

### 7.4 Component-Level

| Komponente | Trigger | Animation |
|---|---|---|
| shadcn `<Dialog>` | Open | BG fade 200 ms; Card scale 0.96→1 + opacity 200 ms |
| shadcn `<Dialog>` | Close | Reverse, 120 ms |
| `sonner` Toast | Append | Slide-up 8 px + opacity 320 ms |
| `sonner` Toast | Auto-Dismiss | Fade-out 200 ms; Auto-Timeout 4 s (Warning bleibt 30 s) |
| shadcn `<Tooltip>` | Hover | Fade + 4 px slide, 120 ms open / 80 ms close |
| Button (alle) | Hover | `translateY(-1px)` + Shadow-Bump (`sh-1` → `sh-2`), 200 ms |
| Button (alle) | Press | `scale(0.985)`, 120 ms |
| Theme-Toggle | Klick | Sun/Moon Crossfade 200 ms |
| Lang-Toggle | Klick | Color-Transition 200 ms; Context-Provider re-rendert ohne Reload |

### 7.5 Loading

Lucide `loader-2` mit `animate-spin`. Verwendung:

- Login-Submit: Button-Inhalt wechselt von Text zu Spinner während Request
- Connecting: Spinner ersetzt Voice-Indikator-Slot

Skeleton-Loaders verwenden wir nicht.

### 7.6 Toast-Position

- Mobile: bottom-center
- Desktop: bottom-right
- Sonner unterstützt das responsive

### 7.7 Reduced-Motion-Override

`@media (prefers-reduced-motion: reduce)`:

- Alle Durations effektiv 0 ms (instant)
- Voice-Indikator → statisch (siehe 6.5)
- Status-Dot pausiert
- Button-Hover-Lift bleibt (1 px ist nicht „motion sickness"-relevant), aber
  Spring-Easings werden zu linear
- Toasts: kein Slide, nur Fade

### 7.8 Performance-Hygiene

- `will-change` *nur* auf Voice-Indikator-Path während aktiver Session
  (`will-change: d`)
- Animationen ausschließlich auf `transform` + `opacity` (composite-only)
- Voice-Indikator-RAF pausiert wenn `document.hidden`

---

## 8. Error & Edge-States

### 8.1 Mic-Permission abgelehnt

Voice-Indikator-Slot wird ersetzt durch Recovery-Block:

```
        ⊘ (Lucide mic-off, 32 px, --fg-3)

   Ohne Mikrofon-Zugriff kein Gespräch.

   Erlaube den Mic-Zugriff in deinem Browser
   und lade die Seite neu.

   ┌────────────────────────────┐
   │  Seite neu laden     ↻     │
   └────────────────────────────┘

   Falls du nicht weißt wie: Klick aufs Schloss-
   Symbol in der Adressleiste deines Browsers.
                                          (Caption)
```

Headline H3 Inter 600 24 px, Lede 16 px, Caption 13 px `--fg-3`.
Kein Try-Again-Button (Browser zeigt Permission-Dialog nach Ablehnung
nicht erneut). Nur Reload.

### 8.2 SDK-Connect-Fail

Spinner stoppt. Status-Line rot „Verbindung fehlgeschlagen". Recovery-Block:

```
   ✕  Verbindung fehlgeschlagen.

   Das passiert manchmal. Versuch es noch einmal,
   das ist meistens vorbei.

   ┌────────────────────────────┐
   │  Erneut verbinden    ↻     │
   └────────────────────────────┘
```

Nach 3 fehlgeschlagenen Retries hintereinander: Caption-Link „Falls das
Problem bleibt, melde dich bei jonathan@plettenberg.org" (mailto, 13 px,
`--fg-3`).

### 8.3 WebRTC-Drop Mid-Conversation

- Sofort: Status-Line „Verbindung neu aufbauen…", Indikator pausiert in
  idle-Pose, Timer pausiert
- Client postet `POST /api/sessions/end-reason` mit `error` präventiv
- Reconnect automatisch (max 2× über 5 s)
- Erfolgreich: Status-Line zurück, Timer läuft weiter
- Endgültig: Session-Ende mit `end_reason='error'`, Treatment wie 8.2

Kein Modal-Dialog während Reconnect.

### 8.4 Login-Lockout

| State | Visual |
|---|---|
| Falsche Eingabe (1–4) | Roter Border auf Input (1 px `--err`), Text darunter „Passwort stimmt nicht. Versuche es noch einmal." (13 px `--err`) |
| Lockout aktiv (60 s) | Input + Submit disabled. Banner darüber: „Zu viele Versuche. Bitte 0:54 warten." Live-Countdown JetBrains Mono. |
| Lockout vorbei | Banner weg, Counter zurück, Input + Submit aktiv |

Kein Versuchs-Counter sichtbar (Anti-Brute-Force-Hint).

### 8.5 Network Offline

- Browser-Event `offline`: sticky-Banner top-of-page „Du bist offline.
  Wir warten." (Amber `--warn-tint` BG, 14 px, Padding 12 px)
- Voice-Session pausiert (Timer + Indikator)
- Browser-Event `online`: Banner weg, Toast „Wieder online" (4 s auto-dismiss)
- Niemals harter Page-Reload — Session-State würde verloren gehen

### 8.6 Webhook-Pipeline-Fail (User-Sicht)

User-facing keine Reaktion. Webhook + DB-Insert passieren nach Disconnect.
Privacy-Hinweis im Footer ist die einzige Kommunikation. Recruiter müssen
nicht wissen, ob Backend grün ist; Jonathan sieht es im Supabase-Studio.

### 8.7 Error-Tonalität (Copy-Hygiene)

**Niemals:**

- „Oops! Etwas ist schiefgelaufen 😬"
- „Error 500 — Internal Server Error"
- „Mic-Berechtigung erforderlich!!!"

**Stattdessen:**

- „Verbindung fehlgeschlagen. Versuch es noch einmal."
- „Ohne Mikrofon-Zugriff kein Gespräch."
- „Du bist offline. Wir warten."

Maximal eine Pointe pro Error-Block. Pointen nur wenn sie sitzen.

### 8.8 Logging

Bewusst minimal im MVP. `console.error` server-seitig (Vercel Console).
Sentry / Speed-Insights = Phase 1.5.

---

## 9. i18n — Internationalisierung

### 9.1 Strategie

Cookie-basiert, kein Route-Segment. Lightweight in-house, kein `next-intl`.

- **Default-Detection:** Server liest `Accept-Language` beim ersten Besuch,
  normalisiert auf `de` | `en` (Fallback `de`), schreibt Cookie `tt_lang`
  (1 Jahr TTL).
- **Manueller Toggle:** Footer-Switch `DE | EN`. Klick auf inaktive Sprache
  → Cookie + LocalStorage update + clientseitiges Context-Re-Render
  (kein Page-Reload).
- **SSR:** `<html lang="de|en">` aus Cookie in `app/layout.tsx`. Keine
  Hydration-Mismatches.
- **OS/Browser-Setting-Änderung:** wirkt sich nicht nachträglich aus,
  sobald Cookie gesetzt ist.

### 9.2 Datei-Struktur

```
lib/i18n/
├── messages.ts      # type definition for keys
├── de.ts            # German strings
├── en.ts            # English strings
├── detect.ts        # server-side detect from Accept-Language
└── provider.tsx     # React Context + useT() hook
```

### 9.3 Footer-Toggle-Visualisierung

`DE | EN` als Inline-Text. Aktiv: Tinten-Farbe, inaktiv: `--fg-3` mit Pointer
+ Hover→`--fg-2`. Kein Icon, keine Box.

Mobile: zwei Zeilen
```
Hinweis zur Audio-Verarbeitung · Impressum
DE | EN              · 2026
```

Desktop: eine Zeile
```
Hinweis zur Audio-Verarbeitung · Impressum · DE | EN · 2026
```

### 9.4 Voice-Agent-Sprache

Auto-Detect am ersten User-Turn (ElevenLabs-Agent-Verhalten). UI-Sprache
wird als Hint für die First-Message gesetzt, damit die Begrüßung in der
gleichen Sprache startet wie die UI. Spart 2 s Sprach-Schwenk.

### 9.5 Was NICHT lokalisiert wird

- Knowledge-Base-Inhalte (`content/*.md`) — Agent übersetzt on-the-fly
- Eigennamen / Tech-Begriffe (Next.js, Supabase, etc.)

---

## 10. Accessibility — Zusammenfassung

- Reduced-Motion: alle Animationen gehen auf instant; Voice-Indikator
  wechselt auf statisch (Sektion 6.5)
- Status-Line `role="status" aria-live="polite"` — Screenreader sagen jeden
  State-Wechsel an
- Voice-Indikator-SVG `role="img" aria-label="…"` — state-bezogen
- Focus-Ring sichtbar auf allen interaktiven Elementen, nicht
  browser-default
- Touch-Targets min 44×44 px (End-Button, Theme-Toggle, Lang-Toggle)
- Kontrast: alle Tokens erfüllen WCAG-AA-Body-Text (4.5:1) — explizit
  geprüft beim Token-Setup mit `axe-core` o. ä. CI-Check (Plan-3-Story)
- Keine Color-only-Indikatoren (z. B. Warning hat Color *und* Text-Wechsel)

---

## 11. Out-of-Scope für Phase 1

- Liquid-Glass-Komponenten (Tokens behalten, Use-Case fehlt)
- Animations-Storybook (für ein 2-Seiten-Portfolio overkill)
- Page-Transitions zwischen allen Routen (nur Login → Lounge)
- Skeleton-Loaders
- Error-Tracking via Sentry (Phase 1.5)
- Multi-Language-OG-Image-Varianten (eine DE-Variante reicht)
- Feedback-Form auf Ended-State
- Brand-Asset-Pipeline für Email-Signatur, Phone-Avatar (Phase 2)

---

## 12. Open Items für Implementation (Plan 3+)

Werden im Implementation-Plan aufgelöst:

- SDK-Audio-Tap-Spike vor Indikator-Build (30 min, erste Story)
- shadcn-Init + Token-Mapping als zweite Story
- Konkrete Datenschutz-Hinweis-Text-Formulierung (~150 Wörter, DE+EN)
- Headline-Wording-Final (jetzt nur initiale Variante)
- WCAG-Kontrast-CI-Check-Setup (axe-core o. ä.)
- `scripts/generate-brand-assets.ts` für SVG → PNG-Pipeline

---

**Diese Spec ergänzt die Architektur-Spec um die visuelle Schicht.**
Änderungen werden im Doc per Edit + Commit gemacht.
