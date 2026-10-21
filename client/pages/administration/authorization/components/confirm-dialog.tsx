import { Alert, AlertDescription } from '#components/ui/alert';
import { Spinner } from '#components/ui/spinner';
import { useRef, type ReactElement, type ReactNode } from 'react';

import { useAuthorizationTranslation } from '../i18n.js';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '#components/ui/alert-dialog';

/**
 * The one confirmation every destructive action in this module goes through.
 * The body names what is about to happen and to what; cancel holds the focus
 * when it opens, and Escape leaves without doing anything.
 */
export function ConfirmDialog({
  open,
  title,
  confirmLabel,
  cancelLabel,
  busy = false,
  error,
  variant = 'destructive',
  children,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  /** What the confirm button does, named as the action rather than as "OK". */
  confirmLabel: string;
  cancelLabel?: string;
  busy?: boolean;
  error?: ReactNode;
  variant?: 'default' | 'destructive';
  /** The body: what is about to happen, and to what. */
  children: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}): ReactElement {
  const t = useAuthorizationTranslation();
  const cancelRef = useRef<HTMLButtonElement>(null);
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !busy) onCancel();
      }}
    >
      <AlertDialogContent initialFocus={cancelRef}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{children}</AlertDialogDescription>
        </AlertDialogHeader>
        {error ? (
          <Alert variant='destructive'>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel ref={cancelRef} disabled={busy}>
            {cancelLabel ?? t('common.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            variant={variant}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {busy ? <Spinner data-icon='inline-start' /> : null}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
