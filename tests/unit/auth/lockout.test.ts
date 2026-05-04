import { describe, it, expect, beforeEach, vi } from 'vitest';
import { recordFailure, isLockedOut, resetLockout } from '@/lib/auth/lockout';

beforeEach(() => {
  resetLockout();
  vi.useRealTimers();
});

describe('lockout', () => {
  it('allows up to MAX_FAILURES attempts before locking', () => {
    for (let i = 0; i < 5; i++) {
      expect(isLockedOut('1.1.1.1')).toBe(false);
      recordFailure('1.1.1.1');
    }
    expect(isLockedOut('1.1.1.1')).toBe(true);
  });

  it('separates state per IP', () => {
    for (let i = 0; i < 5; i++) recordFailure('1.1.1.1');
    expect(isLockedOut('1.1.1.1')).toBe(true);
    expect(isLockedOut('2.2.2.2')).toBe(false);
  });

  it('lock expires after BLOCK_MS', () => {
    vi.useFakeTimers();
    const start = new Date('2026-01-01T00:00:00Z');
    vi.setSystemTime(start);

    for (let i = 0; i < 5; i++) recordFailure('1.1.1.1');
    expect(isLockedOut('1.1.1.1')).toBe(true);

    vi.setSystemTime(new Date(start.getTime() + 61_000));
    expect(isLockedOut('1.1.1.1')).toBe(false);
  });

  it('failures outside the WINDOW do not count', () => {
    vi.useFakeTimers();
    const start = new Date('2026-01-01T00:00:00Z');
    vi.setSystemTime(start);

    recordFailure('1.1.1.1'); // t=0
    vi.setSystemTime(new Date(start.getTime() + 11 * 60_000)); // t = 11min
    for (let i = 0; i < 4; i++) recordFailure('1.1.1.1');
    // 4 failures within window, 1 outside → not locked
    expect(isLockedOut('1.1.1.1')).toBe(false);
  });
});
