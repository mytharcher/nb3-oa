import { ApiClientError } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { SessionExpiredAlert } from '#components/session-expired-alert';
import { Alert, AlertAction, AlertDescription } from '#components/ui/alert';
import { Button } from '#components/ui/button';
import { Skeleton } from '#components/ui/skeleton';
export function Failure({
  error,
  retry,
  denied,
}: {
  error: unknown;
  denied?: boolean;
  retry?: () => void;
}) {
  const { t } = useTranslation();
  if (error instanceof ApiClientError && error.status === 401)
    return <SessionExpiredAlert />;
  const terminal =
    denied ||
    (error instanceof ApiClientError && [403, 404].includes(error.status));
  const reasons = [
    'ATTENDANCE_SHIFT_INVALID',
    'ATTENDANCE_SHIFT_NOT_FOUND',
    'ATTENDANCE_SHIFT_CODE_IMMUTABLE',
    'ATTENDANCE_SHIFT_CODE_CONFLICT',
    'ATTENDANCE_SHIFT_TIME_ZONE_CHANGED',
    'ATTENDANCE_SCHEDULE_INVALID',
    'ATTENDANCE_DEPARTMENT_UNAVAILABLE',
    'ATTENDANCE_LOCAL_TIME_INVALID',
  ];
  const specific =
    error instanceof ApiClientError &&
    error.status === 400 &&
    error.reason &&
    reasons.includes(error.reason)
      ? `attendanceManagement.errors.${error.reason}`
      : undefined;
  const key = denied
    ? 'denied'
    : error instanceof ApiClientError && error.status === 403
      ? 'denied'
      : error instanceof ApiClientError && error.status === 404
        ? 'notFound'
        : error instanceof ApiClientError && error.status === 409
          ? 'conflict'
          : 'failed';
  return (
    <Alert variant='destructive'>
      <AlertDescription>
        {t(specific ?? `attendanceManagement.${key}`)}
      </AlertDescription>
      {!terminal && retry ? (
        <AlertAction>
          <Button variant='outline' onClick={retry}>
            {t('attendanceManagement.retry')}
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
      aria-label={t('attendanceManagement.loading')}
      className='flex flex-col gap-4'
    >
      <Skeleton className='h-12 w-full' />
      <Skeleton className='h-24 w-full' />
    </div>
  );
}
