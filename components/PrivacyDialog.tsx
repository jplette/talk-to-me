// components/PrivacyDialog.tsx
'use client';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/provider';

export function PrivacyDialog() {
  const { t } = useT();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="hover:text-foreground transition-colors"
        >
          {t('footer.privacy')}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('privacy.dialog_title')}</DialogTitle>
          <DialogDescription className="pt-2 text-sm leading-relaxed">
            {t('privacy.dialog_body')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="default">{t('privacy.dialog_close')}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
