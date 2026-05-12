# Contact Outro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** At the end of every conversation the agent speaks a goodbye that includes `jonathan@plettenberg.org`, and the EndedView screen shows a clickable mailto link instead of the old caption.

**Architecture:** Three independent changes — (1) i18n strings + EndedView mailto link, (2) agent prompt goodbye examples, (3) send goodbye signal before manual endSession. No new files, no new dependencies.

**Tech Stack:** Next.js 15 App Router, React, Vitest + React Testing Library, ElevenLabs Conversational AI prompt (markdown)

---

### Task 1: Update i18n strings

**Files:**
- Modify: `lib/i18n/de.ts:44`
- Modify: `lib/i18n/en.ts:44`

The `ended_caption` key will now hold only the prefix text. The email itself is hardcoded as a link in the component (Task 2), so it doesn't need to be translated.

- [ ] **Step 1: Update DE string**

In `lib/i18n/de.ts`, replace line 44:

```ts
  'lounge.ended_caption':         'Hast du gefunden, was du wolltest?',
```

with:

```ts
  'lounge.ended_caption':         'Weitere Fragen? →',
```

- [ ] **Step 2: Update EN string**

In `lib/i18n/en.ts`, replace line 44:

```ts
  'lounge.ended_caption':         'Did you find what you needed?',
```

with:

```ts
  'lounge.ended_caption':         'More questions? →',
```

- [ ] **Step 3: Commit**

```bash
git add lib/i18n/de.ts lib/i18n/en.ts
git commit -m "feat(i18n): replace ended_caption with contact outro prefix"
```

---

### Task 2: Update EndedView — render mailto link (TDD)

**Files:**
- Create: `tests/unit/components/EndedView.test.tsx`
- Modify: `components/lounge/EndedView.tsx:38`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/components/EndedView.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nProvider } from '@/lib/i18n/provider';
import { EndedView } from '@/components/lounge/EndedView';

beforeEach(() => {
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
});

function renderEndedView(onNewSession = vi.fn()) {
  return render(
    <I18nProvider initialLang="de">
      <EndedView turns={[]} onNewSession={onNewSession} />
    </I18nProvider>
  );
}

describe('EndedView', () => {
  it('renders a mailto link to jonathan@plettenberg.org', () => {
    renderEndedView();
    const link = screen.getByRole('link', { name: /jonathan@plettenberg\.org/i });
    expect(link).toHaveAttribute('href', 'mailto:jonathan@plettenberg.org');
  });

  it('shows the contact prefix text', () => {
    renderEndedView();
    expect(screen.getByText(/Weitere Fragen/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/unit/components/EndedView.test.tsx
```

Expected: FAIL — `Unable to find role="link"` (link doesn't exist yet).

- [ ] **Step 3: Update EndedView to render mailto link**

In `components/lounge/EndedView.tsx`, replace line 38:

```tsx
      <p className="text-sm text-muted-foreground">{t('lounge.ended_caption')}</p>
```

with:

```tsx
      <p className="text-sm text-muted-foreground">
        {t('lounge.ended_caption')}{' '}
        <a
          href="mailto:jonathan@plettenberg.org"
          className="underline underline-offset-2 hover:text-foreground transition-colors"
        >
          jonathan@plettenberg.org
        </a>
      </p>
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/unit/components/EndedView.test.tsx
```

Expected: PASS — 2 tests.

- [ ] **Step 5: Run full unit test suite to check for regressions**

```bash
npx vitest run
```

Expected: all tests pass (previously 68+).

- [ ] **Step 6: Commit**

```bash
git add tests/unit/components/EndedView.test.tsx components/lounge/EndedView.tsx
git commit -m "feat(lounge): replace ended_caption with mailto link (jonathan@plettenberg.org)"
```

---

### Task 3: Update agent prompt — goodbye includes email

**Files:**
- Modify: `elevenlabs/prompt.md:51-54`

- [ ] **Step 1: Update the goodbye examples**

In `elevenlabs/prompt.md`, replace the two `Beispiel`-lines under the `[system: Session endet jetzt …]` bullet:

```markdown
  Beispiel DE: „Danke fürs Gespräch. Für weitere Fragen erreichst du mich
               unter jonathan@plettenberg.org — tschüss."
  Beispiel EN: „Thanks for stopping by. For more questions, reach me at
               jonathan@plettenberg.org — take care."
```

Full updated section (lines 51–56) for reference:

```markdown
- `[system: Session endet jetzt — bitte verabschiede dich]` oder `[system: session ending now — please say goodbye]`:
  Beende das Gespräch sofort mit einem kurzen, freundlichen Abschlusssatz,
  der immer die E-Mail-Adresse jonathan@plettenberg.org enthält.
  Beispiel DE: „Danke fürs Gespräch. Für weitere Fragen erreichst du mich unter jonathan@plettenberg.org — tschüss."
  Beispiel EN: „Thanks for stopping by. For more questions, reach me at jonathan@plettenberg.org — take care."
```

- [ ] **Step 2: Commit**

```bash
git add elevenlabs/prompt.md
git commit -m "feat(agent): always include contact email in goodbye outro"
```

---

### Task 4: Send goodbye signal before manual endSession

**Files:**
- Modify: `app/(gated)/lounge/page.tsx:170-175`

- [ ] **Step 1: Update the confirm-dialog end button**

In `app/(gated)/lounge/page.tsx`, replace the `onClick` of the "Beenden / End" button inside the `<Dialog>` (currently around lines 169–176):

```tsx
              <Button
                onClick={async () => {
                  setConfirmOpen(false);
                  await conv.endSession('manual');
                  pendingNav?.();
                  setPendingNav(null);
                }}
              >
```

with:

```tsx
              <Button
                onClick={async () => {
                  setConfirmOpen(false);
                  conv.sendUserMessage(
                    lang === 'de'
                      ? '[system: Session endet jetzt — bitte verabschiede dich]'
                      : '[system: session ending now — please say goodbye]',
                  );
                  await new Promise<void>((r) => setTimeout(r, 500));
                  await conv.endSession('manual');
                  pendingNav?.();
                  setPendingNav(null);
                }}
              >
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add app/(gated)/lounge/page.tsx
git commit -m "feat(lounge): send goodbye signal before manual endSession"
```

---

## Self-Review

| Spec requirement | Covered by |
|---|---|
| Spoken outro in all exit paths (timer, manual, natural) | Task 3 (prompt) + Task 4 (manual signal) |
| Text contact line replaces ended_caption | Task 1 + Task 2 |
| Email as mailto link | Task 2 |
| DE + EN both updated | Task 1 (i18n), Task 3 (prompt examples), Task 4 (lang branch) |
