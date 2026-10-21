import { ApiClientError } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { SessionExpiredAlert } from '#components/session-expired-alert';
import { Alert, AlertDescription, AlertAction } from '#components/ui/alert';
import { Button } from '#components/ui/button';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '#components/ui/empty';
import { Skeleton } from '#components/ui/skeleton';
import { ContactRound } from 'lucide-react';
import type { ReactNode } from 'react';
export function FinanceError({
  error,
  retry,
  context,
}: {
  error: unknown;
  retry?: () => void;
  context?: 'save';
}) {
  const { t } = useTranslation();
  if (error instanceof ApiClientError && error.status === 401)
    return <SessionExpiredAlert />;
  const key =
    error instanceof ApiClientError
      ? error.reason?.startsWith('FINANCE_ASSIGNMENT_')
        ? error.reason
        : error.status === 403
          ? 'forbidden'
          : error.status === 404
            ? 'missing'
            : error.status === 400
              ? 'invalid'
              : 'failed'
      : 'failed';
  return (
    <Alert variant='destructive'>
      <AlertDescription>
        {t(
          context === 'save' && key === 'failed'
            ? 'financeAssignments.saveFailed'
            : `financeAssignments.error.${key}`,
        )}
      </AlertDescription>
      {key === 'failed' && retry ? (
        <AlertAction>
          <Button variant='outline' onClick={retry}>
            {t('financeAssignments.retry')}
          </Button>
        </AlertAction>
      ) : null}
    </Alert>
  );
}
export function FinanceEmpty({
  kind,
  action,
}: {
  kind: string;
  action?: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <Empty className='min-h-48 border border-dashed'>
      <EmptyHeader>
        <EmptyMedia variant='icon'>
          <ContactRound />
        </EmptyMedia>
        <EmptyTitle>{t(`financeAssignments.empty.${kind}Title`)}</EmptyTitle>
        <EmptyDescription>
          {t(`financeAssignments.empty.${kind}Description`)}
        </EmptyDescription>
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  );
}
export function FinanceSkeleton() {
  const { t } = useTranslation();
  return (
    <div
      role='status'
      aria-label={t('financeAssignments.loading')}
      className='flex flex-col gap-4'
    >
      {[0, 1, 2].map((n) => (
        <Skeleton key={n} className='h-10 w-full' />
      ))}
    </div>
  );
}
