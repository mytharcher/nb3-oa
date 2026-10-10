import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import { Badge } from '@/components/ui/badge';

import type { CalendarDayKind } from '../shared/types.js';

const VARIANT: Record<CalendarDayKind, 'default' | 'secondary' | 'outline'> = {
  holiday: 'secondary',
  weekend: 'outline',
  adjustedWorkday: 'default',
  workday: 'outline',
};

/** A day's kind as text in a Badge; the variant only supports the text (guideline T1.4). */
export function DayKindBadge({
  kind,
}: {
  readonly kind: CalendarDayKind;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <Badge variant={VARIANT[kind]}>
      {t(`platform.calendar.kinds.${kind}`)}
    </Badge>
  );
}
