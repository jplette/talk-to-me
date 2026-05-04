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
