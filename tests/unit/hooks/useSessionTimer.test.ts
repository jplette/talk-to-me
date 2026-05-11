// tests/unit/hooks/useSessionTimer.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSessionTimer } from '@/lib/hooks/useSessionTimer';

describe('useSessionTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts at 0 when not running', () => {
    const { result } = renderHook(() => useSessionTimer({ running: false }));
    expect(result.current.elapsedMs).toBe(0);
    expect(result.current.phase).toBe('idle');
  });

  it('counts up while running', () => {
    const { result } = renderHook(() => useSessionTimer({ running: true }));
    act(() => { vi.advanceTimersByTime(1500); });
    expect(result.current.elapsedMs).toBeGreaterThanOrEqual(1000);
    expect(result.current.phase).toBe('active');
  });

  it('emits warning at 3:30', () => {
    const onWarn = vi.fn();
    const { result } = renderHook(() =>
      useSessionTimer({ running: true, onWarning: onWarn })
    );
    act(() => { vi.advanceTimersByTime(210_000); });
    expect(result.current.phase).toBe('warning');
    expect(onWarn).toHaveBeenCalledOnce();
  });

  it('emits goodbye at 3:55', () => {
    const onGoodbye = vi.fn();
    const { result } = renderHook(() =>
      useSessionTimer({ running: true, onGoodbye })
    );
    act(() => { vi.advanceTimersByTime(235_000); });
    expect(onGoodbye).toHaveBeenCalledOnce();
    expect(result.current.phase).toBe('warning');
  });

  it('emits hardLimit at 4:00', () => {
    const onLimit = vi.fn();
    const { result } = renderHook(() =>
      useSessionTimer({ running: true, onHardLimit: onLimit })
    );
    act(() => { vi.advanceTimersByTime(240_000); });
    expect(result.current.phase).toBe('hardLimit');
    expect(onLimit).toHaveBeenCalledOnce();
  });

  it('formats mm:ss', () => {
    const { result } = renderHook(() => useSessionTimer({ running: true }));
    act(() => { vi.advanceTimersByTime(75_000); });
    // 75s remaining-style: hook returns countdown from HARD_LIMIT_MS
    expect(result.current.remainingFormatted).toMatch(/^\d:\d{2}$/);
  });
});
