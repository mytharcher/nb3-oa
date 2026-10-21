import { SessionExpiredAlert } from '#components/session-expired-alert';
import { Alert, AlertDescription } from '#components/ui/alert';
import { Button } from '#components/ui/button';
import { responseStatus } from './response-status.js';
export function LoadFailure({
  error,
  message,
  retryLabel,
  onRetry,
}: {
  error: unknown;
  message: string;
  retryLabel: string;
  onRetry: () => void;
}) {
  const status = responseStatus(error);
  if (status === 401) return <SessionExpiredAlert />;
  return (
    <Alert variant='destructive'>
      <AlertDescription>{message}</AlertDescription>
      {status !== 403 && status !== 404 ? (
        <Button variant='outline' onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </Alert>
  );
}
