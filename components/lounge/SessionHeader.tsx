// components/lounge/SessionHeader.tsx
'use client';

import { cn } from '@/lib/utils';
import { EndButton } from './EndButton';

type Props = {
  remainingFormatted: string;
  isWarning?: boolean;
  onEnd: () => void;
};

export function SessionHeader({
  remainingFormatted,
  isWarning,
  onEnd,
}: Props) {
  return (
    <div className="flex items-center gap-3">
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
