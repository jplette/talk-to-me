// components/lounge/VoiceIndicator.tsx
'use client';

import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

export type VoiceState =
  | 'idle' | 'connecting'
  | 'listening' | 'speaking'
  | 'warning' | 'ending';

type Props = {
  state: VoiceState;
  amplitude?: number;
  width?: number;
  reducedMotion?: boolean;
};

const N = 80;
const AMP_MAX = 36;
const LERP = 0.18;

const ARIA_LABEL: Record<VoiceState, string> = {
  idle: 'Voice activity: idle',
  connecting: 'Connecting',
  listening: 'Voice activity: listening',
  speaking: 'Voice activity: speaking',
  warning: 'Voice activity: warning, 30 seconds left',
  ending: 'Voice activity: ending',
};

export function VoiceIndicator({
  state,
  amplitude = 0,
  width = 320,
  reducedMotion: rmProp,
}: Props) {
  const pathRef = useRef<SVGPathElement>(null);
  const stateRef = useRef(state);
  const ampRef = useRef(amplitude);
  const phaseRef = useRef(0);
  const pointsRef = useRef<number[]>(new Array(N).fill(0));
  const targetsRef = useRef<number[]>(new Array(N).fill(0));
  const reducedMotion =
    rmProp ?? (typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

  // Keep refs in sync (avoid re-mounting RAF on every state/amplitude tick)
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { ampRef.current = amplitude; }, [amplitude]);

  useEffect(() => {
    if (reducedMotion) return;
    if (state === 'connecting') return;

    let raf = 0;
    const tick = () => {
      phaseRef.current += 0.045;
      const s = stateRef.current;
      const a = ampRef.current;

      // base amplitude per state (driven by RMS where applicable)
      let baseAmp: number;
      if (s === 'idle') baseAmp = 1.5;
      else if (s === 'listening') baseAmp = 4 + a * 28;
      else if (s === 'speaking') baseAmp = 4 + a * 32;
      else if (s === 'warning') baseAmp = 4 + a * 24;
      else baseAmp = 0.5; // ending

      if (Math.random() < 0.32) {
        for (let i = 0; i < N; i++) {
          const x = i / (N - 1);
          const fx = (x - 0.5) * 2;
          const env = Math.cos((fx * Math.PI) / 2);
          let y = 0;
          if (s === 'idle') {
            y = Math.sin(phaseRef.current * 0.6 + x * 1.4) * baseAmp * env;
          } else if (s === 'listening') {
            const v =
              Math.sin(x * 6 + phaseRef.current * 3.4) * 0.6 +
              Math.sin(x * 13 + phaseRef.current * 1.8) * 0.4;
            y = -Math.abs(v) * baseAmp * env - Math.random() * baseAmp * 0.15;
          } else if (s === 'speaking' || s === 'warning') {
            y =
              (Math.sin(x * 7 + phaseRef.current * 3.0) * 0.55 +
                Math.sin(x * 17 + phaseRef.current * 5.1) * 0.3 +
                (Math.random() - 0.5) * 0.45) *
              baseAmp *
              env;
          } else {
            y = Math.sin(phaseRef.current * 0.4 + x * 1.0) * baseAmp * env;
          }
          targetsRef.current[i] = y;
        }
      }

      let d = '';
      for (let i = 0; i < N; i++) {
        pointsRef.current[i] +=
          (targetsRef.current[i] - pointsRef.current[i]) * LERP;
        const x = -width / 2 + (i / (N - 1)) * width;
        const y = pointsRef.current[i];
        d += (i === 0 ? 'M ' : ' L ') + x.toFixed(2) + ' ' + y.toFixed(2);
      }
      if (pathRef.current) pathRef.current.setAttribute('d', d);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [width, reducedMotion, state]);

  if (state === 'connecting') {
    return (
      <div
        role="img"
        aria-label={ARIA_LABEL.connecting}
        className="flex h-24 w-full items-center justify-center"
      >
        <Loader2
          className="h-6 w-6 animate-spin text-muted-foreground"
          strokeWidth={1.5}
        />
      </div>
    );
  }

  if (reducedMotion) {
    const dotClass =
      state === 'listening'
        ? 'bg-foreground'
        : state === 'speaking'
        ? 'bg-[var(--jk-flame)]'
        : state === 'warning'
        ? 'bg-[var(--warn)]'
        : 'bg-muted-foreground';
    return (
      <div
        role="img"
        aria-label={ARIA_LABEL[state]}
        className="flex h-24 w-full items-center justify-center"
      >
        <span
          data-testid="reduced-motion-indicator"
          className={`inline-block h-2 w-2 rounded-full ${dotClass}`}
        />
      </div>
    );
  }

  const strokeColor =
    state === 'warning'
      ? 'var(--warn)'
      : 'currentColor';

  return (
    <svg
      role="img"
      aria-label={ARIA_LABEL[state]}
      viewBox={`-${width / 2} -48 ${width} 96`}
      className="h-24 w-full max-w-[320px] text-foreground"
      preserveAspectRatio="none"
      style={{ opacity: state === 'ending' ? 0.25 : 1, transition: 'opacity 320ms var(--ease-out)' }}
    >
      <path
        ref={pathRef}
        data-testid="scope-path"
        d={`M -${width / 2} 0 L ${width / 2} 0`}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ willChange: 'd' }}
      />
    </svg>
  );
}
