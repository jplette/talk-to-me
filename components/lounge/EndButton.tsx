// components/lounge/EndButton.tsx
'use client';

import { PhoneOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = { onEnd: () => void };

export function EndButton({ onEnd }: Props) {
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={onEnd}
      aria-label="End conversation"
      className="h-9 gap-1.5"
    >
      <PhoneOff className="h-3.5 w-3.5" strokeWidth={1.5} />
      <span className="hidden sm:inline">End</span>
    </Button>
  );
}
