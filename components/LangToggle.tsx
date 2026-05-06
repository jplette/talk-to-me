// components/LangToggle.tsx
'use client';

import { useT } from '@/lib/i18n/provider';
import { cn } from '@/lib/utils';

export function LangToggle() {
  const { lang, setLang } = useT();
  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <button
        type="button"
        onClick={() => setLang('de')}
        className={cn(
          'transition-colors',
          lang === 'de'
            ? 'text-foreground font-medium'
            : 'text-muted-foreground hover:text-foreground'
        )}
        aria-pressed={lang === 'de'}
      >
        DE
      </button>
      <span className="text-muted-foreground/60" aria-hidden="true">|</span>
      <button
        type="button"
        onClick={() => setLang('en')}
        className={cn(
          'transition-colors',
          lang === 'en'
            ? 'text-foreground font-medium'
            : 'text-muted-foreground hover:text-foreground'
        )}
        aria-pressed={lang === 'en'}
      >
        EN
      </button>
    </span>
  );
}
