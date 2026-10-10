import { useTranslation } from '@nocobase/i18n/client';
import type { ColumnDef } from '@tanstack/react-table';
import { type ReactElement, useMemo } from 'react';
import { Outlet, useOutletContext } from 'react-router';

import { DataTable, DataTableColumnHeader } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import {
  EMPLOYEE_STATUSES,
  type EmployeeHistory,
  type EmployeePageOutletContext,
} from '../types.js';
import { useDateText } from '../dates.js';
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
  const date = useDateText();

  const columns = useMemo<ColumnDef<EmployeeHistory>[]>(() => {
    const show = (field: string, value: unknown): string => {
      if (value === null || value === undefined || value === '') return '—';
      if (field === 'status' && typeof value === 'string')
        return EMPLOYEE_STATUSES.some((status) => status === value)
          ? t(`employees.status.${value as (typeof EMPLOYEE_STATUSES)[number]}`)
          : value;
      if (typeof value === 'boolean')
        return value ? t('employees.boolean.yes') : t('employees.boolean.no');
      return typeof value === 'string' || typeof value === 'number'
        ? String(value)
        : JSON.stringify(value);
    };
    const label = (field: string): string =>
      isLabelled(field) ? t(`employees.fields.${FIELD_LABELS[field]}`) : field;
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
        cell: ({ row }) =>
          row.original.sourceApplication ?? (
            <span className='text-muted-foreground'>—</span>
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
  }, [date, t]);

  let content: ReactElement;
  if (error) content = <TabLoadError error={error} onRetry={retry} />;
  else if (!rows) content = <TabSkeleton />;
  else
    content = (
      <Card>
        <CardHeader>
          <CardTitle>{t('employees.history.title')}</CardTitle>
          <CardDescription>
            {t('employees.history.description')}
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
            emptyMessage={t('employees.history.empty')}
          />
        </CardContent>
      </Card>
    );

  return (
    <>
      {content}
      <Outlet context={context} />
    </>
  );
}
