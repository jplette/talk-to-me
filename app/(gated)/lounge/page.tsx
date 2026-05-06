// app/(gated)/lounge/page.tsx
'use client';

import { useState } from 'react';
import { LoungeShell } from '@/components/lounge/LoungeShell';
import { IdlePreStart } from '@/components/lounge/IdlePreStart';
import { StatusLine } from '@/components/lounge/StatusLine';
import { useT } from '@/lib/i18n/provider';

export default function LoungePage() {
  const { t } = useT();
  // Phase E: state only ever 'idle'. Phase G replaces this with real machine.
  const [state] = useState<'idle'>('idle');

  return (
    <LoungeShell>
      {state === 'idle' && (
        <>
          <IdlePreStart
            onStart={() => {
              // Phase G wires this up.
              console.log('start clicked');
            }}
          />
          <StatusLine text={t('lounge.status_idle')} variant="idle" />
        </>
      )}
    </LoungeShell>
  );
}
