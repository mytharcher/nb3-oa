import { balanceErrorKey } from './errors.js';
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
import { CalendarDays } from 'lucide-react';
import type { ReactNode } from 'react';
export function BalanceError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const { t } = useTranslation();
  if (error instanceof ApiClientError && error.status === 401)
    return <SessionExpiredAlert />;
  const key = balanceErrorKey(error);
  return (
    <Alert variant='destructive'>
      <AlertDescription>{t(`leaveBalances.error.${key}`)}</AlertDescription>
      {key === 'failed' ? (
        <AlertAction>
          <Button variant='outline' onClick={retry}>
            {t('leaveBalances.retry')}
          </Button>
        </AlertAction>
      ) : null}
    </Alert>
  );
}
export function BalanceEmpty({
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
          <CalendarDays />
        </EmptyMedia>
        <EmptyTitle>{t(`leaveBalances.empty.${kind}Title`)}</EmptyTitle>
        <EmptyDescription>
          {t(`leaveBalances.empty.${kind}Description`)}
        </EmptyDescription>
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  );
}
export function BalanceSkeleton() {
  const { t } = useTranslation();
  return (
    <div
      role='status'
      aria-label={t('leaveBalances.loading')}
      className='flex flex-col gap-4'
    >
      {[0, 1, 2].map((n) => (
        <Skeleton key={n} className='h-10 w-full' />
      ))}
    </div>
  );
}
