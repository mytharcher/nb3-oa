import { ApiClientError } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { Link } from 'react-router';
import { Alert, AlertDescription } from '#components/ui/alert';
import { Button } from '#components/ui/button';
import { SessionExpiredAlert } from '#components/session-expired-alert';
export function ScheduleError({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  const { t } = useTranslation();
  const status = error instanceof ApiClientError ? error.status : 500;
  if (status === 401) return <SessionExpiredAlert />;
  return (
    <Alert variant='destructive'>
      <AlertDescription>
        {t(
          `personalSchedules.errors.${status === 403 ? 'denied' : status === 404 ? 'missing' : status === 409 ? 'conflict' : 'failed'}`,
        )}
      </AlertDescription>
      {[403, 404].includes(status) ? (
        <Button
          variant='outline'
          nativeButton={false}
          render={<Link to='/personal-schedules' />}
        >
          {t('personalSchedules.back')}
        </Button>
      ) : retry ? (
        <Button variant='outline' onClick={retry}>
          {t('personalSchedules.retry')}
        </Button>
      ) : null}
    </Alert>
  );
}
