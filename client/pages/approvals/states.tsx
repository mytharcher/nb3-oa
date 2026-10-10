import { ApiClientError } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { Alert, AlertDescription, AlertAction } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { SessionExpiredAlert } from '@/components/session-expired-alert';
function errorKey(error: unknown) {
  if (!(error instanceof ApiClientError)) return 'failed';
  if (error.status === 403) return 'forbidden';
  if (error.status === 404) return 'notFound';
  if (error.status === 409) return 'conflict';
  if (error.reason === 'LEAVE_BALANCE_UNAVAILABLE') return 'balanceLimit';
  if (
    ['LEAVE_ATTACHMENTS_UNAVAILABLE', 'LEAVE_ATTACHMENT_REQUIRED'].includes(
      error.reason ?? '',
    )
  )
    return 'attachmentLimit';
  if (error.reason === 'LEAVE_OVERLAP') return 'overlap';
  if (error.reason === 'LEAVE_SLA_CONFIGURATION_UNSUPPORTED')
    return 'configuration';
  if (
    ['LEAVE_EMPLOYEE_INACTIVE', 'LEAVE_HANDOVER_INACTIVE'].includes(
      error.reason ?? '',
    )
  )
    return 'inactive';
  if (error.status === 400 || error.status === 422) return 'domainInvalid';
  return 'failed';
}
export function ErrorState({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const { t } = useTranslation();
  if (error instanceof ApiClientError && error.status === 401)
    return <SessionExpiredAlert />;
  const key = errorKey(error);
  return (
    <Alert variant='destructive'>
      <AlertDescription>
        {t(
          key === 'balanceLimit' ||
            key === 'attachmentLimit' ||
            key === 'domainInvalid'
            ? `approvals.${key}`
            : `approvals.error.${key}`,
        )}
      </AlertDescription>
      {key === 'failed' || key === 'conflict' ? (
        <AlertAction>
          <Button variant='outline' onClick={retry}>
            {t(key === 'conflict' ? 'approvals.loadLatest' : 'approvals.retry')}
          </Button>
        </AlertAction>
      ) : null}
    </Alert>
  );
}
