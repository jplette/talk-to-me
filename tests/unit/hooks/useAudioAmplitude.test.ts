// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { applyEma } from '@/lib/hooks/useAudioAmplitude';

describe('useAudioAmplitude math', () => {
  it('applyEma α=0.2 averages', () => {
    let v = 0;
    v = applyEma(v, 1, 0.2);
    expect(v).toBeCloseTo(0.2, 5);
    v = applyEma(v, 1, 0.2);
    expect(v).toBeCloseTo(0.36, 5);
  });
  it('applyEma converges to target', () => {
    let v = 0;
    for (let i = 0; i < 50; i++) v = applyEma(v, 0.7, 0.2);
    expect(v).toBeCloseTo(0.7, 3);
  });
});
