import { ApplicationRefreshButton } from '#components/application-refresh-button';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { StatusBadge } from '#components/status-badge';
import { FavoriteRequestActions } from '#components/request-actions';
import { Button } from '#components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '#components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '#components/ui/empty';
import { Skeleton } from '#components/ui/skeleton';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { cn } from 'cn';
import { ClipboardCheck, Megaphone, Plus, SendHorizontal } from 'lucide-react';
import {
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Link, Outlet, useLocation, useResolvedPath } from 'react-router';
import { ErrorState } from '../approvals/states.js';
import { useResource } from '../approvals/use-resource.js';
import type { CenterRecord } from '../approvals/use-center-resource.js';
import { LeaveCardView, MeetingCardView } from '../home/personal-cards.js';
import {
  useLeaveCardData,
  useMeetingSummary,
} from '../home/personal-card-data.js';
import { byUrgency, dueState } from '../home/record-presentation.js';
import { useRequestAvailability } from '../home/use-request-availability.js';
import { useWorkbenchResource } from '../home/use-workbench-resource.js';
import { WorkRow } from '../home/work-row.js';
import { taskSources, type TaskCenterData } from '../task-center/sources.js';

/** The overview follows the task center's own source labels, so a tile and the list it opens agree. */
const overview = [
  { sourceType: 'approval.task', handling: true },
  { sourceType: 'oa.workItem', handling: true },
  { sourceType: 'oa.announcementReceipt', handling: true },
  { sourceType: 'approval.cc', handling: true },
  { sourceType: 'approval.application', handling: false },
] as const;

const PREVIEW_ROWS = 8;

interface Announcement {
  id: string;
  title: string;
  pinned: boolean;
  publishedAt: string | null;
}

/**
 * Prototype of a workbench organised by task source rather than by approval: what waits on the
 * viewer, starting requests, following their own requests, then reference cards. It reads only
 * the existing task center and workbench endpoints; `/` stays unchanged for comparison.
 */
export default function WorkbenchPrototypePage() {
  const { t, i18n } = useTranslation();
  const { session } = useAuthentication();
  const location = useLocation();
  const base = useResolvedPath('.');
  // Facets cover every source regardless of the requested source and status; one row is enough.
  const facets = useResource<TaskCenterData>('taskCenter', {
    source: 'approval.task',
    status: 'pending',
    page: '1',
    pageSize: '1',
  });
  const pending = useWorkbenchResource({ view: 'pending', pageSize: '100' });
  const mine = useWorkbenchResource({
    view: 'mine',
    pageSize: '5',
    homeSummary: 'true',
  });
  const requests = useRequestAvailability(
    facets.settled && pending.settled && mine.settled,
  );
  const workItemCreate = useCan({
    resource: { type: 'composite', id: 'oa.workItems' },
    action: 'create',
  });
  const meetings = useCan({
    resource: { type: 'composite', id: 'oa.meetingBookings' },
    action: 'view',
  });
  const rooms = useCan({
    resource: { type: 'composite', id: 'oa.meetingRooms' },
    action: 'view',
  });
  const announcements = useCan({
    resource: { type: 'composite', id: 'oa.announcements' },
    action: 'view',
  });
  const granted = (grant: {
    can: boolean;
    isPending: boolean;
    error?: unknown;
  }) => grant.can && !grant.isPending && !grant.error;

  // The clock behind deadlines, relative times and the greeting: ticks each minute and on refresh.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);
  // Reference cards read here so one Refresh keeps every card's data on screen and spins until all settle.
  const leave = useLeaveCardData();
  const meetingSummary = useMeetingSummary(granted(meetings));
  const latest = useResource<Announcement[]>(
    granted(announcements) ? 'announcements' : null,
    { mode: 'received', page: '1', pageSize: '5' },
  );
  const { reload: reloadFacets } = facets;
  const { reload: reloadPending } = pending;
  const { reload: reloadMine } = mine;
  const { reload: reloadBalances } = leave.balances;
  const { reload: reloadLeaveTypes } = leave.options;
  const { reload: reloadMeetings } = meetingSummary;
  const { reload: reloadLatest } = latest;
  const reload = useCallback(() => {
    setNow(new Date());
    reloadFacets();
    reloadPending();
    reloadMine();
    reloadBalances();
    reloadLeaveTypes();
    reloadMeetings();
    reloadLatest();
  }, [
    reloadFacets,
    reloadPending,
    reloadMine,
    reloadBalances,
    reloadLeaveTypes,
    reloadMeetings,
    reloadLatest,
  ]);
  // A failed card's Retry disappears with the error; keep focus on the page-level Refresh.
  const refreshRef = useRef<HTMLButtonElement>(null);
  const retry = () => {
    reload();
    refreshRef.current?.focus();
  };
  const context = useMemo(
    () => ({
      reload,
      onSaved: reload,
      basePath: base.pathname,
      search: location.search,
    }),
    [reload, base.pathname, location.search],
  );

  // Closing an overlay removes the focused element; return focus to the title.
  const titleRef = useRef<HTMLSpanElement>(null);
  const previousPathRef = useRef(location.pathname);
  useEffect(() => {
    if (
      previousPathRef.current !== location.pathname &&
      location.pathname === base.pathname
    )
      titleRef.current?.focus();
    previousPathRef.current = location.pathname;
  }, [location.pathname, base.pathname]);

  const countOf = (sourceType: string) =>
    facets.data?.facets
      .filter((facet) => facet.sourceType === sourceType)
      .reduce((sum, facet) => sum + facet.pending, 0) ?? 0;
  const todoCount = overview
    .filter((item) => item.handling)
    .reduce((sum, item) => sum + countOf(item.sourceType), 0);
  const pendingRows = pending.error ? [] : (pending.data ?? []);
  const preview = pendingRows
    .filter(
      (record, index) =>
        pendingRows.findIndex(
          (other) => other.id === record.id && other.kind === record.kind,
        ) === index,
    )
    .sort(byUrgency)
    .slice(0, PREVIEW_ROWS);
  const overdue = pendingRows.filter(
    (record) => dueState(record.dueAt, now) === 'overdue',
  ).length;
  // Exact while every pending item is loaded; otherwise a lower bound, shown as "n+".
  const overdueComplete =
    pending.meta !== undefined && pendingRows.length >= pending.meta.total;

  const hour = now.getHours();
  const greeting = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  const userName = session?.user.name?.trim();
  const summary = [
    new Intl.DateTimeFormat(i18n.language, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).format(now),
    facets.data && !facets.error
      ? t('workbench.summaryTodo', { count: todoCount })
      : null,
    facets.data && !facets.error && pending.meta && !pending.error && overdue
      ? t('workbench.summaryOverdue', {
          count: overdue,
          suffix: overdueComplete ? '' : '+',
        })
      : null,
  ]
    .filter(Boolean)
    .join(' · ');
  const number = new Intl.NumberFormat(i18n.language);
  const sourceLabel = (sourceType: string) =>
    t(
      taskSources.find((item) => item.sourceType === sourceType)?.label ??
        sourceType,
    );
  // Work items and receipts already name their source as their business type; approvals need
  // telling apart from the viewer's own returned requests.
  const rowSource = (record: CenterRecord) =>
    record.kind === 'oa.workItem' || record.kind === 'oa.announcementReceipt'
      ? undefined
      : t(
          `workbench.rowSource.${
            record.applicantId === session?.user.id ? 'application' : 'approval'
          }`,
        );
  const recent =
    mine.meta?.attention?.submitted ?? (mine.data ?? []).slice(0, 5);
  const revisions = mine.meta?.counts.revisions ?? 0;
  const drafts = mine.meta?.counts.drafts ?? 0;
  const loading =
    facets.loading ||
    pending.loading ||
    mine.loading ||
    leave.balances.loading ||
    leave.options.loading ||
    meetingSummary.loading ||
    latest.loading;

  return (
    <PageContainer className='flex flex-col gap-4'>
      <PageHeader
        title={
          <span ref={titleRef} tabIndex={-1}>
            {userName
              ? t(`workbench.greeting.${greeting}`, { name: userName })
              : t('workbench.title')}
          </span>
        }
        description={summary}
        actions={
          <ApplicationRefreshButton
            ref={refreshRef}
            label={t('workbench.refresh')}
            loading={loading}
            onClick={reload}
          />
        }
      />
      <section aria-label={t('workbench.sourcesLabel')}>
        {facets.error ? (
          <ErrorState context='query' error={facets.error} retry={retry} />
        ) : (
          <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5'>
            {overview.map(({ sourceType }) => {
              const label = sourceLabel(sourceType);
              const icon =
                taskSources.find((item) => item.sourceType === sourceType)
                  ?.icon ?? Megaphone;
              const value = facets.data ? countOf(sourceType) : undefined;
              const content = (
                <Card className='h-full transition-colors group-hover:bg-muted/50'>
                  <CardHeader>
                    <CardDescription className='flex min-w-0 items-center gap-2'>
                      {createElement(icon, {
                        className: 'size-4 shrink-0',
                        'aria-hidden': true,
                      })}
                      <span className='min-w-0 break-words'>{label}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {value === undefined ? (
                      <Skeleton
                        className='h-8 w-16'
                        aria-label={t('workbench.loading')}
                      />
                    ) : (
                      <span
                        className={cn(
                          'text-2xl font-semibold tabular-nums sm:text-3xl',
                          value ? 'text-foreground' : 'text-muted-foreground',
                        )}
                      >
                        {number.format(value)}
                      </span>
                    )}
                  </CardContent>
                </Card>
              );
              return value === undefined ? (
                <div key={sourceType}>{content}</div>
              ) : (
                <Link
                  key={sourceType}
                  to={{
                    pathname: '/taskCenter',
                    search: `?source=${sourceType}`,
                  }}
                  className='group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring'
                  aria-label={`${label} ${number.format(value)}`}
                >
                  {content}
                </Link>
              );
            })}
          </div>
        )}
      </section>
      {/* Narrow screens read the left column first: handle, then start, then follow and reference. */}
      <div className='grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] xl:items-start'>
        <div className='flex min-w-0 flex-col gap-4'>
          <Card className='min-w-0'>
            <CardHeader>
              <CardTitle>
                <h2>{t('workbench.todo')}</h2>
              </CardTitle>
              <CardDescription>
                {t('workbench.todoDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pending.error ? (
                <ErrorState
                  context='query'
                  error={pending.error}
                  retry={retry}
                />
              ) : preview.length ? (
                <ul className='flex flex-col'>
                  {preview.map((record) => (
                    <WorkRow
                      key={`${record.kind}:${record.id}`}
                      record={record}
                      now={now}
                      source={rowSource(record)}
                      showInitiator
                      showApplicant
                    />
                  ))}
                </ul>
              ) : pending.loading ? (
                <RowsSkeleton />
              ) : (
                <CardEmpty
                  icon={<ClipboardCheck />}
                  title={t('workbench.emptyAttention')}
                  description={t('workbench.emptyAttentionDescription')}
                />
              )}
            </CardContent>
            <CardFooter className='mt-auto flex flex-wrap gap-2'>
              <ListLink
                to='/taskCenter'
                label={t('workbench.openTaskCenter')}
              />
            </CardFooter>
          </Card>
          {requests.canSubmit || granted(workItemCreate) ? (
            <Card className='min-w-0'>
              <CardHeader>
                <CardTitle>
                  <h2>{t('workbench.quickStart')}</h2>
                </CardTitle>
                <CardDescription>
                  {t('workbench.quickStartDescription')}
                </CardDescription>
                {granted(workItemCreate) ? (
                  <CardAction>
                    <Button
                      variant='outline'
                      nativeButton={false}
                      render={
                        <Link
                          to={{
                            pathname: 'newWorkItem',
                            search: location.search,
                          }}
                        />
                      }
                    >
                      <Plus data-icon='inline-start' aria-hidden='true' />
                      {t('workbench.newWorkItem')}
                    </Button>
                  </CardAction>
                ) : null}
              </CardHeader>
              {requests.canSubmit ? (
                <CardContent>
                  <FavoriteRequestActions available={requests.available} />
                </CardContent>
              ) : null}
            </Card>
          ) : null}
        </div>
        <div className='flex min-w-0 flex-col gap-4'>
          <Card className='min-w-0'>
            <CardHeader>
              <CardTitle>
                <h2>{t('workbench.mine')}</h2>
              </CardTitle>
              {/* Drafts are part of the personal request list in the task center; counted here, not filtered. */}
              {revisions > 0 || drafts > 0 ? (
                <CardDescription className='flex flex-wrap items-center gap-2'>
                  {revisions > 0 ? (
                    <StatusBadge tone='warning'>
                      {t('workbench.mineRevisions', { count: revisions })}
                    </StatusBadge>
                  ) : null}
                  {drafts > 0 ? (
                    <StatusBadge>
                      {t('workbench.viewDraftsCount', { count: drafts })}
                    </StatusBadge>
                  ) : null}
                </CardDescription>
              ) : null}
            </CardHeader>
            <CardContent>
              {mine.error ? (
                <ErrorState context='query' error={mine.error} retry={retry} />
              ) : recent.length ? (
                <ul className='flex flex-col'>
                  {recent.map((record) => (
                    <WorkRow
                      key={`${record.kind}:${record.id}`}
                      record={record}
                      now={now}
                    />
                  ))}
                </ul>
              ) : mine.loading ? (
                <RowsSkeleton />
              ) : (
                <CardEmpty
                  icon={<SendHorizontal />}
                  title={t('workbench.emptyMine')}
                  description={t(
                    requests.canSubmit
                      ? 'workbench.emptyMineQuickStart'
                      : 'workbench.emptyMineRestricted',
                  )}
                />
              )}
            </CardContent>
            <CardFooter className='mt-auto flex flex-wrap gap-2'>
              <ListLink
                to='/taskCenter?source=approval.application'
                label={t('workbench.viewSource')}
              />
            </CardFooter>
          </Card>
          {granted(meetings) ? (
            <MeetingCardView
              resource={meetingSummary}
              canNavigate={granted(rooms)}
            />
          ) : null}
          <LeaveCardView {...leave} />
          {granted(announcements) ? (
            <LatestAnnouncementsCard resource={latest} retry={retry} />
          ) : null}
        </div>
      </div>
      <Outlet context={context} />
    </PageContainer>
  );
}

function LatestAnnouncementsCard({
  resource,
  retry,
}: {
  resource: ReturnType<typeof useResource<Announcement[]>>;
  retry: () => void;
}) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const rows = resource.data ?? [];
  return (
    <Card className='min-w-0'>
      <CardHeader>
        <CardTitle>
          <h2>{t('workbench.latestAnnouncements')}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {resource.error ? (
          <ErrorState context='query' error={resource.error} retry={retry} />
        ) : rows.length ? (
          <ul className='flex flex-col gap-3'>
            {rows.map((row) => (
              <li key={row.id} className='flex min-w-0 flex-col gap-1 text-sm'>
                <div className='flex min-w-0 items-start gap-2'>
                  {row.pinned ? (
                    <StatusBadge tone='info' className='shrink-0'>
                      {t('workbench.pinned')}
                    </StatusBadge>
                  ) : null}
                  <Link
                    className='min-w-0 rounded-sm font-medium break-words text-foreground underline-offset-4 hover:underline'
                    to={{
                      pathname: `announcement/${encodeURIComponent(row.id)}`,
                      search: location.search,
                    }}
                  >
                    {row.title}
                  </Link>
                </div>
                {row.publishedAt ? (
                  <time
                    className='text-muted-foreground'
                    dateTime={row.publishedAt}
                  >
                    {t('workbench.publishedAt', {
                      date: new Intl.DateTimeFormat(i18n.language, {
                        dateStyle: 'medium',
                      }).format(new Date(row.publishedAt)),
                    })}
                  </time>
                ) : null}
              </li>
            ))}
          </ul>
        ) : resource.loading ? (
          <RowsSkeleton />
        ) : (
          <CardEmpty
            icon={<Megaphone />}
            title={t('workbench.emptyAnnouncements')}
            description={t('workbench.emptyAnnouncementsDescription')}
          />
        )}
      </CardContent>
      <CardFooter className='mt-auto flex flex-wrap gap-2'>
        <ListLink to='/announcements' label={t('workbench.viewSource')} />
      </CardFooter>
    </Card>
  );
}

function CardEmpty({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Empty className='min-h-40 border border-dashed p-6 md:p-6'>
      <EmptyHeader>
        <EmptyMedia variant='icon'>{icon}</EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function ListLink({ to, label }: { to: string; label: string }) {
  return (
    <Button
      variant='ghost'
      size='sm'
      nativeButton={false}
      render={<Link to={to} />}
    >
      {label}
    </Button>
  );
}

function RowsSkeleton() {
  const { t } = useTranslation();
  return (
    <div
      role='status'
      className='flex flex-col gap-4'
      aria-label={t('workbench.loading')}
    >
      {[0, 1, 2].map((key) => (
        <div key={key} className='flex flex-col gap-2'>
          <Skeleton className='h-5 w-1/3' />
          <Skeleton className='h-4 w-2/3' />
        </div>
      ))}
    </div>
  );
}
