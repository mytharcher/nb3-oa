import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { Link, useLocation } from 'react-router';
import { FileDown } from 'lucide-react';
import { Button } from '#components/ui/button';

/** Only authorized, freshly readable business details expose their own print child. */
export function PrintEntry({
  source,
  readable,
}: {
  source:
    'leave' | 'reimbursement' | 'payment' | 'contracts' | 'sealRegistration';
  readable: boolean;
}) {
  const { t } = useTranslation();
  const location = useLocation();
  const use = useCan({
    resource: { type: 'composite', id: 'oa.templatePrint' },
    action: 'use',
  });
  const print = useCan({
    resource: { type: 'composite', id: 'oa.templatePrint' },
    action: `print${source[0].toUpperCase()}${source.slice(1)}`,
  });
  if (
    !readable ||
    !use.can ||
    !print.can ||
    use.isPending ||
    print.isPending ||
    use.error ||
    print.error
  )
    return null;
  return (
    <Button
      data-print-source-focus
      variant='outline'
      nativeButton={false}
      render={
        <Link
          to={{
            pathname: 'print',
            search: location.search,
            hash: location.hash,
          }}
        />
      }
    >
      <FileDown />
      {t('templatePrintUI.printTitle')}
    </Button>
  );
}
