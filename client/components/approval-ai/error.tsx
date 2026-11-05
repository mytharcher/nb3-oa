import { ApiClientError } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { SessionExpiredAlert } from '#components/session-expired-alert';
import { Alert, AlertDescription } from '#components/ui/alert';
import { Button } from '#components/ui/button';
export function ApprovalAiError({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  const { t } = useTranslation();
  if (error instanceof ApiClientError && error.status === 401)
    return <SessionExpiredAlert />;
  const final =
    error instanceof ApiClientError && [403, 404].includes(error.status);
  const pending =
    error instanceof ApiClientError && error.reason === 'CONVERSATION_PENDING';
  const conflict = error instanceof ApiClientError && error.status === 409;
  return (
    <Alert variant='destructive'>
      <AlertDescription>
        {t(
          'approvalAi.' +
            (pending
              ? 'errors.CONVERSATION_PENDING'
              : final
                ? 'unavailable'
                : conflict
                  ? 'conflict'
                  : 'requestFailed'),
        )}
      </AlertDescription>
      {retry && !final && (
        <Button variant='outline' size='sm' onClick={retry}>
          {t(conflict ? 'approvalAi.reload' : 'approvalAi.refresh')}
        </Button>
      )}
    </Alert>
  );
}
