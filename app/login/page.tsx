// app/login/page.tsx
'use client';

import { Suspense, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
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
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
