import { ApplicationRefreshButton } from '#components/application-refresh-button';
import { PersonalCards } from './personal-cards.js';
import { cn } from 'cn';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { ClipboardCheck, Info, TriangleAlert } from 'lucide-react';
import { FavoriteRequestActions } from '#components/request-actions';
import { byUrgency, dueState } from './record-presentation.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useResolvedPath } from 'react-router';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { Alert, AlertAction, AlertDescription } from '#components/ui/alert';
import { Button } from '#components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '#components/ui/card';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '#components/ui/empty';
import { Skeleton } from '#components/ui/skeleton';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '#components/ui/tooltip';
import { ErrorState } from '../approvals/states.js';
import { WorkRow } from './work-row.js';
import { useRequestAvailability } from './use-request-availability.js';
import type { RequestActionAvailability } from '#components/request-action-definitions';

import { useWorkbenchResource } from './use-workbench-resource.js';

export default function HomePage() {
  const { t } = useTranslation();
  const page = useCan({
    resource: { type: 'page', id: 'oa.approvals' },
    action: 'access',
  });
  const view = useCan({
    resource: { type: 'composite', id: 'oa.leave' },
    action: 'view',
  });
  const attendanceView = useCan({
    resource: { type: 'composite', id: 'oa.attendanceChange' },
    action: 'view',
  });
  const outingView = useCan({
    resource: { type: 'composite', id: 'oa.outing' },
    action: 'view',
  });
  const expensePlanView = useCan({
    resource: { type: 'composite', id: 'oa.expensePlan' },
    action: 'view',
  });
  const trainingView = useCan({
    resource: { type: 'composite', id: 'oa.training' },
    action: 'view',
  });
  const assetView = useCan({
    resource: { type: 'composite', id: 'oa.assetRequests' },
    action: 'view',
  });
  const vendorView = useCan({
    resource: { type: 'composite', id: 'oa.vendorQualification' },
    action: 'view',
  });
  const departureView = useCan({
    resource: { type: 'composite', id: 'oa.departure' },
    action: 'view',
  });
  const probationView = useCan({
    resource: { type: 'composite', id: 'oa.probation' },
    action: 'view',
  });
  const paymentView = useCan({
    resource: { type: 'composite', id: 'oa.payment' },
    action: 'view',
  });

  const loanView = useCan({
    resource: { type: 'composite', id: 'oa.loan' },
    action: 'view',
  });

  const purchaseView = useCan({
    resource: { type: 'composite', id: 'oa.purchase' },
    action: 'view',
  });
  const reimbursementView = useCan({
    resource: { type: 'composite', id: 'oa.reimbursement' },
    action: 'view',
  });
  const travelView = useCan({
    resource: { type: 'composite', id: 'oa.travel' },
    action: 'view',
  });
  const travelCancellationView = useCan({
    resource: { type: 'composite', id: 'oa.travelCancellation' },
    action: 'view',
  });
  const budgetView = useCan({
    resource: { type: 'composite', id: 'oa.budgetAdjustment' },
    action: 'view',
  });
  const supplyView = useCan({
    resource: { type: 'composite', id: 'oa.supplies' },
    action: 'view',
  });
  const generalView = useCan({
    resource: { type: 'composite', id: 'oa.general' },
    action: 'view',
  });
  const overtimeView = useCan({
    resource: { type: 'composite', id: 'oa.overtime' },
    action: 'view',
  });
  const cancellationView = useCan({
    resource: { type: 'composite', id: 'oa.leaveCancellation' },
    action: 'view',
  });
  const transferView = useCan({
    resource: { type: 'composite', id: 'oa.transfer' },
    action: 'view',
  });
  const certificateView = useCan({
    resource: { type: 'composite', id: 'oa.certificateRequests' },
    action: 'view',
  });
  const workItemView = useCan({
    resource: { type: 'composite', id: 'oa.workItems' },
    action: 'view',
  });
  const announcementView = useCan({
    resource: { type: 'composite', id: 'oa.announcements' },
    action: 'view',
  });
  // Mount business hooks only after both grants resolve; the landing page remains available to every user.
  if (
    workItemView.isPending ||
    announcementView.isPending ||
    transferView.isPending ||
    certificateView.isPending ||
    page.isPending ||
    view.isPending ||
    attendanceView.isPending ||
    outingView.isPending ||
    generalView.isPending ||
    expensePlanView.isPending ||
    trainingView.isPending ||
    reimbursementView.isPending ||
    paymentView.isPending ||
    probationView.isPending ||
    assetView.isPending ||
    vendorView.isPending ||
    departureView.isPending ||
    loanView.isPending ||
    purchaseView.isPending ||
    travelView.isPending ||
    travelCancellationView.isPending ||
    budgetView.isPending ||
    supplyView.isPending ||
    overtimeView.isPending ||
    cancellationView.isPending
  )
    return (
      <PageContainer>
        <PageHeader
          title={t('workbench.title')}
          description={t('workbench.description')}
        />
        <PersonalCards />
        <LoadingCards />
      </PageContainer>
    );
  if (
    page.can &&
    (workItemView.can ||
      announcementView.can ||
      transferView.can ||
      certificateView.can ||
      view.can ||
      overtimeView.can ||
      cancellationView.can ||
      generalView.can ||
      expensePlanView.can ||
      trainingView.can ||
      reimbursementView.can ||
      paymentView.can ||
      probationView.can ||
      assetView.can ||
      vendorView.can ||
      departureView.can ||
      loanView.can ||
      purchaseView.can ||
      travelView.can ||
      travelCancellationView.can ||
      budgetView.can ||
      supplyView.can ||
      attendanceView.can ||
      outingView.can)
  )
    return <Workbench />;
  return <PersonalWorkbench />;
}

// Personal record access is independent of the approval-center page grant.
function PersonalWorkbench() {
  const { t } = useTranslation();
  const location = useLocation();
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision((value) => value + 1), []);
  const context = useMemo(
    () => ({
      reload,
      onSaved: reload,
      basePath: '/',
      search: location.search,
    }),
    [reload, location.search],
  );
  return (
    <PageContainer className='flex flex-col gap-4'>
      <PageHeader
        title={t('workbench.title')}
        description={t('workbench.description')}
      />
      <PersonalCards key={revision} />
      <Alert role='status'>
        <AlertDescription>{t('workbench.noAccess')}</AlertDescription>
      </Alert>
      <Outlet context={context} />
    </PageContainer>
  );
}

function Workbench() {
  const { session } = useAuthentication();
  // The bounded index preview is enriched with deadlines; overdue remains a
  // lower bound whenever not every pending entry fits in the preview.
  const pending = useWorkbenchResource({ view: 'pending', pageSize: '100' });
  const mine = useWorkbenchResource({
    view: 'mine',
    pageSize: '5',
    homeSummary: 'true',
  });
  const optionsReady = pending.settled && mine.settled;
  // Give the two primary summaries the first read wave. Once enabled, metadata
  // stays enabled on refresh; another identity/revision must settle its own reads.
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const base = useResolvedPath('.');
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
  const requests = useRequestAvailability(optionsReady);
  const canSubmit = requests.canSubmit;
  // The server derives attention from the complete authorized mine set, not this page.
  const revisionRows = { ...mine, data: mine.meta?.attention?.revisions };
  const [personalRevision, setPersonalRevision] = useState(0);
  const refreshRef = useRef<HTMLButtonElement>(null);
  const { reload: reloadPending } = pending;
  const { reload: reloadMine } = mine;
  // The clock behind deadlines, relative times and the greeting: ticks each minute and on refresh.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);
  const reload = useCallback(() => {
    setNow(new Date());
    setPersonalRevision((revision) => revision + 1);
    reloadPending();
    reloadMine();
  }, [reloadPending, reloadMine]);
  const context = useMemo(
    () => ({
      reload,
      onSaved: reload,
      basePath: base.pathname,
      search: location.search,
    }),
    [reload, base.pathname, location.search],
  );
  const loading = pending.loading || mine.loading;
  const pendingRows = pending.error ? [] : (pending.data ?? []);
  const unique = pendingRows
    .filter(
      (record, index) =>
        pendingRows.findIndex(
          (other) => other.id === record.id && other.kind === record.kind,
        ) === index,
    )
    .sort(byUrgency)
    .slice(0, 6);
  const overdue = pendingRows.filter(
    (record) => dueState(record.dueAt, now) === 'overdue',
  ).length;
  // Exact while every pending item is loaded; otherwise a lower bound, shown as "n+".
  const overdueComplete =
    pending.meta !== undefined && pendingRows.length >= pending.meta.total;
  const revisionCount = revisionRows.error
    ? 0
    : (mine.meta?.counts.revisions ?? 0);
  const recent =
    mine.meta?.attention?.submitted ?? (mine.data ?? []).slice(0, 5);
  const number = new Intl.NumberFormat(i18n.language);
  const metrics = [
    {
      key: 'pending',
      value: pending.meta?.total,
      error: pending.error,
      to: '/approvals/todo',
      tone: 'primary',
    },
    {
      key: 'overdue',
      value: pending.meta ? overdue : undefined,
      suffix: overdueComplete ? '' : '+',
      error: pending.error,
      to: '/approvals/todo',
      tone: 'destructive',
    },
    {
      key: 'inProgress',
      value: mine.meta?.counts.inProgress,
      error: mine.error,
      to: '/approvals/mine?category=inProgress',
      tone: 'primary',
    },
  ] as const;
  const retry = () => {
    reload();
    refreshRef.current?.focus();
  };
  const hour = now.getHours();
  const greeting = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  const userName = session?.user.name?.trim();
  const today = new Intl.DateTimeFormat(i18n.language, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(now);
  const summary =
    pending.meta === undefined
      ? today
      : [
          today,
          t('workbench.summaryPending', { count: pending.meta.total }),
          overdue
            ? t('workbench.summaryOverdue', {
                count: overdue,
                suffix: overdueComplete ? '' : '+',
              })
            : null,
        ]
          .filter(Boolean)
          .join(' · ');
  const settled = !pending.loading && !mine.loading;
  // One welcome panel instead of two empty cards when there is nothing at all to show.
  const nothingYet =
    settled &&
    !pending.error &&
    !mine.error &&
    !unique.length &&
    !recent.length &&
    !revisionCount;
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
      {revisionCount > 0 ? (
        <Alert
          role='status'
          className='border-(--status-warning)/25 bg-(--status-warning-background) text-(--status-warning)'
        >
          <TriangleAlert aria-hidden='true' />
          <AlertDescription className='text-(--status-warning)'>
            {t('workbench.revisionBanner', { count: revisionCount })}
          </AlertDescription>
          <AlertAction>
            <Button
              variant='outline'
              size='sm'
              nativeButton={false}
              render={<Link to='/approvals/mine?category=revisions' />}
            >
              {t('workbench.reviewRevisions')}
            </Button>
          </AlertAction>
        </Alert>
      ) : null}
      {revisionRows.error ? (
        <ErrorState context='query' error={revisionRows.error} retry={retry} />
      ) : null}
      <div className='grid grid-cols-3 gap-3 sm:gap-4'>
        {metrics.map((metric) => {
          const active = !metric.error && (metric.value ?? 0) > 0;
          const content = (
            <Card className='h-full transition-colors group-hover:bg-muted/50'>
              <CardHeader>
                <CardDescription>
                  {t(`workbench.${metric.key}`)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {metric.error ? (
                  <span className='text-sm text-muted-foreground'>
                    {t('workbench.unavailable')}
                  </span>
                ) : metric.value === undefined ? (
                  <Skeleton
                    className='h-8 w-16'
                    aria-label={t('workbench.loading')}
                  />
                ) : (
                  <span
                    className={cn(
                      'text-2xl font-semibold tabular-nums sm:text-3xl',
                      !active
                        ? 'text-muted-foreground'
                        : metric.tone === 'destructive'
                          ? 'text-destructive'
                          : 'text-foreground',
                    )}
                  >
                    {number.format(metric.value)}
                    {'suffix' in metric ? metric.suffix : ''}
                  </span>
                )}
              </CardContent>
            </Card>
          );
          return metric.error || metric.value === undefined ? (
            <div key={metric.key}>{content}</div>
          ) : (
            <Link
              key={metric.key}
              to={metric.to}
              className='group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring'
              aria-label={`${t(`workbench.${metric.key}`)} ${metric.value}`}
            >
              {content}
            </Link>
          );
        })}
      </div>
      {loading && (pending.data || mine.data) ? (
        <p role='status' className='text-sm text-muted-foreground'>
          {t('workbench.refreshing')}
        </p>
      ) : null}
      {nothingYet ? (
        <Card>
          <CardContent>
            <Empty className='min-h-40'>
              <EmptyHeader>
                <EmptyMedia variant='icon'>
                  <ClipboardCheck />
                </EmptyMedia>
                <EmptyTitle>{t('workbench.allClear')}</EmptyTitle>
                <EmptyDescription>
                  {t(
                    canSubmit
                      ? 'workbench.allClearDescription'
                      : 'workbench.emptyMineRestricted',
                  )}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
          <CardFooter className='mt-auto flex flex-wrap gap-2'>
            <ListLink to='/approvals/mine' label={t('workbench.viewMine')} />
            {(mine.meta?.counts.drafts ?? 0) > 0 ? (
              <ListLink
                to='/approvals/mine?category=drafts'
                label={t('workbench.viewDraftsCount', {
                  count: mine.meta?.counts.drafts,
                })}
              />
            ) : null}
          </CardFooter>
        </Card>
      ) : (
        <div className='flex flex-col items-stretch gap-4 md:flex-row'>
          <Card className='min-w-0 flex-1'>
            <CardHeader>
              <CardTitle>
                <div className='flex items-center gap-2'>
                  <h2>{t('workbench.attention')}</h2>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant='ghost'
                          size='icon-sm'
                          aria-label={t('approvalCenter.scope')}
                        />
                      }
                    >
                      <Info aria-hidden='true' />
                    </TooltipTrigger>
                    <TooltipContent>{t('approvalCenter.scope')}</TooltipContent>
                  </Tooltip>
                </div>
              </CardTitle>
              <CardDescription>
                {t('workbench.attentionDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className='flex flex-col gap-4'>
              {pending.error ? (
                <ErrorState
                  context='query'
                  error={pending.error}
                  retry={retry}
                />
              ) : null}
              {unique.length ? (
                <ul className='flex flex-col'>
                  {unique.map((record) => (
                    <WorkRow
                      key={`${record.kind}:${record.id}`}
                      record={record}
                      now={now}
                      showInitiator
                      showApplicant
                    />
                  ))}
                </ul>
              ) : pending.loading ? (
                <RowsSkeleton />
              ) : !pending.error ? (
                <EmptyCard kind='Attention' canSubmit={canSubmit} />
              ) : null}
            </CardContent>
            <CardFooter className='mt-auto flex flex-wrap gap-2'>
              <ListLink
                to='/approvals/todo'
                label={t('workbench.viewPending')}
              />
            </CardFooter>
          </Card>
          <Card className='min-w-0 flex-1'>
            <CardHeader>
              <CardTitle>
                <h2>{t('workbench.mine')}</h2>
              </CardTitle>
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
                <EmptyCard kind='Mine' canSubmit={canSubmit} />
              )}
            </CardContent>
            <CardFooter className='mt-auto flex flex-wrap gap-2'>
              <ListLink to='/approvals/mine' label={t('workbench.viewMine')} />
              {(mine.meta?.counts.drafts ?? 0) > 0 ? (
                <ListLink
                  to='/approvals/mine?category=drafts'
                  label={t('workbench.viewDraftsCount', {
                    count: mine.meta?.counts.drafts,
                  })}
                />
              ) : null}
            </CardFooter>
          </Card>
        </div>
      )}
      {canSubmit ? (
        <section id='request-actions' aria-label={t('workbench.newRequest')}>
          <NewRequestCard available={requests.available} />
        </section>
      ) : null}
      {/* Reference information follows the work and the request entries. */}
      <PersonalCards key={personalRevision} />
      <Outlet context={context} />
    </PageContainer>
  );
}

function ListLink({ to, label }: { to: string; label: string }) {
  return (
    <Button
      variant='ghost'
      size='sm'
      render={<Link to={to} />}
      nativeButton={false}
    >
      {label}
    </Button>
  );
}
/** This card contains business creation actions only; browsing belongs in the sidebar and summary footers. */
function NewRequestCard({
  available,
}: {
  available: RequestActionAvailability;
}) {
  const { t } = useTranslation();

  return (
    <Card className='min-w-0'>
      <CardHeader>
        <CardTitle>
          <h2>{t('workbench.newRequest')}</h2>
        </CardTitle>
        <CardDescription>
          {t('workbench.newRequestDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FavoriteRequestActions available={available} />
      </CardContent>
    </Card>
  );
}

function EmptyCard({
  kind,
  canSubmit,
}: {
  kind: 'Attention' | 'Mine' | 'Drafts';
  canSubmit: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Empty className='min-h-48 border border-dashed'>
      <EmptyHeader>
        <EmptyMedia variant='icon'>
          <ClipboardCheck />
        </EmptyMedia>
        <EmptyTitle>{t(`workbench.empty${kind}`)}</EmptyTitle>
        <EmptyDescription>
          {t(
            kind === 'Mine' && !canSubmit
              ? 'workbench.emptyMineRestricted'
              : `workbench.empty${kind}Description`,
          )}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
function RowsSkeleton() {
  const { t } = useTranslation();
  return (
    <div className='flex flex-col gap-4' aria-label={t('workbench.loading')}>
      {[0, 1, 2].map((key) => (
        <div key={key} className='flex flex-col gap-2'>
          <Skeleton className='h-5 w-1/3' />
          <Skeleton className='h-4 w-2/3' />
        </div>
      ))}
    </div>
  );
}
function LoadingCards() {
  return (
    <div className='flex flex-col gap-4'>
      <div className='grid grid-cols-3 gap-3 sm:gap-4'>
        {[0, 1, 2].map((key) => (
          <Card key={key}>
            <CardContent>
              <RowsSkeleton />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className='grid gap-4 xl:grid-cols-2'>
        {[0, 1].map((key) => (
          <Card key={key}>
            <CardContent>
              <RowsSkeleton />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
