import { useTranslation } from '@nocobase/i18n/client';
import { AlertCircleIcon } from 'lucide-react';
import type { ReactElement } from 'react';

import { SessionExpiredAlert } from '@/components/session-expired-alert';
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { statusOf } from './errors.js';

/**
 * A failed load (guideline S4): 401 offers signing in again, 403 and 404 explain without "Retry", anything else
 * offers "Retry".
 */
export function LoadErrorAlert({
  error,
  title,
  onRetry,
  notFoundMessage,
}: {
  readonly error: unknown;
  readonly title?: string;
  readonly onRetry: () => void;
  readonly notFoundMessage?: string;
}): ReactElement {
  const { t } = useTranslation();
  const status = statusOf(error);
  if (status === 401) return <SessionExpiredAlert />;
  const final = status === 403 || status === 404;
  const message =
    status === 403
      ? t('platform.common.forbidden')
      : status === 404
        ? (notFoundMessage ?? t('platform.common.notFound'))
        : t('platform.common.loadFailed');
  return (
    <Alert variant='destructive'>
      <AlertCircleIcon />
      {title ? <AlertTitle>{title}</AlertTitle> : null}
      <AlertDescription>{message}</AlertDescription>
      {final ? null : (
        <AlertAction>
          <Button variant='outline' size='sm' onClick={onRetry}>
            {t('status.retry')}
          </Button>
        </AlertAction>
      )}
    </Alert>
  );
}

/** Skeleton rows shaped like a table (guideline S1). */
export function TableSkeleton({
  rows = 5,
  columns = 4,
}: {
  readonly rows?: number;
  readonly columns?: number;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <div
      role='status'
      aria-label={t('status.loading')}
      className='overflow-hidden rounded-lg border'
    >
      {Array.from({ length: rows }, (_, row) => (
        <div
          key={row}
          className='flex items-center gap-4 border-b px-4 py-3 last:border-b-0'
        >
          {Array.from({ length: columns }, (_, column) => (
            <Skeleton
              key={column}
              className={column === 0 ? 'h-4 w-32' : 'h-4 w-20'}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Skeleton of a form card's fields. */
export function FieldsSkeleton({
  fields = 2,
}: {
  readonly fields?: number;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <div
      role='status'
      aria-label={t('status.loading')}
      className='flex flex-col gap-5'
    >
      {Array.from({ length: fields }, (_, index) => (
        <div key={index} className='flex flex-col gap-2'>
          <Skeleton className='h-4 w-20' />
          <Skeleton className='h-8 w-full' />
        </div>
      ))}
    </div>
  );
}
