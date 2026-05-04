import { LOCKOUT } from '@/lib/config';

type Entry = {
  failures: number[];   // timestamps in ms
  blockedUntil?: number;
};

const state = new Map<string, Entry>();

export function recordFailure(ip: string): void {
  const now = Date.now();
  const entry = state.get(ip) ?? { failures: [] };

  // prune failures outside the window
  entry.failures = entry.failures.filter(
    (t) => now - t <= LOCKOUT.WINDOW_MS
  );
  entry.failures.push(now);

  if (entry.failures.length >= LOCKOUT.MAX_FAILURES) {
    entry.blockedUntil = now + LOCKOUT.BLOCK_MS;
    entry.failures = []; // reset window after lock
  }

  state.set(ip, entry);
}

export function isLockedOut(ip: string): boolean {
  const entry = state.get(ip);
  if (!entry?.blockedUntil) return false;
  if (Date.now() >= entry.blockedUntil) {
    delete entry.blockedUntil;
    return false;
  }
  return true;
}

/** Test-only helper. */
export function resetLockout(): void {
  state.clear();
}
