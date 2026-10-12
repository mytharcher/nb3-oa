import { ApiClientError } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { Alert, AlertDescription } from '#components/ui/alert';
import { ErrorState as SharedError } from '../approvals/states.js';
export function ErrorState({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const { t, i18n } = useTranslation();
  const key =
    error instanceof ApiClientError
      ? `outings.errors.${error.reason ?? ''}`
      : '';
  if (key && i18n.exists(key))
    return (
      <Alert variant='destructive'>
        <AlertDescription>{t(key)}</AlertDescription>
      </Alert>
    );
  return <SharedError error={error} retry={retry} />;
}
