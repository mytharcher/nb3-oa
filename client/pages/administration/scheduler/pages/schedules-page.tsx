import { LoadFailure } from '../../components/load-failure.js';
import { responseStatus } from '../../components/response-status.js';
import { ApplicationRefreshButton } from '#components/application-refresh-button';
import { ApplicationTableEmpty } from '#components/application-table-empty';
import { ApplicationTableSkeleton } from '#components/application-table-skeleton';
import { Alert, AlertDescription } from '#components/ui/alert';
import { ApplicationSearch } from '#components/application-search';
import { ApplicationToolbar } from '#components/application-toolbar';
import { scheduleTitle } from './schedule-title.js';
import { Outlet } from 'react-router';
import { ResponsiveTable as Table } from '#components/responsive-table';
import { PageSection } from '../components/page-section.js';
import { StatusBadge } from '../components/status-badge.js';
import { Button } from '#components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from '#components/ui/select';
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#components/ui/table';
import { PageContainer } from '../components/page-container.js';
import { PageHeader } from '../components/page-header.js';
import { apiClientToken, useService } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { ArrowUpDown } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { Link } from 'react-router';

import { DateTimeValue } from './date-time-value.js';
import { formatClientRelativeTime } from './date-time.js';
import { formatCronDescription } from './cron-description.js';
import { ScheduleSwitch } from './schedule-switch.js';

const SCHEDULER_NS = '@nocobase/app-plugin-scheduler';

/** Rows per page. The pager stays hidden while every row fits on one page. */
const PAGE_SIZE = 10;
/** Rows per request. Search and filters run in the browser over every schedule, so the list is read in full. */
const FETCH_PAGE_SIZE = 100;
type TargetState = 'ready' | 'disabled' | 'missing' | 'invalid';
type ViewStatus = 'active' | 'paused' | 'inactive' | 'targetIssue';

interface ScheduleItem {
  readonly id: string;
  readonly key: string;
  readonly title: string;
  readonly cron: string;
  readonly timezone: string;
  readonly enabled: boolean;
  readonly lifecycleState: 'active' | 'inactive';
  readonly inactiveReason?: string;
  readonly scheduleStatus: 'active' | 'paused';
  readonly targetState: TargetState;
  readonly runCount: number;
  readonly lastRunAt?: string;
  readonly nextRunAt?: string;
  readonly targetType: string;
  readonly targetSummary: {
    readonly targetLabel: string;
    readonly description?: string;
    readonly state?: TargetState;
  };
}

function viewStatus(item: ScheduleItem): ViewStatus {
  if (!item.enabled) return 'paused';
  if (item.lifecycleState === 'inactive') return 'inactive';
  if (item.targetState !== 'ready') return 'targetIssue';
  return 'active';
}

export default function SchedulesPage(): ReactElement {
  const api = useService(apiClientToken);
  const { i18n, t } = useTranslation(SCHEDULER_NS);
  const [items, setItems] = useState<readonly ScheduleItem[]>([]);
  const [actionError, setActionError] = useState(false);
  const [savedName, setSavedName] = useState<string>();
  const [listError, setListError] = useState<unknown>();
  const [revision, setRevision] = useState(0);
  const [sort, setSort] = useState<'runCount' | 'nextRunAt'>('nextRunAt');
  const [descending, setDescending] = useState(true);
  const refresh = () => {
    setLoading(true);
    setListError(undefined);
    setRevision((value) => value + 1);
  };
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ViewStatus>('all');
  const [targetFilter, setTargetFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [updating, setUpdating] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const setScheduleEnabled = (item: ScheduleItem, enabled: boolean): void => {
    setActionError(false);
    setSavedName(undefined);
    setItems((current) =>
      current.map((candidate) =>
        candidate.id === item.id ? { ...candidate, enabled } : candidate,
      ),
    );
    setUpdating((current) => new Set(current).add(item.id));
    void api
      .request<{ data: ScheduleItem }>({
        method: 'POST',
        path: `scheduler/schedules/${encodeURIComponent(item.id)}/${enabled ? 'enable' : 'disable'}`,
      })
      .then(({ data }) => {
        setSavedName(scheduleTitle(data, t));
        setItems((current) =>
          current.map((candidate) =>
            candidate.id === item.id ? data : candidate,
          ),
        );
      })
      .catch(() => {
        setActionError(true);
        setItems((current) =>
          current.map((candidate) =>
            candidate.id === item.id
              ? { ...candidate, enabled: item.enabled }
              : candidate,
          ),
        );
      })
      .finally(() =>
        setUpdating((current) => {
          const next = new Set(current);
          next.delete(item.id);
          return next;
        }),
      );
  };

  useEffect(() => {
    const controller = new AbortController();
    const loadAll = async (): Promise<readonly ScheduleItem[]> => {
      const loaded: ScheduleItem[] = [];
      for (let next = 1; ; next += 1) {
        const response = await api.request<{
          data: readonly ScheduleItem[];
          meta: { total: number };
        }>({
          path: 'scheduler/schedules',
          query: { page: next, pageSize: FETCH_PAGE_SIZE },
          signal: controller.signal,
        });
        loaded.push(...response.data);
        if (response.data.length === 0 || loaded.length >= response.meta.total)
          return loaded;
      }
    };
    void loadAll()
      .then((loaded) => {
        if (!controller.signal.aborted) setItems(loaded);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setListError(cause);
        if ([401, 403, 404].includes(responseStatus(cause) ?? 0)) setItems([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [api, t, revision]);

  const targetTypes = useMemo(
    () => [...new Set(items.map(({ targetType }) => targetType))].sort(),
    [items],
  );
  const visibleItems = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return items
      .filter((item) => {
        const scheduleDescription = formatCronDescription(
          item.cron,
          i18n.resolvedLanguage ?? i18n.language,
        );
        const matchesText =
          !term ||
          [
            scheduleTitle(item, t),
            item.title,
            item.cron,
            scheduleDescription,
            item.targetType,
          ].some((value) => value?.toLocaleLowerCase().includes(term));
        return (
          matchesText &&
          (statusFilter === 'all' || viewStatus(item) === statusFilter) &&
          (targetFilter === 'all' || item.targetType === targetFilter)
        );
      })
      .sort((a, b) => {
        if (sort === 'runCount')
          return (a.runCount - b.runCount) * (descending ? -1 : 1);
        const left = a.nextRunAt ? Date.parse(a.nextRunAt) : null,
          right = b.nextRunAt ? Date.parse(b.nextRunAt) : null;
        if (left === null) return right === null ? 0 : 1;
        if (right === null) return -1;
        return (left - right) * (descending ? -1 : 1);
      });
  }, [
    sort,
    descending,
    i18n.language,
    i18n.resolvedLanguage,
    items,
    search,
    statusFilter,
    targetFilter,
    t,
  ]);

  const pageCount = Math.max(1, Math.ceil(visibleItems.length / PAGE_SIZE));
  // Narrowing a filter restarts from the first page, and the stored page is
  // clamped because the list can shrink under it between renders.
  const currentPage = Math.min(page, pageCount);
  const pagedItems = visibleItems.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const statusLabel = (status: ViewStatus): string =>
    t(`page.statuses.${status}`);
  const targetTypeLabel = (type: string): string =>
    t(`page.targets.${type}`, { defaultValue: type });
  const targetStateLabel = (state: TargetState): string =>
    t(`page.targetStates.${state}`);
  return (
    <PageContainer>
      <PageHeader
        title={t('page.title')}
        description={t('page.description')}
        actions={
          <ApplicationRefreshButton
            label={t('page.refresh')}
            loading={loading}
            onClick={refresh}
          />
        }
      />
      {actionError ? (
        <Alert variant='destructive'>
          <AlertDescription>{t('errors.toggleFailed')}</AlertDescription>
        </Alert>
      ) : null}
      {savedName ? (
        <p role='status' className='text-sm text-muted-foreground'>
          {t('page.saved', { name: savedName })}
        </p>
      ) : null}
      {listError ? (
        <LoadFailure
          error={listError}
          message={t(
            responseStatus(listError) === 403
              ? 'errors.forbidden'
              : responseStatus(listError) === 404
                ? 'errors.notFound'
                : 'errors.loadSchedules',
          )}
          retryLabel={t('page.retry')}
          onRetry={refresh}
        />
      ) : null}

      <PageSection className='overflow-hidden'>
        <ApplicationToolbar className='border-b border-border p-4'>
          <ApplicationSearch
            aria-label={t('page.filters.searchLabel')}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder={t('page.filters.searchPlaceholder')}
            type='search'
            value={search}
          />
          <Select
            items={[
              { value: 'all', label: t('page.filters.allStatuses') },
              ...(['active', 'paused', 'inactive', 'targetIssue'] as const).map(
                (status) => ({ value: status, label: statusLabel(status) }),
              ),
            ]}
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value ?? 'all');
              setPage(1);
            }}
          >
            <SelectTrigger
              aria-label={t('page.filters.statusLabel')}
              className='w-full md:w-44'
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
              <SelectGroup>
                <SelectItem value='all'>
                  {t('page.filters.allStatuses')}
                </SelectItem>
                {(['active', 'paused', 'inactive', 'targetIssue'] as const).map(
                  (status) => (
                    <SelectItem key={status} value={status}>
                      {statusLabel(status)}
                    </SelectItem>
                  ),
                )}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select
            items={[
              { value: 'all', label: t('page.filters.allTargets') },
              ...targetTypes.map((value) => ({
                value,
                label: targetTypeLabel(value),
              })),
            ]}
            value={targetFilter}
            onValueChange={(value) => {
              setTargetFilter(value ?? 'all');
              setPage(1);
            }}
          >
            <SelectTrigger
              aria-label={t('page.filters.targetLabel')}
              className='w-full md:w-48'
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
              <SelectGroup>
                <SelectItem value='all'>
                  {t('page.filters.allTargets')}
                </SelectItem>
                {targetTypes.map((targetType) => (
                  <SelectItem key={targetType} value={targetType}>
                    {targetTypeLabel(targetType)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </ApplicationToolbar>

        {loading && items.length === 0 ? (
          <ApplicationTableSkeleton columns={5} />
        ) : listError && items.length === 0 ? null : visibleItems.length ===
          0 ? (
          <ApplicationTableEmpty
            title={t(
              search.trim() || statusFilter !== 'all' || targetFilter !== 'all'
                ? 'page.noMatches'
                : 'page.empty',
            )}
            clearFilters={
              search.trim() || statusFilter !== 'all' || targetFilter !== 'all'
                ? {
                    label: t('page.clearFilters'),
                    onClick: () => {
                      setSearch('');
                      setStatusFilter('all');
                      setTargetFilter('all');
                      setPage(1);
                    },
                  }
                : undefined
            }
          />
        ) : (
          <>
            <Table
              containerClassName='rounded-none! border-0!'
              className='min-w-3xl text-left'
            >
              <TableHeader className='bg-muted/30 tracking-wide uppercase'>
                <TableRow>
                  {(
                    [
                      'name',
                      'status',
                      'scheduleTimezone',
                      'triggered',
                      'nextRun',
                    ] as const
                  ).map((column) => (
                    <TableHead
                      key={column}
                      aria-sort={
                        (column === 'triggered' && sort === 'runCount') ||
                        (column === 'nextRun' && sort === 'nextRunAt')
                          ? descending
                            ? 'descending'
                            : 'ascending'
                          : undefined
                      }
                      className={
                        column === 'triggered' ? 'text-right' : undefined
                      }
                    >
                      {column === 'triggered' || column === 'nextRun' ? (
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => {
                            const field =
                              column === 'triggered' ? 'runCount' : 'nextRunAt';
                            if (sort === field)
                              setDescending((value) => !value);
                            else {
                              setSort(field);
                              setDescending(true);
                            }
                          }}
                        >
                          {t(`page.columns.${column}`)}
                          <ArrowUpDown />
                        </Button>
                      ) : (
                        t(`page.columns.${column}`)
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedItems.map((item) => {
                  const href = `/schedules/${encodeURIComponent(item.id)}`;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className='break-words'>
                        <Link
                          className='block break-words font-medium text-foreground underline-offset-4 hover:underline focus-visible:underline'
                          to={href}
                        >
                          {scheduleTitle(item, t)}
                        </Link>
                        <p className='mt-1 break-all text-xs text-muted-foreground'>
                          {targetTypeLabel(item.targetType)}
                        </p>
                        {item.targetState !== 'ready' ? (
                          <div className='mt-1'>
                            <StatusBadge
                              label={targetStateLabel(item.targetState)}
                              status='targetIssue'
                            />
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <ScheduleSwitch
                          checked={item.enabled}
                          disabled={
                            updating.has(item.id) ||
                            item.lifecycleState === 'inactive'
                          }
                          label={
                            item.enabled
                              ? t('page.actions.disable')
                              : t('page.actions.enable')
                          }
                          onChange={(enabled) =>
                            setScheduleEnabled(item, enabled)
                          }
                        />
                      </TableCell>
                      <TableCell className='break-words'>
                        <span className='font-medium break-words'>
                          {formatCronDescription(
                            item.cron,
                            i18n.resolvedLanguage ?? i18n.language,
                          ) ?? t('page.invalidSchedule')}
                        </span>
                        <p className='mt-1 text-xs text-muted-foreground'>
                          {item.timezone}
                        </p>
                      </TableCell>
                      <TableCell className='break-words text-right'>
                        <span className='tabular-nums'>
                          {new Intl.NumberFormat(i18n.language).format(
                            item.runCount,
                          )}
                        </span>
                        <p className='mt-1 text-xs text-muted-foreground'>
                          {item.lastRunAt
                            ? (formatClientRelativeTime(item.lastRunAt) ??
                              t('page.unavailable'))
                            : t('page.unavailable')}
                        </p>
                      </TableCell>
                      <TableCell className='break-words'>
                        {item.nextRunAt ? (
                          <DateTimeValue value={item.nextRunAt} />
                        ) : (
                          t('page.unavailable')
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {visibleItems.length > PAGE_SIZE ? (
              <div
                data-slot='table-pagination'
                className='flex min-w-0 flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm'
              >
                <p className='text-muted-foreground'>
                  {t('page.pagination.summary', {
                    page: currentPage,
                    total: pageCount,
                  })}
                </p>
                <div className='flex gap-2'>
                  <Button
                    variant='outline'
                    disabled={currentPage <= 1}
                    onClick={() => setPage(currentPage - 1)}
                    size='sm'
                  >
                    {t('page.pagination.previous')}
                  </Button>
                  <Button
                    variant='outline'
                    disabled={currentPage >= pageCount}
                    onClick={() => setPage(currentPage + 1)}
                    size='sm'
                  >
                    {t('page.pagination.next')}
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </PageSection>
      <Outlet />
    </PageContainer>
  );
}
