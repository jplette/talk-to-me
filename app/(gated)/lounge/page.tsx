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
