import { ApiClientError } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { Link, useLocation } from 'react-router';
import { SessionExpiredAlert } from '#components/session-expired-alert';
import { Alert, AlertDescription } from '#components/ui/alert';
import { Button } from '#components/ui/button';
import { Skeleton } from '#components/ui/skeleton';
export function Failure({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  const { t } = useTranslation(),
    location = useLocation();
  if (error instanceof ApiClientError && error.status === 401)
    return <SessionExpiredAlert />;
  const status = error instanceof ApiClientError ? error.status : 0;
  return (
    <Alert variant='destructive'>
      <AlertDescription>
        {t(
          status === 403
            ? 'announcements.denied'
            : status === 404
              ? 'announcements.missing'
              : status === 409
                ? 'announcements.conflict'
                : 'announcements.failed',
        )}
      </AlertDescription>
      {[403, 404].includes(status) ? (
        <Button
          variant='outline'
          nativeButton={false}
          render={
            <Link
              to={{
                pathname: '..',
                search: location.search,
                hash: location.hash,
              }}
            />
          }
        >
          {t('announcements.back')}
        </Button>
      ) : retry ? (
        <Button variant='outline' onClick={retry}>
          {t('announcements.retry')}
        </Button>
      ) : null}
    </Alert>
  );
}
export function Loading() {
  const { t } = useTranslation();
  return (
    <div
      role='status'
      aria-label={t('announcements.loading')}
      className='flex flex-col gap-4'
    >
      {[0, 1, 2].map((n) => (
        <Skeleton key={n} className='h-10 w-full' />
      ))}
    </div>
  );
}
