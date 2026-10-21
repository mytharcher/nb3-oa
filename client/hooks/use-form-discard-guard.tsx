import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '#components/ui/alert-dialog';
import { Button } from '#components/ui/button';

/** One guard for every user close path. Successful saves call their completion
 * callback directly rather than asking to discard a saved form. */
export function useFormDiscardGuard(dirty: boolean, busy: boolean) {
  const { t } = useTranslation('nb3-oa');
  const [open, setOpen] = useState(false);
  const pendingRef = useRef<{
    promise: Promise<boolean>;
    resolve: (allowed: boolean) => void;
  } | null>(null);
  useEffect(() => () => pendingRef.current?.resolve(false), []);
  function settle(allowed: boolean) {
    pendingRef.current?.resolve(allowed);
    pendingRef.current = null;
    setOpen(false);
  }
  function beforeClose(): boolean | Promise<boolean> {
    if (busy) return false;
    if (!dirty) return true;
    if (pendingRef.current) return pendingRef.current.promise;
    let resolveClose!: (allowed: boolean) => void;
    const promise = new Promise<boolean>((resolve) => {
      resolveClose = resolve;
    });
    pendingRef.current = { promise, resolve: resolveClose };
    setOpen(true);
    return promise;
  }
  async function requestClose(onClose: () => void) {
    if (await beforeClose()) onClose();
  }
  const confirmation = (
    <AlertDialog open={open} onOpenChange={(next) => !next && settle(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('formDrawer.discardTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('formDrawer.discardDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {t('formDrawer.continueEditing')}
          </AlertDialogCancel>
          <Button variant='destructive' onClick={() => settle(true)}>
            {t('actions.discard')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
  return { beforeClose, requestClose, confirmation };
}
