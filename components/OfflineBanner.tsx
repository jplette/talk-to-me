// components/OfflineBanner.tsx
'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus';
import { useT } from '@/lib/i18n/provider';

export function OfflineBanner() {
  const online = useNetworkStatus();
  const wasOffline = useRef(false);
  const { t } = useT();

  useEffect(() => {
    if (!online) {
      wasOffline.current = true;
    } else if (online && wasOffline.current) {
      wasOffline.current = false;
      toast.success(t('error.online_back'));
    }
  }, [online, t]);

  if (online) return null;
  return (
    <div
      role="status"
      className="sticky top-14 z-40 w-full bg-[color-mix(in_oklab,var(--warn)_15%,var(--background))] border-b border-[color-mix(in_oklab,var(--warn)_30%,var(--border))] px-6 py-3 text-sm text-foreground text-center"
    >
      {t('error.offline')}
    </div>
  );
}
