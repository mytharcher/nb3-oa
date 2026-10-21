import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '#components/ui/sheet';
import { useState, type ReactElement, type ReactNode } from 'react';
import { useAuthorizationTranslation } from '../i18n.js';
import { ConfirmDialog } from './confirm-dialog.js';

export function RuleDrawer({
  title,
  description,
  dirty = false,
  busy = false,
  onClose,
  children,
}: {
  title: string;
  description?: string;
  dirty?: boolean;
  busy?: boolean;
  onClose: () => void;
  children: ReactNode;
}): ReactElement {
  const t = useAuthorizationTranslation();
  const [discard, setDiscard] = useState(false);
  function close() {
    if (busy) return;
    if (dirty) setDiscard(true);
    else onClose();
  }
  return (
    <>
      <Sheet
        open
        onOpenChange={(open) => {
          if (!open) close();
        }}
      >
        <SheetContent className='w-full gap-0 data-[side=right]:sm:max-w-2xl'>
          <SheetHeader className='shrink-0 border-b p-6 pr-14'>
            <SheetTitle>{title}</SheetTitle>
            {description ? (
              <SheetDescription>{description}</SheetDescription>
            ) : null}
          </SheetHeader>
          <fieldset
            disabled={busy}
            className='flex min-h-0 min-w-0 flex-1 flex-col'
          >
            {children}
          </fieldset>
        </SheetContent>
      </Sheet>
      <ConfirmDialog
        open={discard}
        title={t('permissionWorkspace.discardTitle')}
        confirmLabel={t('permissionWorkspace.discard')}
        onCancel={() => setDiscard(false)}
        onConfirm={onClose}
      >
        {t('permissionWorkspace.discardBody')}
      </ConfirmDialog>
    </>
  );
}

export function RuleForm({
  children,
  footer,
}: {
  children: ReactNode;
  footer: ReactNode;
}): ReactElement {
  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      <div className='min-h-0 flex-1 flex flex-col gap-6 overflow-y-auto p-6 [&>section+section]:border-t [&>section+section]:pt-6'>
        {children}
      </div>
      <footer className='flex shrink-0 items-center justify-end gap-2 border-t bg-popover px-6 py-4'>
        {footer}
      </footer>
    </div>
  );
}
