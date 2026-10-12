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
  const { t } = useTranslation();
  const reasons: Record<string, string> = {
    SUPPLY_REQUIRED_FIELDS: 'invalid',
    SUPPLY_INVALID_ITEMS: 'invalid',
    SUPPLY_ITEM_UNAVAILABLE: 'itemUnavailable',
    SUPPLY_PRINT_INFO_REQUIRED: 'printRequired',
    SUPPLY_EMPLOYEE_INACTIVE: 'inactive',
    SUPPLY_SLA_CONFIGURATION_UNSUPPORTED: 'configuration',
    SUPPLY_CONTENT_CHANGED: 'contentChanged',
    SUPPLY_REASON_REQUIRED: 'reasonRequired',
  };
  const key =
    error instanceof ApiClientError
      ? (reasons[error.reason ?? ''] ??
        ([400, 422].includes(error.status) ? 'invalid' : undefined))
      : undefined;
  if (key)
    return (
      <Alert variant='destructive'>
        <AlertDescription>{t(`supplies.${key}`)}</AlertDescription>
      </Alert>
    );
  return <SharedError error={error} retry={retry} />;
}
