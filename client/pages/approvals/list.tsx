import { useLeaveLabel } from './use-leave-label.js';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import { ClipboardCheck, MoreHorizontal, RefreshCw } from 'lucide-react';
import { useMemo, useRef } from 'react';
import { Link, Outlet, useLocation, useResolvedPath } from 'react-router';
import { PageHeader } from '@/components/page-header';
import { DataTableServer } from '@/components/data-table/server-table';
import { DataTableColumnHeader } from '@/components/data-table/column-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import {
  Empty,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@/components/ui/empty';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { useUrlSearch } from '@/hooks/use-url-search';
import { TableSkeleton } from '../platform/shared/states.js';
import { ErrorState } from './states.js';
import { TAB_VIEW, type LeaveRecord } from './types.js';
import { useResource } from './use-resource.js';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ApprovalList() {
  const { t, i18n } = useTranslation();
  const typeLabel = useLeaveLabel();
  const location = useLocation();
  const path = useResolvedPath('.');
  const tab = path.pathname.split('/').at(-1) ?? 'todo';
  const view = TAB_VIEW[tab] ?? 'pending';
  const resource = useResource<LeaveRecord[]>('leaveRequests', { view });
  const permission = useCan({
    resource: { type: 'composite', id: 'oa.leave' },
    action: 'submit',
  });
  const search = useUrlSearch({ resetParams: ['page'] });
  const searchRef = useRef<HTMLInputElement>(null);
  const status = search.searchParams.get('status') ?? 'all';
  const sort = search.searchParams.get('orderBy') ?? 'createdAt';
  const desc = search.searchParams.get('direction') !== 'asc';
  const sorting: SortingState = [
    {
      id: ['days', 'createdAt', 'startDate'].includes(sort)
        ? sort
        : 'createdAt',
      desc,
    },
  ];
  const pageSize = [10, 20, 50].includes(
    Number(search.searchParams.get('pageSize')),
  )
    ? Number(search.searchParams.get('pageSize'))
    : 20;
  const page = Math.max(
    0,
    Number(search.searchParams.get('page') ?? 1) - 1 || 0,
  );
  const nameData: Record<string, string> | undefined = undefined;
  const nameLabel = (r: LeaveRecord) =>
    r.applicant?.name ??
    nameData?.[r.applicantId] ??
    t('approvals.unknownPerson');
  const collator = new Intl.Collator(i18n.language);
  const filtered = (resource.data ?? [])
    .filter(
      (r) =>
        (status === 'all' || r.status === status) &&
        (!search.search ||
          `${r.number ?? t('approvals.draft')} ${nameLabel(r)}`
            .toLocaleLowerCase()
            .includes(search.search.toLocaleLowerCase())),
    )
    .sort((a, b) => {
      const id = sorting[0].id;
      const value =
        id === 'days'
          ? Number(a.days) - Number(b.days)
          : collator.compare(
              id === 'startDate' ? a.startDate : a.createdAt,
              id === 'startDate' ? b.startDate : b.createdAt,
            );
      return sorting[0].desc ? -value : value;
    });
  const hasFilters = !!search.text || status !== 'all';
  const empty = resource.data?.length === 0 && !hasFilters;
  const create = (
    <Button
      render={<Link to={{ pathname: 'newLeave', search: location.search }} />}
      nativeButton={false}
    >
      {t('approvals.newLeave')}
    </Button>
  );
  const columns = useMemo<ColumnDef<LeaveRecord, unknown>[]>(
    () => [
      {
        id: 'reference',
        header: t('approvals.reference'),
        enableHiding: false,
        enableSorting: false,
        cell: ({ row }) => (
          <Link
            className='text-primary underline-offset-4 hover:underline'
            to={{
              pathname: `leave/${row.original.id}`,
              search: location.search,
            }}
          >
            {row.original.number ?? t('approvals.draft')} ·{' '}
            {row.original.startDate}–{row.original.endDate}
          </Link>
        ),
      },
      {
        id: 'applicant',
        header: t('approvals.applicant'),
        enableHiding: false,
        enableSorting: false,
        cell: ({ row }) =>
          row.original.applicant?.name ??
          nameData?.[row.original.applicantId] ??
          t('approvals.unknownPerson'),
      },
      {
        accessorKey: 'leaveType',
        header: t('approvals.type'),
        enableHiding: false,
        enableSorting: false,
        cell: ({ row }) => (
          <Badge variant='outline'>{typeLabel(row.original.leaveType)}</Badge>
        ),
      },
      {
        accessorKey: 'days',
        enableHiding: false,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('approvals.days')} />
        ),
        cell: ({ row }) => (
          <span className='block text-right'>
            {new Intl.NumberFormat(i18n.language).format(
              Number(row.original.days),
            )}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: t('approvals.status'),
        enableHiding: false,
        enableSorting: false,
        cell: ({ row }) => (
          <Badge variant='secondary'>
            {t(`approvals.states.${row.original.status}`)}
          </Badge>
        ),
      },
      {
        accessorKey: 'createdAt',
        enableHiding: false,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('approvals.createdAt')}
          />
        ),
        cell: ({ row }) =>
          new Intl.DateTimeFormat(i18n.language, {
            dateStyle: 'medium',
            timeStyle: 'short',
          }).format(new Date(row.original.createdAt)),
      },
      {
        id: 'actions',
        enableHiding: false,
        enableSorting: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant='ghost'
                  size='icon-sm'
                  aria-label={t('approvals.actions', {
                    name: row.original.number ?? t('approvals.draft'),
                  })}
                />
              }
            >
              <MoreHorizontal />
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-auto min-w-40'>
              <DropdownMenuGroup>
                <DropdownMenuItem
                  render={
                    <Link
                      to={{
                        pathname: `leave/${row.original.id}`,
                        search: location.search,
                      }}
                    />
                  }
                >
                  {t('approvals.detail')}
                </DropdownMenuItem>
                {['draft', 'revision'].includes(row.original.status) &&
                view === 'mine' ? (
                  <DropdownMenuItem
                    render={
                      <Link
                        to={{
                          pathname: `editLeave/${row.original.id}`,
                          search: location.search,
                        }}
                      />
                    }
                  >
                    {t('approvals.edit')}
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [t, i18n.language, location.search, nameData, view, typeLabel],
  );
  return (
    <>
      <PageHeader
        title={t('approvals.navigation.center')}
        description={t('approvals.description')}
        actions={
          <>
            {permission.can && resource.data && !empty ? create : null}
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant='outline'
                    size='icon'
                    aria-label={t('approvals.refresh')}
                    disabled={resource.loading}
                    onClick={() => {
                      resource.reload();
                    }}
                  />
                }
              >
                <RefreshCw
                  className={resource.loading ? 'animate-spin' : undefined}
                />
              </TooltipTrigger>
              <TooltipContent>{t('approvals.refresh')}</TooltipContent>
            </Tooltip>
          </>
        }
      />
      <Tabs value={tab}>
        <TabsList className='max-w-full overflow-x-auto'>
          {['todo', 'done', 'copied', 'mine'].map((value) => (
            <TabsTrigger
              key={value}
              value={value}
              render={
                <Link
                  to={{ pathname: `../${value}`, search: location.search }}
                />
              }
            >
              {t(`approvals.tabs.${value}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className='flex flex-wrap items-center gap-2'>
        <Input
          {...search.inputProps}
          ref={searchRef}
          className='w-full sm:max-w-xs'
          placeholder={t('approvals.search')}
          aria-label={t('approvals.search')}
        />
        <Select
          value={status}
          items={[
            { value: 'all', label: t('approvals.all') },
            ...[
              'draft',
              'revision',
              'manager',
              'head',
              'hr',
              'approved',
              'rejected',
              'withdrawn',
              'terminated',
            ].map((v) => ({ value: v, label: t(`approvals.states.${v}`) })),
          ]}
          onValueChange={(v) =>
            search.updateParams((p) => {
              p.set('status', v ?? 'all');
              p.delete('page');
            })
          }
        >
          <SelectTrigger
            className='w-full sm:w-40'
            aria-label={t('approvals.status')}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
            <SelectGroup>
              <SelectItem value='all'>{t('approvals.all')}</SelectItem>
              {[
                'draft',
                'revision',
                'manager',
                'head',
                'hr',
                'approved',
                'rejected',
                'withdrawn',
                'terminated',
              ].map((v) => (
                <SelectItem key={v} value={v}>
                  {t(`approvals.states.${v}`)}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {hasFilters ? (
          <Button
            variant='ghost'
            onClick={() => {
              search.clear((p) => {
                p.delete('status');
                p.delete('page');
              });
              searchRef.current?.focus();
            }}
          >
            {t('approvals.clear')}
          </Button>
        ) : null}
        {resource.loading && resource.data ? <Spinner /> : null}
      </div>
      {resource.error ? (
        <ErrorState error={resource.error} retry={resource.reload} />
      ) : null}
      {!resource.data && resource.loading ? (
        <TableSkeleton />
      ) : empty ? (
        <Empty className='min-h-48 border border-dashed'>
          <EmptyHeader>
            <EmptyMedia variant='icon'>
              <ClipboardCheck />
            </EmptyMedia>
            <EmptyTitle>
              {t(`approvals.empty${tab[0].toUpperCase() + tab.slice(1)}Title`)}
            </EmptyTitle>
            <EmptyDescription>
              {t(
                `approvals.empty${tab[0].toUpperCase() + tab.slice(1)}Description`,
              )}
            </EmptyDescription>
          </EmptyHeader>
          {permission.can ? <EmptyContent>{create}</EmptyContent> : null}
        </Empty>
      ) : resource.data ? (
        <DataTableServer
          columns={columns}
          rows={filtered.slice(
            Math.min(
              page,
              Math.max(0, Math.ceil(filtered.length / pageSize) - 1),
            ) * pageSize,
            (Math.min(
              page,
              Math.max(0, Math.ceil(filtered.length / pageSize) - 1),
            ) +
              1) *
              pageSize,
          )}
          total={filtered.length}
          getRowId={(r) => r.id}
          pagination={{
            pageIndex: Math.min(
              page,
              Math.max(0, Math.ceil(filtered.length / pageSize) - 1),
            ),
            pageSize,
          }}
          pageSizeOptions={[10, 20, 50]}
          sorting={sorting}
          onSortingChange={(next) =>
            search.updateParams((p) => {
              p.set('orderBy', next[0]?.id ?? 'createdAt');
              p.set('direction', next[0]?.desc ? 'desc' : 'asc');
              p.delete('page');
            })
          }
          onPaginationChange={(next) =>
            search.updateParams((p) => {
              p.set('page', String(next.pageIndex + 1));
              p.set('pageSize', String(next.pageSize));
            })
          }
          emptyMessage={
            <div>
              {t('approvals.noResults')}
              <Button
                variant='ghost'
                onClick={() => search.clear((p) => p.delete('status'))}
              >
                {t('approvals.clear')}
              </Button>
            </div>
          }
        />
      ) : null}
      <Outlet context={{ reload: resource.reload }} />
    </>
  );
}
