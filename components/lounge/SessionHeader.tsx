// components/lounge/SessionHeader.tsx
'use client';

import { cn } from '@/lib/utils';
import { EndButton } from './EndButton';

type Props = {
  remainingFormatted: string;
  isWarning?: boolean;
  onEnd: () => void;
};

export function SessionHeader({ remainingFormatted, isWarning, onEnd }: Props) {
  return (
    <div
      className={cn(
        'sticky top-14 z-40 flex w-full flex-shrink-0 items-center justify-between',
        'border-b border-border px-6 py-2',
        'bg-background/90 backdrop-blur-sm md:px-10',
      )}
    >
      <span
        className={cn(
          'font-mono text-sm tabular-nums transition-colors',
          isWarning ? 'text-[var(--warn)]' : 'text-muted-foreground'
        )}
        aria-label={`Time remaining ${remainingFormatted}`}
      >
        {remainingFormatted}
      </span>
      <EndButton onEnd={onEnd} />
    </div>
  );
}
