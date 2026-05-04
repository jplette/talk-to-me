# Talk-To-Me — Plan 1: Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Liefere ein gegated Next.js-Skelett: Public-Landing-Page, Shared-Password-Login, geschütztes Lounge-Placeholder, Supabase-Schema deployed, Vercel-Preview erreichbar.

**Architecture:** Next.js 15 App Router auf Vercel. Auth via Shared-Password (server-side ENV) → signiertes JWT-Cookie (`jose`). Middleware schützt `/(gated)/*`. Supabase-Schema enthält `sessions` und `pending_end_reasons` (für Plan 2 vorbereitet). Brute-Force-Lockout in-memory pro Edge-Worker (pragmatisch).

**Tech Stack:** Next.js 15, React 19, TypeScript 5, Tailwind CSS 4, `jose` (JWT), `@supabase/supabase-js`, Vitest + Playwright.

**Spec-Referenz:** `docs/superpowers/specs/2026-05-04-talk-to-me-digital-twin-design.md` §4, §5, §10, §13.

**Voraussetzungen vor Task 1:**
- Node.js ≥ 20 installiert
- `npm` (oder `pnpm`/`yarn`, der Plan nutzt `npm`)
- GitHub-Account mit Zugriff auf das Repo
- Supabase-Account
- Vercel-Account

---

## File Structure

Plan 1 berührt diese Dateien (alles unterhalb `/Users/Jojo/Documents/Develop/Projects/talk-to-me/`):

```
package.json                            (neu, via create-next-app + manual deps)
tsconfig.json                           (neu)
next.config.ts                          (neu)
postcss.config.mjs                      (neu, Tailwind 4)
vitest.config.ts                        (neu)
playwright.config.ts                    (neu)
.env.local                              (neu, lokal, NICHT committen)
.env.example                            (neu, committen)
.gitignore                              (modifiziert)

app/
├── layout.tsx                          (neu, root layout)
├── globals.css                         (neu, Tailwind directives)
├── (public)/
│   ├── layout.tsx                      (neu)
│   └── page.tsx                        (neu, Landing)
├── (gated)/
│   ├── layout.tsx                      (neu, Auth-Verifikation)
│   └── lounge/
│       └── page.tsx                    (neu, Placeholder)
├── login/
│   └── page.tsx                        (neu, Password-Form)
└── api/
    └── auth/
        ├── login/route.ts              (neu)
        └── logout/route.ts             (neu)

middleware.ts                           (neu, project root, gated check)

lib/
├── config.ts                           (neu, SESSION-Konstanten)
├── supabase/
│   └── server.ts                       (neu, service-role client)
└── auth/
    ├── password.ts                     (neu, constant-time compare)
    ├── jwt.ts                          (neu, JWT sign/verify)
    └── lockout.ts                      (neu, brute-force lockout)

supabase/
└── migrations/
    └── 0001_initial_schema.sql         (neu)

tests/
├── unit/
│   └── auth/
│       ├── password.test.ts            (neu)
│       ├── jwt.test.ts                 (neu)
│       └── lockout.test.ts             (neu)
├── integration/
│   └── api/
│       └── login.test.ts               (neu)
└── e2e/
    └── smoke.spec.ts                   (neu)
```

---

## Task 1: Bootstrap Next.js Project

Bestehende Dateien (`CLAUDE.md`, `README.md`, `docs/`, `.git/`) bleiben erhalten. Wir scaffolden Next.js in einem temporären Ordner und mergen rauf.

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `app/layout.tsx`, `app/globals.css`, `app/page.tsx`, `.gitignore` (alle via create-next-app)

- [ ] **Step 1: Run create-next-app in temp directory**

```bash
cd /Users/Jojo/Documents/Develop/Projects/talk-to-me
npx create-next-app@latest tmp-init \
  --typescript \
  --tailwind \
  --app \
  --eslint \
  --no-src-dir \
  --import-alias "@/*" \
  --use-npm \
  --no-turbopack \
  --skip-install
```

Expected: Verzeichnis `tmp-init/` mit Next.js Boilerplate.

- [ ] **Step 2: Move generated files to project root**

```bash
cd /Users/Jojo/Documents/Develop/Projects/talk-to-me
shopt -s dotglob
mv tmp-init/* tmp-init/.* . 2>/dev/null || true
shopt -u dotglob
rmdir tmp-init
```

Erwartung: `package.json`, `tsconfig.json`, `next.config.ts`, `app/`, `public/`, `postcss.config.mjs` etc. existieren im Root. `.git/` und `CLAUDE.md` unverändert.

- [ ] **Step 3: Drop create-next-app's example homepage (we replace it later)**

```bash
rm -f app/page.tsx app/favicon.ico
rm -rf public/
```

Wir erzeugen eigene Routes in Task 18/19. `app/layout.tsx` und `app/globals.css` bleiben.

- [ ] **Step 4: Install dependencies**

```bash
npm install
```

Expected: `node_modules/` und `package-lock.json` erzeugt; keine Errors.

- [ ] **Step 5: Verify dev server starts**

```bash
npm run dev
```

Expected: `▲ Next.js 15.x.x  - Local: http://localhost:3000`. Browser auf `localhost:3000` zeigt 404 (weil wir `app/page.tsx` gelöscht haben). Mit `Ctrl+C` beenden.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: bootstrap Next.js 15 with App Router + Tailwind"
```

---

## Task 2: Install Plan-1 Dependencies

**Files:**
- Modify: `package.json` (via npm install)

- [ ] **Step 1: Install runtime deps**

```bash
npm install jose @supabase/supabase-js
```

`jose`: JWT lib, Edge-runtime-kompatibel. `@supabase/supabase-js`: Supabase-Client.

- [ ] **Step 2: Install dev deps**

```bash
npm install -D vitest @vitest/coverage-v8 @types/node \
  @playwright/test \
  supabase
```

`vitest`: Unit/Integration. `@playwright/test`: E2E. `supabase`: lokale CLI für Migrations.

- [ ] **Step 3: Install Playwright browsers**

```bash
npx playwright install chromium
```

Lädt Chromium-Binary für E2E-Tests.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add jose, supabase, vitest, playwright"
```

---

## Task 3: Configure Vitest

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (test scripts)

- [ ] **Step 1: Create vitest config**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    globals: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

- [ ] **Step 2: Add test scripts to package.json**

Edit `package.json`, im `"scripts"`-Block ergänzen:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test"
  }
}
```

- [ ] **Step 3: Verify vitest runs (with no tests yet)**

```bash
npm test
```

Expected: `No test files found` (das ist OK).

- [ ] **Step 4: Commit**

```bash
git add vitest.config.ts package.json
git commit -m "chore: configure Vitest for unit + integration tests"
```

---

## Task 4: Configure Playwright

**Files:**
- Create: `playwright.config.ts`
- Modify: `.gitignore`

- [ ] **Step 1: Create Playwright config**

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
```

- [ ] **Step 2: Add Playwright artifacts to .gitignore**

Edit `.gitignore`, am Ende anhängen:

```
# Playwright
/test-results/
/playwright-report/
/blob-report/
/playwright/.cache/
```

- [ ] **Step 3: Commit**

```bash
git add playwright.config.ts .gitignore
git commit -m "chore: configure Playwright for E2E smoke tests"
```

---

## Task 5: Create Project Skeleton Folders

**Files:**
- Create: `lib/`, `lib/auth/`, `lib/supabase/`, `tests/unit/auth/`, `tests/integration/api/`, `tests/e2e/`, `supabase/migrations/`

- [ ] **Step 1: Create folders**

```bash
mkdir -p lib/auth lib/supabase
mkdir -p tests/unit/auth tests/integration/api tests/e2e
mkdir -p supabase/migrations
```

- [ ] **Step 2: Verify structure**

```bash
ls -la lib tests supabase
```

Expected: alle Unterordner sichtbar.

(Kein Commit — leere Ordner werden mit dem ersten File darin in Folgetasks committed.)

---

## Task 6: lib/config.ts (SESSION constants)

**Files:**
- Create: `lib/config.ts`

- [ ] **Step 1: Write config**

```typescript
// lib/config.ts

export const SESSION = {
  HARD_LIMIT_MS: 4 * 60 * 1000,
  WARNING_AT_MS: 3 * 60 * 1000 + 30_000,
  INACTIVITY_PROMPT_MS: 20_000,
  INACTIVITY_END_MS: 30_000,
  GRACEFUL_END_BUDGET_MS: 5_000,
} as const;

export const AUTH = {
  COOKIE_NAME: 'tt_auth',
  COOKIE_TTL_SECONDS: 7 * 24 * 60 * 60,
} as const;

export const LOCKOUT = {
  MAX_FAILURES: 5,
  WINDOW_MS: 10 * 60 * 1000,
  BLOCK_MS: 60 * 1000,
} as const;
```

- [ ] **Step 2: Commit**

```bash
git add lib/config.ts
git commit -m "feat(config): add SESSION, AUTH, LOCKOUT constants"
```

---

## Task 7: Supabase Project Setup (manual)

**Files:**
- Modify: `.env.example`, `.env.local` (lokal, nicht committen)
- Modify: `.gitignore`

Diese Schritte sind teilweise manuell — Supabase-Account-Aktion erforderlich.

- [ ] **Step 1: Create Supabase project**

Im Supabase-Dashboard (https://app.supabase.com):
1. „New project" → Name: `talk-to-me-prod`, Region: `Frankfurt` (eu-central-1).
2. Generiere Database-Password, speichere im Passwort-Manager.
3. Warte bis Project ready.

- [ ] **Step 2: Get credentials**

Im Project-Dashboard → Settings → API:
- `Project URL` (z. B. `https://abcdefgh.supabase.co`)
- `service_role` key (geheim!)

- [ ] **Step 3: Verify .env.local is gitignored**

```bash
grep -E "^\.env(\.local)?$" .gitignore
```

Expected: `.env*.local` oder `.env.local` taucht auf (create-next-app setzt das default). Falls nicht:

```
echo "
# local env
.env.local
.env*.local
" >> .gitignore
```

- [ ] **Step 4: Create .env.example (committed)**

```bash
cat > .env.example <<'EOF'
# Auth
ACCESS_PASSWORD=changeme-strong-password-here
AUTH_JWT_SECRET=changeme-min-32-byte-random-secret

# Supabase (Plan 1)
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY

# ElevenLabs (Plan 2/3)
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=
ELEVENLABS_API_KEY=
ELEVENLABS_WEBHOOK_SECRET=
EOF
```

- [ ] **Step 5: Create .env.local with real values (lokal, NICHT committen)**

```bash
cat > .env.local <<'EOF'
ACCESS_PASSWORD=<wähle ein starkes Passwort, z. B. 24 chars>
AUTH_JWT_SECRET=<openssl rand -base64 32 ergebnis>
SUPABASE_URL=<from Step 2>
SUPABASE_SERVICE_ROLE_KEY=<from Step 2>
EOF
```

`AUTH_JWT_SECRET` generieren:

```bash
openssl rand -base64 32
```

Output in `.env.local` einfügen.

- [ ] **Step 6: Verify .env.local is NOT staged**

```bash
git status
```

Expected: `.env.local` taucht nicht in „Untracked files" auf (gitignored).

- [ ] **Step 7: Commit .env.example only**

```bash
git add .env.example .gitignore
git commit -m "chore: add .env.example with required variable names"
```

---

## Task 8: Write Initial Migration

**Files:**
- Create: `supabase/migrations/0001_initial_schema.sql`

- [ ] **Step 1: Write migration**

```sql
-- supabase/migrations/0001_initial_schema.sql

create table sessions (
  id                  uuid primary key default gen_random_uuid(),
  conversation_id     text unique not null,
  started_at          timestamptz not null,
  ended_at            timestamptz,
  duration_seconds    int,
  end_reason          text check (end_reason in
                          ('timeout','goodbye','manual','inactivity','error','unknown')),

  visitor_name        text,
  visitor_company     text,
  language            text,
  summary             text,
  topic_tags          text[],
  sentiment           text,
  questions           jsonb,

  quality_flags       jsonb,

  transcript          jsonb not null,
  raw_webhook         jsonb,

  channel             text not null default 'web' check (channel in ('web','phone')),

  created_at          timestamptz not null default now()
);

create index sessions_started_at_idx on sessions (started_at desc);
create index sessions_topic_tags_idx on sessions using gin (topic_tags);

alter table sessions enable row level security;
-- keine RLS policies → default deny für anon/authenticated;
-- service-role bypassed RLS.

create table pending_end_reasons (
  conversation_id text primary key,
  reason          text not null check (reason in
                       ('timeout','goodbye','manual','inactivity','error')),
  created_at      timestamptz not null default now()
);

alter table pending_end_reasons enable row level security;
```

- [ ] **Step 2: Commit migration**

```bash
git add supabase/migrations/0001_initial_schema.sql
git commit -m "feat(db): initial schema for sessions and pending_end_reasons"
```

---

## Task 9: Apply Migration

**Files:** keine.

- [ ] **Step 1: Open Supabase SQL Editor**

Im Supabase-Dashboard → SQL Editor → „New query".

- [ ] **Step 2: Paste & run migration**

Inhalt von `supabase/migrations/0001_initial_schema.sql` hineinkopieren, „Run".

Expected: „Success. No rows returned."

- [ ] **Step 3: Verify tables exist**

Im Dashboard → Table Editor: `sessions` und `pending_end_reasons` sind sichtbar (leer).

- [ ] **Step 4: Spot-check via SQL**

Im SQL Editor:

```sql
select column_name, data_type
from information_schema.columns
where table_name = 'sessions'
order by ordinal_position;
```

Expected: 18 Spalten, beginnend bei `id` und endend bei `created_at`.

(Kein Commit nötig.)

---

## Task 10: lib/supabase/server.ts

**Files:**
- Create: `lib/supabase/server.ts`

- [ ] **Step 1: Write server client**

```typescript
// lib/supabase/server.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

export function getSupabaseServer(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in env'
    );
  }

  _client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return _client;
}
```

Lazy-init verhindert Crash beim Importieren in Edge-Runtimes ohne ENV.

- [ ] **Step 2: Commit**

```bash
git add lib/supabase/server.ts
git commit -m "feat(supabase): add lazy server-side client"
```

---

## Task 11: TDD lib/auth/password.ts (constant-time compare)

**Files:**
- Create: `tests/unit/auth/password.test.ts`
- Create: `lib/auth/password.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/unit/auth/password.test.ts
import { describe, it, expect } from 'vitest';
import { verifyPassword } from '@/lib/auth/password';

describe('verifyPassword', () => {
  it('returns true for matching password', () => {
    expect(verifyPassword('secret123', 'secret123')).toBe(true);
  });

  it('returns false for non-matching password', () => {
    expect(verifyPassword('wrong', 'secret123')).toBe(false);
  });

  it('returns false for different lengths (avoiding timing leak)', () => {
    expect(verifyPassword('short', 'much-longer-password')).toBe(false);
  });

  it('returns false for empty input', () => {
    expect(verifyPassword('', 'secret123')).toBe(false);
  });

  it('returns false when expected is empty (defensive)', () => {
    expect(verifyPassword('anything', '')).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- tests/unit/auth/password.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/auth/password'`.

- [ ] **Step 3: Write minimal implementation**

```typescript
// lib/auth/password.ts

/**
 * Constant-time string comparison. Returns false immediately for length
 * mismatch (length itself is not secret in our context).
 */
export function verifyPassword(input: string, expected: string): boolean {
  if (!input || !expected) return false;
  if (input.length !== expected.length) return false;

  let result = 0;
  for (let i = 0; i < input.length; i++) {
    result |= input.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return result === 0;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- tests/unit/auth/password.test.ts
```

Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/auth/password.ts tests/unit/auth/password.test.ts
git commit -m "feat(auth): add constant-time password verification"
```

---

## Task 12: TDD lib/auth/jwt.ts

**Files:**
- Create: `tests/unit/auth/jwt.test.ts`
- Create: `lib/auth/jwt.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/unit/auth/jwt.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { signAuthToken, verifyAuthToken } from '@/lib/auth/jwt';

const TEST_SECRET = 'test-secret-at-least-32-bytes-long-padding-padding';

beforeAll(() => {
  process.env.AUTH_JWT_SECRET = TEST_SECRET;
});

describe('signAuthToken / verifyAuthToken', () => {
  it('signs a token that verifies', async () => {
    const token = await signAuthToken();
    const result = await verifyAuthToken(token);
    expect(result.valid).toBe(true);
  });

  it('rejects a tampered token', async () => {
    const token = await signAuthToken();
    const tampered = token.slice(0, -3) + 'xyz';
    const result = await verifyAuthToken(tampered);
    expect(result.valid).toBe(false);
  });

  it('rejects garbage', async () => {
    const result = await verifyAuthToken('not-a-jwt');
    expect(result.valid).toBe(false);
  });

  it('rejects empty string', async () => {
    const result = await verifyAuthToken('');
    expect(result.valid).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- tests/unit/auth/jwt.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

```typescript
// lib/auth/jwt.ts
import { SignJWT, jwtVerify } from 'jose';
import { AUTH } from '@/lib/config';

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_JWT_SECRET must be set and at least 32 chars');
  }
  return new TextEncoder().encode(secret);
}

export async function signAuthToken(): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${AUTH.COOKIE_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

export type VerifyResult = { valid: true } | { valid: false; reason: string };

export async function verifyAuthToken(token: string): Promise<VerifyResult> {
  if (!token) return { valid: false, reason: 'empty' };
  try {
    await jwtVerify(token, getSecretKey(), { algorithms: ['HS256'] });
    return { valid: true };
  } catch (e) {
    return { valid: false, reason: e instanceof Error ? e.message : 'unknown' };
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- tests/unit/auth/jwt.test.ts
```

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/auth/jwt.ts tests/unit/auth/jwt.test.ts
git commit -m "feat(auth): add JWT sign/verify with jose"
```

---

## Task 13: TDD lib/auth/lockout.ts

**Files:**
- Create: `tests/unit/auth/lockout.test.ts`
- Create: `lib/auth/lockout.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/unit/auth/lockout.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { recordFailure, isLockedOut, resetLockout } from '@/lib/auth/lockout';

beforeEach(() => {
  resetLockout();
  vi.useRealTimers();
});

describe('lockout', () => {
  it('allows up to MAX_FAILURES attempts before locking', () => {
    for (let i = 0; i < 5; i++) {
      expect(isLockedOut('1.1.1.1')).toBe(false);
      recordFailure('1.1.1.1');
    }
    expect(isLockedOut('1.1.1.1')).toBe(true);
  });

  it('separates state per IP', () => {
    for (let i = 0; i < 5; i++) recordFailure('1.1.1.1');
    expect(isLockedOut('1.1.1.1')).toBe(true);
    expect(isLockedOut('2.2.2.2')).toBe(false);
  });

  it('lock expires after BLOCK_MS', () => {
    vi.useFakeTimers();
    const start = new Date('2026-01-01T00:00:00Z');
    vi.setSystemTime(start);

    for (let i = 0; i < 5; i++) recordFailure('1.1.1.1');
    expect(isLockedOut('1.1.1.1')).toBe(true);

    vi.setSystemTime(new Date(start.getTime() + 61_000));
    expect(isLockedOut('1.1.1.1')).toBe(false);
  });

  it('failures outside the WINDOW do not count', () => {
    vi.useFakeTimers();
    const start = new Date('2026-01-01T00:00:00Z');
    vi.setSystemTime(start);

    recordFailure('1.1.1.1'); // t=0
    vi.setSystemTime(new Date(start.getTime() + 11 * 60_000)); // t = 11min
    for (let i = 0; i < 4; i++) recordFailure('1.1.1.1');
    // 4 failures within window, 1 outside → not locked
    expect(isLockedOut('1.1.1.1')).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- tests/unit/auth/lockout.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

```typescript
// lib/auth/lockout.ts
import { LOCKOUT } from '@/lib/config';

type Entry = {
  failures: number[];   // timestamps in ms
  blockedUntil?: number;
};

const state = new Map<string, Entry>();

export function recordFailure(ip: string): void {
  const now = Date.now();
  const entry = state.get(ip) ?? { failures: [] };

  // prune failures outside the window
  entry.failures = entry.failures.filter(
    (t) => now - t <= LOCKOUT.WINDOW_MS
  );
  entry.failures.push(now);

  if (entry.failures.length >= LOCKOUT.MAX_FAILURES) {
    entry.blockedUntil = now + LOCKOUT.BLOCK_MS;
    entry.failures = []; // reset window after lock
  }

  state.set(ip, entry);
}

export function isLockedOut(ip: string): boolean {
  const entry = state.get(ip);
  if (!entry?.blockedUntil) return false;
  if (Date.now() >= entry.blockedUntil) {
    delete entry.blockedUntil;
    return false;
  }
  return true;
}

/** Test-only helper. */
export function resetLockout(): void {
  state.clear();
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- tests/unit/auth/lockout.test.ts
```

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/auth/lockout.ts tests/unit/auth/lockout.test.ts
git commit -m "feat(auth): add in-memory brute-force lockout"
```

---

## Task 14: /api/auth/login Route + Integration Test

**Files:**
- Create: `app/api/auth/login/route.ts`
- Create: `tests/integration/api/login.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/integration/api/login.test.ts
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { POST } from '@/app/api/auth/login/route';
import { resetLockout } from '@/lib/auth/lockout';

beforeAll(() => {
  process.env.ACCESS_PASSWORD = 'correct-horse-battery-staple';
  process.env.AUTH_JWT_SECRET =
    'test-secret-at-least-32-bytes-long-padding-padding';
});

beforeEach(() => {
  resetLockout();
});

function makeRequest(body: unknown, ip = '1.1.1.1'): Request {
  return new Request('http://localhost/api/auth/login', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': ip,
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/login', () => {
  it('sets auth cookie on correct password', async () => {
    const res = await POST(
      makeRequest({ password: 'correct-horse-battery-staple' })
    );
    expect(res.status).toBe(200);
    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toContain('tt_auth=');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=Lax');
  });

  it('rejects wrong password with 401', async () => {
    const res = await POST(makeRequest({ password: 'nope' }));
    expect(res.status).toBe(401);
    expect(res.headers.get('set-cookie')).toBeNull();
  });

  it('rejects malformed body', async () => {
    const res = await POST(makeRequest({ wrongField: 'x' }));
    expect(res.status).toBe(400);
  });

  it('returns 429 after 5 failed attempts', async () => {
    for (let i = 0; i < 5; i++) {
      await POST(makeRequest({ password: 'wrong' }, '9.9.9.9'));
    }
    const res = await POST(
      makeRequest({ password: 'correct-horse-battery-staple' }, '9.9.9.9')
    );
    expect(res.status).toBe(429);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/integration/api/login.test.ts
```

Expected: FAIL — route not found.

- [ ] **Step 3: Write the route**

```typescript
// app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { verifyPassword } from '@/lib/auth/password';
import { signAuthToken } from '@/lib/auth/jwt';
import { recordFailure, isLockedOut } from '@/lib/auth/lockout';
import { AUTH } from '@/lib/config';

const FAIL_DELAY_MS = 250;

function getClientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

async function delay(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

export async function POST(req: Request): Promise<NextResponse> {
  const ip = getClientIp(req);

  if (isLockedOut(ip)) {
    return NextResponse.json(
      { error: 'too_many_attempts' },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const password = (body as { password?: unknown })?.password;
  if (typeof password !== 'string') {
    return NextResponse.json(
      { error: 'missing_password' },
      { status: 400 }
    );
  }

  const expected = process.env.ACCESS_PASSWORD;
  if (!expected) {
    return NextResponse.json(
      { error: 'server_misconfigured' },
      { status: 500 }
    );
  }

  if (!verifyPassword(password, expected)) {
    recordFailure(ip);
    await delay(FAIL_DELAY_MS);
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const token = await signAuthToken();
  const res = NextResponse.json({ ok: true }, { status: 200 });
  res.cookies.set(AUTH.COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: AUTH.COOKIE_TTL_SECONDS,
  });
  return res;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/integration/api/login.test.ts
```

Expected: PASS (4 tests). Beachte: der Lockout-Test dauert ~1 Sek wegen 4× `delay(250)`.

- [ ] **Step 5: Commit**

```bash
git add app/api/auth/login/route.ts tests/integration/api/login.test.ts
git commit -m "feat(auth): add /api/auth/login with lockout + cookie"
```

---

## Task 15: /api/auth/logout Route

**Files:**
- Create: `app/api/auth/logout/route.ts`

(Kein Integration-Test — Logout-Logik ist trivial, durch E2E in Task 20 abgedeckt.)

- [ ] **Step 1: Write the route**

```typescript
// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';
import { AUTH } from '@/lib/config';

export async function POST(): Promise<NextResponse> {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH.COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/auth/logout/route.ts
git commit -m "feat(auth): add /api/auth/logout"
```

---

## Task 16: /login Page

**Files:**
- Create: `app/login/page.tsx`

- [ ] **Step 1: Write the login page**

```tsx
// app/login/page.tsx
'use client';

import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') ?? '/lounge';

  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
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
        setError('Zu viele Versuche. Bitte später erneut probieren.');
      } else {
        setError('Falsches Passwort.');
      }
    } catch {
      setError('Verbindungsfehler. Erneut versuchen.');
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4"
        aria-label="Login"
      >
        <h1 className="text-xl font-medium">Zugang</h1>
        <input
          type="password"
          autoFocus
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Passwort"
          className="w-full rounded border border-neutral-300 px-3 py-2"
          aria-label="Passwort"
        />
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending || password.length === 0}
          className="w-full rounded bg-black px-3 py-2 text-white disabled:opacity-50"
        >
          {pending ? 'Prüfe…' : 'Weiter'}
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 2: Manually verify**

```bash
npm run dev
```

Browser: `http://localhost:3000/login`. Form sichtbar. Falsches Passwort → „Falsches Passwort.". Korrektes Passwort (aus `.env.local`) → Redirect zu `/lounge` (gibt 404 bis Task 19, das ist ok). Server stoppen.

- [ ] **Step 3: Commit**

```bash
git add app/login/page.tsx
git commit -m "feat(auth): add /login page with password form"
```

---

## Task 17: middleware.ts (Gating)

**Files:**
- Create: `middleware.ts` (project root, NICHT in `app/`)

- [ ] **Step 1: Write middleware**

```typescript
// middleware.ts
import { NextResponse, type NextRequest } from 'next/server';
import { verifyAuthToken } from '@/lib/auth/jwt';
import { AUTH } from '@/lib/config';

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(AUTH.COOKIE_NAME)?.value;
  const result = token ? await verifyAuthToken(token) : { valid: false };

  if (!result.valid) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/lounge/:path*'],
};
```

`matcher` schützt explizit `/lounge`. Alle anderen Routes (Landing, /login, /api/*) bleiben unprotected.

- [ ] **Step 2: Manually verify**

Mit `npm run dev`:
- `http://localhost:3000/lounge` ohne Cookie → Redirect auf `/login?next=%2Flounge`. (Siehe noch 404, da Lounge-Page erst in Task 19 existiert.)
- Nach erfolgreichem Login → Redirect auf `/lounge` (404 erwartet).

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat(auth): add middleware gating /lounge"
```

---

## Task 18: Public Landing Page

**Files:**
- Create: `app/(public)/layout.tsx`
- Create: `app/(public)/page.tsx`

- [ ] **Step 1: Write public layout**

```tsx
// app/(public)/layout.tsx
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
```

(Layout-Pass-through, später hier Header/Footer falls nötig.)

- [ ] **Step 2: Write landing page**

```tsx
// app/(public)/page.tsx
import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-24">
      <h1 className="text-3xl font-medium">Talk to me.</h1>
      <p className="mt-4 text-neutral-600">
        Ein digitaler Twin von Jonathan Plettenberg. Auf 4 Minuten begrenzt.
        Spricht über CV, Projekte, Tech-Stack, Arbeitsweise, Hobbys. Sonst
        nichts.
      </p>
      <Link
        href="/lounge"
        className="mt-8 inline-block rounded bg-black px-4 py-2 text-white"
      >
        Gespräch starten
      </Link>
    </main>
  );
}
```

- [ ] **Step 3: Manually verify**

`npm run dev` → `http://localhost:3000/`: Landing sichtbar. Click „Gespräch starten" → leitet auf `/lounge` → Middleware redirected zu `/login?next=%2Flounge`.

- [ ] **Step 4: Commit**

```bash
git add "app/(public)/layout.tsx" "app/(public)/page.tsx"
git commit -m "feat(ui): add public landing page"
```

---

## Task 19: Gated Lounge Placeholder

**Files:**
- Create: `app/(gated)/layout.tsx`
- Create: `app/(gated)/lounge/page.tsx`

- [ ] **Step 1: Write gated layout**

```tsx
// app/(gated)/layout.tsx
export default function GatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
```

(Auth-Verifikation läuft via `middleware.ts` — der Layout selbst macht nichts. Hier später ggf. Logout-Button.)

- [ ] **Step 2: Write lounge placeholder**

```tsx
// app/(gated)/lounge/page.tsx
export default function LoungePage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-24">
      <h1 className="text-2xl font-medium">Lounge</h1>
      <p className="mt-4 text-neutral-600">
        Voice-/Chat-UI kommt in Plan 3. Aktuell nur Auth-Smoke-Test.
      </p>
      <form action="/api/auth/logout" method="POST" className="mt-8">
        <button
          type="submit"
          className="rounded border border-neutral-300 px-3 py-2 text-sm"
        >
          Abmelden
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 3: Manually verify full auth flow**

`npm run dev`:
1. `/` → Landing.
2. „Gespräch starten" → redirected to `/login?next=%2Flounge`.
3. Korrektes Passwort → Lounge sichtbar.
4. „Abmelden" → POST `/api/auth/logout`, Cookie weg. (Browser zeigt JSON-Response — das ist OK für Plan 1, in Plan 3 wird's hübscher.)
5. Erneut `/lounge` → wieder Login-Redirect.

- [ ] **Step 4: Commit**

```bash
git add "app/(gated)/layout.tsx" "app/(gated)/lounge/page.tsx"
git commit -m "feat(ui): add gated lounge placeholder + logout"
```

---

## Task 20: E2E Smoke Test

**Files:**
- Create: `tests/e2e/smoke.spec.ts`

- [ ] **Step 1: Write the smoke test**

```typescript
// tests/e2e/smoke.spec.ts
import { test, expect } from '@playwright/test';

const PASSWORD =
  process.env.ACCESS_PASSWORD ?? 'correct-horse-battery-staple';

test.describe('auth smoke', () => {
  test('redirects unauthenticated lounge access to login', async ({
    page,
  }) => {
    await page.goto('/lounge');
    await expect(page).toHaveURL(/\/login\?next=%2Flounge/);
    await expect(page.getByLabel('Passwort')).toBeVisible();
  });

  test('rejects wrong password with error message', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Passwort').fill('definitely-wrong');
    await page.getByRole('button', { name: 'Weiter' }).click();
    await expect(page.getByRole('alert')).toContainText('Falsches Passwort');
  });

  test('correct password lands on lounge', async ({ page }) => {
    await page.goto('/login?next=%2Flounge');
    await page.getByLabel('Passwort').fill(PASSWORD);
    await page.getByRole('button', { name: 'Weiter' }).click();
    await expect(page).toHaveURL(/\/lounge$/);
    await expect(
      page.getByRole('heading', { name: 'Lounge' })
    ).toBeVisible();
  });

  test('landing page renders', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: 'Talk to me.' })
    ).toBeVisible();
  });
});
```

- [ ] **Step 2: Run E2E (requires dev server, Playwright spawns it via config)**

Stelle sicher: `.env.local` enthält `ACCESS_PASSWORD` und `AUTH_JWT_SECRET`. Dann:

```bash
npm run test:e2e
```

Expected: 4 PASS in ~10–20 Sekunden. Falls fail wegen Port-Conflict: Dev-Server stoppen (`Ctrl+C`) und erneut.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/smoke.spec.ts
git commit -m "test(e2e): smoke test for auth flow"
```

---

## Task 21: Vercel Deploy

**Files:** keine direkten Code-Änderungen.

- [ ] **Step 1: Push branch to GitHub**

Falls noch nicht remote:

```bash
gh repo create talk-to-me --private --source=. --push
```

(Falls schon ein GitHub-Repo verknüpft ist: `git push origin main`.)

- [ ] **Step 2: Import project to Vercel**

1. https://vercel.com/new
2. „Import Git Repository" → talk-to-me auswählen
3. Framework: Next.js (auto-detected)
4. Root: `.` (default)
5. Build Command: `next build` (default)

- [ ] **Step 3: Add ENV vars in Vercel**

Im Vercel-Dashboard → Project → Settings → Environment Variables. Alle für `Production`, `Preview`, `Development`:

- `ACCESS_PASSWORD` (kann anderes Passwort als lokal sein)
- `AUTH_JWT_SECRET` (NEU generieren via `openssl rand -base64 32`, NICHT das lokale)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

- [ ] **Step 4: Trigger deploy**

Vercel deployt automatisch beim Push. Falls nötig: „Redeploy" im Dashboard.

- [ ] **Step 5: Smoke-test production URL**

Vercel zeigt eine `talk-to-me-xxx.vercel.app` URL. Manuell:
1. `/` → Landing erscheint.
2. „Gespräch starten" → Redirect auf `/login`.
3. Korrektes Passwort → Lounge erreichbar.
4. „Abmelden" → Cookie weg, erneuter Login nötig.

- [ ] **Step 6: (Optional) Custom-Domain anbinden**

Falls vorhanden (z. B. `twin.plettenberg.dev`): Vercel → Domains → Add. DNS bei Registrar konfigurieren (CNAME oder A-Record laut Vercel-Anleitung).

(Kein Commit — alles über Dashboard.)

---

## Acceptance Criteria (Plan 1 done when …)

- [ ] `npm test` durchläuft alle Unit + Integration Tests grün (mind. 13 Tests: 5 password + 4 jwt + 4 lockout + 4 login).
- [ ] `npm run test:e2e` durchläuft alle 4 E2E-Smoke-Tests grün.
- [ ] Manuell verifiziert: `/`, `/lounge`-Redirect, `/login`, korrektes Passwort, falsches Passwort, Logout.
- [ ] Supabase: `sessions` und `pending_end_reasons` Tabellen existieren.
- [ ] Vercel-Preview-URL ist erreichbar und führt durch denselben Auth-Flow.
- [ ] `.env.local` ist NICHT committet, `.env.example` ist committet.
- [ ] Alle Tasks haben commits hinterlassen (`git log --oneline | head -25` zeigt ~21 Plan-1-Commits).

---

## Out-of-Scope für Plan 1 (kommt in Plan 2/3/4)

- Webhook-Route + Edge Function (Plan 2)
- ElevenLabs SDK + Voice-UI + State-Machine (Plan 3)
- KB-Inhalte, Agent-Konfig final, Production-Smoke (Plan 4)
- Visuelles Design (separate frontend-design-Session vor Plan 3)
