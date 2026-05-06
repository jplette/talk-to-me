// lib/theme/cookie.ts
export type Theme = 'light' | 'dark';

export function readThemeCookie(value: string | undefined): Theme | null {
  if (value === 'light' || value === 'dark') return value;
  return null;
}

export function serializeThemeCookie(theme: Theme): string {
  return `tt_theme=${theme}; path=/; max-age=31536000; samesite=lax`;
}
