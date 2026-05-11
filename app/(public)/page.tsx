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

      {/* Headline — hardcoded because italic/colour treatment is presentational */}
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
