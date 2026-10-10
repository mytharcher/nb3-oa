import { useLocale, useTranslation } from '@nocobase/i18n/client';
import type { ColumnDef } from '@tanstack/react-table';
import { type ReactElement, useMemo } from 'react';
import { Outlet, useOutletContext } from 'react-router';

import { DataTable, DataTableColumnHeader } from '@/components/data-table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import type {
  EmployeeCompensation,
  EmployeePageOutletContext,
} from '../types.js';
import { useDateText } from '../dates.js';
import { TabLoadError, TabSkeleton } from './load-state.js';
import { useTabList } from './use-tab-list.js';

/** Tab `compensation`: append-only salary rows; the endpoint answers 403 without `compensation.view`. */
export default function EmployeeCompensationTab(): ReactElement {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const context = useOutletContext<EmployeePageOutletContext>();
  const { rows, error, retry } = useTabList<EmployeeCompensation>(
    context.employee.id,
    'compensation',
  );
  const date = useDateText();
  const amount = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [locale],
  );

  const columns = useMemo<ColumnDef<EmployeeCompensation>[]>(
    () => [
      {
        accessorKey: 'effectiveFrom',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('employees.fields.effectiveFrom')}
          />
        ),
        cell: ({ row }) => (
          <span className='whitespace-nowrap'>
            {date(row.original.effectiveFrom)}
          </span>
        ),
      },
      {
        id: 'baseSalary',
        accessorFn: (row) => Number(row.baseSalary),
        header: ({ column }) => (
          <div className='flex justify-end'>
            <DataTableColumnHeader
              column={column}
              title={t('employees.fields.baseSalary')}
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className='text-right tabular-nums'>
            {amount.format(Number(row.original.baseSalary))}
          </div>
        ),
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
    ],
    [amount, date, t],
  );

  let content: ReactElement;
  if (error) content = <TabLoadError error={error} onRetry={retry} />;
  else if (!rows) content = <TabSkeleton />;
  else
    content = (
      <Card>
        <CardHeader>
          <CardTitle>{t('employees.compensation.title')}</CardTitle>
          <CardDescription>
            {t('employees.compensation.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={rows}
            getRowId={(row) => row.id}
            pagination={false}
            showSelectedCount={false}
            initialSorting={[{ id: 'effectiveFrom', desc: true }]}
            emptyMessage={t('employees.compensation.empty')}
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
