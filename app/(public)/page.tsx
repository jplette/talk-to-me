// app/(public)/page.tsx
'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useT } from '@/lib/i18n/provider';
import { TypewriterPhrase } from '@/components/landing/TypewriterPhrase';

export default function LandingPage() {
  const { t, lang } = useT();
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .from('.hero-prompt', { opacity: 0, x: -12, duration: 0.5 })
        .from('.hero-line', { opacity: 0, y: 28, stagger: 0.14, duration: 0.6 }, '+=0.06')
        .from('.hero-lede', { opacity: 0, y: 12, duration: 0.5 }, '-=0.25')
        .from('.hero-cta', { opacity: 0, y: 10, duration: 0.45 }, '-=0.3');
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative mx-auto flex w-full max-w-[560px] flex-col items-start gap-5 px-6 py-16 md:py-[22vh]"
    >
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
        className="hero-prompt font-mono text-[11px] tracking-wider"
        style={{ color: 'rgba(239,131,84,0.5)' }}
        aria-hidden="true"
      >
        $ whoami → jonathan_plettenberg
      </p>

      {/* Headline */}
      <h1
        className="text-[40px] font-bold leading-[1.05] tracking-[-0.03em] text-foreground md:text-5xl lg:text-[52px]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        <span className="hero-line block">Senior</span>
        <span className="hero-line block">Engineer.</span>
        <span className="hero-line block">
          {lang === 'en' ? 'Say ' : 'Sag '}
          <TypewriterPhrase lang={lang} />
        </span>
      </h1>

      {/* Lede */}
      <p
        className="hero-lede max-w-[36ch] text-sm font-light leading-relaxed"
        style={{ color: 'rgba(240,236,230,0.45)' }}
      >
        {t('landing.lede')}
      </p>

      {/* Shell CTA */}
      <Link
        href="/login"
        className="hero-cta mt-1 inline-flex items-center gap-2 rounded-[5px] border px-4 py-2.5 font-mono text-[11px] uppercase tracking-widest transition-colors hover:bg-[rgba(239,131,84,0.16)]"
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
