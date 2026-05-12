// components/lounge/EndButton.tsx
'use client';

import { PhoneOff } from 'lucide-react';

type Props = { onEnd: () => void };

export function EndButton({ onEnd }: Props) {
  return (
    <button
      onClick={onEnd}
      aria-label="End conversation"
      className="inline-flex h-9 items-center gap-1.5 rounded-[5px] border px-3 font-mono text-[11px] uppercase tracking-widest transition-colors hover:bg-[rgba(239,131,84,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--jk-flame)]"
      style={{
        background: 'rgba(239,131,84,0.10)',
        borderColor: 'rgba(239,131,84,0.28)',
        color: 'var(--jk-flame)',
      }}
    >
      <PhoneOff className="h-3.5 w-3.5" strokeWidth={1.5} />
      <span className="hidden sm:inline">End</span>
    </button>
  );
}
