import { useCallback, useMemo, useState } from 'react';
import { format, startOfMonth } from 'date-fns';
import { Link, useSearchParams } from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import { ApiClientError } from '@nocobase/app-client';
import type { ColumnDef } from '@tanstack/react-table';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { ApplicationRefreshButton } from '#components/application-refresh-button';
import { ApplicationTableEmpty } from '#components/application-table-empty';
import { DataTable, DataTableColumnHeader } from '#components/data-table';
import { DateRangePicker, type DateRange } from '#components/date-picker';
import { DepartmentPicker } from '#components/department-picker';
import { SessionExpiredAlert } from '#components/session-expired-alert';
import { Alert, AlertDescription } from '#components/ui/alert';
import { Button } from '#components/ui/button';
import { Skeleton } from '#components/ui/skeleton';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '#components/ui/card';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from '#components/ui/select';
import { useScheduleResource } from '../personal-schedules/resource';
import { approvalStateLabel } from '../approvals/business-metadata';
interface Summary {
  kind: string;
  submitted: number;
  completed: number;
  averageElapsedMs: number | null;
  returned: number;
  returnRate: number;
}
interface Stage {
  kind: string;
  stage: string;
  completed: number;
  averageElapsedMs: number | null;
  waiting: number;
  oldestWaitingMs: number;
}
interface Overdue {
  kind: string;
  recordId: string;
  number: string | null;
  stage: string;
  taskId: string;
  dueAt: string;
  overdueMs: number;
}
interface Result {
  processes: Summary[];
  stages: Stage[];
  overdue: Overdue[];
  sourceKinds: string[];
  generatedAt: string;
  timeZone: string;
}
export default function ProcessOperations() {
  const { t, i18n } = useTranslation(),
    [params, setParams] = useSearchParams();
  const [today] = useState(() => new Date());
  const from = params.get('from') ?? format(startOfMonth(today), 'yyyy-MM-dd'),
    to = params.get('to') ?? format(today, 'yyyy-MM-dd'),
    kind = params.get('kind') ?? 'all',
    departmentId = params.get('department') ?? '';
  const query = {
    from,
    to,
    ...(kind !== 'all' ? { kind } : {}),
    ...(departmentId ? { departmentId } : {}),
  };
  const r = useScheduleResource<{ data: Result }>(
      'reports/process-operations',
      query,
    ),
    result = r.data?.data;
  const update = (values: Record<string, string>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(values)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next);
  };
  const label = useCallback(
    (value: string) => t(`processManagement.kinds.${value.slice(3)}`),
    [t],
  );
  const hours = useCallback(
    (value: number | null) =>
      value === null
        ? '—'
        : t('processOperations.hours', {
            value: new Intl.NumberFormat(i18n.language, {
              maximumFractionDigits: 1,
            }).format(value / 3600000),
          }),
    [t, i18n.language],
  );
  const stageLabel = useCallback(
    (value: string, process: string) => {
      const valueLabel = approvalStateLabel(value, t, process);
      return valueLabel.includes('.')
        ? t('processOperations.stage')
        : valueLabel;
    },
    [t],
  );
  const columns = useMemo<ColumnDef<Summary, unknown>[]>(
    () => [
      {
        accessorKey: 'kind',
        header: t('processOperations.process'),
        cell: ({ row }) =>
          t(`processManagement.kinds.${row.original.kind.slice(3)}`),
      },
      ...(['submitted', 'completed', 'returned'] as const).map((key) => ({
        accessorKey: key,
        header: t(`processOperations.${key}`),
      })),
      {
        accessorKey: 'averageElapsedMs',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('processOperations.average')}
          />
        ),
        cell: ({ row }) =>
          row.original.averageElapsedMs === null
            ? '—'
            : t('processOperations.hours', {
                value: new Intl.NumberFormat(i18n.language, {
                  maximumFractionDigits: 1,
                }).format(row.original.averageElapsedMs / 3600000),
              }),
      },
      {
        accessorKey: 'returnRate',
        header: t('processOperations.returnRate'),
        cell: ({ row }) =>
          new Intl.NumberFormat(i18n.language, {
            style: 'percent',
            maximumFractionDigits: 1,
          }).format(row.original.returnRate),
      },
    ],
    [t, i18n.language],
  );
  const stageColumns = useMemo<ColumnDef<Stage, unknown>[]>(
    () => [
      {
        accessorKey: 'kind',
        header: t('processOperations.process'),
        cell: ({ row }) => label(row.original.kind),
      },
      {
        accessorKey: 'stage',
        header: t('processOperations.stage'),
        cell: ({ row }) => stageLabel(row.original.stage, row.original.kind),
      },
      { accessorKey: 'completed', header: t('processOperations.endedStages') },
      {
        accessorKey: 'averageElapsedMs',
        header: t('processOperations.averageStay'),
        cell: ({ row }) => hours(row.original.averageElapsedMs),
      },
      { accessorKey: 'waiting', header: t('processOperations.waiting') },
      {
        accessorKey: 'oldestWaitingMs',
        header: t('processOperations.oldestWait'),
        cell: ({ row }) => hours(row.original.oldestWaitingMs),
      },
    ],
    [t, label, stageLabel, hours],
  );
  const overdueColumns = useMemo<ColumnDef<Overdue, unknown>[]>(
    () => [
      {
        accessorKey: 'kind',
        header: t('processOperations.process'),
        cell: ({ row }) => label(row.original.kind),
      },
      {
        accessorKey: 'number',
        header: t('processOperations.number'),
        cell: ({ row }) =>
          row.original.number || t('processOperations.noNumber'),
      },
      {
        accessorKey: 'stage',
        header: t('processOperations.stage'),
        cell: ({ row }) => stageLabel(row.original.stage, row.original.kind),
      },
      {
        accessorKey: 'dueAt',
        header: t('processOperations.due'),
        cell: ({ row }) =>
          new Intl.DateTimeFormat(i18n.language, {
            dateStyle: 'medium',
            timeStyle: 'short',
          }).format(new Date(row.original.dueAt)),
      },
      {
        accessorKey: 'overdueMs',
        header: t('processOperations.overdueTime'),
        cell: ({ row }) => hours(row.original.overdueMs),
      },
    ],
    [t, label, stageLabel, hours, i18n.language],
  );
  const items = [
    { value: 'all', label: t('processOperations.all') },
    ...[
      ...new Set([
        ...(result?.sourceKinds ?? []),
        ...(kind !== 'all' ? [kind] : []),
      ]),
    ].map((value) => ({ value, label: label(value) })),
  ];
  const status = r.error instanceof ApiClientError ? r.error.status : 500;
  return (
    <PageContainer className='min-w-0'>
      <PageHeader
        title={t('processOperations.title')}
        description={t('processOperations.hint')}
        actions={
          <ApplicationRefreshButton
            label={t('processOperations.refresh')}
            loading={r.loading}
            onClick={r.reload}
          />
        }
      />
      <div className='flex flex-wrap items-end gap-3'>
        <div className='space-y-1'>
          <label className='block text-sm' htmlFor='report-range'>
            {t('processOperations.range')}
          </label>
          <Range
            key={`${from}:${to}`}
            from={from}
            to={to}
            onChange={(a, b) => update({ from: a, to: b })}
          />
        </div>
        <div className='w-full space-y-1 sm:w-56'>
          <label className='block text-sm' htmlFor='report-kind'>
            {t('processOperations.process')}
          </label>
          <Select
            items={items}
            value={kind}
            onValueChange={(value) => update({ kind: value ?? 'all' })}
          >
            <SelectTrigger id='report-kind' className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className='w-auto min-w-(--anchor-width)'>
              <SelectGroup>
                {items.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className='w-full space-y-1 sm:w-56'>
          <label className='block text-sm' htmlFor='report-department'>
            {t('processOperations.department')}
          </label>
          <DepartmentPicker
            id='report-department'
            value={departmentId}
            onChange={(value) => update({ department: value })}
          />
        </div>
        {departmentId || kind !== 'all' ? (
          <Button
            variant='outline'
            onClick={() => update({ department: '', kind: 'all' })}
          >
            {t('processOperations.clear')}
          </Button>
        ) : null}
      </div>
      {r.error ? (
        status === 401 ? (
          <SessionExpiredAlert />
        ) : (
          <Alert variant='destructive'>
            <AlertDescription>
              {t(
                `processOperations.errors.${status === 403 ? 'denied' : status === 400 ? 'broad' : 'failed'}`,
              )}
            </AlertDescription>
            {status === 403 ? (
              <Button
                variant='outline'
                nativeButton={false}
                render={<Link to='/' />}
              >
                {t('processOperations.back')}
              </Button>
            ) : status !== 400 ? (
              <Button variant='outline' onClick={r.reload}>
                {t('processOperations.retry')}
              </Button>
            ) : null}
          </Alert>
        )
      ) : null}
      {r.loading && !result ? <Skeleton className='h-64' /> : null}
      {result ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t('processOperations.summary')}</CardTitle>
              <CardDescription>
                {t('processOperations.naturalTime')}
              </CardDescription>
            </CardHeader>
            <CardContent className='min-w-0'>
              <DataTable
                columns={columns}
                data={result.processes}
                getRowId={(row) => row.kind}
                showSelectedCount={false}
                emptyMessage={
                  <ApplicationTableEmpty
                    title={t('processOperations.empty')}
                    description={t('processOperations.emptyHint')}
                  />
                }
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t('processOperations.stages')}</CardTitle>
              <CardDescription>
                {t('processOperations.stageHint')}
              </CardDescription>
            </CardHeader>
            <CardContent className='min-w-0'>
              <DataTable
                columns={stageColumns}
                data={result.stages}
                getRowId={(row) => `${row.kind}:${row.stage}`}
                showSelectedCount={false}
                emptyMessage={t('processOperations.noStages')}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t('processOperations.overdue')}</CardTitle>
              <CardDescription>
                {t('processOperations.overdueHint')}
              </CardDescription>
            </CardHeader>
            <CardContent className='min-w-0'>
              <DataTable
                columns={overdueColumns}
                data={result.overdue}
                getRowId={(row) => row.taskId}
                showSelectedCount={false}
                emptyMessage={t('processOperations.noOverdue')}
              />
            </CardContent>
          </Card>
          <p className='text-xs text-muted-foreground'>
            {t('processOperations.generated', {
              at: new Intl.DateTimeFormat(i18n.language, {
                dateStyle: 'medium',
                timeStyle: 'short',
              }).format(new Date(result.generatedAt)),
            })}
          </p>
        </>
      ) : null}
    </PageContainer>
  );
}
function Range({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}) {
  const [value, setValue] = useState<DateRange | undefined>(() => {
    const a = new Date(`${from}T12:00:00`),
      b = new Date(`${to}T12:00:00`);
    return Number.isFinite(+a) && Number.isFinite(+b)
      ? { from: a, to: b }
      : undefined;
  });
  return (
    <DateRangePicker
      id='report-range'
      value={value}
      onChange={(range) => {
        setValue(range);
        if (range?.from && range.to)
          onChange(
            format(range.from, 'yyyy-MM-dd'),
            format(range.to, 'yyyy-MM-dd'),
          );
      }}
    />
  );
}
