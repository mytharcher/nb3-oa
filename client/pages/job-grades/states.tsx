import { ApiClientError } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { Layers, Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { SessionExpiredAlert } from '#components/session-expired-alert';
import { Alert, AlertDescription, AlertAction } from '#components/ui/alert';
import { Button } from '#components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '#components/ui/empty';
import { Skeleton } from '#components/ui/skeleton';
export function Failure({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  const { t } = useTranslation();
  if (error instanceof ApiClientError && error.status === 401)
    return <SessionExpiredAlert />;
  const terminal =
    error instanceof ApiClientError && [403, 404].includes(error.status);
  return (
    <Alert variant='destructive'>
      <AlertDescription>
        {t(
          `jobGrades.${error instanceof ApiClientError && error.status === 403 ? 'privateDenied' : error instanceof ApiClientError && error.status === 404 ? 'notFound' : 'failed'}`,
        )}
      </AlertDescription>
      {!terminal && retry ? (
        <AlertAction>
          <Button variant='outline' onClick={retry}>
            {t('jobGrades.retry')}
          </Button>
        </AlertAction>
      ) : null}
    </Alert>
  );
}
export function Loading({
  kind = 'table',
}: {
  kind?: 'table' | 'form' | 'detail';
}) {
  const { t } = useTranslation();
  return (
    <div
      role='status'
      aria-label={t('jobGrades.loading')}
      className='flex flex-col gap-4'
    >
      {kind === 'detail' ? <Skeleton className='h-24 w-full' /> : null}
      {[0, 1, 2].map((row) => (
        <div key={row} className='grid grid-cols-3 gap-4'>
          {[0, 1, 2].map((column) => (
            <Skeleton
              key={column}
              className={kind === 'form' ? 'h-16 w-full' : 'h-10 w-full'}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
export function NoRows({
  filtered,
  action,
}: {
  filtered: boolean;
  action?: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <Empty className='min-h-48 border border-dashed'>
      <EmptyHeader>
        <EmptyMedia variant='icon'>
          {filtered ? <Search /> : <Layers />}
        </EmptyMedia>
        <EmptyTitle>
          {t(`jobGrades.${filtered ? 'noMatches' : 'empty'}`)}
        </EmptyTitle>
        <EmptyDescription>
          {t(
            `jobGrades.${filtered ? 'noMatchesDescription' : action ? 'emptyDescription' : 'emptyReadonly'}`,
          )}
        </EmptyDescription>
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  );
}
