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
