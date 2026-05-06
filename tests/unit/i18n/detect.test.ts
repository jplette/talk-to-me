// tests/unit/i18n/detect.test.ts
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { detectLanguage } from '@/lib/i18n/detect';

describe('detectLanguage', () => {
  it('returns de for null/empty', () => {
    expect(detectLanguage(null)).toBe('de');
    expect(detectLanguage('')).toBe('de');
  });
  it('returns de for de-DE/de-AT/de-CH', () => {
    expect(detectLanguage('de-DE,en;q=0.9')).toBe('de');
    expect(detectLanguage('de-AT,de;q=0.9')).toBe('de');
    expect(detectLanguage('de')).toBe('de');
  });
  it('returns en for en-US/en-GB', () => {
    expect(detectLanguage('en-US,en;q=0.9,de;q=0.8')).toBe('en');
    expect(detectLanguage('en-GB')).toBe('en');
  });
  it('falls back to de for unsupported lang', () => {
    expect(detectLanguage('fr-FR,fr;q=0.9')).toBe('de');
    expect(detectLanguage('ja-JP')).toBe('de');
  });
  it('respects q-weighting (en before de)', () => {
    expect(detectLanguage('en;q=0.9, de;q=0.5')).toBe('en');
    expect(detectLanguage('de;q=0.9, en;q=0.5')).toBe('de');
  });
});
