import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { useSearchParams } from 'react-router';
import { useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  ChevronLeft,
  ChevronRight,
  CircleCheckBig,
  X,
  Clock3,
  FlaskConical,
  Inbox,
  Layers,
  SearchX,
} from 'lucide-react';
import { cn } from 'cn';
import { ApplicationRefreshButton } from '#components/application-refresh-button';
import { ApplicationSearch } from '#components/application-search';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { StatusBadge } from '#components/status-badge';
import { Button } from '#components/ui/button';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '#components/ui/alert-dialog';
import { Card } from '#components/ui/card';
import { Checkbox } from '#components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '#components/ui/collapsible';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '#components/ui/empty';
import { Skeleton } from '#components/ui/skeleton';
import { Spinner } from '#components/ui/spinner';
import { Tabs, TabsList, TabsTrigger } from '#components/ui/tabs';
import {
  matchesStatusTab,
  prototypeNow,
  prototypeTasks,
  statusTabs,
  taskSources,
  taskSubjects,
  type PrototypeTask,
  type StatusTab,
  type TaskSourceDefinition,
  type TaskSubjectDefinition,
  type TaskStatus,
} from './prototype-data.js';
import {
  bulkActionApplies,
  bulkActionsFor,
  type TaskBulkAction,
} from './bulk-actions.js';
import { TaskSummary } from './summaries.js';

// Layered task center prototype: source type → subject (collapsible under its source) → status tab
// → task cards. Each layer narrows the one above; navigation counts are always pending counts.
// Not connected to data yet. Plugin gaps found while designing it (Task Center on
// feat/approval-user-task-center):
// - “My requests” has no index source: Approval projects only assignee and CC tasks.
// - Subject groups need a facet endpoint (distinct subjects with counts per source/status);
//   `statistics` filters by subject on the server but the Client data source does not pass it.
// - “Closed” needs a multi-status filter (completed + cancelled) on list and statistics.
// - The index stores only a title, so summaries need either an index payload or a per-type loader.
// - `TaskCenterSource.renderTask` is one renderer per source; summaries are keyed by subject.
// - Batch actions have no contribution contract.
// See docs/designs/oa/task-center-plugin-gaps.md.

const PAGE_SIZE = 10;
const DAY = 86_400_000;
const statusTone: Record<TaskStatus, 'warning' | 'success' | 'neutral'> = {
  pending: 'warning',
  completed: 'success',
  cancelled: 'neutral',
};
type DayGroup = 'today' | 'yesterday' | 'earlier';

export default function TaskCenterPage(): ReactElement {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const sourceType =
    taskSources.find(
      (source) => source.sourceType === searchParams.get('source'),
    )?.sourceType ?? taskSources[0].sourceType;
  const source = taskSources.find((item) => item.sourceType === sourceType)!;
  const statusParam = searchParams.get('status');
  const status: StatusTab = statusTabs.includes(statusParam as StatusTab)
    ? (statusParam as StatusTab)
    : 'pending';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const [refreshing, setRefreshing] = useState(false);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(refreshTimerRef.current), []);
  // Prototype: batch actions change this local copy so their effect shows in counts and tabs.
  const [allTasks, setAllTasks] =
    useState<readonly PrototypeTask[]>(prototypeTasks);

  const update = (values: Record<string, string | undefined>): void => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        for (const [key, value] of Object.entries(values))
          if (value === undefined) next.delete(key);
          else next.set(key, value);
        next.delete('page');
        return next;
      },
      { replace: true },
    );
  };
  const goToPage = (value: number): void =>
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set('page', String(value));
      return next;
    });

  const sourceTasks = useMemo(
    () => allTasks.filter((task) => task.sourceType === sourceType),
    [allTasks, sourceType],
  );
  const subjectParam = searchParams.get('subject');
  const subject = subjectsOf(allTasks, sourceType).some(
    (item) => item.subject === subjectParam,
  )
    ? subjectParam!
    : '';
  const subjectDefinition = taskSubjects.find(
    (item) => item.subject === subject,
  );
  const subjectTasks = subject
    ? sourceTasks.filter((task) => task.subject === subject)
    : sourceTasks;
  const tasks = subjectTasks
    .filter((task) => matchesStatusTab(task.status, status))
    .sort((a, b) => timeOf(b).localeCompare(timeOf(a)));
  const lastPage = Math.max(1, Math.ceil(tasks.length / PAGE_SIZE));
  const currentPage = Math.min(page, lastPage);
  const visible = tasks.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const countOf = (tab: StatusTab): number =>
    subjectTasks.filter((task) => matchesStatusTab(task.status, tab)).length;
  const pending = countOf('pending');
  const ScopeIcon = subjectDefinition?.icon ?? source.icon;

  // Batch selection: offered only where the task type contributes actions, for the tasks those
  // actions apply to on the current page. Changing scope, tab or page starts a new selection.
  const toaster = useToaster();
  const actions = bulkActionsFor(sourceType, subject || undefined);
  const isSelectable = (task: PrototypeTask): boolean =>
    actions.some((action) => bulkActionApplies(action, task));
  const selectionScope = JSON.stringify([
    sourceType,
    subject,
    status,
    currentPage,
  ]);
  const [selection, setSelection] = useState<{
    scope: string;
    ids: ReadonlySet<string>;
  }>();
  const selectedIds =
    selection?.scope === selectionScope ? selection.ids : new Set<string>();
  const selectableVisible = visible.filter(isSelectable);
  const selected = selectableVisible.filter((task) => selectedIds.has(task.id));
  const setSelected = (ids: Iterable<string>): void =>
    setSelection({ scope: selectionScope, ids: new Set(ids) });
  const [confirmation, setConfirmation] = useState<{
    action: TaskBulkAction;
    items: readonly PrototypeTask[];
    skipped: number;
  }>();
  const [running, setRunning] = useState(false);
  const runTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(runTimerRef.current), []);
  const perform = (): void => {
    if (!confirmation || running) return;
    const { action, items } = confirmation;
    setRunning(true);
    runTimerRef.current = setTimeout(() => {
      const ids = new Set(items.map((task) => task.id));
      if (action.result) {
        const result = action.result;
        setAllTasks((current) =>
          current.map((task) =>
            ids.has(task.id)
              ? {
                  ...task,
                  status: result,
                  updatedAt: prototypeNow.toISOString(),
                }
              : task,
          ),
        );
      }
      toaster.show({
        title: t(action.done, { count: items.length }),
        type: 'success',
      });
      setSelection(undefined);
      setConfirmation(undefined);
      setRunning(false);
    }, 600);
  };

  const refresh = (): void => {
    setRefreshing(true);
    clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <PageContainer>
      <PageHeader
        title={t('taskCenter.title')}
        description={t('taskCenter.description')}
        actions={
          <ApplicationRefreshButton
            label={t('taskCenter.refresh')}
            loading={refreshing}
            onClick={refresh}
          />
        }
      />
      <p className='-mt-2 flex items-center gap-1.5 text-xs text-muted-foreground'>
        <FlaskConical aria-hidden className='size-3.5' />
        {t('taskCenter.prototypeNotice')}
      </p>
      <div className='grid items-start gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]'>
        <SourceNavigation
          tasks={allTasks}
          currentSource={sourceType}
          currentSubject={subject}
          onSelect={(value, nextSubject) =>
            update({
              source: value,
              subject: nextSubject,
              status: undefined,
            })
          }
        />
        <section
          aria-labelledby='task-center-scope'
          className='flex min-w-0 flex-col gap-5'
        >
          <div className='flex flex-col gap-4 border-b sm:flex-row sm:items-end sm:justify-between'>
            <div className='flex min-w-0 items-center gap-3 pb-1'>
              <span className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                <ScopeIcon aria-hidden className='size-5' />
              </span>
              <div className='min-w-0'>
                <h2
                  id='task-center-scope'
                  className='flex min-w-0 items-center gap-1 text-base font-medium'
                >
                  {subjectDefinition ? (
                    <>
                      <button
                        type='button'
                        className='truncate rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none'
                        onClick={() =>
                          update({ subject: undefined, status: undefined })
                        }
                      >
                        {t(source.label)}
                      </button>
                      <ChevronRight
                        aria-hidden
                        className='size-4 shrink-0 text-muted-foreground'
                      />
                      <span className='truncate'>
                        {t(subjectDefinition.label)}
                      </span>
                    </>
                  ) : (
                    <span className='truncate'>{t(source.label)}</span>
                  )}
                </h2>
                <p className='text-sm text-muted-foreground'>
                  {pending
                    ? t('taskCenter.overview', { count: pending })
                    : t('taskCenter.overviewClear')}
                </p>
              </div>
            </div>
            <Tabs
              value={status}
              onValueChange={(value) =>
                update({
                  status: value === 'pending' ? undefined : String(value),
                })
              }
            >
              <TabsList variant='line' className='h-10'>
                {statusTabs.map((tab) => (
                  <TabsTrigger key={tab} value={tab} className='px-3'>
                    {t(`taskCenter.tabs.${tab}`)}
                    <CountPill
                      count={countOf(tab)}
                      emphasis={tab === 'pending' && status === 'pending'}
                    />
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          {refreshing ? (
            <TaskListSkeleton />
          ) : visible.length === 0 ? (
            <TaskListEmpty
              status={status}
              onShowAll={
                status === 'all' ? undefined : () => update({ status: 'all' })
              }
            />
          ) : (
            <>
              {actions.length && selectableVisible.length ? (
                <div className='-mb-2 flex items-center gap-3 px-4 text-sm text-muted-foreground'>
                  <Checkbox
                    aria-label={t('taskCenter.bulk.selectAll')}
                    checked={
                      selected.length > 0 &&
                      selected.length === selectableVisible.length
                    }
                    indeterminate={
                      selected.length > 0 &&
                      selected.length < selectableVisible.length
                    }
                    onCheckedChange={(checked) =>
                      setSelected(
                        checked ? selectableVisible.map((task) => task.id) : [],
                      )
                    }
                  />
                  <span>
                    {selected.length
                      ? t('taskCenter.bulk.selected', {
                          count: selected.length,
                        })
                      : t('taskCenter.bulk.hint', {
                          count: selectableVisible.length,
                        })}
                  </span>
                </div>
              ) : null}
              <TaskList
                tasks={visible}
                source={source}
                showSubject={!subject}
                selection={
                  selectableVisible.length
                    ? {
                        isSelectable,
                        isSelected: (task) => selectedIds.has(task.id),
                        onChange: (task, checked) => {
                          const next = new Set(selectedIds);
                          if (checked) next.add(task.id);
                          else next.delete(task.id);
                          setSelected(next);
                        },
                      }
                    : undefined
                }
              />
            </>
          )}
          {selected.length && !refreshing ? (
            <BulkActionBar
              actions={actions}
              selected={selected}
              onClear={() => setSelected([])}
              onRun={(action) => {
                const items = selected.filter((task) =>
                  bulkActionApplies(action, task),
                );
                setConfirmation({
                  action,
                  items,
                  skipped: selected.length - items.length,
                });
              }}
            />
          ) : null}
          <BulkConfirmDialog
            confirmation={confirmation}
            running={running}
            onCancel={() => setConfirmation(undefined)}
            onConfirm={perform}
          />
          {!refreshing && tasks.length > PAGE_SIZE ? (
            <nav
              aria-label={t('taskCenter.paginationLabel')}
              className='flex items-center justify-between gap-2 text-sm text-muted-foreground'
            >
              <span>
                {t('taskCenter.pagination', {
                  page: currentPage,
                  pages: lastPage,
                  total: tasks.length,
                })}
              </span>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={currentPage <= 1}
                  onClick={() => goToPage(currentPage - 1)}
                >
                  <ChevronLeft data-icon='inline-start' />
                  {t('taskCenter.previous')}
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={currentPage >= lastPage}
                  onClick={() => goToPage(currentPage + 1)}
                >
                  {t('taskCenter.next')}
                  <ChevronRight data-icon='inline-end' />
                </Button>
              </div>
            </nav>
          ) : null}
        </section>
      </div>
    </PageContainer>
  );
}

/** Pending tasks sort and group by arrival; closed tasks by when they closed. */
function timeOf(task: PrototypeTask): string {
  return task.status === 'pending' ? task.createdAt : task.updatedAt;
}

/** Subjects that occur in a source, in any status. A facet endpoint will provide these later. */
function subjectsOf(
  tasks: readonly PrototypeTask[],
  sourceType: string,
): readonly TaskSubjectDefinition[] {
  return taskSubjects.filter((item) =>
    tasks.some(
      (task) => task.sourceType === sourceType && task.subject === item.subject,
    ),
  );
}

/** Pending count of a source or one of its subjects; it never follows the status tab. */
function pendingCount(
  tasks: readonly PrototypeTask[],
  sourceType: string,
  subject?: string,
): number {
  return tasks.filter(
    (task) =>
      task.sourceType === sourceType &&
      (!subject || task.subject === subject) &&
      task.status === 'pending',
  ).length;
}

function CountPill({
  count,
  emphasis = false,
}: {
  readonly count: number;
  readonly emphasis?: boolean;
}): ReactElement {
  return (
    <span
      className={cn(
        'inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs leading-5 font-medium tabular-nums',
        emphasis && count
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground',
      )}
    >
      {count}
    </span>
  );
}

/** Marks the part of a subject name that matches the search keyword. */
function Highlight({
  keyword,
  text,
}: {
  readonly keyword: string;
  readonly text: string;
}): ReactNode {
  const index = keyword ? text.toLocaleLowerCase().indexOf(keyword) : -1;
  if (index < 0) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark className='rounded-sm bg-primary/15 text-foreground'>
        {text.slice(index, index + keyword.length)}
      </mark>
      {text.slice(index + keyword.length)}
    </>
  );
}

function SourceNavigation({
  currentSource,
  currentSubject,
  onSelect,
  tasks,
}: {
  readonly tasks: readonly PrototypeTask[];
  readonly currentSource: string;
  readonly currentSubject: string;
  readonly onSelect: (sourceType: string, subject?: string) => void;
}): ReactElement {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(
    () => new Set([currentSource]),
  );
  const setOpen = (sourceType: string, open: boolean): void =>
    setExpanded((current) => {
      const next = new Set(current);
      if (open) next.add(sourceType);
      else next.delete(sourceType);
      return next;
    });
  // Client-side filter over subject names; matching sources unfold while a keyword is entered.
  const [query, setQuery] = useState('');
  const keyword = query.trim().toLocaleLowerCase();
  const groups = taskSources
    .map((source) => ({
      source,
      subjects: subjectsOf(tasks, source.sourceType).filter(
        (item) =>
          !keyword || t(item.label).toLocaleLowerCase().includes(keyword),
      ),
    }))
    .filter((group) => !keyword || group.subjects.length);
  return (
    <nav
      aria-label={t('taskCenter.sourceGroup')}
      className='flex flex-col gap-3 rounded-xl border bg-card p-3 lg:sticky lg:top-4'
    >
      <ApplicationSearch
        className='sm:w-full'
        value={query}
        placeholder={t('taskCenter.subjectSearch')}
        onChange={(event) => setQuery(event.target.value)}
      />
      {keyword && !groups.length ? (
        <div className='flex flex-col items-center gap-2 px-2 py-6 text-center text-sm text-muted-foreground'>
          <SearchX aria-hidden className='size-5' />
          <p>{t('taskCenter.noSubjectMatches')}</p>
          <Button variant='outline' size='sm' onClick={() => setQuery('')}>
            {t('taskCenter.clearSearch')}
          </Button>
        </div>
      ) : null}
      <ul className='flex flex-col gap-0.5'>
        {groups.map(({ source, subjects }) => {
          const Icon = source.icon;
          const selected = source.sourceType === currentSource;
          const current = selected && !currentSubject;
          const open = Boolean(keyword) || expanded.has(source.sourceType);
          const label = t(source.label);
          return (
            <li key={source.sourceType}>
              <Collapsible
                open={open}
                onOpenChange={(value) => setOpen(source.sourceType, value)}
              >
                <div
                  className={cn(
                    'group/source flex items-center rounded-lg transition-colors',
                    current ? 'bg-accent' : 'hover:bg-muted',
                  )}
                >
                  <button
                    type='button'
                    aria-current={current ? 'page' : undefined}
                    className='flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none'
                    onClick={() => {
                      setOpen(source.sourceType, true);
                      onSelect(source.sourceType);
                    }}
                  >
                    <span
                      className={cn(
                        'flex size-7 shrink-0 items-center justify-center rounded-md transition-colors',
                        selected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground group-hover/source:bg-background',
                      )}
                    >
                      <Icon aria-hidden className='size-4' />
                    </span>
                    <span
                      className={cn(
                        'flex-1 truncate',
                        selected ? 'font-medium' : 'text-foreground/80',
                      )}
                    >
                      {label}
                    </span>
                    <NavigationCount
                      count={pendingCount(tasks, source.sourceType)}
                      strong={selected}
                    />
                  </button>
                  {subjects.length && !keyword ? (
                    <CollapsibleTrigger
                      render={
                        <Button
                          variant='ghost'
                          size='icon-sm'
                          className='mr-1 text-muted-foreground hover:bg-transparent hover:text-foreground'
                          aria-label={t(
                            open ? 'taskCenter.collapse' : 'taskCenter.expand',
                            { name: label },
                          )}
                        />
                      }
                    >
                      <ChevronRight
                        className={cn(
                          'transition-transform duration-200',
                          open && 'rotate-90',
                        )}
                      />
                    </CollapsibleTrigger>
                  ) : null}
                </div>
                <CollapsibleContent>
                  <ul
                    aria-label={t('taskCenter.subjectGroup', { name: label })}
                    className='my-1 ml-5 flex flex-col gap-0.5 border-l'
                  >
                    {subjects.map((item) => {
                      const active =
                        selected && currentSubject === item.subject;
                      return (
                        <li key={item.subject}>
                          <button
                            type='button'
                            aria-current={active ? 'page' : undefined}
                            className={cn(
                              '-ml-px flex w-full items-center gap-2 rounded-r-md border-l-2 py-1.5 pr-2 pl-3 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none',
                              active
                                ? 'border-primary bg-accent font-medium text-accent-foreground'
                                : 'border-transparent text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground',
                            )}
                            onClick={() =>
                              onSelect(source.sourceType, item.subject)
                            }
                          >
                            <span className='flex-1 truncate'>
                              <Highlight
                                keyword={keyword}
                                text={t(item.label)}
                              />
                            </span>
                            <NavigationCount
                              count={pendingCount(
                                tasks,
                                source.sourceType,
                                item.subject,
                              )}
                            />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function NavigationCount({
  count,
  strong = false,
}: {
  readonly count: number;
  readonly strong?: boolean;
}): ReactElement | null {
  const { t } = useTranslation();
  if (!count) return null;
  return (
    <span
      aria-label={t('taskCenter.pendingCount', { count })}
      className={cn(
        'min-w-5 rounded-full px-1.5 text-center text-xs leading-5 font-medium tabular-nums',
        strong
          ? 'bg-primary/10 text-primary'
          : 'bg-muted text-muted-foreground',
      )}
    >
      {count}
    </span>
  );
}

function dayGroupOf(time: string): DayGroup {
  const start = new Date(prototypeNow);
  start.setHours(0, 0, 0, 0);
  const value = new Date(time).getTime();
  if (value >= start.getTime()) return 'today';
  if (value >= start.getTime() - DAY) return 'yesterday';
  return 'earlier';
}

interface TaskSelection {
  readonly isSelectable: (task: PrototypeTask) => boolean;
  readonly isSelected: (task: PrototypeTask) => boolean;
  readonly onChange: (task: PrototypeTask, checked: boolean) => void;
}

function TaskList({
  selection,
  showSubject,
  source,
  tasks,
}: {
  readonly selection?: TaskSelection;
  readonly showSubject: boolean;
  readonly source: TaskSourceDefinition;
  readonly tasks: readonly PrototypeTask[];
}): ReactElement {
  const { t } = useTranslation();
  const groups: { key: DayGroup; tasks: PrototypeTask[] }[] = [];
  for (const task of tasks) {
    const key = dayGroupOf(timeOf(task));
    const last = groups.at(-1);
    if (last?.key === key) last.tasks.push(task);
    else groups.push({ key, tasks: [task] });
  }
  return (
    <div className='flex flex-col gap-6'>
      {groups.map((group) => (
        <section
          key={group.key}
          aria-labelledby={`task-day-${group.key}`}
          className='flex flex-col gap-3'
        >
          <h3
            id={`task-day-${group.key}`}
            className='flex items-center gap-3 text-xs font-medium text-muted-foreground'
          >
            {t(`taskCenter.groups.${group.key}`)}
            <span aria-hidden className='h-px flex-1 bg-border' />
          </h3>
          <ul className='flex flex-col gap-3'>
            {group.tasks.map((task) => (
              <li key={task.id}>
                <TaskCard
                  task={task}
                  source={source}
                  showSubject={showSubject}
                  selection={selection}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function useWhen(): (time: string) => { relative: string; absolute: string } {
  const { i18n } = useTranslation();
  const relative = new Intl.RelativeTimeFormat(i18n.language, {
    numeric: 'auto',
  });
  const absolute = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const short = new Intl.DateTimeFormat(i18n.language, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  return (time) => {
    const date = new Date(time);
    const minutes = Math.round(
      (date.getTime() - prototypeNow.getTime()) / 60_000,
    );
    const text =
      minutes > -1
        ? relative.format(0, 'minute')
        : minutes > -60
          ? relative.format(minutes, 'minute')
          : minutes > -24 * 60
            ? relative.format(Math.round(minutes / 60), 'hour')
            : short.format(date);
    return { relative: text, absolute: absolute.format(date) };
  };
}

function TaskCard({
  selection,
  showSubject,
  source,
  task,
}: {
  readonly selection?: TaskSelection;
  readonly showSubject: boolean;
  readonly source: TaskSourceDefinition;
  readonly task: PrototypeTask;
}): ReactElement {
  const { t } = useTranslation();
  const when = useWhen()(timeOf(task));
  const subject = taskSubjects.find((item) => item.subject === task.subject);
  const SubjectIcon = subject?.icon ?? Layers;
  const open = task.status === 'pending';
  const selectable = selection?.isSelectable(task) ?? false;
  const checked = selectable && (selection?.isSelected(task) ?? false);
  const statusLabel =
    source.statusLabels?.[task.status] ?? `taskCenter.status.${task.status}`;
  return (
    <Card
      className={cn(
        'group/task gap-0 px-4 transition-shadow hover:shadow-md',
        checked ? 'bg-primary/5 ring-primary/40' : 'hover:ring-foreground/15',
      )}
    >
      <div className='flex items-start gap-3'>
        {selection ? (
          // Keeps titles aligned when only some cards can be selected.
          <span className='flex h-9 w-4 shrink-0 items-center'>
            {selectable ? (
              <Checkbox
                aria-label={t('taskCenter.bulk.selectTask', {
                  name: task.title,
                })}
                checked={checked}
                onCheckedChange={(value) => selection.onChange(task, value)}
              />
            ) : open ? (
              <Checkbox
                disabled
                aria-label={t('taskCenter.bulk.notSupported', {
                  name: task.title,
                })}
                title={t('taskCenter.bulk.notSupportedHint')}
              />
            ) : null}
          </span>
        ) : null}
        <span
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-lg',
            open
              ? 'bg-primary/10 text-primary'
              : 'bg-muted text-muted-foreground',
          )}
        >
          <SubjectIcon aria-hidden className='size-4' />
        </span>
        <div className='flex min-w-0 flex-1 flex-col gap-1'>
          <div className='flex items-start justify-between gap-3'>
            <h4
              className={cn(
                'truncate text-sm font-medium',
                !open && 'text-foreground/70',
              )}
              title={task.title}
            >
              {task.title}
            </h4>
            <StatusBadge tone={statusTone[task.status]} className='shrink-0'>
              {t(statusLabel)}
            </StatusBadge>
          </div>
          <p className='flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground'>
            {showSubject && subject ? (
              <>
                <span>{t(subject.label)}</span>
                <span aria-hidden>·</span>
              </>
            ) : null}
            <span className='inline-flex items-center gap-1'>
              <Clock3 aria-hidden className='size-3' />
              <time dateTime={timeOf(task)} title={when.absolute}>
                {t(open ? 'taskCenter.receivedAt' : 'taskCenter.closedAt', {
                  time: when.relative,
                })}
              </time>
            </span>
          </p>
          <TaskSummary task={task} />
        </div>
      </div>
    </Card>
  );
}

function BulkActionBar({
  actions,
  onClear,
  onRun,
  selected,
}: {
  readonly actions: readonly TaskBulkAction[];
  readonly onClear: () => void;
  readonly onRun: (action: TaskBulkAction) => void;
  readonly selected: readonly PrototypeTask[];
}): ReactElement {
  const { t } = useTranslation();
  return (
    <div
      role='toolbar'
      aria-label={t('taskCenter.bulk.toolbar')}
      className='sticky bottom-4 z-10 flex flex-wrap items-center gap-2 self-center rounded-xl border bg-popover py-2 pr-2 pl-4 text-popover-foreground shadow-lg'
    >
      <span className='text-sm font-medium tabular-nums'>
        {t('taskCenter.bulk.selected', { count: selected.length })}
      </span>
      <Button
        variant='ghost'
        size='icon-sm'
        aria-label={t('taskCenter.bulk.clear')}
        title={t('taskCenter.bulk.clear')}
        onClick={onClear}
      >
        <X />
      </Button>
      <span aria-hidden className='mx-1 h-5 w-px bg-border' />
      {actions.map((action) => {
        const Icon = action.icon;
        const count = selected.filter((task) =>
          bulkActionApplies(action, task),
        ).length;
        return (
          <Button
            key={action.key}
            size='sm'
            variant={action.primary ? 'default' : 'outline'}
            disabled={!count}
            onClick={() => onRun(action)}
          >
            <Icon data-icon='inline-start' />
            {t(action.label, { count })}
          </Button>
        );
      })}
    </div>
  );
}

function BulkConfirmDialog({
  confirmation,
  onCancel,
  onConfirm,
  running,
}: {
  readonly confirmation?: {
    readonly action: TaskBulkAction;
    readonly items: readonly PrototypeTask[];
    readonly skipped: number;
  };
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
  readonly running: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const action = confirmation?.action;
  const count = confirmation?.items.length ?? 0;
  return (
    <AlertDialog
      open={Boolean(confirmation)}
      onOpenChange={(open) => {
        if (!open && !running) onCancel();
      }}
    >
      <AlertDialogContent className='max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden'>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {action ? t(action.confirmTitle, { count }) : null}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {action ? t(action.confirmDescription) : null}
            {confirmation?.skipped
              ? ` ${t('taskCenter.bulk.skipped', { count: confirmation.skipped })}`
              : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <ul className='flex min-h-0 flex-col divide-y overflow-y-auto rounded-lg border text-sm'>
          {confirmation?.items.map((task) => (
            <li key={task.id} className='truncate px-3 py-2' title={task.title}>
              {task.title}
            </li>
          ))}
        </ul>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={running}>
            {t('taskCenter.bulk.cancel')}
          </AlertDialogCancel>
          <Button disabled={running} onClick={onConfirm}>
            {running ? <Spinner data-icon='inline-start' /> : null}
            {action ? t(action.label, { count }) : null}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function TaskListEmpty({
  onShowAll,
  status,
}: {
  readonly onShowAll?: () => void;
  readonly status: StatusTab;
}): ReactElement {
  const { t } = useTranslation();
  const Icon = status === 'pending' ? CircleCheckBig : Inbox;
  return (
    <Empty className='min-h-64 border border-dashed'>
      <EmptyHeader>
        <EmptyMedia variant='icon'>
          <Icon />
        </EmptyMedia>
        <EmptyTitle>{t(`taskCenter.empty.${status}.title`)}</EmptyTitle>
        <EmptyDescription>
          {t(`taskCenter.empty.${status}.description`)}
        </EmptyDescription>
      </EmptyHeader>
      {onShowAll ? (
        <EmptyContent>
          <Button variant='outline' size='sm' onClick={onShowAll}>
            {t('taskCenter.showAll')}
          </Button>
        </EmptyContent>
      ) : null}
    </Empty>
  );
}

function TaskListSkeleton(): ReactElement {
  const { t } = useTranslation();
  return (
    <ul
      className='flex flex-col gap-3'
      aria-label={t('taskCenter.loading')}
      aria-busy
    >
      {[0, 1, 2].map((index) => (
        <li key={index}>
          <Card className='px-4'>
            <div className='flex items-start gap-3'>
              <Skeleton className='size-9 rounded-lg' />
              <div className='flex flex-1 flex-col gap-2'>
                <div className='flex items-center justify-between gap-3'>
                  <Skeleton className='h-4 w-2/3' />
                  <Skeleton className='h-5 w-14' />
                </div>
                <Skeleton className='h-3 w-32' />
                <Skeleton className='h-12 w-full rounded-lg' />
              </div>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
