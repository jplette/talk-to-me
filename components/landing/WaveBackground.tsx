// components/landing/WaveBackground.tsx
'use client';

import { useEffect, useRef } from 'react';

const WAVES = [
  { freq: 0.0065, amp: 32, speed: 0.28, phase: 0,    yRatio: 0.18 },
  { freq: 0.0100, amp: 20, speed: 0.45, phase: 2.1,  yRatio: 0.35 },
  { freq: 0.0050, amp: 48, speed: 0.20, phase: 4.3,  yRatio: 0.52 },
  { freq: 0.0130, amp: 16, speed: 0.58, phase: 1.4,  yRatio: 0.68 },
  { freq: 0.0080, amp: 26, speed: 0.34, phase: 3.6,  yRatio: 0.84 },
] as const;

// Opacity per wave — middle wave most prominent
const OPACITIES = [0.11, 0.15, 0.20, 0.15, 0.11] as const;

export function WaveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf: number;
    let startTime: number | null = null;

    const resize = () => {
      const dpr = window.devicePixelRatio;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    };

    window.addEventListener('resize', resize);
    resize();

    const draw = (now: number) => {
      if (!startTime) startTime = now;
      const t = (now - startTime) / 1000;

      const dpr = window.devicePixelRatio;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      WAVES.forEach((wave, i) => {
        const yBase = wave.yRatio * h;
        const isCenter = i === 2;

        ctx.beginPath();
        ctx.strokeStyle = `rgba(239,131,84,${OPACITIES[i]})`;
        ctx.lineWidth = isCenter ? 1.5 : 1;

        if (isCenter) {
          ctx.shadowColor = 'rgba(239,131,84,0.25)';
          ctx.shadowBlur = 8;
        }

        for (let x = 0; x <= w; x += 4) {
          const y = yBase + Math.sin(x * wave.freq + t * wave.speed + wave.phase) * wave.amp;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      ctx.restore();
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}
