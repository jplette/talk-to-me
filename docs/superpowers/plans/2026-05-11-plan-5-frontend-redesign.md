# Plan 5 — Frontend Redesign: Warm Terminal

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic Jakumba/Inter design with a distinctive "Warm Terminal" aesthetic — full dark, Space Grotesk headlines, DM Mono labels — and fix three UX bugs (sticky timer, footer layout, missing Impressum page).

**Architecture:** All changes are purely visual — no business logic changes. New font variables are added to CSS tokens, dark theme becomes the default, and the lounge active state gets a viewport-locked flex layout so the timer and footer stay visible while the transcript scrolls.

**Tech Stack:** Next.js 16 App Router, Tailwind CSS 4, `next/font/google`, CSS custom properties, Vitest

---

## File Map

| File | Change |
|---|---|
| `lib/theme/cookie.ts` | Default fallback → `'dark'` |
| `tests/unit/theme/cookie.test.ts` | Update expectation: undefined → `'dark'` |
| `app/layout.tsx` | Replace Inter+JetBrains_Mono with Space_Grotesk+DM_Mono+DM_Sans; body `h-full` |
| `app/styles/tokens.css` | Add `--font-display`, `--font-body`; update `--font-sans` alias |
| `app/styles/tokens.dark.css` | Warm Terminal palette (`#0F1117` bg, etc.) |
| `app/globals.css` | Add `--font-display`/`--font-body` to `@theme inline`; update `font-family` |
| `components/Wordmark.tsx` | `jp.talk-to-me` in DM Mono with flame dot |
| `app/(public)/page.tsx` | Full Warm Terminal hero rewrite |
| `app/(gated)/layout.tsx` | Wrap in `flex flex-col flex-1 min-h-0` |
| `components/lounge/SessionHeader.tsx` | `sticky top-14 z-40`, full-width bar style |
| `app/(gated)/lounge/page.tsx` | Active state: remove LoungeShell, use flex-1 scroll layout |
| `components/lounge/IdlePreStart.tsx` | Warm Terminal idle redesign |
| `app/(public)/imprint/page.tsx` | New — Impressum §5 TMG |

---

## Task 1: Dark as Default

**Files:**
- Modify: `lib/theme/cookie.ts`
- Modify: `tests/unit/theme/cookie.test.ts`

- [ ] **Step 1: Update the test expectation first**

The existing test `'returns null for missing/invalid'` asserts `readThemeCookie(undefined) === null`. Change it to assert `'dark'`:

```ts
// tests/unit/theme/cookie.test.ts
it('returns dark for missing/invalid', () => {
  expect(readThemeCookie(undefined)).toBe('dark');
  expect(readThemeCookie('')).toBe('dark');
  expect(readThemeCookie('greenpink')).toBe('dark');
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/unit/theme/cookie.test.ts
```

Expected: FAIL — `expected null to be 'dark'`

- [ ] **Step 3: Update `readThemeCookie` to return `'dark'` as fallback**

```ts
// lib/theme/cookie.ts
export type Theme = 'light' | 'dark';

export function readThemeCookie(value: string | undefined): Theme {
  if (value === 'light' || value === 'dark') return value;
  return 'dark';
}

export function serializeThemeCookie(theme: Theme): string {
  return `tt_theme=${theme}; path=/; max-age=31536000; samesite=lax`;
}
```

Return type changes from `Theme | null` to `Theme`. The call site in `app/layout.tsx` uses `theme ?? undefined` — that can now simplify to just `theme`.

- [ ] **Step 4: Update the call site in `app/layout.tsx`**

Change only the two affected lines:

```tsx
// app/layout.tsx — change these two lines only
const theme = readThemeCookie(cookieStore.get('tt_theme')?.value);
// ...in JSX:
data-theme={theme}   // was: data-theme={theme ?? undefined}
```

- [ ] **Step 5: Run tests**

```bash
npx vitest run tests/unit/theme/cookie.test.ts
```

Expected: all 3 tests PASS

- [ ] **Step 6: Commit**

```bash
git add lib/theme/cookie.ts tests/unit/theme/cookie.test.ts app/layout.tsx
git commit -m "feat(theme): dark as default when no cookie is set"
```

---

## Task 2: Font Stack — Space Grotesk + DM Mono + DM Sans

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/styles/tokens.css`
- Modify: `app/globals.css`

- [ ] **Step 1: Replace font imports in `app/layout.tsx`**

Full file replacement (builds on Task 1's `data-theme` change):

```tsx
// app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, DM_Mono, DM_Sans } from 'next/font/google';
import { cookies, headers } from 'next/headers';
import { Toaster } from 'sonner';
import { detectLanguage } from '@/lib/i18n/detect';
import { I18nProvider } from '@/lib/i18n/provider';
import { ThemeProvider } from '@/lib/theme/provider';
import { readThemeCookie } from '@/lib/theme/cookie';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const dmMono = DM_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
});

const dmSans = DM_Sans({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['300', '400', '500'],
});

export const metadata: Metadata = {
  title: 'Jonathan Plettenberg — talk to me',
  description:
    'Eine kuratierte Voice-Konversation mit Jonathans digitalem Zwilling.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F0F0F3' },
    { media: '(prefers-color-scheme: dark)',  color: '#0F1117' },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const acceptLang = headerStore.get('accept-language');
  const langCookie = cookieStore.get('tt_lang')?.value;
  const lang =
    langCookie === 'de' || langCookie === 'en'
      ? langCookie
      : detectLanguage(acceptLang);
  const theme = readThemeCookie(cookieStore.get('tt_theme')?.value);

  return (
    <html
      lang={lang}
      data-theme={theme}
      className={`${spaceGrotesk.variable} ${dmMono.variable} ${dmSans.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="h-full flex flex-col bg-background text-foreground">
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

`body` changes from `min-h-full` to `h-full` — this is required for the lounge layout fix in Task 6.

- [ ] **Step 2: Update font vars in `app/styles/tokens.css`**

Replace only the `/* Type */` block (leave everything else unchanged):

```css
  /* Type */
  --font-display: 'Space Grotesk', system-ui, sans-serif;
  --font-body:    'DM Sans', system-ui, sans-serif;
  --font-mono:    'DM Mono', ui-monospace, monospace;
  /* Backward-compat alias used by globals.css @theme inline */
  --font-sans:    var(--font-body);
```

- [ ] **Step 3: Update `app/globals.css` — `@theme inline` and `html, body`**

In the `@theme inline {}` block, add `--font-display` and `--font-body` entries after the existing font lines:

```css
/* Inside @theme inline {} — add these two lines after --font-mono: */
  --font-display: var(--font-display);
  --font-body:    var(--font-body);
```

Update the `html, body` rule's `font-family`:

```css
html, body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
```

- [ ] **Step 4: Verify build compiles without errors**

```bash
npx next build 2>&1 | tail -5
```

Expected: exits 0, no font-related errors.

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx app/styles/tokens.css app/globals.css
git commit -m "feat(fonts): replace Inter+JetBrains with Space Grotesk+DM Mono+DM Sans"
```

---

## Task 3: Warm Terminal Color Tokens

**Files:**
- Modify: `app/styles/tokens.dark.css`

- [ ] **Step 1: Replace dark tokens with Warm Terminal palette**

Full replacement of `app/styles/tokens.dark.css`:

```css
/* app/styles/tokens.dark.css — Warm Terminal dark tokens */

[data-theme='dark'] {
  --jk-bg:        #0F1117;
  --jk-bg-elev-1: #161820;
  --jk-bg-elev-2: #1D1F2B;

  --fg-1: #F0ECE6;
  --fg-2: rgba(240,236,230,0.55);
  --fg-3: rgba(240,236,230,0.25);

  --line:        rgba(255,255,255,0.07);
  --line-strong: rgba(255,255,255,0.12);

  --jk-flame-deep: #EF8354;

  /* Status semantic */
  --warn: #EF8354;
  --err:  #EF6E55;
  --ok:   #2F7D5B;

  /* Shadows */
  --sh-0: 0 0 0 1px rgba(255,255,255,0.06);
  --sh-1: 0 1px 2px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06);
  --sh-2: 0 2px 8px rgba(0,0,0,0.55), 0 1px 2px rgba(0,0,0,0.4);
  --sh-3: 0 8px 24px rgba(0,0,0,0.65), 0 2px 6px rgba(0,0,0,0.5);
}
```

- [ ] **Step 2: Verify app starts without CSS errors**

```bash
npx next dev --turbopack &
sleep 4 && curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
kill %1
```

Expected: `200`

- [ ] **Step 3: Commit**

```bash
git add app/styles/tokens.dark.css
git commit -m "feat(tokens): warm terminal dark palette (#0F1117, flame accents)"
```

---

## Task 4: Wordmark Redesign

**Files:**
- Modify: `components/Wordmark.tsx`

- [ ] **Step 1: Rewrite `Wordmark.tsx`**

```tsx
// components/Wordmark.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type MouseEvent } from 'react';

type Props = {
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
      className="focus-visible:outline-none"
      aria-label="Jonathan Plettenberg — start"
    >
      <span className="font-mono text-xs tracking-wide text-muted-foreground">
        jp<span className="text-[var(--jk-flame)]">.</span>talk-to-me
      </span>
    </Link>
  );
}
```

- [ ] **Step 2: Visual check**

```bash
npx next dev --turbopack
```

Open http://localhost:3000 — header shows `jp.talk-to-me` with an orange dot, no `JP` box or "Jonathan Plettenberg" text.

- [ ] **Step 3: Commit**

```bash
git add components/Wordmark.tsx
git commit -m "feat(wordmark): jp.talk-to-me in DM Mono with flame dot"
```

---

## Task 5: Landing Page — Warm Terminal Hero

**Files:**
- Modify: `app/(public)/page.tsx`

- [ ] **Step 1: Rewrite `app/(public)/page.tsx`**

```tsx
// app/(public)/page.tsx
'use client';

import Link from 'next/link';
import { useT } from '@/lib/i18n/provider';

export default function LandingPage() {
  const { t, lang } = useT();

  return (
    <section className="relative mx-auto flex w-full max-w-[560px] flex-col items-start gap-5 px-6 py-16 md:py-[22vh]">
      {/* Radial glow top-right */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(239,131,84,0.10) 0%, transparent 65%)',
        }}
      />

      {/* Terminal prompt */}
      <p
        className="font-mono text-[11px] tracking-wider"
        style={{ color: 'rgba(239,131,84,0.5)' }}
        aria-hidden="true"
      >
        $ whoami → jonathan_plettenberg
      </p>

      {/* Headline — hardcoded because the italic/colour treatment is presentational */}
      <h1
        className="text-[40px] font-bold leading-[1.05] tracking-[-0.03em] text-foreground md:text-5xl lg:text-[52px]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Senior<br />Engineer.<br />
        {lang === 'en' ? 'Say ' : 'Sag '}
        <em
          className="not-italic"
          style={{ color: 'var(--jk-flame)', fontStyle: 'italic' }}
        >
          {lang === 'en' ? 'Hello.' : 'Hallo.'}
        </em>
      </h1>

      {/* Lede — still from i18n */}
      <p
        className="text-sm font-light leading-relaxed max-w-[36ch]"
        style={{ color: 'rgba(240,236,230,0.45)' }}
      >
        {t('landing.lede')}
      </p>

      {/* Shell CTA */}
      <Link
        href="/login"
        className="mt-1 inline-flex items-center gap-2 rounded-[5px] border px-4 py-2.5 font-mono text-[11px] uppercase tracking-widest transition-colors hover:bg-[rgba(239,131,84,0.16)]"
        style={{
          background: 'rgba(239,131,84,0.10)',
          borderColor: 'rgba(239,131,84,0.28)',
          color: 'var(--jk-flame)',
        }}
      >
        ./connect.sh <span aria-hidden="true">→</span>
      </Link>
    </section>
  );
}
```

- [ ] **Step 2: Visual check at http://localhost:3000**

Verify: dark background, DM Mono prompt line in dim orange, Space Grotesk bold headline, "Hallo." in flame orange italic, shell CTA button with orange border, radial glow top-right.

- [ ] **Step 3: Check EN locale**

Add `?lang=en` query or switch the ThemeToggle to English — headline should read "Say Hello."

- [ ] **Step 4: Commit**

```bash
git add "app/(public)/page.tsx"
git commit -m "feat(landing): warm terminal hero with Space Grotesk + shell CTA"
```

---

## Task 6: Lounge Active Layout Fix (Sticky Timer + Footer Always Visible)

**Files:**
- Modify: `app/(gated)/layout.tsx`
- Modify: `components/lounge/SessionHeader.tsx`
- Modify: `app/(gated)/lounge/page.tsx`

**Context:** Body is now `h-full flex flex-col` (Task 2). The gated layout needs a flex wrapper so its children fill the available viewport height. The active lounge content area needs `flex-1 overflow-y-auto` to scroll internally. The SessionHeader becomes a sticky bar just below the AppHeader (`top-14` = 56px).

- [ ] **Step 1: Wrap gated layout in a flex container**

```tsx
// app/(gated)/layout.tsx
import { Footer } from '@/components/Footer';
import { OfflineBanner } from '@/components/OfflineBanner';

export default function GatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <OfflineBanner />
      {children}
      <Footer />
    </div>
  );
}
```

`min-h-0` prevents the div from growing beyond the viewport height (flex children default to `min-height: auto`).

- [ ] **Step 2: Update `SessionHeader` to a sticky full-width bar**

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

export function SessionHeader({ remainingFormatted, isWarning, onEnd }: Props) {
  return (
    <div
      className={cn(
        'sticky top-14 z-40 flex w-full flex-shrink-0 items-center justify-between',
        'border-b border-border px-6 py-2',
        'bg-background/90 backdrop-blur-sm md:px-10',
      )}
    >
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

`top-14` = 56px = the height of AppHeader (`h-14`).

- [ ] **Step 3: Restructure the active state branch in `lounge/page.tsx`**

Find the final `else` branch (active/warning/inactivity-prompt state). Replace the `<LoungeShell>` wrapper with a flex structure:

```tsx
// app/(gated)/lounge/page.tsx — replace only the active state branch

// OLD (the last branch before the closing </> and <Dialog>):
) : (
  <LoungeShell>
    <div className="flex w-full items-center justify-end">
      <SessionHeader
        remainingFormatted={timer.remainingFormatted}
        isWarning={timer.phase === 'warning' || timer.phase === 'hardLimit'}
        onEnd={() => { void conv.endSession('manual'); }}
      />
    </div>
    <VoiceIndicator state={indicatorState} amplitude={amplitude} />
    <StatusLine text={t(statusKey)} variant={statusVariant} />
    <TranscriptStream turns={conv.turns} agentSpeaking={agentSpeaking} />
  </LoungeShell>
)

// NEW:
) : (
  <>
    <SessionHeader
      remainingFormatted={timer.remainingFormatted}
      isWarning={timer.phase === 'warning' || timer.phase === 'hardLimit'}
      onEnd={() => { void conv.endSession('manual'); }}
    />
    <div className="flex flex-1 flex-col items-center gap-6 overflow-y-auto px-6 py-6 min-h-0 md:px-10">
      <VoiceIndicator state={indicatorState} amplitude={amplitude} />
      <StatusLine text={t(statusKey)} variant={statusVariant} />
      <TranscriptStream turns={conv.turns} agentSpeaking={agentSpeaking} />
    </div>
  </>
)
```

- [ ] **Step 4: Visual check — active lounge layout**

```bash
npx next dev --turbopack
```

1. Log in and start a session.
2. Let the transcript fill the screen (or temporarily add dummy turns to TranscriptStream).
3. Verify: SessionHeader (timer + end button) stays pinned at top during scroll.
4. Verify: Footer stays visible at the bottom of the viewport.
5. Verify: Body of the screen scrolls independently between header and footer.

- [ ] **Step 5: Commit**

```bash
git add "app/(gated)/layout.tsx" components/lounge/SessionHeader.tsx "app/(gated)/lounge/page.tsx"
git commit -m "fix(lounge): sticky session bar and always-visible footer for active call"
```

---

## Task 7: Lounge Idle Redesign

**Files:**
- Modify: `components/lounge/IdlePreStart.tsx`

- [ ] **Step 1: Rewrite `IdlePreStart.tsx`**

```tsx
// components/lounge/IdlePreStart.tsx
'use client';

import { useT } from '@/lib/i18n/provider';

type Props = { onStart: () => void };

export function IdlePreStart({ onStart }: Props) {
  const { t } = useT();
  return (
    <section className="flex flex-col items-center gap-6 text-center">
      {/* Ring */}
      <div
        className="relative flex h-20 w-20 items-center justify-center rounded-full"
        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
        aria-hidden="true"
      >
        <div
          className="absolute rounded-full"
          style={{
            inset: '-10px',
            border: '1px solid rgba(255,255,255,0.04)',
          }}
        />
        <div
          className="flex h-11 w-11 items-center justify-center rounded-full text-lg"
          style={{
            background: 'rgba(239,131,84,0.08)',
            border: '1px solid rgba(239,131,84,0.20)',
          }}
        >
          🎙
        </div>
      </div>

      {/* Text */}
      <div className="flex flex-col gap-1.5">
        <h2
          className="text-xl font-semibold tracking-tight text-foreground"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {t('lounge.idle_heading')}
        </h2>
        <p
          className="text-sm max-w-[30ch]"
          style={{ color: 'rgba(240,236,230,0.38)' }}
        >
          {t('lounge.idle_lede')}
        </p>
      </div>

      {/* Shell CTA */}
      <button
        onClick={onStart}
        className="inline-flex items-center gap-2 rounded-[5px] border px-5 py-2.5 font-mono text-[11px] uppercase tracking-widest transition-colors hover:bg-[rgba(239,131,84,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--jk-flame)]"
        style={{
          background: 'rgba(239,131,84,0.10)',
          borderColor: 'rgba(239,131,84,0.25)',
          color: 'var(--jk-flame)',
        }}
      >
        ./start-session.sh <span aria-hidden="true">↵</span>
      </button>

      <p
        className="font-mono text-[10px] tracking-wide"
        style={{ color: 'rgba(240,236,230,0.18)' }}
      >
        {t('lounge.idle_caption')}
      </p>
    </section>
  );
}
```

- [ ] **Step 2: Visual check — lounge idle state**

Open http://localhost:3000/login, log in. Idle state shows: outer ring, inner ring, mic emoji, heading, shell CTA `./start-session.sh ↵`, caption in dim mono.

- [ ] **Step 3: Commit**

```bash
git add components/lounge/IdlePreStart.tsx
git commit -m "feat(lounge): warm terminal idle redesign with shell CTA"
```

---

## Task 8: Imprint Page

**Files:**
- Create: `app/(public)/imprint/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// app/(public)/imprint/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Impressum — Jonathan Plettenberg',
};

export default function ImprintPage() {
  return (
    <main className="mx-auto max-w-[560px] px-6 py-16 text-sm leading-relaxed">
      <h1
        className="mb-8 text-2xl font-bold tracking-tight text-foreground"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Impressum
      </h1>

      <section className="space-y-1 text-muted-foreground">
        <p className="font-medium text-foreground">Jonathan Plettenberg</p>
        <p>Mahalia-Jackson-Str. 27</p>
        <p>64285 Darmstadt</p>
        <p>
          <a
            href="mailto:jonathan@plettenberg.org"
            className="text-[var(--jk-flame)] hover:underline"
          >
            jonathan@plettenberg.org
          </a>
        </p>
      </section>

      <section className="mt-10 space-y-3 text-muted-foreground">
        <h2 className="font-mono text-[11px] uppercase tracking-widest text-foreground">
          Haftungsausschluss
        </h2>
        <p>
          Die Inhalte dieser Website wurden mit größtmöglicher Sorgfalt erstellt.
          Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte kann
          jedoch keine Gewähr übernommen werden.
        </p>
        <p>
          Als Diensteanbieter bin ich gemäß § 7 Abs. 1 TMG für eigene Inhalte auf
          diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis
          10 TMG bin ich als Diensteanbieter jedoch nicht verpflichtet, übermittelte
          oder gespeicherte fremde Informationen zu überwachen.
        </p>
      </section>

      <section className="mt-10 space-y-3 text-muted-foreground">
        <h2 className="font-mono text-[11px] uppercase tracking-widest text-foreground">
          Datenschutz
        </h2>
        <p>
          Die Nutzung dieser Website ist ohne Angabe personenbezogener Daten möglich.
          Im Rahmen einer Sprachkonversation können Name und Unternehmen freiwillig
          genannt werden und werden temporär verarbeitet. Weitere Informationen
          entnehmen Sie der Datenschutzerklärung.
        </p>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Verify the Footer link already points to `/imprint`**

```bash
grep -n "imprint" /Users/Jojo/Documents/Develop/Projects/talk-to-me/components/Footer.tsx
```

Expected: a line containing `href="/imprint"` — no Footer change needed.

- [ ] **Step 3: Visual check**

Open http://localhost:3000/imprint — page renders with Impressum content, nav and footer visible, `/imprint` link in footer is active.

- [ ] **Step 4: Commit**

```bash
git add "app/(public)/imprint/page.tsx"
git commit -m "feat: add /imprint page (§5 TMG)"
```

---

## Task 9: Final QA + Build

- [ ] **Step 1: Run unit tests**

```bash
npx vitest run
```

Expected: all tests PASS (including the updated cookie test from Task 1).

- [ ] **Step 2: Production build**

```bash
npx next build
```

Expected: exits 0, no TypeScript errors.

- [ ] **Step 3: Manual visual checklist**

| Screen | Check |
|---|---|
| Landing (dark) | `#0F1117` bg, Space Grotesk headline, prompt line, shell CTA, glow |
| Landing (light) | ThemeToggle → light: readable, no broken layout |
| Lounge idle | Ring + mic, `./start-session.sh ↵` button visible |
| Lounge active | SessionBar sticky at top, transcript scrolls, footer always visible |
| Imprint | Renders at `/imprint`, address correct, footer link active |

- [ ] **Step 4: Push**

```bash
git push origin main
```

---

## Self-Review Notes

- **Task 6:** `min-h-0` on the gated layout wrapper is required — flex children default to `min-height: auto` and would overflow the viewport without it.
- **Task 2:** `body` changes from `min-h-full` to `h-full`. This is load-bearing for Task 6 — the body must be exactly viewport height, not "at least" viewport height.
- **Task 5:** `section` has no `overflow-hidden` so the glow can bleed slightly past its container — visually desired. If it causes scroll issues, add `overflow: clip` (not `hidden`) to avoid triggering scroll context.
- **Wordmark (Task 4):** `aria-label="Jonathan Plettenberg — start"` on the Link is preserved — no a11y regression.
- **Footer link (Task 8):** `Footer.tsx` already has `href="/imprint"` — confirmed via grep in Step 2. No Footer change needed.
- **TranscriptStream auto-scroll:** Uses `el.scrollTop = el.scrollHeight` in a `useEffect`. After Task 6 the scroll container is the `div.overflow-y-auto` in `lounge/page.tsx`, not the page. `TranscriptStream` uses its own `ref` for scrolling — this continues to work because `ref.current.scrollTop` sets scroll on the element that holds `TranscriptStream`. Verify visually in Task 6 Step 4.
