import { Button } from '#components/ui/button';
import { useNavigationGuard } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useEffect, useRef, useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '#components/ui/alert-dialog';

/** Application navigation uses an accessible synchronous guard; beforeunload remains browser-owned. */
export function useDiscardGuard(
  dirty: boolean,
  blocked: boolean,
  committed: boolean,
) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const approvedRef = useRef(false);
  useEffect(() => {
    const revoke = () => {
      approvedRef.current = false;
    };
    document.addEventListener('input', revoke, true);
    document.addEventListener('change', revoke, true);
    return () => {
      document.removeEventListener('input', revoke, true);
      document.removeEventListener('change', revoke, true);
    };
  }, []);
  const finish = (allowed: boolean) => {
    approvedRef.current = allowed;
    setOpen(false);
  };
  useNavigationGuard(() => {
    if (committed) return true;
    if (blocked) return false;
    if (!dirty) return true;
    if (approvedRef.current) {
      approvedRef.current = false;
      return true;
    }
    setOpen(true);
    return false;
  });
  return (
    <AlertDialog
      open={open}
      onOpenChange={(value) => {
        if (!value) finish(false);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('approvals.discard')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('purchases.discardThenNavigate')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
          <Button onClick={() => finish(true)}>
            {t('approvals.discardConfirm')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
