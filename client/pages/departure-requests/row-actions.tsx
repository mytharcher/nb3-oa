import { Link, useLocation } from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import { Button } from '#components/ui/button';
import type { DepartureRecord } from './types.js';
/** Editing needs a fresh lifecycle offer; the list offers only the non-destructive detail link. */
export function DepartureRowActions({
  record,
  disabled,
}: {
  record: DepartureRecord;
  disabled: boolean;
}) {
  const { t } = useTranslation(),
    location = useLocation();
  return (
    <Button
      variant='ghost'
      size='sm'
      disabled={disabled}
      nativeButton={false}
      render={<Link to={{ pathname: record.id, search: location.search }} />}
    >
      {t('approvals.detail')}
    </Button>
  );
}
