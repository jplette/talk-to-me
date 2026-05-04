import { describe, it, expect } from 'vitest';
import { verifyPassword } from '@/lib/auth/password';

describe('verifyPassword', () => {
  it('returns true for matching password', () => {
    expect(verifyPassword('secret123', 'secret123')).toBe(true);
  });

  it('returns false for non-matching password', () => {
    expect(verifyPassword('wrong', 'secret123')).toBe(false);
  });

  it('returns false for different lengths (avoiding timing leak)', () => {
    expect(verifyPassword('short', 'much-longer-password')).toBe(false);
  });

  it('returns false for empty input', () => {
    expect(verifyPassword('', 'secret123')).toBe(false);
  });

  it('returns false when expected is empty (defensive)', () => {
    expect(verifyPassword('anything', '')).toBe(false);
  });
});
