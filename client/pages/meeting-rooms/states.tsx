import { useContext, useEffect, useRef } from 'react';
import { Link, useLocation, useOutletContext } from 'react-router';
import { RouteOverlayContext } from '#components/use-route-overlay';
import { errorKey } from './errors.js';
import { ApiClientError } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { DoorOpen } from 'lucide-react';
import type { ReactNode } from 'react';
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
export function MeetingError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const { t } = useTranslation();
  const overlay = useContext(RouteOverlayContext);
  const location = useLocation();
  const parent = useOutletContext<{
    reload?: () => void;
    onSaved?: () => void;
  } | null>();
  const missingRef = useRef<unknown>(null);
  useEffect(() => {
    if (
      error instanceof ApiClientError &&
      error.status === 404 &&
      missingRef.current !== error
    ) {
      missingRef.current = error;
      (parent?.onSaved ?? parent?.reload)?.();
    }
  }, [error, parent]);
  if (error instanceof ApiClientError && error.status === 401)
    return <SessionExpiredAlert />;
  return (
    <Alert variant='destructive'>
      <AlertDescription>
        {t(`meetingRooms.errors.${errorKey(error)}`)}
      </AlertDescription>
      {error instanceof ApiClientError && [403, 404].includes(error.status) ? (
        overlay ? (
          <Button
            variant='outline'
            onClick={() => {
              void overlay.close();
            }}
          >
            {t('meetingRooms.backToList')}
          </Button>
        ) : (
          <Button
            variant='outline'
            nativeButton={false}
            render={
              <Link
                to={{
                  pathname: '/meeting-rooms',
                  search: location.search,
                  hash: location.hash,
                }}
              />
            }
          >
            {t('meetingRooms.backToList')}
          </Button>
        )
      ) : null}
      {!(
        error instanceof ApiClientError && [403, 404].includes(error.status)
      ) ? (
        <AlertAction>
          <Button variant='outline' onClick={retry}>
            {t('meetingRooms.retry')}
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
      aria-label={t('meetingRooms.loading')}
      className='flex flex-col gap-4'
    >
      {[0, 1, 2].map((n) => (
        <Skeleton key={n} className='h-10 w-full' />
      ))}
    </div>
  );
}
export function NoRecords({
  filtered,
  action,
}: {
  filtered: boolean;
  action?: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <Empty className='min-h-48 border border-dashed'>
      <EmptyHeader>
        <EmptyMedia variant='icon'>
          <DoorOpen />
        </EmptyMedia>
        <EmptyTitle>
          {t(`meetingRooms.empty.${filtered ? 'filtered' : 'title'}`)}
        </EmptyTitle>
        <EmptyDescription>
          {t('meetingRooms.empty.description')}
        </EmptyDescription>
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  );
}

export function FormError({
  error,
}: {
  error?: { type?: string | number; message?: string };
}) {
  if (!error) return null;
  if (error.type === 'sessionExpired') return <SessionExpiredAlert />;
  return (
    <Alert variant='destructive'>
      <AlertDescription>{error.message}</AlertDescription>
    </Alert>
  );
}
