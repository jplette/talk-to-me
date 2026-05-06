// lib/i18n/detect.ts
import type { Lang } from './messages';

const SUPPORTED: Lang[] = ['de', 'en'];

export function detectLanguage(acceptLanguage: string | null | undefined): Lang {
  if (!acceptLanguage) return 'de';
  const entries = acceptLanguage
    .split(',')
    .map((part) => {
      const [tagRaw, ...params] = part.split(';');
      const tag = tagRaw.trim().toLowerCase();
      const qParam = params.find((p) => p.trim().startsWith('q='));
      const q = qParam ? parseFloat(qParam.trim().slice(2)) : 1;
      return { tag, q: isNaN(q) ? 1 : q };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of entries) {
    const primary = tag.split('-')[0] as Lang;
    if (SUPPORTED.includes(primary)) return primary;
  }
  return 'de';
}
