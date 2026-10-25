import { LongText } from '#components/long-text';
import { useState } from 'react';
import {
  Link,
  Outlet,
  useParams,
  useLocation,
  useNavigate,
  useOutletContext,
} from 'react-router';
import { useApiClient, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { BackButton } from '#components/back-button';
import { Button } from '#components/ui/button';
import { Skeleton } from '#components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '#components/ui/alert-dialog';
import { useScheduleResource } from './resource';
import { ScheduleError } from './states';
import { type Schedule, schedulePolicy, scheduleTime } from './types';
export default function ScheduleDetail() {
  const { scheduleId } = useParams(),
    location = useLocation(),
    navigate = useNavigate(),
    parent = useOutletContext<{ reload?: () => void }>();
  const { t, i18n } = useTranslation(),
    api = useApiClient(),
    toaster = useToaster();
  const r = useScheduleResource<{ data: Schedule }>(
      `personalSchedules/${encodeURIComponent(scheduleId ?? '')}`,
    ),
    row = r.data?.data;
  const edit = useCan(schedulePolicy('edit')),
    remove = useCan(schedulePolicy('delete'));
  const [confirm, setConfirm] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>();
  return (
    <PageContainer>
      <BackButton />
      {r.error ? <ScheduleError error={r.error} retry={r.reload} /> : null}
      {r.loading && !row ? <Skeleton className='h-48' /> : null}
      {row ? (
        <>
          <PageHeader
            title={row.title}
            description={scheduleTime(row, i18n.language)}
            actions={
              !row.sourceBookingId ? (
                <>
                  {edit.can && !edit.isPending && !edit.error ? (
                    <Button
                      nativeButton={false}
                      render={
                        <Link
                          to={{
                            pathname: `/personal-schedules/${row.id}/edit`,
                            search: location.search,
                          }}
                        />
                      }
                    >
                      {t('personalSchedules.edit')}
                    </Button>
                  ) : null}
                  {remove.can && !remove.isPending && !remove.error ? (
                    <Button variant='outline' onClick={() => setConfirm(true)}>
                      {t('personalSchedules.delete')}
                    </Button>
                  ) : null}
                </>
              ) : null
            }
          />
          <LongText>
            {row.description || t('personalSchedules.noDescription')}
          </LongText>
          {row.sourceBookingId ? (
            <div className='space-y-2'>
              <p className='text-sm text-muted-foreground'>
                {t('personalSchedules.managed')}
              </p>
              <Button
                variant='outline'
                nativeButton={false}
                render={
                  <Link to={`/meeting-rooms/booking/${row.sourceBookingId}`} />
                }
              >
                {t('personalSchedules.openMeeting')}
              </Button>
            </div>
          ) : null}
          {error ? <ScheduleError error={error} retry={r.reload} /> : null}
          <AlertDialog
            open={confirm}
            onOpenChange={(value) => {
              if (!busy) setConfirm(value);
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t('personalSchedules.deleteTitle', { title: row.title })}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t('personalSchedules.deleteHint')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={busy}>
                  {t('personalSchedules.cancel')}
                </AlertDialogCancel>
                <AlertDialogAction
                  variant='destructive'
                  disabled={busy}
                  onClick={(event) => {
                    event.preventDefault();
                    void (async () => {
                      if (busy) return;
                      setBusy(true);
                      setError(undefined);
                      try {
                        await api.request({
                          path: `personalSchedules/${row.id}`,
                          method: 'DELETE',
                          json: { expectedVersion: row.version },
                        });
                        parent?.reload?.();
                        toaster.show({ title: t('personalSchedules.deleted') });
                        await navigate({
                          pathname: '/personal-schedules',
                          search: location.search,
                        });
                      } catch (err) {
                        setError(err);
                        setConfirm(false);
                        r.reload();
                      } finally {
                        setBusy(false);
                      }
                    })();
                  }}
                >
                  {t(
                    busy
                      ? 'personalSchedules.deleting'
                      : 'personalSchedules.delete',
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : null}
      <Outlet
        context={{
          reload: () => {
            r.reload();
            parent?.reload?.();
          },
        }}
      />
    </PageContainer>
  );
}
