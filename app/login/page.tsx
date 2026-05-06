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
