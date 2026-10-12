import { useState } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import { Printer } from 'lucide-react';
import { Button } from '#components/ui/button';
import { printSurface } from '#lib/print-surface';

export function PrintSurfaceButton({
  disabled = false,
}: {
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <>
      <Button
        type='button'
        variant='outline'
        disabled={disabled || busy}
        onClick={async (event) => {
          const overlay = event.currentTarget.closest<HTMLElement>(
            '[data-slot="route-overlay-content"]',
          );
          if (!overlay) return;
          setBusy(true);
          setFailed(false);
          try {
            await printSurface(overlay);
          } catch {
            setFailed(true);
          } finally {
            setBusy(false);
          }
        }}
      >
        <Printer />
        {t('approvals.printPdf')}
      </Button>
      {failed ? <span role='alert'>{t('approvals.printFailed')}</span> : null}
    </>
  );
}
