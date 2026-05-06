// components/Footer.tsx
'use client';

import { LangToggle } from './LangToggle';
import { PrivacyDialog } from './PrivacyDialog';
import { useT } from '@/lib/i18n/provider';

export function Footer() {
  const { t } = useT();
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between md:px-10">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <PrivacyDialog />
          <span aria-hidden="true">·</span>
          <a href="/imprint" className="hover:text-foreground transition-colors">
            {t('footer.imprint')}
          </a>
        </div>
        <div className="flex items-center gap-2">
          <LangToggle />
          <span aria-hidden="true">·</span>
          <span>{year}</span>
        </div>
      </div>
    </footer>
  );
}
