import { useRef, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Link, Outlet, useLocation, useSearchParams } from 'react-router';
import { ApiClientError, useApiClient, useToaster } from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import type { ColumnDef } from '@tanstack/react-table';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { DataTableServer } from '#components/data-table/server-table';
import { ApplicationRefreshButton } from '#components/application-refresh-button';
import { ApplicationTableSkeleton } from '#components/application-table-skeleton';
import { DepartmentPicker } from '#components/department-picker';
import { UserPicker } from '#components/user-picker';
import { DatePicker } from '#components/date-picker';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import { Label } from '#components/ui/label';
import { Textarea } from '#components/ui/textarea';
import { Badge } from '#components/ui/badge';
import { Alert, AlertDescription } from '#components/ui/alert';
import { Dialog, DialogTitle, DialogDescription } from '#components/ui/dialog';
import {
  FormDrawerContent,
  FormDrawerHeader,
  FormDrawerBody,
  FormDrawerFooter,
} from '#components/form-drawer';
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '#components/ui/empty';
import { createRequestKey } from '#lib/request-key';
import { useResource } from '../approvals/use-resource.js';
import { ErrorState } from '../approvals/states.js';
import {
  attendanceCsvCell,
  attendanceResultResource,
  type AttendancePage,
  type AttendanceResult,
} from './types.js';

export default function AttendanceResultsPage() {
  const { t, i18n } = useTranslation();
  const api = useApiClient();
  const toast = useToaster();
  const { session } = useAuthentication();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const [today] = useState(() => new Date());
  const requested = params.get('month') ?? '';
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(requested)
    ? requested
    : format(today, 'yyyy-MM');
  const page = Math.max(1, Math.floor(Number(params.get('page')) || 1));
  const pageSize = [10, 31, 50, 100].includes(Number(params.get('pageSize')))
    ? Number(params.get('pageSize'))
    : 31;
  const userId = params.get('userId') ?? '';
  const departmentId = params.get('departmentId') ?? '';
  const view = useCan({ resource: attendanceResultResource, action: 'view' });
  const recalculate = useCan({
    resource: attendanceResultResource,
    action: 'recalculate',
  });
  const calculateSelf = useCan({
    resource: attendanceResultResource,
    action: 'calculateSelf',
  });
  const exportAccess = useCan({
    resource: attendanceResultResource,
    action: 'export',
  });
  const correction = useCan({
    resource: { type: 'composite', id: 'oa.attendanceChange' },
    action: 'submit',
  });
  const canRecalculate =
    recalculate.can && !recalculate.isPending && !recalculate.error;
  const canCalculate =
    canRecalculate &&
    calculateSelf.can &&
    !calculateSelf.isPending &&
    !calculateSelf.error;
  const canExport =
    exportAccess.can && !exportAccess.isPending && !exportAccess.error;
  const canCorrect =
    correction.can && !correction.isPending && !correction.error;
  const query = {
    month,
    page: String(page),
    pageSize: String(pageSize),
    ...(userId ? { userId } : {}),
    ...(departmentId ? { departmentId } : {}),
  };
  const resource = useResource<AttendancePage>(
    view.can && !view.isPending && !view.error ? 'attendanceResults' : null,
    query,
  );
  const [calculate, setCalculate] = useState<{ row?: AttendanceResult }>();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<unknown>();
  const update = (values: Record<string, string>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries({ page: '1', ...values })) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next);
  };
  const download = async () => {
    if (exporting) return;
    setExporting(true);
    setExportError(undefined);
    try {
      const { data } = await api.request<{
        data: { items: AttendanceResult[] };
      }>({
        path: 'attendanceResults/export',
        query: {
          month,
          ...(userId ? { userId } : {}),
          ...(departmentId ? { departmentId } : {}),
        },
      });
      const headings = [
        'employee',
        'date',
        'status',
        'lateMinutes',
        'earlyMinutes',
        'missingPunches',
        'absentMinutes',
        'approvedOvertimeMinutes',
      ].map((key) => t(`attendanceResults.${key}`));
      const records = data.items.map((row) => [
        row.userName,
        row.date,
        t(`attendanceResults.statuses.${row.result.status}`),
        row.result.lateMinutes,
        row.result.earlyMinutes,
        row.result.missingPunches,
        row.result.absentMinutes,
        row.approvedOvertimeMinutes,
      ]);
      const url = URL.createObjectURL(
        new Blob(
          [
            '\uFEFF',
            [headings, ...records]
              .map((row) => row.map(attendanceCsvCell).join(','))
              .join('\r\n'),
          ],
          { type: 'text/csv;charset=utf-8' },
        ),
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = `attendance-${month}.csv`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
      toast.show({ title: t('attendanceResults.exported') });
    } catch (error) {
      setExportError(error);
    } finally {
      setExporting(false);
    }
  };
  const columns: ColumnDef<AttendanceResult, unknown>[] = [
    {
      id: 'result',
      header: t('attendanceResults.dailyResult'),
      cell: ({ row: { original: row } }) => (
        <div className='flex min-w-0 flex-col gap-2 whitespace-normal'>
          <div className='flex flex-wrap items-center gap-2'>
            <span className='font-medium'>{row.date}</span>
            <span>{row.userName || t('attendanceResults.unnamed')}</span>
            <Badge
              variant={
                row.result.status === 'exception' ||
                row.result.status === 'blocked'
                  ? 'destructive'
                  : 'secondary'
              }
            >
              {t(`attendanceResults.statuses.${row.result.status}`)}
            </Badge>
          </div>
          <div className='flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground'>
            {(
              [
                'lateMinutes',
                'earlyMinutes',
                'missingPunches',
                'absentMinutes',
              ] as const
            ).map((key) => (
              <span key={key}>
                {t(`attendanceResults.${key}`)}: {row.result[key]}
              </span>
            ))}
            <span>
              {t('attendanceResults.approvedOvertimeMinutes')}:{' '}
              {row.approvedOvertimeMinutes}
            </span>
          </div>
          {row.result.reasons.length ? (
            <p className='text-sm'>
              {[
                ...new Set(
                  row.result.reasons.map((reason) =>
                    i18n.exists(`attendanceResults.reasons.${reason}`)
                      ? t(`attendanceResults.reasons.${reason}`)
                      : t('attendanceResults.needsReview'),
                  ),
                ),
              ].join(' · ')}
            </p>
          ) : null}
          <div className='flex flex-wrap gap-2'>
            {canCorrect && row.userId === session?.user.id
              ? row.missingPunches.map((missing) => (
                  <Button
                    key={missing.id}
                    size='sm'
                    variant='outline'
                    nativeButton={false}
                    render={
                      <Link
                        to={{
                          pathname: 'newAttendanceChange',
                          search: (() => {
                            const next = new URLSearchParams(location.search);
                            next.set('missingPunchId', missing.id);
                            return `?${next.toString()}`;
                          })(),
                        }}
                      />
                    }
                  >
                    {t(
                      missing.punchKind === 'out'
                        ? 'attendanceResults.correctOut'
                        : 'attendanceResults.correctIn',
                    )}
                  </Button>
                ))
              : null}
            {canRecalculate ? (
              <Button
                size='sm'
                variant='outline'
                onClick={() => setCalculate({ row })}
              >
                {t('attendanceResults.recalculate')}
              </Button>
            ) : null}
          </div>
        </div>
      ),
    },
  ];
  const create = canCalculate ? (
    <Button onClick={() => setCalculate({})}>
      {t('attendanceResults.calculate')}
    </Button>
  ) : null;
  const hasFilters = !!userId || !!departmentId;
  return (
    <PageContainer>
      <PageHeader
        title={t('attendanceResults.title')}
        description={t('attendanceResults.description')}
        actions={
          <>
            {resource.data?.total ? create : null}
            {canExport ? (
              <Button
                variant='outline'
                disabled={
                  exporting || resource.loading || !resource.data?.total
                }
                onClick={() => void download()}
              >
                {t(
                  exporting
                    ? 'attendanceResults.exporting'
                    : 'attendanceResults.export',
                )}
              </Button>
            ) : null}
            <ApplicationRefreshButton
              label={t('attendanceResults.refresh')}
              loading={resource.loading}
              onClick={resource.reload}
            />
          </>
        }
      />
      <div className='flex flex-wrap items-end gap-3'>
        <div className='flex flex-col gap-2'>
          <Label htmlFor='attendance-month'>
            {t('attendanceResults.month')}
          </Label>
          <Input
            id='attendance-month'
            type='month'
            value={month}
            className='w-44'
            onChange={(event) => update({ month: event.target.value })}
          />
        </div>
        {canExport ? (
          <>
            <div className='flex min-w-0 flex-col gap-2'>
              <Label htmlFor='attendance-employee'>
                {t('attendanceResults.employee')}
              </Label>
              <UserPicker
                id='attendance-employee'
                value={userId}
                onChange={(value) => update({ userId: value })}
                className='w-60 max-w-full'
              />
            </div>
            <div className='flex min-w-0 flex-col gap-2'>
              <Label htmlFor='attendance-department'>
                {t('attendanceResults.department')}
              </Label>
              <DepartmentPicker
                id='attendance-department'
                value={departmentId}
                onChange={(value) => update({ departmentId: value })}
                className='w-60 max-w-full'
              />
            </div>
          </>
        ) : null}
        {hasFilters ? (
          <Button
            variant='outline'
            onClick={() => update({ userId: '', departmentId: '' })}
          >
            {t('attendanceResults.clear')}
          </Button>
        ) : null}
      </div>
      {resource.data ? (
        <>
          <p className='text-sm text-muted-foreground'>
            {t('attendanceResults.timeZone', { zone: resource.data.timeZone })}
          </p>
          <dl className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
            {(
              [
                'normalDays',
                'exceptionDays',
                'blockedDays',
                'restDays',
              ] as const
            ).map((key) => (
              <div key={key} className='rounded-lg border p-3'>
                <dt className='text-sm text-muted-foreground'>
                  {t(`attendanceResults.${key}`)}
                </dt>
                <dd className='text-2xl font-semibold'>
                  {resource.data!.summary[key]}
                </dd>
              </div>
            ))}
          </dl>
        </>
      ) : null}
      {exportError ? (
        <ErrorState error={exportError} retry={() => void download()} />
      ) : null}
      {view.error ? (
        <ErrorState error={view.error} retry={resource.reload} />
      ) : !view.can && !view.isPending ? (
        <Alert variant='destructive'>
          <AlertDescription>{t('attendanceResults.denied')}</AlertDescription>
        </Alert>
      ) : resource.error ? (
        <ErrorState error={resource.error} retry={resource.reload} />
      ) : resource.loading || view.isPending ? (
        <ApplicationTableSkeleton columns={1} />
      ) : resource.data?.total ? (
        <DataTableServer
          columns={columns}
          rows={resource.data.items}
          total={resource.data.total}
          getRowId={(row) => row.id}
          pagination={{ pageIndex: page - 1, pageSize }}
          onPaginationChange={(value) =>
            update({
              page: String(value.pageIndex + 1),
              pageSize: String(value.pageSize),
            })
          }
          emptyMessage={t('attendanceResults.noResults')}
          pageSizeOptions={[10, 31, 50, 100]}
        />
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>
              {t(
                hasFilters
                  ? 'attendanceResults.noResults'
                  : 'attendanceResults.empty',
              )}
            </EmptyTitle>
            <EmptyDescription>
              {t('attendanceResults.emptyDescription')}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            {hasFilters ? (
              <Button
                variant='outline'
                onClick={() => update({ userId: '', departmentId: '' })}
              >
                {t('attendanceResults.clear')}
              </Button>
            ) : (
              create
            )}
          </EmptyContent>
        </Empty>
      )}
      {calculate ? (
        <CalculationDrawer
          key={calculate.row?.id ?? 'self'}
          row={calculate.row}
          today={today}
          onClose={() => setCalculate(undefined)}
          onSaved={() => {
            setCalculate(undefined);
            resource.reload();
          }}
        />
      ) : null}
      <Outlet context={{ reload: resource.reload }} />
    </PageContainer>
  );
}
function CalculationDrawer({
  row,
  today,
  onClose,
  onSaved,
}: {
  row?: AttendanceResult;
  today: Date;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const api = useApiClient();
  const toast = useToaster();
  const [date, setDate] = useState(
    () =>
      row?.date ??
      format(
        new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1),
        'yyyy-MM-dd',
      ),
  );
  const [latestDay] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1),
  );
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const requestRef = useRef<{ fingerprint: string; key: string } | undefined>(
    undefined,
  );
  const submit = async () => {
    if (busy || !date || !reason.trim()) return;
    const body = {
      date,
      ...(row ? { id: row.id } : {}),
      reason: reason.trim(),
    };
    const fingerprint = JSON.stringify(body);
    if (requestRef.current?.fingerprint !== fingerprint)
      requestRef.current = { fingerprint, key: createRequestKey() };
    setBusy(true);
    setError(undefined);
    try {
      await api.request({
        path: 'attendanceResults/calculate',
        method: 'POST',
        json: { ...body, requestKey: requestRef.current.key },
      });
      toast.show({ title: t('attendanceResults.calculated') });
      onSaved();
    } catch (error) {
      setError(error);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <FormDrawerContent>
        <FormDrawerHeader>
          <DialogTitle>
            {t(
              row
                ? 'attendanceResults.recalculate'
                : 'attendanceResults.calculate',
            )}
          </DialogTitle>
          <DialogDescription>
            {t('attendanceResults.calculateDescription')}
          </DialogDescription>
        </FormDrawerHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <FormDrawerBody>
            <Label htmlFor='attendance-calculate-date'>
              {t('attendanceResults.date')}
            </Label>
            <DatePicker
              id='attendance-calculate-date'
              value={parseISO(date)}
              onChange={(value) =>
                setDate(value ? format(value, 'yyyy-MM-dd') : '')
              }
              disabled={busy || !!row}
              disabledDays={{ after: latestDay }}
            />
            <Label htmlFor='attendance-calculate-reason'>
              {t('attendanceResults.reason')}
            </Label>
            <Textarea
              id='attendance-calculate-reason'
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={2000}
              required
              disabled={busy}
            />
            {error ? (
              <Alert variant='destructive'>
                <AlertDescription>
                  {t(
                    error instanceof ApiClientError && error.status === 403
                      ? 'attendanceResults.denied'
                      : 'attendanceResults.calculateFailed',
                  )}
                </AlertDescription>
              </Alert>
            ) : null}
          </FormDrawerBody>
          <FormDrawerFooter>
            <Button
              variant='outline'
              type='button'
              disabled={busy}
              onClick={onClose}
            >
              {t('attendanceResults.cancel')}
            </Button>
            <Button type='submit' disabled={busy || !date || !reason.trim()}>
              {t(
                busy
                  ? 'attendanceResults.calculating'
                  : 'attendanceResults.confirmCalculate',
              )}
            </Button>
          </FormDrawerFooter>
        </form>
      </FormDrawerContent>
    </Dialog>
  );
}
