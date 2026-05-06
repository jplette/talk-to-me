// components/lounge/StatusLine.tsx
'use client';

import { cn } from '@/lib/utils';

type Props = {
  text: string;
  variant?: 'idle' | 'listening' | 'speaking' | 'warning' | 'ending';
};

export function StatusLine({ text, variant = 'idle' }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 text-sm font-medium text-muted-foreground"
    >
      <span
        aria-hidden="true"
        className={cn(
          'inline-block h-2 w-2 rounded-full bg-current opacity-40 transition-opacity',
          variant === 'listening' && 'opacity-100 motion-safe:animate-pulse',
          variant === 'speaking' && 'opacity-100 bg-[var(--jk-flame)]',
          variant === 'warning' && 'opacity-100 bg-[var(--warn)]'
        )}
      />
      <span>{text}</span>
    </div>
  );
}
