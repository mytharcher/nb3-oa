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
import { Wallet } from 'lucide-react';
import type { ReactNode } from 'react';
export function BudgetError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const { t } = useTranslation();
  if (error instanceof ApiClientError && error.status === 401)
    return <SessionExpiredAlert />;
  const key =
    error instanceof ApiClientError
      ? error.reason?.startsWith('BUDGET_')
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
      <AlertDescription>{t(`budgets.error.${key}`)}</AlertDescription>
      {key === 'failed' ? (
        <AlertAction>
          <Button variant='outline' onClick={retry}>
            {t('budgets.retry')}
          </Button>
        </AlertAction>
      ) : null}
    </Alert>
  );
}
export function BudgetEmpty({
  kind,
  action,
}: {
  kind: string;
  action?: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <Empty className='min-h-48'>
      <EmptyHeader>
        <EmptyMedia variant='icon'>
          <Wallet />
        </EmptyMedia>
        <EmptyTitle>{t(`budgets.empty.${kind}Title`)}</EmptyTitle>
        <EmptyDescription>
          {t(`budgets.empty.${kind}Description`)}
        </EmptyDescription>
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  );
}
export function BudgetSkeleton() {
  const { t } = useTranslation();
  return (
    <div
      role='status'
      aria-label={t('budgets.loading')}
      className='flex flex-col gap-4'
    >
      {[0, 1, 2].map((n) => (
        <Skeleton key={n} className='h-10 w-full' />
      ))}
    </div>
  );
}
