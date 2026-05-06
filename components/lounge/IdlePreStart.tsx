// components/lounge/IdlePreStart.tsx
'use client';

import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/provider';

type Props = { onStart: () => void };

export function IdlePreStart({ onStart }: Props) {
  const { t } = useT();
  return (
    <section className="flex flex-col items-center gap-6 text-center">
      <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-[32px]">
        {t('lounge.idle_heading')}
      </h2>
      <p className="text-base leading-snug text-muted-foreground max-w-[40ch]">
        {t('lounge.idle_lede')}
      </p>
      <Button size="lg" onClick={onStart} className="w-full sm:w-auto">
        {t('lounge.idle_cta')}
        <ArrowRight className="ml-1 h-4 w-4" strokeWidth={1.5} />
      </Button>
      <p className="text-xs text-muted-foreground">{t('lounge.idle_caption')}</p>
    </section>
  );
}
