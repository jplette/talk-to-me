// components/lounge/ConnectFailRecovery.tsx
'use client';

import { useState } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/provider';

type Props = { onRetry: () => void };

export function ConnectFailRecovery({ onRetry }: Props) {
  const [attempts, setAttempts] = useState(0);
  const { t } = useT();
  return (
    <section className="flex flex-col items-center gap-4 text-center">
      <X className="h-8 w-8 text-destructive" strokeWidth={1.5} aria-hidden />
      <h3 className="text-2xl font-semibold text-foreground">
        {t('error.connect_fail_heading')}
      </h3>
      <p className="text-base text-muted-foreground max-w-[40ch]">
        {t('error.connect_fail_lede')}
      </p>
      <Button
        onClick={() => {
          setAttempts((n) => n + 1);
          onRetry();
        }}
        className="gap-1.5"
      >
        {t('error.connect_fail_action')}
        <RefreshCw className="h-4 w-4" strokeWidth={1.5} />
      </Button>
      {attempts >= 3 && (
        <a
          href="mailto:jonathan@plettenberg.org"
          className="text-[13px] text-muted-foreground/80 underline-offset-2 hover:underline"
        >
          {t('error.connect_fail_mailto')}
        </a>
      )}
    </section>
  );
}
