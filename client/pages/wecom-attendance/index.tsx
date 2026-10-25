import { format, parseISO } from 'date-fns';
import { useRef, useState } from 'react';
import { useApiClient } from '@nocobase/app-client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import type { ColumnDef } from '@tanstack/react-table';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { DataTableServer } from '#components/data-table/server-table';
import { ApplicationTableSkeleton } from '#components/application-table-skeleton';
import { Button } from '#components/ui/button';
import { Label } from '#components/ui/label';
import { Textarea } from '#components/ui/textarea';
import { Alert, AlertDescription } from '#components/ui/alert';
import { Dialog, DialogTitle, DialogDescription } from '#components/ui/dialog';
import {
  FormDrawerContent,
  FormDrawerHeader,
  FormDrawerBody,
  FormDrawerFooter,
} from '#components/form-drawer';
import { DatePicker } from '#components/date-picker';
import { createRequestKey } from '#lib/request-key';
import { useResource } from '../approvals/use-resource.js';
import { ErrorState } from '../approvals/states.js';
interface Run {
  id: string;
  startDate: string;
  endDate: string;
  state: 'running' | 'completed' | 'failed';
  errorCode: string | null;
  committedRecords: number;
  completedBatches: number;
  attempts: number;
  createdAt: string;
  updatedAt: string;
}
interface Status {
  enabled: boolean;
  configured: boolean;
  mappedUsers: number;
  runs: Run[];
}
export default function WecomAttendancePage() {
  const { t, i18n } = useTranslation(),
    api = useApiClient();
  const resourceId = { type: 'settings' as const, id: 'oa.wecomAttendance' };
  const view = useCan({ resource: resourceId, action: 'view' }),
    sync = useCan({ resource: resourceId, action: 'sync' });
  const resource = useResource<Status>(
    view.can && !view.isPending ? 'attendanceManagement/wecomSource' : null,
  );
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [start, setStart] = useState(''),
    [end, setEnd] = useState(''),
    [reason, setReason] = useState(''),
    [error, setError] = useState<unknown>(),
    [failed, setFailed] = useState(false);
  const attemptRef = useRef<{ meaning: string; key: string } | undefined>(
    undefined,
  );
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const ready = resource.data?.enabled && resource.data.configured;
  const columns: ColumnDef<Run>[] = [
    {
      id: 'run',
      header: t('wecomAttendance.runs'),
      cell: ({ row }) => (
        <div className='flex flex-wrap items-center justify-between gap-3 py-2'>
          <div className='min-w-0 space-y-1'>
            <div>
              {row.original.startDate} – {row.original.endDate}
            </div>
            <div>{t(`wecomAttendance.states.${row.original.state}`)}</div>
              <div className='text-sm text-muted-foreground'>{t('wecomAttendance.startedAt', { time: new Intl.DateTimeFormat(i18n.language, { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(row.original.createdAt)) })}</div>
            <div className='text-sm text-muted-foreground'>
              {t('wecomAttendance.counts', {
                records: row.original.committedRecords,
                batches: row.original.completedBatches,
              })}
            </div>
            {row.original.errorCode ? (
              <p className='text-sm text-destructive'>
                {t('wecomAttendance.runFailed')}
              </p>
            ) : null}
          </div>
          {row.original.state === 'failed' && sync.can ? (
            <Button
              variant='outline'
              onClick={() => {
                setStart(row.original.startDate);
                setEnd(row.original.endDate);
                setReason('');
                setError(undefined);
                setFailed(false);
                attemptRef.current = undefined;
                setOpen(true);
              }}
            >
              {t('wecomAttendance.retry')}
            </Button>
          ) : null}
        </div>
      ),
    },
  ];
  async function submit() {
    if (busy) return;
    setBusy(true);
    setError(undefined);
    setFailed(false);
    const input = { startDate: start, endDate: end, reason: reason.trim() },
      meaning = JSON.stringify(input);
    if (attemptRef.current?.meaning !== meaning)
      attemptRef.current = { meaning, key: createRequestKey() };
    try {
      const result = await api.request<{ data: Run }>({
        method: 'POST',
        path: 'attendanceManagement/wecomSource/sync',
        json: { ...input, requestKey: attemptRef.current.key },
      });
      resource.reload();
      if (result.data.state === 'completed') {
        attemptRef.current = undefined;
        setOpen(false);
      } else setFailed(true);
    } catch (cause) {
      setError(cause);
    } finally {
      setBusy(false);
    }
  }
  return (
    <PageContainer>
      <PageHeader
        title={t('wecomAttendance.title')}
        description={t('wecomAttendance.description')}
        actions={
          <>
            <Button
              variant='outline'
              onClick={resource.reload}
              disabled={resource.loading}
            >
              {t('wecomAttendance.refresh')}
            </Button>
            {sync.can ? (
              <Button
                disabled={!ready}
                onClick={() => {
                  setError(undefined);
                  setFailed(false);
                  setOpen(true);
                }}
              >
                {t('wecomAttendance.sync')}
              </Button>
            ) : null}
          </>
        }
      />
      {view.error ? (
        <ErrorState error={view.error} retry={resource.reload} />
      ) : !view.isPending && !view.can ? (
        <Alert variant='destructive'>
          <AlertDescription>{t('wecomAttendance.denied')}</AlertDescription>
        </Alert>
      ) : resource.error ? (
        <ErrorState error={resource.error} retry={resource.reload} />
      ) : resource.loading || view.isPending ? (
        <ApplicationTableSkeleton columns={1} />
      ) : resource.data ? (
        <>
          <Alert>
            <AlertDescription>
              {t(
                !resource.data.enabled
                  ? 'wecomAttendance.disabled'
                  : !resource.data.configured
                    ? 'wecomAttendance.unconfigured'
                    : 'wecomAttendance.ready',
                { count: resource.data.mappedUsers },
              )}
            </AlertDescription>
          </Alert>
          <DataTableServer
            columns={columns}
            rows={resource.data.runs.slice(
              pagination.pageIndex * pagination.pageSize,
              (pagination.pageIndex + 1) * pagination.pageSize,
            )}
            total={resource.data.runs.length}
            getRowId={(r) => r.id}
            pagination={pagination}
            onPaginationChange={setPagination}
            pageSizeOptions={[10, 30]}
            emptyMessage={t('wecomAttendance.empty')}
          />
        </>
      ) : null}
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!busy) setOpen(value);
        }}
      >
        <FormDrawerContent>
          <FormDrawerHeader>
            <DialogTitle>{t('wecomAttendance.sync')}</DialogTitle>
            <DialogDescription>
              {t('wecomAttendance.rangeHint')}
            </DialogDescription>
          </FormDrawerHeader>
          <FormDrawerBody>
            <form
              id='wecom-sync'
              className='space-y-4'
              onSubmit={(event) => {
                event.preventDefault();
                void submit();
              }}
            >
              <div className='space-y-2'>
                <Label htmlFor='wecom-start'>
                  {t('wecomAttendance.start')}
                </Label>
                <DatePicker
                  id='wecom-start'
                  value={start ? parseISO(start) : undefined}
                  onChange={(date) =>
                    setStart(date ? format(date, 'yyyy-MM-dd') : '')
                  }
                  disabled={busy}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='wecom-end'>{t('wecomAttendance.end')}</Label>
                <DatePicker
                  id='wecom-end'
                  value={end ? parseISO(end) : undefined}
                  onChange={(date) =>
                    setEnd(date ? format(date, 'yyyy-MM-dd') : '')
                  }
                  disabled={busy}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='wecom-reason'>
                  {t('wecomAttendance.reason')}
                </Label>
                <Textarea
                  id='wecom-reason'
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={busy}
                  required
                />
              </div>
              {error ? (
                <ErrorState error={error} retry={() => void submit()} />
              ) : null}
              {failed ? (
                <Alert variant='destructive'>
                  <AlertDescription>
                    {t('wecomAttendance.runFailed')}
                  </AlertDescription>
                </Alert>
              ) : null}
            </form>
          </FormDrawerBody>
          <FormDrawerFooter>
            <Button
              variant='outline'
              disabled={busy}
              onClick={() => setOpen(false)}
            >
              {t('wecomAttendance.cancel')}
            </Button>
            <Button
              type='submit'
              form='wecom-sync'
              disabled={busy || !start || !end || !reason.trim()}
            >
              {t(
                busy
                  ? 'wecomAttendance.syncing'
                  : failed
                    ? 'wecomAttendance.retry'
                    : 'wecomAttendance.sync',
              )}
            </Button>
          </FormDrawerFooter>
        </FormDrawerContent>
      </Dialog>
    </PageContainer>
  );
}
