import { ApiClientError } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { AlertCircleIcon } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';

import { SessionExpiredAlert } from '#components/session-expired-alert';
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from '#components/ui/alert';
import { Badge } from '#components/ui/badge';
import { Button } from '#components/ui/button';
import { Skeleton } from '#components/ui/skeleton';

/**
 * A failed load, by status (guideline S4): 401 offers signing in again, 403 and 404 explain without "Retry", anything
 * else offers "Retry".
 */
export function LoadError({
  error,
  title,
  onRetry,
  notFound,
}: {
  readonly error: unknown;
  readonly title: string;
  readonly onRetry: () => void;
  /** What to say for a 404, with its next step. */
  readonly notFound?: ReactNode;
}): ReactElement {
  const { t } = useTranslation();
  if (error instanceof ApiClientError && error.status === 401)
    return <SessionExpiredAlert />;
  const status = error instanceof ApiClientError ? error.status : undefined;
  const final = status === 403 || status === 404;
  return (
    <Alert variant='destructive'>
      <AlertCircleIcon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {status === 404
          ? (notFound ?? t('org.errors.notFound'))
          : status === 403
            ? t('org.errors.forbidden')
            : t('org.errors.requestFailed')}
      </AlertDescription>
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

/** Enabled or disabled, as text in a Badge (guideline T1.4). */
export function ActiveBadge({
  active,
}: {
  readonly active: boolean;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <Badge variant={active ? 'secondary' : 'outline'}>
      {active ? t('org.common.active') : t('org.common.inactive')}
    </Badge>
  );
}

/** Skeleton rows shaped like a table (guideline S1). */
export function TableSkeleton({
  rows = 5,
}: {
  readonly rows?: number;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <div
      role='status'
      aria-label={t('status.loading')}
      className='overflow-hidden rounded-lg border'
    >
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className='flex items-center gap-4 border-b px-4 py-3 last:border-b-0'
        >
          <Skeleton className='h-4 w-40' />
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-5 w-16 rounded-full' />
          <Skeleton className='ml-auto h-4 w-8' />
        </div>
      ))}
    </div>
  );
}

/** Field skeletons for a form that loads its record first. */
export function FormSkeleton({
  fields,
}: {
  readonly fields: number;
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
          <Skeleton className='h-4 w-16' />
          <Skeleton className='h-8 w-full' />
        </div>
      ))}
    </div>
  );
}

/** A required field's mark (guideline T3.2). */
export function RequiredMark(): ReactElement {
  return (
    <span aria-hidden='true' className='text-destructive'>
      *
    </span>
  );
}
