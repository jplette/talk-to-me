// components/lounge/MicPermissionRecovery.tsx
'use client';

import { MicOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/provider';

export function MicPermissionRecovery() {
  const { t } = useT();
  return (
    <section className="flex flex-col items-center gap-4 text-center">
      <MicOff className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} aria-hidden />
      <h3 className="text-2xl font-semibold text-foreground">
        {t('error.mic_denied_heading')}
      </h3>
      <p className="text-base text-muted-foreground max-w-[40ch]">
        {t('error.mic_denied_lede')}
      </p>
      <Button onClick={() => location.reload()} className="gap-1.5">
        {t('error.mic_denied_action')}
        <RefreshCw className="h-4 w-4" strokeWidth={1.5} />
      </Button>
      <p className="text-[13px] text-muted-foreground/80 max-w-[40ch]">
        {t('error.mic_denied_caption')}
      </p>
    </section>
  );
}
