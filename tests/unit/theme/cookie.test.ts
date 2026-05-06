// tests/unit/theme/cookie.test.ts
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readThemeCookie, serializeThemeCookie } from '@/lib/theme/cookie';

describe('theme cookie', () => {
  it('parses light/dark', () => {
    expect(readThemeCookie('light')).toBe('light');
    expect(readThemeCookie('dark')).toBe('dark');
  });
  it('returns null for missing/invalid', () => {
    expect(readThemeCookie(undefined)).toBe(null);
    expect(readThemeCookie('')).toBe(null);
    expect(readThemeCookie('greenpink')).toBe(null);
  });
  it('serializes with samesite=lax max-age 1y', () => {
    const s = serializeThemeCookie('dark');
    expect(s).toContain('tt_theme=dark');
    expect(s.toLowerCase()).toContain('samesite=lax');
    expect(s).toContain('max-age=31536000');
  });
});
