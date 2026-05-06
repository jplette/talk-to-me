'use client';

import { useEffect, useRef, useState } from 'react';

export function applyEma(prev: number, target: number, alpha: number): number {
  return prev + alpha * (target - prev);
}

/**
 * Polls a 0-1 volume getter via requestAnimationFrame at ~30 Hz and
 * EMA-smooths the result. Designed for `conv.getInputVolume()` /
 * `conv.getOutputVolume()` from @elevenlabs/react.
 */
export function useAudioAmplitude(
  getter: (() => number) | null,
  enabled: boolean,
): number {
  const [amp, setAmp] = useState(0);
  const ampRef = useRef(0);

  useEffect(() => {
    if (!enabled || !getter) {
      ampRef.current = 0;
      setAmp(0);
      return;
    }
    let raf = 0;
    let lastTick = 0;

    const tick = (t: number) => {
      if (t - lastTick >= 33) {
        lastTick = t;
        let target = 0;
        try {
          target = Math.max(0, Math.min(1, getter()));
        } catch {
          target = 0;
        }
        ampRef.current = applyEma(ampRef.current, target, 0.2);
        setAmp(ampRef.current);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [getter, enabled]);

  return amp;
}
