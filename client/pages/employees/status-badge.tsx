import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import { Badge } from '@/components/ui/badge';

import type { EmployeeStatus } from './types.js';

const VARIANTS: Record<
  EmployeeStatus,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  probation: 'secondary',
  regular: 'default',
  leaving: 'outline',
  left: 'destructive',
};

/** An employee status as text in a Badge; the color only supports the text (guideline T1.4). */
export function EmployeeStatusBadge({
  status,
}: {
  readonly status: EmployeeStatus | undefined;
}): ReactElement {
  const { t } = useTranslation();
  if (!status) return <span className='text-muted-foreground'>—</span>;
  return (
    <Badge variant={VARIANTS[status]}>{t(`employees.status.${status}`)}</Badge>
  );
}
