import { useCan } from '@nocobase/app-plugin-authorization/client';
import type { ReactElement, ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import { ApiClientError } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { RefreshCw, ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription } from '#components/ui/alert';
import { Button } from '#components/ui/button';
import { Skeleton } from '#components/ui/skeleton';
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
  EmptyContent,
} from '#components/ui/empty';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#components/ui/tooltip';
import { SessionExpiredAlert } from '#components/session-expired-alert';
export function AccessTabs(): ReactElement {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const canInspect = useCan({
    resource: { type: 'settings', id: 'authorization.inspector' },
    action: 'inspect',
  }).can;
  return (
    <nav aria-label={t('access.title')} className='flex gap-2'>
      <Button
        variant={pathname.includes('/people') ? 'ghost' : 'secondary'}
        nativeButton={false}
        aria-current={!pathname.includes('/people') ? 'page' : undefined}
        render={<Link to='/access/roles' />}
      >
        {t('access.roles')}
      </Button>
      {canInspect ? (
        <Button
          variant={pathname.includes('/people') ? 'secondary' : 'ghost'}
          nativeButton={false}
          aria-current={pathname.includes('/people') ? 'page' : undefined}
          render={<Link to='/access/people' />}
        >
          {t('access.people')}
        </Button>
      ) : null}
    </nav>
  );
}
export function Loading(): ReactElement {
  const { t } = useTranslation();
  return (
    <div
      role='status'
      aria-label={t('access.loading')}
      className='flex flex-col gap-4'
    >
      {[0, 1, 2].map((key) => (
        <Skeleton key={key} className='h-12 w-full' />
      ))}
    </div>
  );
}
export function ErrorState({
  error,
  retry,
  backTo,
  onBack,
}: {
  error: unknown;
  retry?: () => void;
  backTo?: string;
  onBack?: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const status = error instanceof ApiClientError ? error.status : undefined;
  if (status === 401) return <SessionExpiredAlert />;
  const reason = error instanceof ApiClientError ? error.reason : undefined;
  const message =
    reason === 'IMPACT_UNAVAILABLE'
      ? t('access.impactUnavailable')
      : reason === 'LAST_ASSIGNMENT'
        ? t('access.lastAdmin')
        : reason === 'PROTECTED_PERMISSION_SET'
          ? t('access.protectedHelp')
          : reason === 'CUSTOM_POLICY_READ_ONLY'
            ? t('access.specialReadOnly')
            : reason === 'SUBJECT_NOT_ALLOWED'
              ? t('access.subjectNotAllowed')
              : status === 403
                ? t('access.denied')
                : status === 404
                  ? t('access.missing')
                  : status === 409
                    ? t('access.conflict')
                    : t('access.failed');
  return (
    <Alert variant='destructive'>
      <AlertDescription>
        {message}
        {status === 404 && backTo ? (
          <Button
            variant='outline'
            nativeButton={false}
            onClick={onBack}
            render={<Link to={backTo} />}
          >
            {t('access.back')}
          </Button>
        ) : null}
        {retry && status !== 400 && status !== 403 && status !== 404 ? (
          <Button variant='outline' onClick={retry}>
            {t(status === 409 ? 'access.reload' : 'access.retry')}
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
export function Blank({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}): ReactElement {
  return (
    <Empty className='min-h-48 border border-dashed'>
      <EmptyHeader>
        <EmptyMedia variant='icon'>
          <ShieldCheck />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  );
}
export function Refresh({
  reload,
  busy,
}: {
  reload: () => void;
  busy: boolean;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant='outline'
            size='icon'
            disabled={busy}
            aria-label={t('access.refresh')}
            onClick={reload}
          />
        }
      >
        <RefreshCw className={busy ? 'animate-spin' : ''} />
      </TooltipTrigger>
      <TooltipContent>{t('access.refresh')}</TooltipContent>
    </Tooltip>
  );
}
