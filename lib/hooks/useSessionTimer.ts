// lib/hooks/useSessionTimer.ts
'use client';

import { useEffect, useRef, useState } from 'react';
import { SESSION } from '@/lib/config';

export type TimerPhase = 'idle' | 'active' | 'warning' | 'hardLimit';

type Options = {
  running: boolean;
  onWarning?: () => void;
  onHardLimit?: () => void;
};

export function useSessionTimer({ running, onWarning, onHardLimit }: Options) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const startRef = useRef<number | null>(null);
  const warnedRef = useRef(false);
  const limitedRef = useRef(false);

  useEffect(() => {
    if (!running) {
      startRef.current = null;
      warnedRef.current = false;
      limitedRef.current = false;
      setElapsedMs(0);
      return;
    }
    startRef.current = Date.now();
    const id = window.setInterval(() => {
      const now = Date.now();
      const elapsed = now - (startRef.current ?? now);
      setElapsedMs(elapsed);
      if (elapsed >= SESSION.WARNING_AT_MS && !warnedRef.current) {
        warnedRef.current = true;
        onWarning?.();
      }
      if (elapsed >= SESSION.HARD_LIMIT_MS && !limitedRef.current) {
        limitedRef.current = true;
        onHardLimit?.();
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [running, onWarning, onHardLimit]);

  let phase: TimerPhase = 'idle';
  if (running) {
    if (elapsedMs >= SESSION.HARD_LIMIT_MS) phase = 'hardLimit';
    else if (elapsedMs >= SESSION.WARNING_AT_MS) phase = 'warning';
    else phase = 'active';
  }

  const remainingMs = Math.max(0, SESSION.HARD_LIMIT_MS - elapsedMs);
  const totalSec = Math.floor(remainingMs / 1000);
  const mm = Math.floor(totalSec / 60);
  const ss = (totalSec % 60).toString().padStart(2, '0');

  return {
    elapsedMs,
    remainingMs,
    remainingFormatted: `${mm}:${ss}`,
    phase,
  };
}
