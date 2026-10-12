import { ApiClientError } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactNode } from 'react';
import { FileText } from 'lucide-react';
import { SessionExpiredAlert } from '#components/session-expired-alert';
import { Alert, AlertDescription, AlertAction } from '#components/ui/alert';
import { Button } from '#components/ui/button';
import { Skeleton } from '#components/ui/skeleton';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '#components/ui/empty';
import { FileMismatch } from './command.js';
import { DownloadError } from './download.js';
function errorKey(error: unknown) {
  if (error instanceof FileMismatch) return 'fileDoesNotMatch';
  if (error instanceof DownloadError) return error.reason;
  if (error instanceof ApiClientError) {
    if (error.status === 403) return 'forbidden';
    if (error.status === 404) return 'missing';
    if (error.status === 409) return 'conflict';
    if (error.reason === 'PRINT_SOURCE_UNAVAILABLE') return 'sourceUnavailable';
    if (error.status === 400) return 'invalid';
  }
  return 'failed';
}
export function ErrorState({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  const { t } = useTranslation();
  if (error instanceof ApiClientError && error.status === 401)
    return <SessionExpiredAlert />;
  const key = errorKey(error);
  return (
    <Alert variant='destructive'>
      <AlertDescription>{t(`templatePrintUI.${key}`)}</AlertDescription>
      {retry && ['failed', 'conflict'].includes(key) ? (
        <AlertAction>
          <Button variant='outline' onClick={retry}>
            {t('templatePrintUI.retry')}
          </Button>
        </AlertAction>
      ) : null}
    </Alert>
  );
}
export function Loading() {
  const { t } = useTranslation();
  return (
    <div
      role='status'
      aria-label={t('templatePrintUI.loading')}
      className='flex flex-col gap-4'
    >
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className='h-10 w-full' />
      ))}
    </div>
  );
}
export function EmptyState({
  filtered = false,
  action,
  use = false,
}: {
  filtered?: boolean;
  action?: ReactNode;
  use?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Empty className='min-h-48 border border-dashed'>
      <EmptyHeader>
        <EmptyMedia variant='icon'>
          <FileText />
        </EmptyMedia>
        <EmptyTitle>
          {t(
            `templatePrintUI.${use ? 'noUsable' : filtered ? 'noResults' : 'empty'}`,
          )}
        </EmptyTitle>
        {!use ? (
          <EmptyDescription>
            {t(
              `templatePrintUI.${filtered ? 'noResultsDescription' : 'emptyDescription'}`,
            )}
          </EmptyDescription>
        ) : null}
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  );
}
