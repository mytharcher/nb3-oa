import { RouteOverlayHandoffContext } from '#components/route-overlay-handoff';
import { useBatchApprove } from '../approvals/batch-approve.js';
import type { CenterRecord } from '../approvals/use-center-resource.js';
import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useAuthorizationRevision } from '@nocobase/app-plugin-authorization/client';
import {
  Outlet,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import { ApplicationRefreshButton } from '#components/application-refresh-button';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { Button } from '#components/ui/button';
import {
  TaskCenterLayout,
  TaskList,
  TaskListEmpty,
  TaskListSkeleton,
  TaskPagination,
  TaskSourceNav,
  TaskStatusTabs,
  taskStatusTabs,
  type TaskCardData,
  type TaskCenterStatusTab,
  type TaskNavSource,
} from '#extensions/nocobase-task-center-ui/index';
import { approvalBusiness } from '../approvals/business-metadata.js';
import { useResource } from '../approvals/use-resource.js';
import { ErrorState } from '../approvals/states.js';
import { taskSources, type TaskCenterData } from './sources.js';

const PAGE_SIZE = 10;

export default function TaskCenterPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const source =
    taskSources.find(
      (item) =>
        item.sourceType ===
        (params.get('source') === 'approval.mine'
          ? 'approval.application'
          : params.get('source')),
    ) ?? taskSources[0];
  const subject = params.get('subject') ?? '';
  const status = taskStatusTabs.includes(
    params.get('status') as TaskCenterStatusTab,
  )
    ? (params.get('status') as TaskCenterStatusTab)
    : 'pending';
  const pageValue = Number(params.get('page'));
  const page = Number.isSafeInteger(pageValue) && pageValue > 0 ? pageValue : 1;
  const resource = useResource<TaskCenterData>('taskCenter', {
    source: source.sourceType,
    ...(subject ? { subject } : {}),
    status,
    page: String(page),
    pageSize: String(PAGE_SIZE),
  });
  const reload = resource.reload;
  const previousPathRef = useRef(location.pathname);
  useEffect(() => {
    if (
      previousPathRef.current !== '/taskCenter' &&
      location.pathname === '/taskCenter'
    )
      reload();
    previousPathRef.current = location.pathname;
  }, [location.pathname, reload]);
  const data = resource.data;
  const { session } = useAuthentication();
  const revision = useAuthorizationRevision();
  const identity = JSON.stringify([session?.user.id, revision]);
  const countScope = JSON.stringify([source.sourceType, subject]);
  // Facets describe every source, independent of the current list query.
  // Retain only navigation metadata while switching; never retain old tasks.
  const [navigationSnapshot, setNavigationSnapshot] = useState<{
    identity: string;
    countScope: string;
    facets: TaskCenterData['facets'];
    counts: TaskCenterData['counts'];
  }>();
  if (
    navigationSnapshot &&
    (navigationSnapshot.identity !== identity || resource.error)
  ) {
    setNavigationSnapshot(undefined);
  } else if (
    data &&
    !resource.error &&
    navigationSnapshot?.facets !== data.facets
  ) {
    setNavigationSnapshot({
      identity,
      countScope,
      facets: data.facets,
      counts: data.counts,
    });
  }
  const snapshot =
    navigationSnapshot?.identity === identity && !resource.error
      ? navigationSnapshot
      : undefined;
  const facets = data?.facets ?? snapshot?.facets;
  const counts =
    data?.counts ??
    (snapshot?.countScope === countScope ? snapshot.counts : undefined);
  useEffect(() => {
    if (!data || resource.loading) return;
    const last = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
    if (page > last)
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.set('page', String(last));
          return next;
        },
        { replace: true },
      );
  }, [data, page, resource.loading, setParams]);
  const batchRows = useMemo(
    () =>
      data?.tasks
        .filter((task) => task.recordId && approvalBusiness(task.subject))
        .map((task) => ({
          id: task.recordId!,
          kind: task.subject as CenterRecord['kind'],
          number: task.title,
          title: task.title,
        })),
    [data],
  );
  const batch = useBatchApprove(
    batchRows,
    source.sourceType === 'approval.task' &&
      status === 'pending' &&
      !resource.loading &&
      !resource.error,
    JSON.stringify([source.sourceType, subject, status, page]),
    resource.reload,
  );
  const label = (key: string): string => {
    if (key === 'oa.itRepair') return t('itRepairs.title');
    const business = approvalBusiness(key);
    return business ? t(`approvalCenter.kinds.${business.label}`) : key;
  };
  const update = (values: Record<string, string | undefined>): void => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete('page');
        for (const [key, value] of Object.entries(values))
          if (value) next.set(key, value);
          else next.delete(key);
        return next;
      },
      { replace: true },
    );
  };
  const navigation: TaskNavSource[] = taskSources.map((item) => {
    const sourceFacets =
      facets?.filter((facet) => facet.sourceType === item.sourceType) ?? [];
    return {
      key: item.sourceType,
      label: t(item.label),
      icon: item.icon,
      count: sourceFacets.reduce((n, facet) => n + facet.pending, 0),
      subjects: sourceFacets
        .map((facet) => ({
          key: facet.subject,
          label: label(facet.subject),
          count: facet.pending,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    };
  });
  const cards: TaskCardData[] =
    data?.tasks.map((task) => ({
      id: task.id,
      title: approvalBusiness(task.title) ? label(task.title) : task.title,
      status: task.status,
      statusLabel:
        task.businessStatus === 'draft'
          ? t('taskCenter.status.draft')
          : t(
              `taskCenter.status.${task.sourceType === 'approval.cc' && task.status !== 'cancelled' ? (task.status === 'pending' ? 'unread' : 'read') : task.status}`,
            ),
      time: task.status === 'pending' ? task.createdAt : task.updatedAt,
      subject: task.subject,
      subjectLabel: label(task.subject),
      icon: source.icon,
    })) ?? [];
  return (
    <PageContainer>
      <PageHeader
        title={t('taskCenter.title')}
        description={t('taskCenter.description')}
        actions={
          <ApplicationRefreshButton
            label={t('taskCenter.refresh')}
            loading={resource.loading}
            onClick={resource.reload}
          />
        }
      />
      <TaskCenterLayout
        label={[t(source.label), subject ? label(subject) : undefined]
          .filter(Boolean)
          .join(' / ')}
        navigation={
          <TaskSourceNav
            sources={navigation}
            source={source.sourceType}
            subject={subject}
            onSelect={(value, nextSubject) =>
              update({
                source: value,
                subject: nextSubject,
                status: undefined,
                category: undefined,
              })
            }
          />
        }
      >
        <TaskStatusTabs
          value={status}
          counts={counts ?? { pending: 0, closed: 0, all: 0 }}
          onValueChange={(value) =>
            update({ status: value === 'pending' ? undefined : value })
          }
        />
        {batch.controls}
        {resource.error ? (
          <ErrorState
            error={resource.error}
            retry={resource.reload}
            context='query'
          />
        ) : null}
        {!data && resource.loading ? (
          <TaskListSkeleton />
        ) : data ? (
          <>
            {cards.length ? (
              <TaskList
                tasks={cards}
                showSubject={!subject}
                selection={
                  source.sourceType === 'approval.task' &&
                  status === 'pending' &&
                  batch.hasCandidates
                    ? {
                        stateOf: (card) => {
                          const task = data.tasks.find(
                            (item) => item.id === card.id,
                          )!;
                          if (
                            !batch.candidates.some(
                              (candidate) =>
                                candidate.taskId === task.sourceKey,
                            )
                          )
                            return 'unsupported';
                          return batch.selected.length &&
                            batch.selected[0].kind !== task.subject
                            ? 'locked'
                            : 'available';
                        },
                        isSelected: (card) =>
                          batch.selected.some(
                            (candidate) =>
                              candidate.taskId ===
                              data.tasks.find((item) => item.id === card.id)
                                ?.sourceKey,
                          ),
                        onChange: (card, checked) => {
                          const task = data.tasks.find(
                            (item) => item.id === card.id,
                          )!;
                          const candidate = batch.candidates.find(
                            (item) => item.taskId === task.sourceKey,
                          );
                          if (candidate) batch.select(candidate, checked);
                        },
                        selectedLabel: batch.selected[0]
                          ? label(batch.selected[0].kind)
                          : undefined,
                      }
                    : undefined
                }
                onOpen={(card) => {
                  const task = data.tasks.find((item) => item.id === card.id)!;
                  const business = approvalBusiness(task.subject);
                  void navigate({
                    pathname:
                      task.businessStatus === 'draft' &&
                      task.recordId &&
                      business
                        ? `/taskCenter/${business.detail}/${encodeURIComponent(task.recordId)}`
                        : `/taskCenter/task/${encodeURIComponent(card.id)}`,
                    search: location.search,
                  });
                }}
              />
            ) : (
              <>
                <TaskListEmpty
                  title={subject ? t('taskCenter.noResults') : undefined}
                  description={
                    subject ? t('taskCenter.noResultsDescription') : undefined
                  }
                  status={status}
                  onShowAll={
                    status === 'all'
                      ? undefined
                      : () => update({ status: 'all' })
                  }
                />
                {subject ? (
                  <Button
                    variant='outline'
                    onClick={() =>
                      update({ subject: undefined, status: undefined })
                    }
                  >
                    {t('approvals.clear')}
                  </Button>
                ) : null}
              </>
            )}
            <TaskPagination
              page={page}
              pageCount={Math.max(1, Math.ceil(data.total / PAGE_SIZE))}
              total={data.total}
              onPageChange={(value) =>
                setParams((current) => {
                  const next = new URLSearchParams(current);
                  next.set('page', String(value));
                  return next;
                })
              }
            />
          </>
        ) : null}
      </TaskCenterLayout>
      <RouteOverlayHandoffContext.Provider
        value={
          (location.state as { routeOverlayHandoff?: unknown } | null)
            ?.routeOverlayHandoff === location.pathname
        }
      >
        <Outlet
          context={{
            reload: resource.reload,
            basePath: '/taskCenter',
            search: location.search,
          }}
        />
      </RouteOverlayHandoffContext.Provider>
    </PageContainer>
  );
}
