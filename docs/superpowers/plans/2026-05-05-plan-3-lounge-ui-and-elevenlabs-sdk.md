# Plan 3 — Lounge UI + ElevenLabs SDK Integration

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bauen die public Landing- und Login-Page sowie die gegated `/lounge` mit ElevenLabs Conversational AI SDK, Voice-Indikator (Tinten-Linie), Live-Transcript, Session-Timer + End-Reason-Reporting, Theme + i18n — gemäß Visual-Spec (`2026-05-05-talk-to-me-visual-design.md`).

**Architecture:** Next.js 16 App-Router (React 19, Tailwind 4, shadcn/ui auf Jakumba-Tokens gemappt, Lucide-Icons). i18n + Theme als leichte React-Contexts (Cookie-SSR + LocalStorage). Voice-Indikator als reine SVG-Path-Komponente, Amplitude aus Web-Audio-Tap auf Mic-Stream / Agent-Audio. ElevenLabs SDK (`@elevenlabs/react`) hinter einem eigenen `useElevenLabsConversation`-Hook gekapselt, der die Render-State-Machine `idle → connecting → active.listening ↔ active.speaking → warning → ending → ended` exportiert. End-Reason wird vor Disconnect gegen die in Plan 2 gebaute `/api/sessions/end-reason`-Route gemeldet.

**Tech Stack:** Next.js 16.2 (App Router, `proxy.ts` als Middleware-Equivalent), React 19, Tailwind 4, shadcn/ui, Lucide, Sonner (Toasts), `@elevenlabs/react`, Vitest 4 + Testing Library + jsdom (Component-Tests), Playwright (E2E).

**Spec-Referenzen:**
- Architektur: `docs/superpowers/specs/2026-05-04-talk-to-me-digital-twin-design.md` — §8 (State-Machine), §8.3 (SESSION-Konstanten, schon in `lib/config.ts`), §11 (End-Reason-Sync), §12 (Edge-Cases).
- Visual: `docs/superpowers/specs/2026-05-05-talk-to-me-visual-design.md` — §2 (Tokens), §3 (Landing/Login), §4 (Lounge), §5 (Wordmark), §6 (Voice-Indikator), §7 (Motion), §8 (Errors), §9 (i18n), §10 (a11y).

**Voraussetzungen vor Task 1:**
- Plan 1 + Plan 2 abgeschlossen, alle Tests grün.
- `lib/config.ts` enthält `SESSION` und `WEBHOOK` Konstanten (✓ vorhanden).
- `app/api/sessions/end-reason/route.ts` deployed (✓ vorhanden, durch Plan 2).
- ElevenLabs-Account vorhanden, ein Test-Agent ist konfiguriert (für Phase A Spike + Phase G).
- ENV: `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`, `ELEVENLABS_API_KEY` lokal in `.env.local`.

---

## File Structure (Plan 3 berührt diese Dateien)

```
app/
├── layout.tsx                              (modifiziert: Inter+JetBrains, lang/theme cookie)
├── globals.css                             (modifiziert: token import, shadcn vars, dark variant)
├── styles/
│   ├── tokens.css                          (neu — Jakumba light tokens)
│   └── tokens.dark.css                     (neu — derived dark tokens)
├── icon.svg                                (neu — JP-monogram)
├── apple-icon.png                          (build-output von scripts/generate-brand-assets.ts)
├── opengraph-image.png                     (build-output)
├── (public)/
│   ├── layout.tsx                          (modifiziert: AppHeader + Footer)
│   └── page.tsx                            (rewrite — visual spec §3)
├── (gated)/lounge/page.tsx                 (rewrite — LoungeShell + state machine)
└── login/page.tsx                          (restyle — visual spec §3.4 + 8.4)

components/
├── Wordmark.tsx                            (neu)
├── ThemeToggle.tsx                         (neu)
├── LangToggle.tsx                          (neu)
├── AppHeader.tsx                           (neu)
├── Footer.tsx                              (neu)
├── PrivacyDialog.tsx                       (neu)
├── OfflineBanner.tsx                       (neu)
├── ui/                                     (shadcn-init: button, input, dialog)
└── lounge/
    ├── LoungeShell.tsx                     (neu)
    ├── IdlePreStart.tsx                    (neu)
    ├── StatusLine.tsx                      (neu)
    ├── SessionHeader.tsx                   (neu)
    ├── EndButton.tsx                       (neu)
    ├── VoiceIndicator.tsx                  (neu)
    ├── TranscriptStream.tsx                (neu)
    ├── TranscriptTurn.tsx                  (neu)
    ├── MicPermissionRecovery.tsx           (neu)
    ├── ConnectFailRecovery.tsx             (neu)
    └── EndedView.tsx                       (neu)

lib/
├── i18n/
│   ├── messages.ts                         (neu — type-def für keys)
│   ├── de.ts                               (neu)
│   ├── en.ts                               (neu)
│   ├── detect.ts                           (neu — Accept-Language Parser)
│   └── provider.tsx                        (neu — Context + useT)
├── theme/
│   ├── cookie.ts                           (neu — server cookie helpers)
│   └── provider.tsx                        (neu — Context + useTheme)
├── hooks/
│   ├── useSessionTimer.ts                  (neu)
│   ├── useNetworkStatus.ts                 (neu)
│   ├── useAudioAmplitude.ts                (neu)
│   └── useElevenLabsConversation.ts        (neu)
└── utils/cn.ts                             (neu — clsx + tailwind-merge)

scripts/
└── generate-brand-assets.ts                (neu — SVG → PNG via sharp)

tests/
├── unit/
│   ├── i18n/detect.test.ts                 (neu)
│   ├── theme/cookie.test.ts                (neu)
│   ├── hooks/useSessionTimer.test.ts       (neu)
│   ├── hooks/useAudioAmplitude.test.ts     (neu)
│   └── components/VoiceIndicator.test.tsx  (neu)
└── e2e/
    ├── smoke.spec.ts                       (modifiziert — neue Copy)
    ├── landing.spec.ts                     (neu)
    └── lounge-skeleton.spec.ts             (neu)

vitest.config.ts                            (modifiziert — jsdom env, tsx include)
.env.example                                (modifiziert — agent_id Hinweis)
docs/superpowers/spikes/2026-05-05-elevenlabs-sdk-spike.md (neu — Phase A doc)
```

---

## Phase A — Foundation Setup

### Task 1: ElevenLabs SDK Audio-Tap Spike

**Ziel:** Vor dem Bauen des Voice-Indikators und des SDK-Hooks dokumentieren, **wie genau** wir an die Amplitude des Agent-Audio-Outputs kommen. Drei mögliche Pfade (siehe Visual-Spec §6.2): (a) SDK-Event mit Audio-Chunks, (b) `<audio>`-Element + `MediaElementAudioSourceNode`, (c) synthetische Pulse aus `speech_started/ended`. Wir verifizieren empirisch, welcher davon im aktuellen `@elevenlabs/react` verfügbar ist, und schreiben das Ergebnis in einen Spike-Report.

**Files:**
- Create: `docs/superpowers/spikes/2026-05-05-elevenlabs-sdk-spike.md`

- [ ] **Step 1: Install SDK temporär (wird in Task 2 ohnehin permanent installiert; in Spike-Branch zur Prüfung der Public-API)**

```bash
cd /Users/Jojo/Documents/Develop/Projects/talk-to-me
npm install @elevenlabs/react
```

- [ ] **Step 2: Spike-Skript bauen (eine `app/_spike/elevenlabs/page.tsx` mit einer Buttonleiste)**

Datei `app/_spike/elevenlabs/page.tsx` (temporär — wird am Ende des Spikes wieder entfernt):

```tsx
'use client';
import { useConversation } from '@elevenlabs/react';
import { useEffect, useRef, useState } from 'react';

export default function Spike() {
  const conv = useConversation();
  const [log, setLog] = useState<string[]>([]);
  const append = (s: string) => setLog((l) => [...l, `${Date.now()}: ${s}`]);

  // Probe: which fields exist on `conv`?
  useEffect(() => {
    append('keys: ' + Object.keys(conv as object).join(','));
  }, [conv]);

  return (
    <div style={{ padding: 24, fontFamily: 'monospace' }}>
      <h1>EL SDK Spike</h1>
      <button
        onClick={() =>
          conv.startSession({
            agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID!,
          })
        }
      >
        Start
      </button>
      <button onClick={() => conv.endSession()}>End</button>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{log.join('\n')}</pre>
    </div>
  );
}
```

- [ ] **Step 3: `npm run dev`, Browser-DevTools öffnen, in der Console folgendes prüfen:**

  - Welche Felder hat das `useConversation()`-Returnobjekt? (insbesondere: `getInputVolume`, `getOutputVolume`, `inputFrequencyData`, `outputFrequencyData`, `audioContext`, `audioStream`, `mediaStream`, `audioElement`)
  - Beim aktiven Gespräch: gibt es eine offizielle Methode, an Mic-Amplitude und Agent-Output-Amplitude zu kommen?
  - Falls nicht: gibt es einen `<audio>`-Tag im DOM, den das SDK rendert? (`document.querySelectorAll('audio')`).
  - Welche Events feuern? (`onMessage`, `onStatusChange`, `onError`, `onAudio` o. ä.)

- [ ] **Step 4: Findings im Spike-Report festhalten**

Datei `docs/superpowers/spikes/2026-05-05-elevenlabs-sdk-spike.md`:

```markdown
# ElevenLabs SDK Audio-Tap Spike

**Datum:** 2026-05-05
**Author:** Claude (during Plan-3 Phase A)

## Frage
Wie kommen wir an die Amplitude des User-Mic-Streams und des Agent-Audio-Outputs für den Voice-Indikator?

## Probe-Setup
`@elevenlabs/react` v<paste-version-from-package.json>, einfache Page mit `useConversation()`.

## Findings (live-aufgezeichnet)

### useConversation() Return-Shape
- Methoden: <auflisten>
- Status-Felder: <auflisten>
- Audio-bezogene Helper: <auflisten oder "keine">

### Events
- onMessage: <was kommt an>
- onStatusChange: <welche Status-Werte>
- onError: <ja/nein>

### DOM-Audio-Element
- Audio-Tag vom SDK gerendert: <ja/nein>; falls ja, Selector: <z. B. `audio[data-elevenlabs]`>.

### Mic-Stream-Zugriff
- `getUserMedia` wird vom SDK selbst aufgerufen — Stream daher **nicht** öffentlich.
- Workaround: eigenen `getUserMedia`-Call vor `startSession` + Stream cachen, an SDK-Connect mitgeben (falls API es erlaubt) ODER: nach Connect einen zweiten Stream öffnen (Browser teilen sich das Hardware-Mic, eigener AnalyserNode tappt da rein).

## Entscheidung

**Pfad-A (offiziell):** falls `getInputVolume()` / `getOutputVolume()` als 0..1 verfügbar sind → 30 Hz Polling von dort, fertig.

**Pfad-B (DOM-tap):** falls (a) nicht da, aber `<audio>`-Element existiert → `MediaElementAudioSourceNode` darauf für Speaking-Amplitude. Listening-Amplitude separat aus eigenem `getUserMedia()`.

**Pfad-C (synthetic):** wenn weder noch → `onMessage`-Events (`speech_started/ended`) treiben einen synthetischen Sinus.

→ **Implementierung in Plan 3 Phase F + G nutzt Pfad <X>.**

## Konsequenzen für Plan 3
- `useAudioAmplitude(source)` akzeptiert: `MediaStream | HTMLAudioElement | null`. Falls Pfad-A: zusätzlicher Modus `'sdk-volume'` mit Callback-Polling.
- `useElevenLabsConversation` exposed `inputAmplitudeSource` und `outputAmplitudeSource` als Discriminated-Union.
```

- [ ] **Step 5: Spike-Page wieder löschen**

```bash
rm -rf app/_spike
```

- [ ] **Step 6: Commit**

```bash
git add docs/superpowers/spikes/2026-05-05-elevenlabs-sdk-spike.md package.json package-lock.json
git commit -m "$(cat <<'EOF'
docs(spike): document ElevenLabs SDK audio-tap path for voice indicator

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

> **Resolution if unclear:** Falls keiner der drei Pfade zuverlässig funktioniert, fallback auf Pfad-C (synthetic) mit klarer Notiz im Spike. Visual-Spec §6.2 sieht das explizit als tertiary path vor.

---

### Task 2: Install Dependencies

**Files:**
- Modify: `package.json`, `package-lock.json`

- [ ] **Step 1: Runtime-Deps**

```bash
cd /Users/Jojo/Documents/Develop/Projects/talk-to-me
npm install @elevenlabs/react lucide-react sonner clsx tailwind-merge class-variance-authority
```

- [ ] **Step 2: Dev-Deps für Component-Tests**

```bash
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 3: Build-Asset-Pipeline**

```bash
npm install -D sharp tsx
```

- [ ] **Step 4: Verify**

```bash
npx tsc --noEmit
```

Expected: keine Fehler.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "$(cat <<'EOF'
chore(deps): add elevenlabs sdk, lucide, sonner, shadcn deps + testing-library

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: shadcn/ui init

shadcn/ui init schreibt `components.json`, generiert `lib/utils.ts` (cn-helper), und initialisiert `app/globals.css` mit shadcn-Variablen. Wir patchen das im nächsten Task auf Jakumba-Tokens.

**Files:**
- Create: `components.json`
- Modify: `app/globals.css` (vom Init überschrieben — okay, wir konsolidieren in Task 5)

- [ ] **Step 1: Init laufen lassen**

```bash
npx shadcn@latest init
```

Antworten:
- Style: `New York`
- Base color: `Neutral`
- CSS variables: `Yes`
- Tailwind config: `app/globals.css`
- Components alias: `@/components`
- Utils alias: `@/lib/utils`
- React Server Components: `Yes`

- [ ] **Step 2: Drei Basiskomponenten installieren**

```bash
npx shadcn@latest add button input dialog
```

Erwartung: Files in `components/ui/button.tsx`, `components/ui/input.tsx`, `components/ui/dialog.tsx`.

- [ ] **Step 3: cn-utility umziehen (`lib/utils.ts` → `lib/utils/cn.ts`)**

shadcn-Init legt `lib/utils.ts` an. Wir wollen die Datei stattdessen unter `lib/utils/cn.ts`. **Wir verschieben nicht** — shadcn-Generator nutzt `@/lib/utils`. Stattdessen: `lib/utils/cn.ts` zusätzlich als Re-Export anlegen (für eigenen Code), `lib/utils.ts` so lassen wie shadcn es generiert hat:

```typescript
// lib/utils/cn.ts
export { cn } from '@/lib/utils';
```

- [ ] **Step 4: Commit**

```bash
git add components.json components/ui lib/utils.ts lib/utils/cn.ts app/globals.css
git commit -m "$(cat <<'EOF'
chore(ui): init shadcn (new-york, neutral) + button/input/dialog

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Jakumba Tokens

**Files:**
- Create: `app/styles/tokens.css`
- Create: `app/styles/tokens.dark.css`

- [ ] **Step 1: Write `app/styles/tokens.css`**

```css
/* app/styles/tokens.css — Jakumba Design System foundation (light tokens). */

:root {
  /* Ink + canvas */
  --jk-ink:        #2D3142;
  --jk-ink-90:    #41475A;
  --jk-ink-70:    #60646C;
  --jk-ink-40:    #B0B4BA;
  --jk-ink-20:    #D5D7DC;
  --jk-ink-15:    #E0E1E6;
  --jk-ink-05:    #F4F4F6;
  --jk-canvas:    #F0F0F3;
  --jk-canvas-2:  #E7E7EB;
  --jk-paper:     #FFFFFF;
  --fg-on-ink:    #F7F3EE;

  /* Accent */
  --jk-flame:     #EF8354;
  --fg-on-flame:  #FFFFFF;

  /* Semantic */
  --warn: #AB6400;
  --err:  #C03A2B;
  --ok:   #2F7D5B;

  /* Type */
  --font-sans: 'Inter', system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;

  /* Spacing scale (8px base) */
  --sp-1: 4px;  --sp-2: 8px;   --sp-3: 12px; --sp-4: 16px;
  --sp-5: 24px; --sp-6: 32px;  --sp-7: 40px; --sp-8: 48px;
  --sp-9: 64px; --sp-10: 80px; --sp-11: 96px; --sp-12: 144px;

  /* Radii */
  --r-xs: 4px;
  --r-sm: 6px;
  --r-md: 8px;
  --r-lg: 16px;
  --r-xl: 24px;
  --r-2xl: 32px;
  --r-pill: 9999px;

  /* Shadows — whisper philosophy */
  --sh-0: 0 0 0 1px rgba(45,49,66,0.06);
  --sh-1: 0 1px 2px rgba(45,49,66,0.04), 0 0 0 1px rgba(45,49,66,0.06);
  --sh-2: 0 2px 6px rgba(45,49,66,0.06), 0 1px 2px rgba(45,49,66,0.05);
  --sh-3: 0 8px 24px rgba(45,49,66,0.08), 0 2px 6px rgba(45,49,66,0.06);

  /* Motion */
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --d-1: 120ms;
  --d-2: 200ms;
  --d-3: 320ms;
  --d-4: 520ms;
}
```

- [ ] **Step 2: Write `app/styles/tokens.dark.css`**

```css
/* app/styles/tokens.dark.css — derived dark tokens (visual spec §2.3). */

[data-theme='dark'] {
  --jk-bg:        #14151C;
  --jk-bg-elev-1: #1D1F29;
  --jk-bg-elev-2: #232532;

  --fg-1: #F0F0F3;
  --fg-2: #A8AAB6;
  --fg-3: #6E7180;

  --line:        #2A2C39;
  --line-strong: #353748;

  --jk-flame-deep: #D67043;

  /* Status semantic — heller auf dark */
  --warn: #E29A2D;
  --err:  #EF6E55;
  --ok:   #58BC92;

  /* Shadows: dimmer auf dark */
  --sh-0: 0 0 0 1px rgba(255,255,255,0.06);
  --sh-1: 0 1px 2px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06);
  --sh-2: 0 2px 6px rgba(0,0,0,0.45), 0 1px 2px rgba(0,0,0,0.35);
  --sh-3: 0 8px 24px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.4);
}
```

- [ ] **Step 3: Commit**

```bash
git add app/styles/tokens.css app/styles/tokens.dark.css
git commit -m "$(cat <<'EOF'
feat(tokens): add Jakumba light + derived dark tokens

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Wire shadcn ↔ Jakumba in `app/globals.css`

shadcn-Init hat `globals.css` mit eigenen `--background`, `--foreground` etc. überschrieben. Wir mappen diese auf die Jakumba-Variablen aus Task 4.

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Komplett-Replace (außer `@import "tailwindcss"` Zeile)**

```css
@import 'tailwindcss';
@import './styles/tokens.css';
@import './styles/tokens.dark.css';

/* Tailwind 4 dark variant tied to data-theme attribute */
@variant dark (&:where([data-theme=dark], [data-theme=dark] *));

/* shadcn → Jakumba mapping (light) */
:root {
  --background:           var(--jk-canvas);
  --foreground:           var(--jk-ink);
  --card:                 var(--jk-paper);
  --card-foreground:      var(--jk-ink);
  --popover:              var(--jk-paper);
  --popover-foreground:   var(--jk-ink);
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
  --radius:               0.375rem; /* 6px = r-sm */
  --destructive:          var(--err);
  --destructive-foreground: #FFFFFF;
}

/* shadcn → Jakumba mapping (dark) */
[data-theme='dark'] {
  --background:           var(--jk-bg);
  --foreground:           var(--fg-1);
  --card:                 var(--jk-bg-elev-1);
  --card-foreground:      var(--fg-1);
  --popover:              var(--jk-bg-elev-2);
  --popover-foreground:   var(--fg-1);
  --primary:              var(--fg-1);
  --primary-foreground:   var(--jk-bg);
  --secondary:            var(--jk-bg-elev-1);
  --secondary-foreground: var(--fg-1);
  --accent:               var(--jk-flame-deep);
  --accent-foreground:    #FFFFFF;
  --muted:                var(--jk-bg-elev-1);
  --muted-foreground:     var(--fg-2);
  --border:               var(--line);
  --input:                var(--line-strong);
  --ring:                 var(--jk-flame-deep);
}

@theme inline {
  --color-background:           var(--background);
  --color-foreground:           var(--foreground);
  --color-card:                 var(--card);
  --color-card-foreground:      var(--card-foreground);
  --color-primary:              var(--primary);
  --color-primary-foreground:   var(--primary-foreground);
  --color-secondary:            var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-accent:               var(--accent);
  --color-accent-foreground:    var(--accent-foreground);
  --color-muted:                var(--muted);
  --color-muted-foreground:     var(--muted-foreground);
  --color-border:               var(--border);
  --color-input:                var(--input);
  --color-ring:                 var(--ring);
  --color-destructive:          var(--destructive);
  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --radius: var(--radius);
}

* { box-sizing: border-box; }

html, body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

/* Reduced-motion: visual-spec §7.7 */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    transition-duration: 0.001ms !important;
  }
}

/* Focus-ring: spec §7.1 */
:where(button, a, input, [tabindex]):focus-visible {
  outline: 2px solid color-mix(in oklab, var(--jk-flame) 40%, transparent);
  outline-offset: 2px;
  border-radius: var(--r-sm);
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: keine CSS-Fehler.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "$(cat <<'EOF'
feat(tokens): map shadcn variables onto Jakumba tokens (light + dark)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Swap Geist → Inter + JetBrains Mono in layout

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Rewrite `app/layout.tsx`**

```tsx
import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { cookies, headers } from 'next/headers';
import { Toaster } from 'sonner';
import { detectLanguage } from '@/lib/i18n/detect';
import { I18nProvider } from '@/lib/i18n/provider';
import { ThemeProvider } from '@/lib/theme/provider';
import { readThemeCookie } from '@/lib/theme/cookie';
import './globals.css';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'Jonathan Plettenberg — talk to me',
  description:
    'Eine kuratierte Voice-Konversation mit Jonathans digitalem Zwilling.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F0F0F3' },
    { media: '(prefers-color-scheme: dark)',  color: '#14151C' },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const acceptLang = headerStore.get('accept-language');
  const langCookie = cookieStore.get('tt_lang')?.value;
  const lang = langCookie === 'de' || langCookie === 'en'
    ? langCookie
    : detectLanguage(acceptLang);
  const theme = readThemeCookie(cookieStore.get('tt_theme')?.value);

  return (
    <html
      lang={lang}
      data-theme={theme ?? undefined}
      className={`${inter.variable} ${jetbrainsMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider initialTheme={theme}>
          <I18nProvider initialLang={lang}>
            {children}
            <Toaster position="bottom-right" richColors closeButton />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/layout.tsx
git commit -m "$(cat <<'EOF'
feat(layout): swap Geist for Inter+JetBrains, wire i18n+theme providers

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

> Note: Build wird in Task 6 fail bis I18nProvider/ThemeProvider in Phase B existieren — okay, Phase B kommt direkt danach.

---

### Task 7: Vitest jsdom env

**Files:**
- Modify: `vitest.config.ts`
- Create: `tests/setup.ts`

- [ ] **Step 1: Update `vitest.config.ts`**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: [
      'tests/unit/**/*.test.ts',
      'tests/unit/**/*.test.tsx',
      'tests/integration/**/*.test.ts',
    ],
    globals: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

- [ ] **Step 2: Create `tests/setup.ts`**

```typescript
// tests/setup.ts
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

// jsdom doesn't ship matchMedia
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}
```

- [ ] **Step 3: Smoke-run**

```bash
npm test
```

Expected: alle bisherigen Tests grün (jsdom darf Node-Tests nicht brechen — `crypto.subtle` ist in jsdom verfügbar via `node:crypto` Polyfill ab Node 20). Falls einzelne Tests brechen, in den betroffenen Dateien `// @vitest-environment node` als File-Pragma ergänzen.

- [ ] **Step 4: Commit**

```bash
git add vitest.config.ts tests/setup.ts
git commit -m "$(cat <<'EOF'
test(config): switch vitest to jsdom + setup-file with testing-library

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase B — i18n & Theme Infrastructure

### Task 8: i18n messages + provider

**Files:**
- Create: `lib/i18n/messages.ts`
- Create: `lib/i18n/de.ts`
- Create: `lib/i18n/en.ts`
- Create: `lib/i18n/provider.tsx`

- [ ] **Step 1: Define keys in `lib/i18n/messages.ts`**

```typescript
// lib/i18n/messages.ts

export type Lang = 'de' | 'en';

export type MessageKey =
  // Landing
  | 'landing.headline'
  | 'landing.lede'
  | 'landing.login_cta'
  // Login
  | 'login.heading'
  | 'login.lede'
  | 'login.password_placeholder'
  | 'login.submit'
  | 'login.submitting'
  | 'login.error_wrong'
  | 'login.error_lockout'
  | 'login.error_network'
  // Footer
  | 'footer.privacy'
  | 'footer.imprint'
  // Privacy dialog
  | 'privacy.dialog_title'
  | 'privacy.dialog_body'
  | 'privacy.dialog_close'
  // Lounge — idle
  | 'lounge.idle_heading'
  | 'lounge.idle_lede'
  | 'lounge.idle_cta'
  | 'lounge.idle_caption'
  // Lounge — status
  | 'lounge.status_idle'
  | 'lounge.status_connecting'
  | 'lounge.status_listening'
  | 'lounge.status_speaking'
  | 'lounge.status_warning'
  | 'lounge.status_inactivity'
  | 'lounge.status_ending'
  | 'lounge.status_reconnecting'
  | 'lounge.status_connect_failed'
  // Lounge — ended
  | 'lounge.ended_display'
  | 'lounge.ended_new_session'
  | 'lounge.ended_copy_transcript'
  | 'lounge.ended_copy_toast'
  | 'lounge.ended_caption'
  // Errors
  | 'error.mic_denied_heading'
  | 'error.mic_denied_lede'
  | 'error.mic_denied_action'
  | 'error.mic_denied_caption'
  | 'error.connect_fail_heading'
  | 'error.connect_fail_lede'
  | 'error.connect_fail_action'
  | 'error.connect_fail_mailto'
  | 'error.offline'
  | 'error.online_back'
  // Confirm
  | 'confirm.end_session_title'
  | 'confirm.end_session_body'
  | 'confirm.end_session_yes'
  | 'confirm.end_session_no'
  // Misc
  | 'a11y.mic_off';

export type Messages = Record<MessageKey, string>;
```

- [ ] **Step 2: `lib/i18n/de.ts` und `lib/i18n/en.ts`**

```typescript
// lib/i18n/de.ts
import type { Messages } from './messages';

export const de: Messages = {
  'landing.headline':   'Sprich mit\nmeinem digitalen\nZwilling.',
  'landing.lede':       'Eine kuratierte Voice-Konversation über meinen Werdegang, meine Projekte, und wie ich arbeite. Vier Minuten, deine Fragen.',
  'landing.login_cta':  'Login',

  'login.heading':                  'Zugang',
  'login.lede':                     'Du brauchst das geteilte Passwort, das du per Email/Slack erhalten hast.',
  'login.password_placeholder':     'Passwort',
  'login.submit':                   'Weiter',
  'login.submitting':               'Prüfe…',
  'login.error_wrong':              'Passwort stimmt nicht. Versuche es noch einmal.',
  'login.error_lockout':            'Zu viele Versuche. Bitte {seconds} warten.',
  'login.error_network':            'Verbindungsfehler. Erneut versuchen.',

  'footer.privacy':  'Hinweis zur Audio-Verarbeitung',
  'footer.imprint':  'Impressum',

  'privacy.dialog_title':  'Hinweis zur Audio-Verarbeitung',
  'privacy.dialog_body':   'Während des Gesprächs wird dein Mikrofon-Audio in Echtzeit an ElevenLabs zur Speech-to-Text-Verarbeitung übertragen. Das Transkript und die Antworten des digitalen Zwillings werden für Qualitäts-Analysen gespeichert. Es findet keine Stimm-Identifikation und keine Weitergabe an Dritte statt. Eine Sitzung ist auf 4 Minuten begrenzt. Mehr Infos: jonathan@plettenberg.org.',
  'privacy.dialog_close':  'Verstanden',

  'lounge.idle_heading':   'Sprich mit Jonathan.',
  'lounge.idle_lede':      'Wir reden 4 Minuten — über meinen Werdegang, Projekte, und wie ich arbeite.',
  'lounge.idle_cta':       'Konversation starten',
  'lounge.idle_caption':   'Mic-Permission wird gleich gefragt.',

  'lounge.status_idle':           'Bereit',
  'lounge.status_connecting':     'Verbinde…',
  'lounge.status_listening':      'Hört zu …',
  'lounge.status_speaking':       'Antwortet',
  'lounge.status_warning':        'Noch 30 Sekunden',
  'lounge.status_inactivity':     'Noch da?',
  'lounge.status_ending':         'Bis dann.',
  'lounge.status_reconnecting':   'Verbindung neu aufbauen…',
  'lounge.status_connect_failed': 'Verbindung fehlgeschlagen',

  'lounge.ended_display':         'Bis dann.',
  'lounge.ended_new_session':     'Neue Session',
  'lounge.ended_copy_transcript': 'Transkript kopieren',
  'lounge.ended_copy_toast':      'Transkript kopiert',
  'lounge.ended_caption':         'Hast du gefunden, was du wolltest?',

  'error.mic_denied_heading':   'Ohne Mikrofon-Zugriff kein Gespräch.',
  'error.mic_denied_lede':      'Erlaube den Mic-Zugriff in deinem Browser und lade die Seite neu.',
  'error.mic_denied_action':    'Seite neu laden',
  'error.mic_denied_caption':   'Falls du nicht weißt wie: Klick aufs Schloss-Symbol in der Adressleiste deines Browsers.',
  'error.connect_fail_heading': 'Verbindung fehlgeschlagen.',
  'error.connect_fail_lede':    'Das passiert manchmal. Versuch es noch einmal, das ist meistens vorbei.',
  'error.connect_fail_action':  'Erneut verbinden',
  'error.connect_fail_mailto':  'Falls das Problem bleibt, melde dich bei jonathan@plettenberg.org.',
  'error.offline':              'Du bist offline. Wir warten.',
  'error.online_back':          'Wieder online',

  'confirm.end_session_title': 'Konversation jetzt beenden?',
  'confirm.end_session_body':  'Du landest auf der Startseite.',
  'confirm.end_session_yes':   'Beenden',
  'confirm.end_session_no':    'Weiterreden',

  'a11y.mic_off': 'Mikrofon aus',
};
```

```typescript
// lib/i18n/en.ts
import type { Messages } from './messages';

export const en: Messages = {
  'landing.headline':   'Talk to\nmy digital\ntwin.',
  'landing.lede':       'A curated voice conversation about my work history, projects, and how I operate. Four minutes, your questions.',
  'landing.login_cta':  'Login',

  'login.heading':                  'Access',
  'login.lede':                     'You need the shared password you received via email/Slack.',
  'login.password_placeholder':     'Password',
  'login.submit':                   'Continue',
  'login.submitting':               'Checking…',
  'login.error_wrong':              "Password doesn't match. Try again.",
  'login.error_lockout':            'Too many attempts. Please wait {seconds}.',
  'login.error_network':            'Connection error. Try again.',

  'footer.privacy':  'How we handle audio',
  'footer.imprint':  'Imprint',

  'privacy.dialog_title':  'How we handle audio',
  'privacy.dialog_body':   'During the conversation, your microphone audio is streamed in real time to ElevenLabs for speech-to-text processing. The transcript and the digital twin\'s responses are stored for quality analysis. No voice identification, no sharing with third parties. A session is capped at 4 minutes. More info: jonathan@plettenberg.org.',
  'privacy.dialog_close':  'Got it',

  'lounge.idle_heading':   'Talk to Jonathan.',
  'lounge.idle_lede':      'Four minutes — about my work history, projects, and how I operate.',
  'lounge.idle_cta':       'Start conversation',
  'lounge.idle_caption':   'Mic permission will be asked next.',

  'lounge.status_idle':           'Ready',
  'lounge.status_connecting':     'Connecting…',
  'lounge.status_listening':      'Listening …',
  'lounge.status_speaking':       'Replying',
  'lounge.status_warning':        '30 seconds left',
  'lounge.status_inactivity':     'Still there?',
  'lounge.status_ending':         'Until then.',
  'lounge.status_reconnecting':   'Reconnecting…',
  'lounge.status_connect_failed': 'Connection failed',

  'lounge.ended_display':         'Until then.',
  'lounge.ended_new_session':     'New session',
  'lounge.ended_copy_transcript': 'Copy transcript',
  'lounge.ended_copy_toast':      'Transcript copied',
  'lounge.ended_caption':         'Did you find what you needed?',

  'error.mic_denied_heading':   'No conversation without mic access.',
  'error.mic_denied_lede':      'Allow mic access in your browser and reload the page.',
  'error.mic_denied_action':    'Reload page',
  'error.mic_denied_caption':   "If you're not sure how: click the lock icon in your browser's address bar.",
  'error.connect_fail_heading': 'Connection failed.',
  'error.connect_fail_lede':    'It happens. Try again — usually that\'s it.',
  'error.connect_fail_action':  'Reconnect',
  'error.connect_fail_mailto':  'If it persists, reach out at jonathan@plettenberg.org.',
  'error.offline':              "You're offline. We'll wait.",
  'error.online_back':          'Back online',

  'confirm.end_session_title': 'End conversation now?',
  'confirm.end_session_body':  "You'll land on the start page.",
  'confirm.end_session_yes':   'End',
  'confirm.end_session_no':    'Keep going',

  'a11y.mic_off': 'Microphone off',
};
```

- [ ] **Step 3: Provider in `lib/i18n/provider.tsx`**

```tsx
// lib/i18n/provider.tsx
'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { de } from './de';
import { en } from './en';
import type { Lang, MessageKey } from './messages';

const dictionaries = { de, en } as const;

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({
  initialLang,
  children,
}: {
  initialLang: Lang;
  children: React.ReactNode;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    document.cookie = `tt_lang=${l}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('tt_lang', l);
      document.documentElement.lang = l;
    }
  }, []);

  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) => {
      const dict = dictionaries[lang];
      let str = dict[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replace(`{${k}}`, String(v));
        }
      }
      return str;
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useT() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useT must be used inside I18nProvider');
  return ctx;
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/i18n
git commit -m "$(cat <<'EOF'
feat(i18n): add DE+EN dictionaries and React provider with useT hook

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: i18n Accept-Language detect

**Files:**
- Create: `tests/unit/i18n/detect.test.ts`
- Create: `lib/i18n/detect.ts`

- [ ] **Step 1: Failing tests**

```typescript
// tests/unit/i18n/detect.test.ts
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { detectLanguage } from '@/lib/i18n/detect';

describe('detectLanguage', () => {
  it('returns de for null/empty', () => {
    expect(detectLanguage(null)).toBe('de');
    expect(detectLanguage('')).toBe('de');
  });
  it('returns de for de-DE/de-AT/de-CH', () => {
    expect(detectLanguage('de-DE,en;q=0.9')).toBe('de');
    expect(detectLanguage('de-AT,de;q=0.9')).toBe('de');
    expect(detectLanguage('de')).toBe('de');
  });
  it('returns en for en-US/en-GB', () => {
    expect(detectLanguage('en-US,en;q=0.9,de;q=0.8')).toBe('en');
    expect(detectLanguage('en-GB')).toBe('en');
  });
  it('falls back to de for unsupported lang', () => {
    expect(detectLanguage('fr-FR,fr;q=0.9')).toBe('de');
    expect(detectLanguage('ja-JP')).toBe('de');
  });
  it('respects q-weighting (en before de)', () => {
    expect(detectLanguage('en;q=0.9, de;q=0.5')).toBe('en');
    expect(detectLanguage('de;q=0.9, en;q=0.5')).toBe('de');
  });
});
```

- [ ] **Step 2: Run failing**

```bash
npm test -- tests/unit/i18n/detect.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `lib/i18n/detect.ts`**

```typescript
// lib/i18n/detect.ts
import type { Lang } from './messages';

const SUPPORTED: Lang[] = ['de', 'en'];

export function detectLanguage(acceptLanguage: string | null | undefined): Lang {
  if (!acceptLanguage) return 'de';
  const entries = acceptLanguage
    .split(',')
    .map((part) => {
      const [tagRaw, ...params] = part.split(';');
      const tag = tagRaw.trim().toLowerCase();
      const qParam = params.find((p) => p.trim().startsWith('q='));
      const q = qParam ? parseFloat(qParam.trim().slice(2)) : 1;
      return { tag, q: isNaN(q) ? 1 : q };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of entries) {
    const primary = tag.split('-')[0] as Lang;
    if (SUPPORTED.includes(primary)) return primary;
  }
  return 'de';
}
```

- [ ] **Step 4: Run tests pass**

```bash
npm test -- tests/unit/i18n/detect.test.ts
```

Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/i18n/detect.ts tests/unit/i18n/detect.test.ts
git commit -m "$(cat <<'EOF'
feat(i18n): server-side Accept-Language detection with q-weighting

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: Theme cookie helpers + provider

**Files:**
- Create: `tests/unit/theme/cookie.test.ts`
- Create: `lib/theme/cookie.ts`
- Create: `lib/theme/provider.tsx`

- [ ] **Step 1: Failing tests for cookie**

```typescript
// tests/unit/theme/cookie.test.ts
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readThemeCookie, serializeThemeCookie } from '@/lib/theme/cookie';

describe('theme cookie', () => {
  it('parses light/dark', () => {
    expect(readThemeCookie('light')).toBe('light');
    expect(readThemeCookie('dark')).toBe('dark');
  });
  it('returns null for missing/invalid', () => {
    expect(readThemeCookie(undefined)).toBe(null);
    expect(readThemeCookie('')).toBe(null);
    expect(readThemeCookie('greenpink')).toBe(null);
  });
  it('serializes with samesite=lax max-age 1y', () => {
    const s = serializeThemeCookie('dark');
    expect(s).toContain('tt_theme=dark');
    expect(s.toLowerCase()).toContain('samesite=lax');
    expect(s).toContain('max-age=31536000');
  });
});
```

- [ ] **Step 2: Implement `lib/theme/cookie.ts`**

```typescript
// lib/theme/cookie.ts
export type Theme = 'light' | 'dark';

export function readThemeCookie(value: string | undefined): Theme | null {
  if (value === 'light' || value === 'dark') return value;
  return null;
}

export function serializeThemeCookie(theme: Theme): string {
  return `tt_theme=${theme}; path=/; max-age=31536000; samesite=lax`;
}
```

- [ ] **Step 3: Tests pass**

```bash
npm test -- tests/unit/theme/cookie.test.ts
```

Expected: PASS (3 tests).

- [ ] **Step 4: Implement `lib/theme/provider.tsx`**

```tsx
// lib/theme/provider.tsx
'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { serializeThemeCookie, type Theme } from './cookie';

type Ctx = {
  theme: Theme;
  toggle: () => void;
};

const ThemeContext = createContext<Ctx | null>(null);

function systemTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function ThemeProvider({
  initialTheme,
  children,
}: {
  initialTheme: Theme | null;
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState<Theme>(initialTheme ?? 'light');
  const [hydrated, setHydrated] = useState(false);

  // On first client render: if no cookie set, fall back to localStorage > prefers-color-scheme.
  useEffect(() => {
    if (initialTheme) {
      setHydrated(true);
      return;
    }
    const stored = window.localStorage.getItem('tt_theme');
    const next: Theme =
      stored === 'light' || stored === 'dark' ? stored : systemTheme();
    setTheme(next);
    document.documentElement.dataset.theme = next;
    setHydrated(true);
  }, [initialTheme]);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      window.localStorage.setItem('tt_theme', next);
      document.cookie = serializeThemeCookie(next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      <div data-hydrated={hydrated ? 'true' : 'false'} className="contents">
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
```

- [ ] **Step 5: Commit**

```bash
git add lib/theme tests/unit/theme
git commit -m "$(cat <<'EOF'
feat(theme): cookie helpers + React provider with system fallback

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase C — Identity & Shell Components

### Task 11: Wordmark

**Files:**
- Create: `components/Wordmark.tsx`

- [ ] **Step 1: Implement**

```tsx
// components/Wordmark.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type MouseEvent } from 'react';

type Props = {
  /** When provided, intercepts navigation (returns true to allow, false to cancel). */
  onClickGuard?: (proceed: () => void) => void;
};

export function Wordmark({ onClickGuard }: Props) {
  const router = useRouter();

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    if (!onClickGuard) return;
    e.preventDefault();
    onClickGuard(() => router.push('/'));
  }

  return (
    <Link
      href="/"
      onClick={handleClick}
      className="flex items-center gap-3 group focus-visible:outline-none"
      aria-label="Jonathan Plettenberg — start"
    >
      <span
        className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[var(--jk-ink)] text-[var(--fg-on-ink)] dark:bg-[var(--fg-1)] dark:text-[var(--jk-bg)] font-extrabold text-[14px] tracking-[-0.04em] pl-[7px] pr-[5px]"
        aria-hidden="true"
      >
        JP
      </span>
      <span className="text-sm font-semibold tracking-tight text-foreground hidden sm:inline">
        Jonathan Plettenberg
      </span>
    </Link>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/Wordmark.tsx
git commit -m "$(cat <<'EOF'
feat(ui): Wordmark component with monogram + name + onClickGuard hook

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 12: ThemeToggle + LangToggle

**Files:**
- Create: `components/ThemeToggle.tsx`
- Create: `components/LangToggle.tsx`

- [ ] **Step 1: ThemeToggle**

```tsx
// components/ThemeToggle.tsx
'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/theme/provider';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      className="inline-flex h-11 w-11 items-center justify-center rounded-md text-foreground/80 hover:text-foreground hover:bg-muted transition-colors"
    >
      {theme === 'dark' ? (
        <Sun className="h-[18px] w-[18px]" strokeWidth={1.5} />
      ) : (
        <Moon className="h-[18px] w-[18px]" strokeWidth={1.5} />
      )}
    </button>
  );
}
```

- [ ] **Step 2: LangToggle**

```tsx
// components/LangToggle.tsx
'use client';

import { useT } from '@/lib/i18n/provider';
import { cn } from '@/lib/utils';

export function LangToggle() {
  const { lang, setLang } = useT();
  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <button
        type="button"
        onClick={() => setLang('de')}
        className={cn(
          'transition-colors',
          lang === 'de'
            ? 'text-foreground font-medium'
            : 'text-muted-foreground hover:text-foreground'
        )}
        aria-pressed={lang === 'de'}
      >
        DE
      </button>
      <span className="text-muted-foreground/60" aria-hidden="true">|</span>
      <button
        type="button"
        onClick={() => setLang('en')}
        className={cn(
          'transition-colors',
          lang === 'en'
            ? 'text-foreground font-medium'
            : 'text-muted-foreground hover:text-foreground'
        )}
        aria-pressed={lang === 'en'}
      >
        EN
      </button>
    </span>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/ThemeToggle.tsx components/LangToggle.tsx
git commit -m "$(cat <<'EOF'
feat(ui): ThemeToggle (Sun/Moon) and LangToggle (DE|EN)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 13: AppHeader

**Files:**
- Create: `components/AppHeader.tsx`

- [ ] **Step 1: Implement**

```tsx
// components/AppHeader.tsx
import { ThemeToggle } from './ThemeToggle';
import { Wordmark } from './Wordmark';

type Props = {
  middleSlot?: React.ReactNode;
  /** Pass through to Wordmark. */
  wordmarkClickGuard?: (proceed: () => void) => void;
};

export function AppHeader({ middleSlot, wordmarkClickGuard }: Props) {
  return (
    <header className="sticky top-0 z-50 h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6 md:px-10">
        <Wordmark onClickGuard={wordmarkClickGuard} />
        {middleSlot && <div className="flex items-center gap-3">{middleSlot}</div>}
        <ThemeToggle />
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/AppHeader.tsx
git commit -m "$(cat <<'EOF'
feat(ui): AppHeader with Wordmark + optional middle slot + ThemeToggle

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 14: Footer + PrivacyDialog

**Files:**
- Create: `components/PrivacyDialog.tsx`
- Create: `components/Footer.tsx`

- [ ] **Step 1: PrivacyDialog**

```tsx
// components/PrivacyDialog.tsx
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/provider';

export function PrivacyDialog() {
  const { t } = useT();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="hover:text-foreground transition-colors"
        >
          {t('footer.privacy')}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('privacy.dialog_title')}</DialogTitle>
          <DialogDescription className="pt-2 text-sm leading-relaxed">
            {t('privacy.dialog_body')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="default" onClick={(e) => (e.currentTarget.closest('[role=dialog]') as HTMLElement | null)?.querySelector<HTMLButtonElement>('[data-dialog-close]')?.click()}>
            {t('privacy.dialog_close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

> **OPEN ITEM:** Final-Wording des Privacy-Texts in `lib/i18n/de.ts` / `en.ts` ist Platzhalter (~150 Wörter) — Visual-Spec §12 markiert das als Open-Item.

- [ ] **Step 2: Footer**

```tsx
// components/Footer.tsx
'use client';

import { LangToggle } from './LangToggle';
import { PrivacyDialog } from './PrivacyDialog';
import { useT } from '@/lib/i18n/provider';

export function Footer() {
  const { t } = useT();
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between md:px-10">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <PrivacyDialog />
          <span aria-hidden="true">·</span>
          <a href="/imprint" className="hover:text-foreground transition-colors">
            {t('footer.imprint')}
          </a>
        </div>
        <div className="flex items-center gap-2">
          <LangToggle />
          <span aria-hidden="true">·</span>
          <span>{year}</span>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/PrivacyDialog.tsx components/Footer.tsx
git commit -m "$(cat <<'EOF'
feat(ui): Footer with privacy dialog, lang toggle, year

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 15: Brand assets (icon.svg + generator)

**Files:**
- Create: `app/icon.svg`
- Create: `scripts/generate-brand-assets.ts`
- Modify: `package.json` (add `brand:assets` script)

- [ ] **Step 1: `app/icon.svg`**

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="20" fill="#EF8354"/>
  <text
    x="50" y="58"
    font-family="Inter, system-ui, sans-serif"
    font-weight="800"
    font-size="44"
    letter-spacing="-2"
    fill="#FFFFFF"
    text-anchor="middle"
    dominant-baseline="middle"
  >JP</text>
</svg>
```

- [ ] **Step 2: `scripts/generate-brand-assets.ts`**

```typescript
// scripts/generate-brand-assets.ts
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(__dirname, '..');
const ICON_SVG = path.join(ROOT, 'app/icon.svg');
const APPLE_OUT = path.join(ROOT, 'app/apple-icon.png');
const OG_OUT = path.join(ROOT, 'app/opengraph-image.png');

const OG_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#F0F0F3"/>
  <rect width="1200" height="4" y="626" fill="#EF8354"/>
  <g transform="translate(80, 80)">
    <rect width="56" height="56" rx="11" fill="#EF8354"/>
    <text x="28" y="33" font-family="Inter,sans-serif" font-weight="800" font-size="24" fill="#FFF" text-anchor="middle" dominant-baseline="middle">JP</text>
  </g>
  <text x="80" y="280" font-family="Inter,sans-serif" font-weight="800" font-size="80" letter-spacing="-3" fill="#2D3142">Sprich mit</text>
  <text x="80" y="370" font-family="Inter,sans-serif" font-weight="800" font-size="80" letter-spacing="-3" fill="#2D3142">meinem digitalen</text>
  <text x="80" y="460" font-family="Inter,sans-serif" font-weight="800" font-size="80" letter-spacing="-3" fill="#2D3142">Zwilling.</text>
  <text x="80" y="550" font-family="Inter,sans-serif" font-weight="500" font-size="22" fill="#60646C">Jonathan Plettenberg · 4 Min Voice</text>
</svg>
`;

async function main() {
  const iconSvg = await readFile(ICON_SVG);

  // 180×180 apple-icon
  await sharp(iconSvg).resize(180, 180).png().toFile(APPLE_OUT);

  // 1200×630 OG image
  await sharp(Buffer.from(OG_SVG)).png().toFile(OG_OUT);

  console.log('Generated:', APPLE_OUT, OG_OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 3: Add npm script**

In `package.json` `scripts`:

```json
"brand:assets": "tsx scripts/generate-brand-assets.ts",
```

- [ ] **Step 4: Run + verify**

```bash
npm run brand:assets
ls -la app/apple-icon.png app/opengraph-image.png
```

Expected: zwei PNGs.

- [ ] **Step 5: Commit**

```bash
git add app/icon.svg app/apple-icon.png app/opengraph-image.png scripts/generate-brand-assets.ts package.json package-lock.json
git commit -m "$(cat <<'EOF'
feat(brand): JP monogram icon.svg + apple-icon + og-image (sharp pipeline)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

> **Note:** Next.js 16 picks up `app/icon.svg`, `app/apple-icon.png`, `app/opengraph-image.png` automatisch — keine manuelle `<meta>`-Pflege.

---

## Phase D — Public Surfaces

### Task 16: Rewrite `(public)/layout.tsx` mit AppHeader + Footer

**Files:**
- Modify: `app/(public)/layout.tsx`

- [ ] **Step 1: Implement**

```tsx
// app/(public)/layout.tsx
import { AppHeader } from '@/components/AppHeader';
import { Footer } from '@/components/Footer';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppHeader />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(public\)/layout.tsx
git commit -m "$(cat <<'EOF'
feat(public): wrap public routes in AppHeader+Footer shell

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 17: Landing page rewrite

**Files:**
- Modify: `app/(public)/page.tsx`

- [ ] **Step 1: Implement**

```tsx
// app/(public)/page.tsx
'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/provider';

export default function LandingPage() {
  const { t } = useT();
  const headline = t('landing.headline');

  return (
    <section className="mx-auto flex w-full max-w-[560px] flex-col items-start gap-6 px-6 py-16 md:py-[25vh]">
      <h1
        className="text-[36px] font-extrabold tracking-[-0.04em] leading-[1.1] text-foreground md:text-5xl lg:text-[56px] whitespace-pre-line"
      >
        {headline}
      </h1>
      <p className="text-lg leading-snug text-muted-foreground max-w-[40ch]">
        {t('landing.lede')}
      </p>
      <Button asChild size="lg" className="w-full md:w-auto">
        <Link href="/login">
          {t('landing.login_cta')}
          <ArrowRight className="ml-1 h-4 w-4" strokeWidth={1.5} />
        </Link>
      </Button>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(public\)/page.tsx
git commit -m "$(cat <<'EOF'
feat(landing): minimal-gate composition with i18n headline + login CTA

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 18: Login page restyle (Card + lockout countdown)

**Files:**
- Modify: `app/login/page.tsx`

- [ ] **Step 1: Implement**

```tsx
// app/login/page.tsx
'use client';

import { Suspense, useEffect, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppHeader } from '@/components/AppHeader';
import { Footer } from '@/components/Footer';
import { useT } from '@/lib/i18n/provider';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useT();
  const next = params.get('next') ?? '/lounge';

  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [now, setNow] = useState<number>(Date.now());

  // Live-countdown timer for lockout banner
  useEffect(() => {
    if (!lockoutUntil) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [lockoutUntil]);

  const lockoutSecondsLeft = lockoutUntil
    ? Math.max(0, Math.ceil((lockoutUntil - now) / 1000))
    : 0;
  const locked = lockoutSecondsLeft > 0;

  useEffect(() => {
    if (locked === false && lockoutUntil) setLockoutUntil(null);
  }, [locked, lockoutUntil]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (locked) return;
    setError(null);
    setPending(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.status === 200) {
        router.push(next);
        return;
      }
      if (res.status === 429) {
        setLockoutUntil(Date.now() + 60_000);
        setError(null);
      } else {
        setError(t('login.error_wrong'));
      }
    } catch {
      setError(t('login.error_network'));
    } finally {
      setPending(false);
    }
  }

  function formatLockout(s: number): string {
    const mm = Math.floor(s / 60).toString().padStart(1, '0');
    const ss = (s % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-[400px] rounded-lg bg-card border border-border p-8 shadow-[var(--sh-2)]">
        <h2 className="text-2xl font-semibold text-foreground">
          {t('login.heading')}
        </h2>
        <p className="mt-2 text-base text-muted-foreground">
          {t('login.lede')}
        </p>

        {locked && (
          <div
            role="alert"
            className="mt-4 rounded-md border border-[color-mix(in_oklab,var(--warn)_50%,transparent)] bg-[color-mix(in_oklab,var(--warn)_10%,transparent)] p-3 text-sm text-foreground"
          >
            {t('login.error_lockout', {
              seconds: formatLockout(lockoutSecondsLeft),
            })}
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-3" aria-label="Login">
          <Input
            type="password"
            autoFocus
            required
            disabled={locked}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('login.password_placeholder')}
            aria-label={t('login.password_placeholder')}
            aria-invalid={!!error}
            className={error ? 'border-destructive' : ''}
          />
          {error && (
            <p role="alert" className="text-[13px] text-destructive">
              {error}
            </p>
          )}
          <Button
            type="submit"
            disabled={pending || locked || password.length === 0}
            className="w-full"
          >
            {pending ? t('login.submitting') : t('login.submit')}
          </Button>
        </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <>
      <AppHeader />
      <Suspense>
        <LoginForm />
      </Suspense>
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/login/page.tsx
git commit -m "$(cat <<'EOF'
feat(login): restyle as Card + i18n + live lockout countdown

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 19: Update existing E2E smoke

Existing `tests/e2e/smoke.spec.ts` testet noch alte deutsche Copy (`Talk to me.`, `Lounge`-Heading, `Weiter`-Button). Wir aktualisieren auf neue Strings.

**Files:**
- Modify: `tests/e2e/smoke.spec.ts`

- [ ] **Step 1: Rewrite**

```typescript
// tests/e2e/smoke.spec.ts
import { test, expect } from '@playwright/test';

const PASSWORD =
  process.env.ACCESS_PASSWORD ?? 'correct-horse-battery-staple';

test.describe('auth smoke', () => {
  test('redirects unauthenticated lounge access to login', async ({ page }) => {
    await page.goto('/lounge');
    await expect(page).toHaveURL(/\/login\?next=%2Flounge/);
    await expect(page.getByPlaceholder(/Passwort|Password/)).toBeVisible();
  });

  test('rejects wrong password with error message', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/Passwort|Password/).fill('definitely-wrong');
    await page.getByRole('button', { name: /Weiter|Continue/ }).click();
    await expect(page.getByRole('alert')).toBeVisible();
  });

  test('correct password lands on lounge', async ({ page }) => {
    await page.goto('/login?next=%2Flounge');
    await page.getByPlaceholder(/Passwort|Password/).fill(PASSWORD);
    await page.getByRole('button', { name: /Weiter|Continue/ }).click();
    await expect(page).toHaveURL(/\/lounge$/);
    // Lounge idle CTA visible (visual spec §4.4)
    await expect(
      page.getByRole('button', { name: /Konversation starten|Start conversation/ })
    ).toBeVisible();
  });

  test('landing page renders headline', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: /Login/ })).toBeVisible();
  });
});
```

- [ ] **Step 2: Commit**

```bash
git add tests/e2e/smoke.spec.ts
git commit -m "$(cat <<'EOF'
test(e2e): update smoke spec for new lounge idle CTA + i18n button names

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase E — Lounge Skeleton (No SDK Yet)

### Task 20: useSessionTimer hook

**Files:**
- Create: `tests/unit/hooks/useSessionTimer.test.ts`
- Create: `lib/hooks/useSessionTimer.ts`

- [ ] **Step 1: Failing tests**

```typescript
// tests/unit/hooks/useSessionTimer.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSessionTimer } from '@/lib/hooks/useSessionTimer';

describe('useSessionTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts at 0 when not running', () => {
    const { result } = renderHook(() => useSessionTimer({ running: false }));
    expect(result.current.elapsedMs).toBe(0);
    expect(result.current.phase).toBe('idle');
  });

  it('counts up while running', () => {
    const { result } = renderHook(() => useSessionTimer({ running: true }));
    act(() => { vi.advanceTimersByTime(1500); });
    expect(result.current.elapsedMs).toBeGreaterThanOrEqual(1000);
    expect(result.current.phase).toBe('active');
  });

  it('emits warning at 3:30', () => {
    const onWarn = vi.fn();
    const { result } = renderHook(() =>
      useSessionTimer({ running: true, onWarning: onWarn })
    );
    act(() => { vi.advanceTimersByTime(210_000); });
    expect(result.current.phase).toBe('warning');
    expect(onWarn).toHaveBeenCalledOnce();
  });

  it('emits hardLimit at 4:00', () => {
    const onLimit = vi.fn();
    const { result } = renderHook(() =>
      useSessionTimer({ running: true, onHardLimit: onLimit })
    );
    act(() => { vi.advanceTimersByTime(240_000); });
    expect(result.current.phase).toBe('hardLimit');
    expect(onLimit).toHaveBeenCalledOnce();
  });

  it('formats mm:ss', () => {
    const { result } = renderHook(() => useSessionTimer({ running: true }));
    act(() => { vi.advanceTimersByTime(75_000); });
    // 75s remaining-style: hook returns countdown from HARD_LIMIT_MS
    expect(result.current.remainingFormatted).toMatch(/^\d:\d{2}$/);
  });
});
```

- [ ] **Step 2: Implement**

```typescript
// lib/hooks/useSessionTimer.ts
'use client';

import { useEffect, useRef, useState } from 'react';
import { SESSION } from '@/lib/config';

export type TimerPhase = 'idle' | 'active' | 'warning' | 'hardLimit';

type Options = {
  running: boolean;
  onWarning?: () => void;
  onHardLimit?: () => void;
};

export function useSessionTimer({ running, onWarning, onHardLimit }: Options) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const startRef = useRef<number | null>(null);
  const warnedRef = useRef(false);
  const limitedRef = useRef(false);

  useEffect(() => {
    if (!running) {
      startRef.current = null;
      warnedRef.current = false;
      limitedRef.current = false;
      setElapsedMs(0);
      return;
    }
    startRef.current = Date.now();
    const id = window.setInterval(() => {
      const now = Date.now();
      const elapsed = now - (startRef.current ?? now);
      setElapsedMs(elapsed);
      if (elapsed >= SESSION.WARNING_AT_MS && !warnedRef.current) {
        warnedRef.current = true;
        onWarning?.();
      }
      if (elapsed >= SESSION.HARD_LIMIT_MS && !limitedRef.current) {
        limitedRef.current = true;
        onHardLimit?.();
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [running, onWarning, onHardLimit]);

  let phase: TimerPhase = 'idle';
  if (running) {
    if (elapsedMs >= SESSION.HARD_LIMIT_MS) phase = 'hardLimit';
    else if (elapsedMs >= SESSION.WARNING_AT_MS) phase = 'warning';
    else phase = 'active';
  }

  const remainingMs = Math.max(0, SESSION.HARD_LIMIT_MS - elapsedMs);
  const totalSec = Math.floor(remainingMs / 1000);
  const mm = Math.floor(totalSec / 60);
  const ss = (totalSec % 60).toString().padStart(2, '0');

  return {
    elapsedMs,
    remainingMs,
    remainingFormatted: `${mm}:${ss}`,
    phase,
  };
}
```

- [ ] **Step 3: Tests pass**

```bash
npm test -- tests/unit/hooks/useSessionTimer.test.ts
```

Expected: PASS (5).

- [ ] **Step 4: Commit**

```bash
git add lib/hooks/useSessionTimer.ts tests/unit/hooks/useSessionTimer.test.ts
git commit -m "$(cat <<'EOF'
feat(hooks): useSessionTimer with warning + hard-limit callbacks

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 21: useNetworkStatus + OfflineBanner

**Files:**
- Create: `lib/hooks/useNetworkStatus.ts`
- Create: `components/OfflineBanner.tsx`

- [ ] **Step 1: Hook**

```typescript
// lib/hooks/useNetworkStatus.ts
'use client';

import { useEffect, useState } from 'react';

export function useNetworkStatus() {
  const [online, setOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  useEffect(() => {
    function on() { setOnline(true); }
    function off() { setOnline(false); }
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}
```

- [ ] **Step 2: Banner**

```tsx
// components/OfflineBanner.tsx
'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus';
import { useT } from '@/lib/i18n/provider';

export function OfflineBanner() {
  const online = useNetworkStatus();
  const wasOffline = useRef(false);
  const { t } = useT();

  useEffect(() => {
    if (!online) {
      wasOffline.current = true;
    } else if (online && wasOffline.current) {
      wasOffline.current = false;
      toast.success(t('error.online_back'));
    }
  }, [online, t]);

  if (online) return null;
  return (
    <div
      role="status"
      className="sticky top-14 z-40 w-full bg-[color-mix(in_oklab,var(--warn)_15%,var(--background))] border-b border-[color-mix(in_oklab,var(--warn)_30%,var(--border))] px-6 py-3 text-sm text-foreground text-center"
    >
      {t('error.offline')}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/hooks/useNetworkStatus.ts components/OfflineBanner.tsx
git commit -m "$(cat <<'EOF'
feat(network): online/offline hook + sticky offline banner with sonner toast

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 22: LoungeShell + IdlePreStart + StatusLine

**Files:**
- Create: `components/lounge/LoungeShell.tsx`
- Create: `components/lounge/IdlePreStart.tsx`
- Create: `components/lounge/StatusLine.tsx`

- [ ] **Step 1: LoungeShell**

```tsx
// components/lounge/LoungeShell.tsx
export function LoungeShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-8">
      <div className="flex w-full max-w-[640px] flex-col items-center gap-6">
        {children}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: IdlePreStart**

```tsx
// components/lounge/IdlePreStart.tsx
'use client';

import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/provider';

type Props = { onStart: () => void };

export function IdlePreStart({ onStart }: Props) {
  const { t } = useT();
  return (
    <section className="flex flex-col items-center gap-6 text-center">
      <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-[32px]">
        {t('lounge.idle_heading')}
      </h2>
      <p className="text-base leading-snug text-muted-foreground max-w-[40ch]">
        {t('lounge.idle_lede')}
      </p>
      <Button size="lg" onClick={onStart} className="w-full sm:w-auto">
        {t('lounge.idle_cta')}
        <ArrowRight className="ml-1 h-4 w-4" strokeWidth={1.5} />
      </Button>
      <p className="text-xs text-muted-foreground">{t('lounge.idle_caption')}</p>
    </section>
  );
}
```

- [ ] **Step 3: StatusLine**

```tsx
// components/lounge/StatusLine.tsx
'use client';

import { cn } from '@/lib/utils';

type Props = {
  text: string;
  variant?: 'idle' | 'listening' | 'speaking' | 'warning' | 'ending';
};

export function StatusLine({ text, variant = 'idle' }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 text-sm font-medium text-muted-foreground"
    >
      <span
        aria-hidden="true"
        className={cn(
          'inline-block h-2 w-2 rounded-full bg-current opacity-40 transition-opacity',
          variant === 'listening' && 'opacity-100 motion-safe:animate-pulse',
          variant === 'speaking' && 'opacity-100 bg-[var(--jk-flame)]',
          variant === 'warning' && 'opacity-100 bg-[var(--warn)]'
        )}
      />
      <span>{text}</span>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add components/lounge
git commit -m "$(cat <<'EOF'
feat(lounge): LoungeShell + IdlePreStart + StatusLine (a11y aria-live)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 23: SessionHeader + EndButton

**Files:**
- Create: `components/lounge/EndButton.tsx`
- Create: `components/lounge/SessionHeader.tsx`

- [ ] **Step 1: EndButton**

```tsx
// components/lounge/EndButton.tsx
'use client';

import { PhoneOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = { onEnd: () => void };

export function EndButton({ onEnd }: Props) {
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={onEnd}
      aria-label="End conversation"
      className="h-9 gap-1.5"
    >
      <PhoneOff className="h-3.5 w-3.5" strokeWidth={1.5} />
      <span className="hidden sm:inline">End</span>
    </Button>
  );
}
```

- [ ] **Step 2: SessionHeader**

```tsx
// components/lounge/SessionHeader.tsx
'use client';

import { cn } from '@/lib/utils';
import { EndButton } from './EndButton';

type Props = {
  remainingFormatted: string;
  isWarning?: boolean;
  onEnd: () => void;
};

export function SessionHeader({
  remainingFormatted,
  isWarning,
  onEnd,
}: Props) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          'font-mono text-sm tabular-nums transition-colors',
          isWarning ? 'text-[var(--warn)]' : 'text-muted-foreground'
        )}
        aria-label={`Time remaining ${remainingFormatted}`}
      >
        {remainingFormatted}
      </span>
      <EndButton onEnd={onEnd} />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/lounge/EndButton.tsx components/lounge/SessionHeader.tsx
git commit -m "$(cat <<'EOF'
feat(lounge): EndButton (phone-off) + SessionHeader timer + warning color

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 24: Wire Lounge skeleton page (no SDK yet)

**Files:**
- Modify: `app/(gated)/lounge/page.tsx`
- Create: `app/(gated)/layout.tsx` (if not present, ensures AppHeader+Footer wrap lounge too)

- [ ] **Step 1: Gated layout**

```tsx
// app/(gated)/layout.tsx
import { AppHeader } from '@/components/AppHeader';
import { Footer } from '@/components/Footer';
import { OfflineBanner } from '@/components/OfflineBanner';

export default function GatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppHeader />
      <OfflineBanner />
      {children}
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Lounge page (skeleton; Phase G replaces this with the real SDK-driven state machine; here it's a literal `idle`-only screen, perfectly visible)**

```tsx
// app/(gated)/lounge/page.tsx
'use client';

import { useState } from 'react';
import { LoungeShell } from '@/components/lounge/LoungeShell';
import { IdlePreStart } from '@/components/lounge/IdlePreStart';
import { StatusLine } from '@/components/lounge/StatusLine';
import { useT } from '@/lib/i18n/provider';

export default function LoungePage() {
  const { t } = useT();
  // Phase E: state only ever 'idle'. Phase G replaces this with real machine.
  const [state] = useState<'idle'>('idle');

  return (
    <LoungeShell>
      {state === 'idle' && (
        <>
          <IdlePreStart
            onStart={() => {
              // Phase G wires this up.
              console.log('start clicked');
            }}
          />
          <StatusLine text={t('lounge.status_idle')} variant="idle" />
        </>
      )}
    </LoungeShell>
  );
}
```

- [ ] **Step 3: Smoke test (manual)**

```bash
npm run dev
# log in, navigate /lounge, expect: idle CTA + status line
```

- [ ] **Step 4: Run full test suite (still green?)**

```bash
npm test && npm run test:e2e
```

Expected: Plan-1 + Plan-2 + new unit tests grün; E2E smoke grün (Lounge-CTA-Assert greift jetzt).

- [ ] **Step 5: Commit**

```bash
git add app/\(gated\)
git commit -m "$(cat <<'EOF'
feat(lounge): skeleton page with idle CTA, gated layout shell

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase F — Voice Indicator

### Task 25: useAudioAmplitude

**Files:**
- Create: `tests/unit/hooks/useAudioAmplitude.test.ts`
- Create: `lib/hooks/useAudioAmplitude.ts`

- [ ] **Step 1: Failing tests** (auf der reinen Math: EMA, RMS aus Byte-Time-Domain)

```typescript
// tests/unit/hooks/useAudioAmplitude.test.ts
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { computeRms, applyEma } from '@/lib/hooks/useAudioAmplitude';

describe('useAudioAmplitude math', () => {
  it('computeRms: silence (all 128) → 0', () => {
    const buf = new Uint8Array(64).fill(128);
    expect(computeRms(buf)).toBeCloseTo(0, 3);
  });
  it('computeRms: full-scale square → ~1', () => {
    const buf = new Uint8Array(64);
    for (let i = 0; i < buf.length; i++) buf[i] = i % 2 ? 0 : 255;
    expect(computeRms(buf)).toBeGreaterThan(0.9);
  });
  it('applyEma α=0.2 averages', () => {
    let v = 0;
    v = applyEma(v, 1, 0.2); // → 0.2
    expect(v).toBeCloseTo(0.2, 5);
    v = applyEma(v, 1, 0.2); // → 0.36
    expect(v).toBeCloseTo(0.36, 5);
  });
  it('applyEma converges to target', () => {
    let v = 0;
    for (let i = 0; i < 50; i++) v = applyEma(v, 0.7, 0.2);
    expect(v).toBeCloseTo(0.7, 3);
  });
});
```

- [ ] **Step 2: Implement**

```typescript
// lib/hooks/useAudioAmplitude.ts
'use client';

import { useEffect, useRef, useState } from 'react';

export function computeRms(timeDomain: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i < timeDomain.length; i++) {
    const v = (timeDomain[i] - 128) / 128;
    sum += v * v;
  }
  return Math.sqrt(sum / timeDomain.length);
}

export function applyEma(prev: number, target: number, alpha: number): number {
  return prev + alpha * (target - prev);
}

type Source = MediaStream | HTMLAudioElement | null;

/**
 * Returns smoothed amplitude in [0..1]. Polls at ~30 Hz.
 */
export function useAudioAmplitude(source: Source, enabled: boolean): number {
  const [amp, setAmp] = useState(0);
  const ampRef = useRef(0);

  useEffect(() => {
    if (!enabled || !source) {
      ampRef.current = 0;
      setAmp(0);
      return;
    }
    let ctx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let raf = 0;
    let lastTick = 0;
    const buf = new Uint8Array(1024);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AC = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
      ctx = new AC();
      analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;

      let node: AudioNode | null = null;
      if (source instanceof MediaStream) {
        node = ctx.createMediaStreamSource(source);
      } else {
        node = ctx.createMediaElementSource(source);
        node.connect(ctx.destination); // keep audio audible
      }
      node.connect(analyser);

      const tick = (t: number) => {
        if (t - lastTick >= 33) {
          lastTick = t;
          analyser!.getByteTimeDomainData(buf);
          const rms = computeRms(buf);
          ampRef.current = applyEma(ampRef.current, Math.min(1, rms * 2), 0.2);
          setAmp(ampRef.current);
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    } catch {
      // ignore — caller will see amp=0
    }

    return () => {
      cancelAnimationFrame(raf);
      analyser?.disconnect();
      ctx?.close();
    };
  }, [source, enabled]);

  return amp;
}
```

- [ ] **Step 3: Tests pass**

```bash
npm test -- tests/unit/hooks/useAudioAmplitude.test.ts
```

Expected: PASS (4).

- [ ] **Step 4: Commit**

```bash
git add lib/hooks/useAudioAmplitude.ts tests/unit/hooks/useAudioAmplitude.test.ts
git commit -m "$(cat <<'EOF'
feat(hooks): useAudioAmplitude with RMS + EMA smoothing (30Hz)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 26: VoiceIndicator component

**Files:**
- Create: `tests/unit/components/VoiceIndicator.test.tsx`
- Create: `components/lounge/VoiceIndicator.tsx`

- [ ] **Step 1: Failing tests**

```tsx
// tests/unit/components/VoiceIndicator.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VoiceIndicator } from '@/components/lounge/VoiceIndicator';

describe('VoiceIndicator', () => {
  it('renders an svg with state-bound aria-label (idle)', () => {
    render(<VoiceIndicator state="idle" amplitude={0} />);
    const svg = screen.getByRole('img');
    expect(svg.getAttribute('aria-label')).toMatch(/idle/i);
  });
  it('reduced-motion → renders a static circle indicator (no path)', () => {
    render(
      <VoiceIndicator state="listening" amplitude={0.5} reducedMotion />
    );
    expect(screen.getByTestId('reduced-motion-indicator')).toBeInTheDocument();
    expect(screen.queryByTestId('scope-path')).not.toBeInTheDocument();
  });
  it('non-reduced: renders an svg path', () => {
    render(<VoiceIndicator state="listening" amplitude={0.3} />);
    expect(screen.getByTestId('scope-path')).toBeInTheDocument();
  });
  it('aria-label changes per state', () => {
    const { rerender } = render(<VoiceIndicator state="listening" amplitude={0} />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toMatch(/listening/i);
    rerender(<VoiceIndicator state="speaking" amplitude={0} />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toMatch(/speaking/i);
  });
});
```

- [ ] **Step 2: Implement** (Math direkt aus Brainstorm-Prototyp portiert)

```tsx
// components/lounge/VoiceIndicator.tsx
'use client';

import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

export type VoiceState =
  | 'idle' | 'connecting'
  | 'listening' | 'speaking'
  | 'warning' | 'ending';

type Props = {
  state: VoiceState;
  amplitude?: number;
  width?: number;
  reducedMotion?: boolean;
};

const N = 80;
const AMP_MAX = 36;
const LERP = 0.18;

const ARIA_LABEL: Record<VoiceState, string> = {
  idle: 'Voice activity: idle',
  connecting: 'Connecting',
  listening: 'Voice activity: listening',
  speaking: 'Voice activity: speaking',
  warning: 'Voice activity: warning, 30 seconds left',
  ending: 'Voice activity: ending',
};

export function VoiceIndicator({
  state,
  amplitude = 0,
  width = 320,
  reducedMotion: rmProp,
}: Props) {
  const pathRef = useRef<SVGPathElement>(null);
  const stateRef = useRef(state);
  const ampRef = useRef(amplitude);
  const phaseRef = useRef(0);
  const pointsRef = useRef<number[]>(new Array(N).fill(0));
  const targetsRef = useRef<number[]>(new Array(N).fill(0));
  const reducedMotion =
    rmProp ?? (typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

  // Keep refs in sync (avoid re-mounting RAF on every state/amplitude tick)
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { ampRef.current = amplitude; }, [amplitude]);

  useEffect(() => {
    if (reducedMotion) return;
    if (state === 'connecting') return;

    let raf = 0;
    const tick = () => {
      phaseRef.current += 0.045;
      const s = stateRef.current;
      const a = ampRef.current;

      // base amplitude per state (driven by RMS where applicable)
      let baseAmp: number;
      if (s === 'idle') baseAmp = 1.5;
      else if (s === 'listening') baseAmp = 4 + a * 28;
      else if (s === 'speaking') baseAmp = 4 + a * 32;
      else if (s === 'warning') baseAmp = 4 + a * 24;
      else baseAmp = 0.5; // ending

      if (Math.random() < 0.32) {
        for (let i = 0; i < N; i++) {
          const x = i / (N - 1);
          const fx = (x - 0.5) * 2;
          const env = Math.cos((fx * Math.PI) / 2);
          let y = 0;
          if (s === 'idle') {
            y = Math.sin(phaseRef.current * 0.6 + x * 1.4) * baseAmp * env;
          } else if (s === 'listening') {
            const v =
              Math.sin(x * 6 + phaseRef.current * 3.4) * 0.6 +
              Math.sin(x * 13 + phaseRef.current * 1.8) * 0.4;
            y = -Math.abs(v) * baseAmp * env - Math.random() * baseAmp * 0.15;
          } else if (s === 'speaking' || s === 'warning') {
            y =
              (Math.sin(x * 7 + phaseRef.current * 3.0) * 0.55 +
                Math.sin(x * 17 + phaseRef.current * 5.1) * 0.3 +
                (Math.random() - 0.5) * 0.45) *
              baseAmp *
              env;
          } else {
            y = Math.sin(phaseRef.current * 0.4 + x * 1.0) * baseAmp * env;
          }
          targetsRef.current[i] = y;
        }
      }

      let d = '';
      for (let i = 0; i < N; i++) {
        pointsRef.current[i] +=
          (targetsRef.current[i] - pointsRef.current[i]) * LERP;
        const x = -width / 2 + (i / (N - 1)) * width;
        const y = pointsRef.current[i];
        d += (i === 0 ? 'M ' : ' L ') + x.toFixed(2) + ' ' + y.toFixed(2);
      }
      if (pathRef.current) pathRef.current.setAttribute('d', d);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [width, reducedMotion, state]);

  if (state === 'connecting') {
    return (
      <div
        role="img"
        aria-label={ARIA_LABEL.connecting}
        className="flex h-24 w-full items-center justify-center"
      >
        <Loader2
          className="h-6 w-6 animate-spin text-muted-foreground"
          strokeWidth={1.5}
        />
      </div>
    );
  }

  if (reducedMotion) {
    const dotClass =
      state === 'listening'
        ? 'bg-foreground'
        : state === 'speaking'
        ? 'bg-[var(--jk-flame)]'
        : state === 'warning'
        ? 'bg-[var(--warn)]'
        : 'bg-muted-foreground';
    return (
      <div
        role="img"
        aria-label={ARIA_LABEL[state]}
        className="flex h-24 w-full items-center justify-center"
      >
        <span
          data-testid="reduced-motion-indicator"
          className={`inline-block h-2 w-2 rounded-full ${dotClass}`}
        />
      </div>
    );
  }

  const strokeColor =
    state === 'warning'
      ? 'var(--warn)'
      : 'currentColor';

  return (
    <svg
      role="img"
      aria-label={ARIA_LABEL[state]}
      viewBox={`-${width / 2} -48 ${width} 96`}
      className="h-24 w-full max-w-[320px] text-foreground"
      preserveAspectRatio="none"
      style={{ opacity: state === 'ending' ? 0.25 : 1, transition: 'opacity 320ms var(--ease-out)' }}
    >
      <path
        ref={pathRef}
        data-testid="scope-path"
        d={`M -${width / 2} 0 L ${width / 2} 0`}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ willChange: 'd' }}
      />
    </svg>
  );
}
```

- [ ] **Step 3: Tests pass**

```bash
npm test -- tests/unit/components/VoiceIndicator.test.tsx
```

Expected: PASS (4).

- [ ] **Step 4: Commit**

```bash
git add lib/hooks/useAudioAmplitude.ts components/lounge/VoiceIndicator.tsx tests/unit/components/VoiceIndicator.test.tsx
git commit -m "$(cat <<'EOF'
feat(lounge): VoiceIndicator (Tinten-Linie SVG path) with reduced-motion fallback

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase G — ElevenLabs SDK Integration

### Task 27: useElevenLabsConversation hook

Wraps `@elevenlabs/react`'s `useConversation()` and exposes our app-state machine. Concrete API depends on Spike findings (Task 1) — the structure below assumes Pfad-A or Pfad-B from the spike.

**Files:**
- Create: `lib/hooks/useElevenLabsConversation.ts`

- [ ] **Step 1: Implement**

```typescript
// lib/hooks/useElevenLabsConversation.ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useConversation } from '@elevenlabs/react';
import { SESSION } from '@/lib/config';
import type { Lang } from '@/lib/i18n/messages';

export type Turn = {
  role: 'agent' | 'user';
  message: string;
  /** True while the agent is mid-utterance (only ever on the latest agent turn). */
  inProgress?: boolean;
};

export type AppState =
  | { name: 'idle' }
  | { name: 'connecting' }
  | { name: 'active'; sub: 'listening' | 'speaking' }
  | { name: 'warning'; sub: 'listening' | 'speaking' }
  | { name: 'inactivity-prompt' }
  | { name: 'reconnecting' }
  | { name: 'ending'; reason: EndReason }
  | { name: 'ended'; reason: EndReason }
  | { name: 'error-mic' }
  | { name: 'error-connect' };

export type EndReason =
  | 'timeout' | 'goodbye' | 'manual' | 'inactivity' | 'error';

const GOODBYE_PATTERNS = [
  /\b(tschüss|tschuess|ciao|bye)\b/i,
  /danke[, ].{0,10}das war('?s|s)/i,
  /thanks?[, ].{0,10}that('?s|s) (it|all)/i,
];

type Options = {
  agentId: string;
  uiLang: Lang;
};

export function useElevenLabsConversation({ agentId, uiLang }: Options) {
  const [state, setState] = useState<AppState>({ name: 'idle' });
  const [turns, setTurns] = useState<Turn[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [agentAudio, setAgentAudio] = useState<HTMLAudioElement | null>(null);

  const lastUserSpeechRef = useRef<number>(0);
  const inactivityTimerRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const conv = useConversation({
    onConnect: ({ conversationId: cid }) => {
      if (cid) setConversationId(cid);
      setState({ name: 'active', sub: 'listening' });
      reconnectAttemptsRef.current = 0;
    },
    onDisconnect: () => {
      // handled by transitionEnd below
    },
    onMessage: (msg: { source: 'agent' | 'user'; message: string }) => {
      setTurns((prev) => {
        const last = prev[prev.length - 1];
        const next: Turn = { role: msg.source, message: msg.message };
        if (msg.source === 'user') lastUserSpeechRef.current = Date.now();
        // Goodbye detection
        if (msg.source === 'user') {
          for (const p of GOODBYE_PATTERNS) {
            if (p.test(msg.message)) {
              queueMicrotask(() => endSession('goodbye'));
              break;
            }
          }
        }
        if (last && last.role === next.role) {
          return [...prev.slice(0, -1), { ...last, message: next.message }];
        }
        return [...prev, next];
      });
    },
    onError: () => {
      setState((s) => {
        if (s.name === 'active' || s.name === 'warning') {
          // mid-conversation drop → reconnect
          return { name: 'reconnecting' };
        }
        return { name: 'error-connect' };
      });
    },
    onModeChange: ({ mode }: { mode: 'listening' | 'speaking' }) => {
      setState((s) => {
        if (s.name === 'active' || s.name === 'warning') {
          return { ...s, sub: mode };
        }
        return s;
      });
    },
  });

  // ---- Public methods ----

  const start = useCallback(async () => {
    setState({ name: 'connecting' });
    try {
      // request mic up-front so we own the stream for amplitude tap
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicStream(stream);
    } catch {
      setState({ name: 'error-mic' });
      return;
    }
    try {
      await conv.startSession({
        agentId,
        // visual-spec §9.4: pass UI lang as first-message hint
        overrides: { agent: { language: uiLang } },
      });
      // try to grab agent audio element if SDK renders one (Pfad-B per spike)
      const audio = document.querySelector<HTMLAudioElement>(
        'audio[data-elevenlabs], audio[autoplay]'
      );
      if (audio) setAgentAudio(audio);
    } catch {
      reconnectAttemptsRef.current += 1;
      setState({ name: 'error-connect' });
    }
  }, [agentId, conv, uiLang]);

  const endSession = useCallback(
    async (reason: EndReason) => {
      setState({ name: 'ending', reason });
      // POST end-reason BEFORE disconnect (architecture spec §11.1)
      if (conversationId) {
        try {
          await fetch('/api/sessions/end-reason', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              conversation_id: conversationId,
              reason,
            }),
            keepalive: true,
          });
        } catch {
          // best-effort
        }
      }
      try {
        await conv.endSession();
      } catch {
        // ignore
      }
      micStream?.getTracks().forEach((t) => t.stop());
      setMicStream(null);
      setAgentAudio(null);
      setState({ name: 'ended', reason });
    },
    [conversationId, conv, micStream]
  );

  // ---- Inactivity watcher ----
  useEffect(() => {
    if (state.name !== 'active' && state.name !== 'warning') {
      if (inactivityTimerRef.current)
        window.clearInterval(inactivityTimerRef.current);
      return;
    }
    lastUserSpeechRef.current ||= Date.now();
    inactivityTimerRef.current = window.setInterval(() => {
      const idleMs = Date.now() - lastUserSpeechRef.current;
      if (idleMs >= SESSION.INACTIVITY_END_MS) {
        endSession('inactivity');
      } else if (idleMs >= SESSION.INACTIVITY_PROMPT_MS) {
        setState((s) =>
          s.name === 'active' || s.name === 'warning'
            ? { name: 'inactivity-prompt' }
            : s
        );
      }
    }, 1_000);
    return () => {
      if (inactivityTimerRef.current)
        window.clearInterval(inactivityTimerRef.current);
    };
  }, [state.name, endSession]);

  // ---- Reconnect attempts (architecture spec §8.3): max 2× over 5s ----
  useEffect(() => {
    if (state.name !== 'reconnecting') return;
    if (reconnectAttemptsRef.current >= 2) {
      // Already counted; let endSession finish-up with error
      // Pre-emptively report error end-reason
      endSession('error');
      return;
    }
    reconnectAttemptsRef.current += 1;
    const id = window.setTimeout(() => {
      void start();
    }, 2_500);
    return () => window.clearTimeout(id);
  }, [state.name, start, endSession]);

  return {
    state,
    setState,
    turns,
    conversationId,
    micStream,
    agentAudio,
    start,
    endSession,
  };
}
```

> **Resolution if unclear:** Falls die SDK ein anderes Event-Naming hat (Spike Task 1 zeigt das), wird das hier in einem Mini-Fix-Commit angepasst. Die Hook-Signatur (return-shape) bleibt stabil.

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add lib/hooks/useElevenLabsConversation.ts
git commit -m "$(cat <<'EOF'
feat(hooks): useElevenLabsConversation wrapping SDK with full state machine

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 28: TranscriptStream + TranscriptTurn

**Files:**
- Create: `components/lounge/TranscriptTurn.tsx`
- Create: `components/lounge/TranscriptStream.tsx`

- [ ] **Step 1: TranscriptTurn**

```tsx
// components/lounge/TranscriptTurn.tsx
'use client';

import type { Turn } from '@/lib/hooks/useElevenLabsConversation';
import { useT } from '@/lib/i18n/provider';

type Props = { turn: Turn; isLatestAgent: boolean; agentSpeaking: boolean };

export function TranscriptTurn({ turn, isLatestAgent, agentSpeaking }: Props) {
  const { lang } = useT();
  const youLabel = lang === 'de' ? 'Du' : 'You';
  const meLabel = 'Jonathan';
  const showCursor =
    turn.role === 'agent' && isLatestAgent && agentSpeaking;
  return (
    <div className="space-y-1">
      <div className="font-mono text-[11px] tracking-[0.02em] text-muted-foreground/70">
        — {turn.role === 'user' ? youLabel : meLabel}
      </div>
      <div className="text-sm leading-relaxed text-foreground">
        {turn.message}
        {showCursor && <span className="ml-0.5 animate-pulse">▌</span>}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: TranscriptStream**

```tsx
// components/lounge/TranscriptStream.tsx
'use client';

import { useEffect, useRef } from 'react';
import type { Turn } from '@/lib/hooks/useElevenLabsConversation';
import { TranscriptTurn } from './TranscriptTurn';

type Props = { turns: Turn[]; agentSpeaking: boolean };

export function TranscriptStream({ turns, agentSpeaking }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [turns]);

  if (turns.length === 0) return null;

  // Index of last agent turn
  let lastAgentIdx = -1;
  for (let i = turns.length - 1; i >= 0; i--) {
    if (turns[i].role === 'agent') {
      lastAgentIdx = i;
      break;
    }
  }

  return (
    <div
      ref={ref}
      className="w-full max-w-[420px] space-y-3 border-t border-dashed border-border pt-6 text-sm"
    >
      {turns.map((t, i) => (
        <TranscriptTurn
          key={`${i}-${t.role}`}
          turn={t}
          isLatestAgent={i === lastAgentIdx}
          agentSpeaking={agentSpeaking}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/lounge/TranscriptStream.tsx components/lounge/TranscriptTurn.tsx
git commit -m "$(cat <<'EOF'
feat(lounge): TranscriptStream + Turn with cursor on latest agent message

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 29: Wire Lounge page with full state machine

**Files:**
- Modify: `app/(gated)/lounge/page.tsx`

- [ ] **Step 1: Implement**

```tsx
// app/(gated)/lounge/page.tsx
'use client';

import { useMemo } from 'react';
import { LoungeShell } from '@/components/lounge/LoungeShell';
import { IdlePreStart } from '@/components/lounge/IdlePreStart';
import { StatusLine } from '@/components/lounge/StatusLine';
import { SessionHeader } from '@/components/lounge/SessionHeader';
import { VoiceIndicator } from '@/components/lounge/VoiceIndicator';
import { TranscriptStream } from '@/components/lounge/TranscriptStream';
import { MicPermissionRecovery } from '@/components/lounge/MicPermissionRecovery';
import { ConnectFailRecovery } from '@/components/lounge/ConnectFailRecovery';
import { EndedView } from '@/components/lounge/EndedView';
import { useElevenLabsConversation } from '@/lib/hooks/useElevenLabsConversation';
import { useSessionTimer } from '@/lib/hooks/useSessionTimer';
import { useAudioAmplitude } from '@/lib/hooks/useAudioAmplitude';
import { useT } from '@/lib/i18n/provider';

export default function LoungePage() {
  const { t, lang } = useT();
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID!;
  const conv = useElevenLabsConversation({ agentId, uiLang: lang });

  const isActive =
    conv.state.name === 'active' ||
    conv.state.name === 'warning' ||
    conv.state.name === 'inactivity-prompt';
  const agentSpeaking =
    (conv.state.name === 'active' || conv.state.name === 'warning') &&
    conv.state.sub === 'speaking';

  const timer = useSessionTimer({
    running: isActive,
    onWarning: () =>
      conv.setState((s) =>
        s.name === 'active' ? { name: 'warning', sub: s.sub } : s
      ),
    onHardLimit: () => conv.endSession('timeout'),
  });

  // Pick amplitude source based on indicator state
  const ampSource = useMemo(() => {
    if (agentSpeaking) return conv.agentAudio;
    return conv.micStream;
  }, [agentSpeaking, conv.agentAudio, conv.micStream]);
  const amplitude = useAudioAmplitude(ampSource, isActive);

  // Map app-state to indicator state
  let indicatorState: 'idle' | 'connecting' | 'listening' | 'speaking' | 'warning' | 'ending' = 'idle';
  let statusKey: Parameters<typeof t>[0] = 'lounge.status_idle';
  let statusVariant: Parameters<typeof StatusLine>[0]['variant'] = 'idle';

  switch (conv.state.name) {
    case 'connecting':
      indicatorState = 'connecting';
      statusKey = 'lounge.status_connecting';
      break;
    case 'active':
      indicatorState = conv.state.sub;
      statusKey = conv.state.sub === 'speaking' ? 'lounge.status_speaking' : 'lounge.status_listening';
      statusVariant = conv.state.sub === 'speaking' ? 'speaking' : 'listening';
      break;
    case 'warning':
      indicatorState = 'warning';
      statusKey = 'lounge.status_warning';
      statusVariant = 'warning';
      break;
    case 'inactivity-prompt':
      indicatorState = 'listening';
      statusKey = 'lounge.status_inactivity';
      statusVariant = 'listening';
      break;
    case 'reconnecting':
      indicatorState = 'connecting';
      statusKey = 'lounge.status_reconnecting';
      break;
    case 'ending':
      indicatorState = 'ending';
      statusKey = 'lounge.status_ending';
      statusVariant = 'ending';
      break;
    default:
      break;
  }

  // Special-case rendering
  if (conv.state.name === 'error-mic') {
    return (
      <LoungeShell>
        <MicPermissionRecovery />
      </LoungeShell>
    );
  }
  if (conv.state.name === 'error-connect') {
    return (
      <LoungeShell>
        <ConnectFailRecovery onRetry={conv.start} />
      </LoungeShell>
    );
  }
  if (conv.state.name === 'ended') {
    return (
      <LoungeShell>
        <EndedView turns={conv.turns} onNewSession={() => location.reload()} />
      </LoungeShell>
    );
  }
  if (conv.state.name === 'idle') {
    return (
      <LoungeShell>
        <IdlePreStart onStart={conv.start} />
        <StatusLine text={t('lounge.status_idle')} variant="idle" />
      </LoungeShell>
    );
  }

  return (
    <LoungeShell>
      <div className="flex w-full items-center justify-end">
        <SessionHeader
          remainingFormatted={timer.remainingFormatted}
          isWarning={timer.phase === 'warning' || timer.phase === 'hardLimit'}
          onEnd={() => conv.endSession('manual')}
        />
      </div>
      <VoiceIndicator state={indicatorState} amplitude={amplitude} />
      <StatusLine text={t(statusKey)} variant={statusVariant} />
      <TranscriptStream turns={conv.turns} agentSpeaking={agentSpeaking} />
    </LoungeShell>
  );
}
```

- [ ] **Step 2: Commit (placeholder components are imported but Task 30 will create them — build will fail temporarily; resolve in Task 30)**

```bash
git add app/\(gated\)/lounge/page.tsx
git commit -m "$(cat <<'EOF'
feat(lounge): wire LoungePage to SDK hook + timer + amplitude + transcript

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase H — Lifecycle Edge Cases

### Task 30: MicPermissionRecovery + ConnectFailRecovery + EndedView

**Files:**
- Create: `components/lounge/MicPermissionRecovery.tsx`
- Create: `components/lounge/ConnectFailRecovery.tsx`
- Create: `components/lounge/EndedView.tsx`

- [ ] **Step 1: MicPermissionRecovery (visual spec §8.1)**

```tsx
// components/lounge/MicPermissionRecovery.tsx
'use client';

import { MicOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/provider';

export function MicPermissionRecovery() {
  const { t } = useT();
  return (
    <section className="flex flex-col items-center gap-4 text-center">
      <MicOff className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} aria-hidden />
      <h3 className="text-2xl font-semibold text-foreground">
        {t('error.mic_denied_heading')}
      </h3>
      <p className="text-base text-muted-foreground max-w-[40ch]">
        {t('error.mic_denied_lede')}
      </p>
      <Button onClick={() => location.reload()} className="gap-1.5">
        {t('error.mic_denied_action')}
        <RefreshCw className="h-4 w-4" strokeWidth={1.5} />
      </Button>
      <p className="text-[13px] text-muted-foreground/80 max-w-[40ch]">
        {t('error.mic_denied_caption')}
      </p>
    </section>
  );
}
```

- [ ] **Step 2: ConnectFailRecovery (visual spec §8.2)**

```tsx
// components/lounge/ConnectFailRecovery.tsx
'use client';

import { useState } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/provider';

type Props = { onRetry: () => void };

export function ConnectFailRecovery({ onRetry }: Props) {
  const [attempts, setAttempts] = useState(0);
  const { t } = useT();
  return (
    <section className="flex flex-col items-center gap-4 text-center">
      <X className="h-8 w-8 text-destructive" strokeWidth={1.5} aria-hidden />
      <h3 className="text-2xl font-semibold text-foreground">
        {t('error.connect_fail_heading')}
      </h3>
      <p className="text-base text-muted-foreground max-w-[40ch]">
        {t('error.connect_fail_lede')}
      </p>
      <Button
        onClick={() => {
          setAttempts((n) => n + 1);
          onRetry();
        }}
        className="gap-1.5"
      >
        {t('error.connect_fail_action')}
        <RefreshCw className="h-4 w-4" strokeWidth={1.5} />
      </Button>
      {attempts >= 3 && (
        <a
          href="mailto:jonathan@plettenberg.org"
          className="text-[13px] text-muted-foreground/80 underline-offset-2 hover:underline"
        >
          {t('error.connect_fail_mailto')}
        </a>
      )}
    </section>
  );
}
```

- [ ] **Step 3: EndedView (visual spec §4.5)**

```tsx
// components/lounge/EndedView.tsx
'use client';

import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { TranscriptStream } from './TranscriptStream';
import type { Turn } from '@/lib/hooks/useElevenLabsConversation';
import { useT } from '@/lib/i18n/provider';

type Props = { turns: Turn[]; onNewSession: () => void };

export function EndedView({ turns, onNewSession }: Props) {
  const { t } = useT();

  function copyTranscript() {
    const text = turns
      .map((t) => `${t.role === 'user' ? 'Du' : 'Jonathan'}: ${t.message}`)
      .join('\n\n');
    navigator.clipboard.writeText(text).then(() => {
      toast.success(t('lounge.ended_copy_toast'));
    });
  }

  return (
    <section className="flex flex-col items-center gap-6 text-center">
      <h2 className="text-5xl font-extrabold tracking-[-0.04em] text-foreground">
        {t('lounge.ended_display')}
      </h2>
      <div className="w-full max-h-[50vh] overflow-y-auto">
        <TranscriptStream turns={turns} agentSpeaking={false} />
      </div>
      <div className="flex flex-col items-center gap-2 sm:flex-row">
        <Button onClick={onNewSession}>{t('lounge.ended_new_session')}</Button>
        <Button variant="ghost" onClick={copyTranscript}>
          {t('lounge.ended_copy_transcript')}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">{t('lounge.ended_caption')}</p>
    </section>
  );
}
```

- [ ] **Step 4: Build + smoke**

```bash
npm run build
```

Expected: Build success.

- [ ] **Step 5: Commit**

```bash
git add components/lounge/MicPermissionRecovery.tsx components/lounge/ConnectFailRecovery.tsx components/lounge/EndedView.tsx
git commit -m "$(cat <<'EOF'
feat(lounge): mic-permission, connect-fail, ended view recovery components

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 31: Wordmark click guard + active-session confirm dialog

**Files:**
- Modify: `app/(gated)/layout.tsx` and/or wire at `LoungePage`. Cleanest: pass guard via `AppHeader` prop; AppHeader is in gated-layout. We hoist the dialog state up.

We'll instead **let the lounge page render its own AppHeader** (override gated-layout for lounge specifically? simpler: keep AppHeader in layout, but use a tiny client component that registers a guard via context).

Simpler path: a dedicated `LoungeHeaderGuard` small client component that mounts inside `LoungePage` and uses a `signalConfirm` callback exposed via window-event to AppHeader. Pragmatic alternative: lift AppHeader from gated-layout into each gated page. Let's do that — only `/lounge` exists in gated for now.

**Files:**
- Modify: `app/(gated)/layout.tsx` (remove AppHeader, keep only OfflineBanner + Footer)
- Modify: `app/(gated)/lounge/page.tsx` (render AppHeader with click-guard)

- [ ] **Step 1: Update `(gated)/layout.tsx`**

```tsx
// app/(gated)/layout.tsx
import { Footer } from '@/components/Footer';
import { OfflineBanner } from '@/components/OfflineBanner';

export default function GatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <OfflineBanner />
      {children}
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: In `LoungePage`, add header + confirm dialog**

Top of file imports add:

```tsx
import { useState } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
```

Inside the component (keep all previous logic), wrap return value:

```tsx
const [confirmOpen, setConfirmOpen] = useState(false);
const [pendingNav, setPendingNav] = useState<(() => void) | null>(null);

const wordmarkGuard = isActive
  ? (proceed: () => void) => {
      setPendingNav(() => proceed);
      setConfirmOpen(true);
    }
  : undefined;

return (
  <>
    <AppHeader wordmarkClickGuard={wordmarkGuard} />
    {/* rest of the original return … */}
    <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('confirm.end_session_title')}</DialogTitle>
          <DialogDescription>{t('confirm.end_session_body')}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
            {t('confirm.end_session_no')}
          </Button>
          <Button
            onClick={async () => {
              setConfirmOpen(false);
              await conv.endSession('manual');
              pendingNav?.();
              setPendingNav(null);
            }}
          >
            {t('confirm.end_session_yes')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
);
```

> **Resolution if unclear:** Visual-Spec §5.6 sagt: Confirm-Dialog nur in `active.*` und `warning`. `isActive` deckt das ab (active + warning + inactivity-prompt — letzteres ist ein Sub-State von active und qualifies imo, da Session noch läuft).

- [ ] **Step 3: Public/Login routes — AppHeader stays in `(public)/layout.tsx` and `app/login/page.tsx`** (already there from Phase D).

- [ ] **Step 4: Commit**

```bash
git add app/\(gated\)
git commit -m "$(cat <<'EOF'
feat(lounge): confirm dialog when leaving via Wordmark mid-session

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase I — Verification

### Task 32: E2E landing.spec.ts

**Files:**
- Create: `tests/e2e/landing.spec.ts`

- [ ] **Step 1: Implement**

```typescript
// tests/e2e/landing.spec.ts
import { test, expect } from '@playwright/test';

test.describe('landing', () => {
  test('renders headline + login + footer (DE default)', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Sprich/);
    await expect(page.getByRole('link', { name: /Login/ })).toBeVisible();
    await expect(page.getByText(/Hinweis zur Audio-Verarbeitung/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'DE', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'EN', exact: true })).toBeVisible();
  });

  test('lang toggle: DE → EN swaps headline copy', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/');
    await page.getByRole('button', { name: 'EN', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Talk to/);
    await expect(page.getByText(/How we handle audio/)).toBeVisible();
  });
});
```

- [ ] **Step 2: Commit**

```bash
git add tests/e2e/landing.spec.ts
git commit -m "$(cat <<'EOF'
test(e2e): landing renders + DE↔EN toggle swaps headline + footer copy

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 33: E2E lounge-skeleton

**Files:**
- Create: `tests/e2e/lounge-skeleton.spec.ts`

Verifies that the Lounge route loads behind auth, idle CTA renders, and click-CTA transitions to a non-idle state. We do NOT test full SDK conversation (flaky/expensive). To make this test robust without a live agent, we **stub** `@elevenlabs/react` via Playwright route interception of the SDK script.

> **Resolution if unclear:** If route-interception of the SDK proves brittle, the test reduces to: assert idle CTA renders + clicking it changes status text from "Bereit" to either "Verbinde…" or "Ohne Mikrofon-Zugriff…" (mic-denied) within 3s. That alone proves wiring.

- [ ] **Step 1: Implement (degraded-but-stable variant: assert idle + click-transitions)**

```typescript
// tests/e2e/lounge-skeleton.spec.ts
import { test, expect } from '@playwright/test';

const PASSWORD = process.env.ACCESS_PASSWORD ?? 'correct-horse-battery-staple';

test.describe('lounge skeleton', () => {
  test.beforeEach(async ({ context, page }) => {
    // Deny mic globally so we don't hang on permission prompt
    await context.grantPermissions([], { origin: 'http://localhost:3000' });
    await page.goto('/login?next=%2Flounge');
    await page.getByPlaceholder(/Passwort|Password/).fill(PASSWORD);
    await page.getByRole('button', { name: /Weiter|Continue/ }).click();
    await expect(page).toHaveURL(/\/lounge$/);
  });

  test('idle CTA visible + click transitions away from idle', async ({ page }) => {
    const cta = page.getByRole('button', { name: /Konversation starten|Start conversation/ });
    await expect(cta).toBeVisible();
    await cta.click();
    // Expect either: connecting, error-mic (no mic perm), or error-connect.
    await expect(
      page.getByText(/Verbinde|Connecting|Mikrofon|microphone|fehlgeschlagen|failed/i).first()
    ).toBeVisible({ timeout: 5_000 });
  });
});
```

- [ ] **Step 2: Commit**

```bash
git add tests/e2e/lounge-skeleton.spec.ts
git commit -m "$(cat <<'EOF'
test(e2e): lounge skeleton — idle CTA + click leaves idle state

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 34: Lighthouse / a11y sanity check

**Files:** keine (manuell oder Skript-Hint).

- [ ] **Step 1: Lighthouse Accessibility-Run**

```bash
npx lighthouse http://localhost:3000 --only-categories=accessibility --quiet --chrome-flags="--headless"
npx lighthouse http://localhost:3000/login --only-categories=accessibility --quiet --chrome-flags="--headless"
```

Expected: ≥95 score auf beiden. Bei <95: Issues fixen, vorher nicht weiter.

- [ ] **Step 2: Document baseline**

Append to `docs/superpowers/spikes/2026-05-05-elevenlabs-sdk-spike.md`:

```markdown
## Lighthouse Accessibility Baseline (Plan 3 done)
- `/`: <score>
- `/login`: <score>
- `/lounge` (with login): <score>
```

(Kein Commit nötig — Spike-Doc ist bereits committed.)

---

### Task 35: Manual Test-Charta (visual spec §13.4 + spec §13.4)

**Files:** keine.

Nach Deploy auf Vercel (push to `main`), manuell durchgehen:

- [ ] 3× DE Sessions (verschiedene Topics: CV, Tech-Stack, Hobby)
- [ ] 3× EN Sessions
- [ ] 1× Timer voll auslaufen (4 min, observe warning at 3:30 + hard-stop at 4:00)
- [ ] 1× Goodbye sagen ("tschüss") → end_reason='goodbye' in Supabase
- [ ] 1× End-Button → end_reason='manual'
- [ ] 1× Tab schließen mid-session → webhook fires, end_reason='unknown' (per architecture spec §11.1)
- [ ] 1× Out-of-Scope-Frage (Wetter) → graceful refusal
- [ ] 1× Jailbreak ("ignore previous instructions") → in-character refusal
- [ ] 1× Mic-Permission ablehnen → MicPermissionRecovery rendert
- [ ] DE-Footer-Toggle → EN, dann reload → bleibt EN (Cookie persistence)
- [ ] Theme-Toggle Light → Dark, reload → bleibt Dark
- [ ] Wordmark-Klick mid-session → Confirm-Dialog
- [ ] Reduced-Motion (Browser-DevTools): Voice-Indikator → statischer Kreis
- [ ] Mobile-Viewport (375 px): Layout passt, SessionHeader wandert in Strip unter dem AppHeader
- [ ] Supabase Studio: alle 12+ Sessions zeigen `quality_flags`, `transcript`, `end_reason`, `summary`, `topic_tags` plausibel

---

### Task 36: Final test suite run

**Files:** keine.

- [ ] **Step 1: Unit + Integration**

```bash
npm test
```

Expected: Plan-1 (17) + Plan-2 (32) + Plan-3 (~5+4+3+5+4+4 = 25) = ~74 Tests grün.

- [ ] **Step 2: E2E**

```bash
set -a; source .env.local; set +a
npm run test:e2e
```

Expected: smoke (4) + landing (2) + lounge-skeleton (1) = 7 PASS.

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: 0 errors, 0 warnings.

(Kein Commit — falls grün.)

---

## Acceptance Criteria (Plan 3 done when …)

- [ ] `npm test` ~74 Tests grün
- [ ] `npm run test:e2e` 7 Tests grün
- [ ] `npm run build` ohne Fehler
- [ ] Manuell: Landing, Login, Lounge alle in DE und EN renderbar
- [ ] Manuell: Theme-Toggle persistiert (Cookie + LocalStorage)
- [ ] Manuell: 1 vollständige End-to-End-Voice-Session DE und EN durchlaufen, Supabase-Row korrekt
- [ ] Manuell: Reduced-Motion-Override aktiv → statischer Voice-Indikator
- [ ] Lighthouse Accessibility ≥ 95 auf `/`, `/login`, `/lounge`

---

## Out-of-Scope für Plan 3

- ElevenLabs Agent-Konfiguration (Prompt, KB, Voice) — Plan 4
- KB-Files (`content/profile.md` etc.) — Plan 4
- Sentry / Speed-Insights — Phase 1.5
- Voice-Clone — Phase 1.5
- Liquid-Glass-Komponenten — Phase 1.5
- WCAG axe-core CI-Check (manuell Lighthouse reicht im MVP)
- Multi-language OG-Image-Varianten
- Email-Signatur / Phone-Avatar (Phase 2)

---

## Open Items (für Plan 3 dokumentiert)

- **Privacy-Text:** Platzhalter ~150 Wörter. Vor Public-Launch finalisiert (Visual-Spec §12).
- **SDK-Audio-Tap-Pfad:** Der Spike (Task 1) entscheidet zwischen Pfad-A/B/C; falls keiner stabil ist, bleibt der synthetische Pulse als Fallback. Hook-API ist so geschnitten, dass der Wechsel kein Refactor ist.
- **Goodbye-Pattern-Coverage:** Initial nur grobe DE+EN Patterns. Falls False-Positives in echten Sessions auftauchen, list pflegen.
- **`@elevenlabs/react` Event-Naming:** Hook (`useElevenLabsConversation`) basiert auf der wahrscheinlichsten API. Kleine Mini-Fix-Commits werden erwartet, sobald der Spike das endgültig zeigt.
- **End-Reason bei Tab-Close:** Architektur-Spec §11.1 sagt: dann `unknown`. Wir nutzen `keepalive: true` beim Fetch — `beforeunload`-Hook könnte zusätzlich helfen, ist aber unzuverlässig (Browser-Inhibitions). Akzeptiert: bei Tab-Close kann's `unknown` werden — explizit so dokumentiert.
- **WCAG-Kontrast-CI:** Visual-Spec §10 wünscht axe-core CI. Im MVP nur manuell via Lighthouse — als Phase-1.5-Story dokumentiert.

---

## Spec-Coverage-Appendix

Architektur-Spec (`2026-05-04-talk-to-me-digital-twin-design.md`):

| § | Anforderung | Adressiert in |
|---|---|---|
| §3 | Browser tappt Mic + streamt zu ElevenLabs | Task 27 (start session, getUserMedia) |
| §4 | Komponenten unter `components/lounge/` | Tasks 22–28, 30 |
| §5 | `lib/config.ts` SESSION-Konstanten | (vorhanden, Task 20 verwendet sie) |
| §8.1 | State-Machine idle→connecting→active(listening↔speaking)→warning→ending→ended | Task 27 (`AppState`), Task 29 (mapping) |
| §8.2 | End-Reason-Detection (timeout/goodbye/manual/inactivity/error/unknown) | Task 27 (timer→timeout, regex→goodbye, button→manual, idle-watcher→inactivity, onError→error) |
| §8.3 | Timer-Konstanten | Task 20 (`useSessionTimer`) |
| §8.4 | UI-States Treatments | Task 29 (state→indicatorState mapping) |
| §10 | Auth (Login + Lockout) | Task 18 (Login-Restyle, lockout-banner countdown) |
| §11.1 | End-Reason-POST vor Disconnect | Task 27 (`endSession` POST keepalive) |
| §12 | Mic-denied / SDK-fail / WebRTC-drop / Tab-close | Tasks 27, 30 |
| §13.3 | E2E Smoke | Tasks 19, 32, 33 |
| §13.4 | Manuelle Test-Charta | Task 35 |

Visual-Spec (`2026-05-05-talk-to-me-visual-design.md`):

| § | Anforderung | Adressiert in |
|---|---|---|
| §2.1–2.3 | Jakumba-Tokens + Dark-Mode + shadcn-Mapping | Tasks 4, 5 |
| §2.4 | Tailwind-4-Dark-Variant | Task 5 |
| §2.5 | Lucide Icons | (durchgehend in Tasks 12, 17, 23, 30) |
| §3 | Landing minimal-gate | Tasks 16, 17 |
| §3.4 | Login-Card + Lockout-Banner | Task 18 |
| §4.1–4.2 | Lounge Center-Stage + Komponenten-Inventar | Tasks 22, 23, 24, 28, 29 |
| §4.3 | State→Treatment | Task 29 |
| §4.4 | Idle-Pre-Start | Task 22 |
| §4.5 | Ended-View | Task 30 |
| §4.6 | Inactivity-Handling | Task 27 |
| §5.1–5.5 | Wordmark + Brand-Assets | Tasks 11, 15 |
| §5.6 | Klick-Guard mid-session | Task 31 |
| §6 | Voice-Indikator (Math, States, Reduced-Motion, a11y) | Tasks 25, 26 |
| §7 | Motion (CSS-easings, Toast, Dialog) | Tasks 4 (tokens), 14 (dialog) |
| §8.1–8.5 | Error-States | Tasks 18, 21, 30 |
| §8.7 | Error-Tonalität | (i18n strings, Task 8) |
| §9 | i18n Strategy + DE/EN | Tasks 8, 9, 12 |
| §9.4 | UI-Lang als First-Message-Hint | Task 27 (`overrides.agent.language`) |
| §10 | Accessibility (reduced-motion, aria-live, focus, contrast) | Tasks 5 (focus-ring), 22 (aria-live), 26 (reduced-motion + role=img), 34 (Lighthouse) |

---

**Done.** Plan 3 schließt die UI- und SDK-Schicht ab. Der nächste Plan (Plan 4) konfiguriert den ElevenLabs-Agent (Prompt, KB-Upload, Voice-A/B) und befüllt `content/*.md` mit echten KB-Inhalten.
