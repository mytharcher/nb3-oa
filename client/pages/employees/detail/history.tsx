import { CompactEmpty } from './compact-empty.js';
import { SourceReference } from './source-reference.js';
import { useTranslation } from '@nocobase/i18n/client';
import type { ColumnDef } from '@tanstack/react-table';
import { type ReactElement, useCallback, useMemo } from 'react';
import { Outlet, useOutletContext } from 'react-router';

import { DataTable, DataTableColumnHeader } from '#components/data-table';
import { Badge } from '#components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#components/ui/card';

import {
  EMPLOYEE_STATUSES,
  type EmployeeHistory,
  type EmployeePageOutletContext,
} from '../types.js';
import { useDateText } from '../dates.js';
import { useApiClient } from '@nocobase/app-client';
import { useEffect, useState } from 'react';
import { TabLoadError, TabSkeleton } from './load-state.js';
import { useTabList } from './use-tab-list.js';

/** History fields and the label each is shown with. */
const FIELD_LABELS = {
  status: 'status',
  active: 'active',
  lastWorkingDay: 'lastWorkingDay',
  managerId: 'manager',
  positionId: 'position',
  gradeId: 'grade',
  hireDate: 'hireDate',
  careerStartDate: 'careerStartDate',
  probationEndDate: 'probationEndDate',
} as const;

function isLabelled(field: string): field is keyof typeof FIELD_LABELS {
  return field in FIELD_LABELS;
}

/** Tab `history`: hires, regularizations, transfers, departures and data corrections, newest first. */
export default function EmployeeHistoryTab(): ReactElement {
  const { t } = useTranslation();
  const context = useOutletContext<EmployeePageOutletContext>();
  const { rows, error, retry } = useTabList<EmployeeHistory>(
    context.employee.id,
    'history',
  );
  const changed = context.onSourceChanged;
  const sourceChanged = useCallback(() => {
    changed?.();
    retry();
  }, [changed, retry]);
  const date = useDateText();
  const api = useApiClient();
  const [catalogs, setCatalogs] = useState<
    Record<string, { id: string; title: string }[]>
  >({});
  useEffect(() => {
    const controller = new AbortController();
    for (const kind of ['positions', 'grades']) {
      void api
        .request<{ data: { id: string; title: string }[] }>({
          path: `${kind}/options`,
          query: { includeInactive: 'true' },
          signal: controller.signal,
        })
        .then(
          ({ data }) => {
            if (!controller.signal.aborted && Array.isArray(data))
              setCatalogs((old) => ({ ...old, [kind]: data }));
          },
          () => {
            /* A missing catalog label must not expose an internal reference. */
          },
        );
    }
    return () => controller.abort();
  }, [api]);

  const columns = useMemo<ColumnDef<EmployeeHistory>[]>(() => {
    const show = (field: string, value: unknown): string => {
      if (value === null || value === undefined || value === '') return '—';
      if (
        (field === 'positionId' || field === 'gradeId') &&
        typeof value === 'string'
      )
        return (
          catalogs[field === 'positionId' ? 'positions' : 'grades']?.find(
            (r) => r.id === value,
          )?.title ?? t('employees.history.referenceUnavailable')
        );
      if (field === 'managerId' && typeof value === 'string')
        return context.employee.manager?.id === value
          ? context.employee.manager.name
          : t('employees.history.personUnavailable');
      if (field === 'status' && typeof value === 'string')
        return EMPLOYEE_STATUSES.some((status) => status === value)
          ? t(`employees.status.${value as (typeof EMPLOYEE_STATUSES)[number]}`)
          : value;
      if (
        [
          'hireDate',
          'careerStartDate',
          'probationEndDate',
          'lastWorkingDay',
        ].includes(field) &&
        typeof value === 'string'
      )
        return date(value) ?? '—';
      if (typeof value === 'boolean')
        return value ? t('employees.boolean.yes') : t('employees.boolean.no');
      return typeof value === 'string' || typeof value === 'number'
        ? String(value)
        : JSON.stringify(value);
    };
    const label = (field: string): string =>
      isLabelled(field)
        ? t(`employees.fields.${FIELD_LABELS[field]}`)
        : t('employees.history.otherField');
    return [
      {
        accessorKey: 'effectiveAt',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('employees.fields.effectiveAt')}
          />
        ),
        cell: ({ row }) => (
          <span className='whitespace-nowrap'>
            {date(row.original.effectiveAt)}
          </span>
        ),
      },
      {
        accessorKey: 'kind',
        enableSorting: false,
        header: t('employees.fields.kind'),
        cell: ({ row }) => (
          <Badge variant='outline'>
            {t(`employees.historyKind.${row.original.kind}`)}
          </Badge>
        ),
      },
      {
        id: 'changes',
        enableSorting: false,
        header: t('employees.fields.changes'),
        cell: ({ row }) => {
          const after = row.original.after ?? {};
          const before = row.original.before ?? {};
          const fields = [
            ...new Set([...Object.keys(before), ...Object.keys(after)]),
          ];
          if (!fields.length)
            return <span className='text-muted-foreground'>—</span>;
          return (
            <ul className='flex flex-col gap-1'>
              {fields.map((field) => (
                <li key={field}>
                  <span className='text-muted-foreground'>
                    {label(field)}:{' '}
                  </span>
                  {show(field, before[field])} → {show(field, after[field])}
                </li>
              ))}
            </ul>
          );
        },
      },
      {
        accessorKey: 'sourceApplication',
        enableSorting: false,
        header: t('employees.fields.sourceApplication'),
        cell: ({ row }) => (
          <SourceReference source={row.original.sourceApplication} />
        ),
      },
      {
        accessorKey: 'note',
        enableSorting: false,
        header: t('employees.fields.note'),
        cell: ({ row }) =>
          row.original.note ?? <span className='text-muted-foreground'>—</span>,
      },
    ];
  }, [date, t, catalogs, context.employee.manager]);

  let content: ReactElement;
  if (error) content = <TabLoadError error={error} onRetry={retry} />;
  else if (!rows) content = <TabSkeleton />;
  else
    content = (
      <Card>
        <CardHeader>
          <CardTitle>{t('employees.history.title')}</CardTitle>
          <CardDescription>
            {t('employees.history.description')}{' '}
            {t('employees.history.referenceNotice')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={rows}
            getRowId={(row) => row.id}
            pagination={false}
            showSelectedCount={false}
            initialSorting={[{ id: 'effectiveAt', desc: true }]}
            emptyMessage={<CompactEmpty title={t('employees.history.empty')} />}
          />
        </CardContent>
      </Card>
    );

  return (
    <>
      {content}
      <Outlet
        context={{
          ...context,
          reload: sourceChanged,
          onSourceChanged: sourceChanged,
        }}
      />
    </>
  );
}
