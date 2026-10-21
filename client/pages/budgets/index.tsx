import { useEffect } from 'react';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import type { ColumnDef, Column } from '@tanstack/react-table';
import { MoreHorizontal, RefreshCw, Plus, Pencil, Eye } from 'lucide-react';
import { Link, Outlet, useLocation } from 'react-router';
import { DataTableServer, DataTableColumnHeader } from '#components/data-table';
import { ApplicationToolbar } from '#components/application-toolbar';
import { ApplicationTableSkeleton } from '#components/application-table-skeleton';
import { DepartmentPicker } from '#components/department-picker';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { StatusBadge } from '#components/status-badge';
import { Button } from '#components/ui/button';
import { Label } from '#components/ui/label';
import { Input } from '#components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from '#components/ui/select';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
} from '#components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '#components/ui/tooltip';
import { useUrlSearch } from '#hooks/use-url-search';
import { TruncatedText } from '#components/truncated-text';
import { useBalanceResource } from './resource.js';
import { BudgetEmpty, BudgetError } from './states.js';
import {
  BUDGET_SETTINGS,
  label,
  money,
  type Budget,
  type BudgetContext,
  type Page,
  type Subject,
} from './types.js';
const sorts = [
  'year',
  'allocatedCents',
  'heldCents',
  'usedCents',
  'availableCents',
];
export default function BudgetsPage() {
  const { t, i18n } = useTranslation();
  const { searchParams, updateParams, text, inputProps, clear } = useUrlSearch({
    param: 'year',
  });
  const location = useLocation();
  const permission = useCan({
    resource: { type: 'settings', id: BUDGET_SETTINGS },
    action: 'update',
  });
  const canUpdate =
    permission.can && !permission.isPending && !permission.error;
  const year = searchParams.get('year') ?? '',
    departmentId = searchParams.get('departmentId') ?? '',
    subject = searchParams.get('subject') ?? '';
  const validYear =
    year && /^\d{4}$/.test(year) && Number(year) >= 1900 ? year : undefined;
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const pageSize = [10, 20, 50, 100].includes(
    Number(searchParams.get('pageSize')),
  )
    ? Number(searchParams.get('pageSize'))
    : 20;
  const orderBy = sorts.includes(searchParams.get('orderBy') ?? '')
    ? searchParams.get('orderBy')!
    : 'year';
  const direction = searchParams.get('direction') === 'asc' ? 'asc' : 'desc';
  const r = useBalanceResource<Page<Budget>>('budgets', {
    page: String(page),
    pageSize: String(pageSize),
    orderBy,
    direction,
    ...(validYear ? { year: validYear } : {}),
    ...(departmentId ? { departmentId } : {}),
    ...(subject ? { subject } : {}),
  });
  const options = useBalanceResource<{ data: { subjects: Subject[] } }>(
    'budgets/options',
  );
  const filtered = !!(year || departmentId || subject);
  const clearFilters = () =>
    clear((p) => {
      p.delete('departmentId');
      p.delete('subject');
      p.delete('page');
    });
  const link = (path: string) => ({ pathname: path, search: location.search });
  const create = canUpdate ? (
    <Button nativeButton={false} render={<Link to={link('new')} />}>
      <Plus data-icon='inline-start' />
      {t('budgets.new')}
    </Button>
  ) : null;
  const columns: ColumnDef<Budget>[] = [
    {
      id: 'department',
      header: t('budgets.department'),
      enableSorting: false,
      cell: ({ row }) => (
        <Link
          to={link(row.original.id)}
          className='font-medium underline-offset-4 hover:underline'
        >
          <TruncatedText text={row.original.department.title} />
        </Link>
      ),
    },
    {
      accessorKey: 'year',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('budgets.year')} />
      ),
    },
    {
      id: 'subject',
      header: t('budgets.subject'),
      enableSorting: false,
      cell: ({ row }) => (
        <StatusBadge tone='neutral'>
          {label(row.original.subjectLabel, i18n.language)}
        </StatusBadge>
      ),
    },
    ...(
      ['allocatedCents', 'heldCents', 'usedCents', 'availableCents'] as const
    ).map((key) => ({
      accessorKey: key,
      header: ({ column }: { column: Column<Budget, unknown> }) => (
        <DataTableColumnHeader
          column={column}
          title={t(`budgets.${key}`)}
          className='justify-end'
        />
      ),
      cell: ({ row }: { row: { original: Budget } }) => (
        <div className='text-right tabular-nums'>
          {money(row.original[key], i18n.language)}
        </div>
      ),
    })),
    {
      id: 'actions',
      enableSorting: false,
      header: '',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant='ghost'
                size='icon-sm'
                aria-label={t('budgets.rowActions', {
                  name: row.original.department.title,
                })}
              />
            }
          >
            <MoreHorizontal />
          </DropdownMenuTrigger>
          <DropdownMenuContent className='w-auto min-w-40' align='end'>
            <DropdownMenuGroup>
              <DropdownMenuItem render={<Link to={link(row.original.id)} />}>
                <Eye />
                {t('budgets.view')}
              </DropdownMenuItem>
              {canUpdate ? (
                <DropdownMenuItem
                  render={<Link to={link(`adjust/${row.original.id}`)} />}
                >
                  <Pencil />
                  {t('budgets.adjust')}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
  useEffect(() => {
    const actual = r.data?.meta.page;
    if (actual && actual !== page)
      updateParams((p) => p.set('page', String(actual)));
  }, [r.data?.meta.page, page, updateParams]);
  const context: BudgetContext = { onSaved: () => r.reload() };
  return (
    <PageContainer>
      <PageHeader
        title={t('budgets.title')}
        description={t('budgets.description')}
      />
      <ApplicationToolbar
        actions={
          <>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant='outline'
                    size='icon'
                    aria-label={t('budgets.refresh')}
                    disabled={r.loading}
                    onClick={() => {
                      r.reload();
                      options.reload();
                    }}
                  />
                }
              >
                <RefreshCw className={r.loading ? 'animate-spin' : undefined} />
              </TooltipTrigger>
              <TooltipContent>{t('budgets.refresh')}</TooltipContent>
            </Tooltip>
            {create}
          </>
        }
      >
        <div data-slot='application-filter' className='flex flex-col gap-2'>
          <Label htmlFor='budget-department'>{t('budgets.department')}</Label>
          <DepartmentPicker
            id='budget-department'
            value={departmentId}
            onChange={(v) =>
              updateParams((p) => {
                if (v) p.set('departmentId', v);
                else p.delete('departmentId');
                p.delete('page');
              })
            }
          />
        </div>
        <div
          data-slot='application-filter'
          data-context='true'
          className='flex flex-col gap-2'
        >
          <Label htmlFor='budget-year'>{t('budgets.year')}</Label>
          <Input
            id='budget-year'
            className='w-full sm:w-40'
            inputMode='numeric'
            placeholder={t('budgets.yearPlaceholder')}
            {...inputProps}
            value={text}
          />
        </div>
        <div data-slot='application-filter' className='flex flex-col gap-2'>
          <Label htmlFor='budget-subject'>{t('budgets.subject')}</Label>
          <Select
            items={[
              { value: '__all', label: t('budgets.allSubjects') },
              ...(options.data?.data.subjects ?? []).map((s) => ({
                value: s.code,
                label: label(s.label, i18n.language),
              })),
            ]}
            value={subject || '__all'}
            onValueChange={(v) =>
              updateParams((p) => {
                if (v && v !== '__all') p.set('subject', v);
                else p.delete('subject');
                p.delete('page');
              })
            }
          >
            <SelectTrigger id='budget-subject' className='w-full sm:w-40'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
              <SelectGroup>
                <SelectItem value='__all'>
                  {t('budgets.allSubjects')}
                </SelectItem>
                {options.data?.data.subjects.map((s) => (
                  <SelectItem key={s.code} value={s.code}>
                    {label(s.label, i18n.language)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        {filtered ? (
          <Button variant='outline' onClick={clearFilters}>
            {t('budgets.clear')}
          </Button>
        ) : null}
      </ApplicationToolbar>
      {options.error ? (
        <BudgetError error={options.error} retry={options.reload} />
      ) : null}
      {r.error ? <BudgetError error={r.error} retry={r.reload} /> : null}
      {!r.data ? (
        r.loading ? (
          <ApplicationTableSkeleton columns={8} />
        ) : null
      ) : (
        <DataTableServer
          columns={columns}
          rows={r.data.data}
          total={r.data.meta.total}
          getRowId={(b) => b.id}
          pagination={{ pageIndex: r.data.meta.page - 1, pageSize }}
          onPaginationChange={(p) =>
            updateParams((v) => {
              v.set('page', String(p.pageIndex + 1));
              v.set('pageSize', String(p.pageSize));
            })
          }
          sorting={[{ id: orderBy, desc: direction === 'desc' }]}
          onSortingChange={(s) =>
            updateParams((p) => {
              p.set('orderBy', s[0]?.id ?? 'year');
              p.set('direction', s[0]?.desc === false ? 'asc' : 'desc');
              p.delete('page');
            })
          }
          pageSizeOptions={[10, 20, 50, 100]}
          emptyMessage={
            <BudgetEmpty
              kind={filtered ? 'filtered' : canUpdate ? 'accounts' : 'readonly'}
              action={
                filtered ? (
                  <Button variant='outline' onClick={clearFilters}>
                    {t('budgets.clear')}
                  </Button>
                ) : null
              }
            />
          }
        />
      )}
      <Outlet context={context} />
    </PageContainer>
  );
}
