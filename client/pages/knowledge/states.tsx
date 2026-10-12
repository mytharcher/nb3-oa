import { Link, useLocation } from 'react-router';
import { ApiClientError } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { SessionExpiredAlert } from '#components/session-expired-alert';
import { Alert, AlertDescription } from '#components/ui/alert';
import { Skeleton } from '#components/ui/skeleton';
import { Button } from '#components/ui/button';
export function KnowledgeError({
  error,
  retry,
  unavailable = false,
}: {
  error: unknown;
  retry?: () => void;
  unavailable?: boolean;
}) {
  const { t } = useTranslation(),
    location = useLocation();
  if (error instanceof ApiClientError && error.status === 401)
    return <SessionExpiredAlert />;
  const denied =
    unavailable ||
    (error instanceof ApiClientError && [403, 404].includes(error.status));
  return (
    <Alert variant='destructive'>
      <AlertDescription>
        {t(`knowledge.${denied ? 'unavailable' : 'failed'}`)}
      </AlertDescription>
      {denied ? (
        <Button
          nativeButton={false}
          variant='outline'
          render={
            <Link to={{ pathname: '/knowledge', search: location.search }} />
          }
        >
          {t('knowledge.backToList')}
        </Button>
      ) : null}
      {!denied && retry ? (
        <Button variant='outline' onClick={retry}>
          {t('knowledge.retry')}
        </Button>
      ) : null}
    </Alert>
  );
}

export function KnowledgeSkeleton() {
  const { t } = useTranslation();
  return (
    <div
      role='status'
      aria-label={t('knowledge.loading')}
      className='flex flex-col gap-5'
    >
      <Skeleton className='h-6 w-1/2' />
      <Skeleton className='h-20 w-full' />
      <Skeleton className='h-10 w-full' />
    </div>
  );
}
