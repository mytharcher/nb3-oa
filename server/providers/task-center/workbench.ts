import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import type { Application } from '@nocobase/app-server/application';
import { databaseManagerToken } from '@nocobase/db';
import {
  userTaskServiceToken,
  type UserTask,
} from '@nocobase/app-plugin-task-center/server';
import {
  CenterItem,
  CenterMeta,
} from '../../routes/approval-center/schemas.js';
import { taskDate, taskReference } from './values.js';

// Fixed sources, never a loop over approval definitions or business repositories.
const pendingSources = [
  'approval.task',
  'oa.workItem',
  'oa.announcementReceipt',
];
const key = (subject: string, recordId: string) =>
  JSON.stringify([subject, recordId]);

/** Personal entries authorize only safe index presentation, never business details. */
export async function workbenchTaskRows(
  app: Application,
  tasks: readonly UserTask[],
) {
  if (!tasks.length) return [];
  const db = app.container.resolve(databaseManagerToken);
  const references = tasks.filter(
    (task) => task.sourceType !== 'approval.application',
  );
  const targets = references.length
    ? await db.repository('oaTaskCenterTargets').findMany({
        filter: (f) =>
          f.or(
            references.map((task) =>
              f.and([
                f.string('sourceType').eq(task.sourceType),
                f.string('sourceKey').eq(task.sourceKey),
              ]),
            ),
          ),
      })
    : [];
  const lookup = new Map(
    targets.map((target) => [
      key(taskReference(target.sourceType), taskReference(target.sourceKey)),
      taskReference(target.recordId),
    ]),
  );
  const resolved = tasks.map((task) => {
    const prefix = `${task.subject}:`;
    const recordId =
      task.sourceType === 'approval.application'
        ? task.sourceKey.startsWith(prefix)
          ? task.sourceKey.slice(prefix.length)
          : undefined
        : lookup.get(key(task.sourceType, task.sourceKey));
    if (!recordId) throw new Error('Task center reference is not ready.');
    return { task, recordId };
  });
  const summaries = await db.repository('oaTaskCenterSummaries').findMany({
    filter: (f) =>
      f.or(
        resolved.map(({ task, recordId }) =>
          f.and([
            f.string('subject').eq(task.subject),
            f.string('recordId').eq(recordId),
          ]),
        ),
      ),
  });
  const summaryByRecord = new Map(
    summaries.map((row) => [
      key(taskReference(row.subject), taskReference(row.recordId)),
      row,
    ]),
  );
  return resolved.map(({ task, recordId }) => {
    const summary = summaryByRecord.get(key(task.subject, recordId));
    if (!summary) throw new Error('Task center summary is not ready.');
    return CenterItem.parse({
      id: recordId,
      kind: task.subject,
      title: task.title === task.subject ? undefined : task.title,
      number: null,
      applicantId: summary.applicantId ?? '',
      applicant: null,
      status:
        task.sourceType === 'oa.announcementReceipt'
          ? task.status
          : summary.status,
      createdAt: taskDate(task.createdAt).toISOString(),
      updatedAt: taskDate(task.updatedAt).toISOString(),
      ...(summary.dueAt
        ? { dueAt: taskDate(summary.dueAt).toISOString() }
        : {}),
      startDate: null,
      endDate: null,
      amount: null,
      unit: null,
    });
  });
}

export async function readWorkbenchTasks(
  app: Application,
  userId: string,
  view: 'pending' | 'mine',
  pageSize: number,
) {
  const service = app.container.resolve(userTaskServiceToken);
  const sources = view === 'mine' ? ['approval.application'] : pendingSources;
  const pages = await Promise.all(
    sources.map((sourceType) =>
      service.list(userId, {
        sourceType,
        ...(view === 'pending' ? { status: 'pending' as const } : {}),
        page: 1,
        pageSize,
        orderBy: 'createdAt',
        direction: view === 'pending' ? 'asc' : 'desc',
      }),
    ),
  );
  const tasks = pages
    .flatMap((page) => page.data)
    .sort((a, b) => {
      const compared =
        taskDate(a.createdAt).getTime() - taskDate(b.createdAt).getTime();
      return (
        (view === 'pending' ? compared : -compared) || a.id.localeCompare(b.id)
      );
    })
    .slice(0, pageSize);
  const data = await workbenchTaskRows(app, tasks);
  const counts = { drafts: 0, revisions: 0, inProgress: 0 };
  const summaries = app.container
    .resolve(databaseManagerToken)
    .repository('oaTaskCenterSummaries');
  // Draft and returned counts use business state from the companion index;
  // applicant work remains separate from an approver's decision tasks.
  const groups = await summaries.groupBy({
    filter: { applicantId: userId },
    by: ['category'],
    aggregate: (a) => ({ count: a.count() }),
  });
  for (const row of groups) {
    if (
      row.category === 'drafts' ||
      row.category === 'revisions' ||
      row.category === 'inProgress'
    )
      counts[row.category] = Number(row.count);
  }
  if (view === 'pending' && counts.revisions) {
    const revisions = await summaries.findMany({
      filter: { applicantId: userId, category: 'revisions' },
      sort: (s) => [s.field('createdAt').asc(), s.field('id').asc()],
      limit: pageSize,
    });
    for (const row of revisions)
      data.push(
        CenterItem.parse({
          id: taskReference(row.recordId),
          kind: row.subject,
          title: row.number ?? undefined,
          number: row.number,
          applicantId: userId,
          applicant: null,
          status: row.status,
          createdAt: row.createdAt
            ? taskDate(row.createdAt).toISOString()
            : null,
          ...(row.dueAt ? { dueAt: taskDate(row.dueAt).toISOString() } : {}),
          startDate: null,
          endDate: null,
          amount: null,
          unit: null,
        }),
      );
    data.sort((a, b) =>
      a.dueAt && b.dueAt
        ? a.dueAt.localeCompare(b.dueAt)
        : a.dueAt
          ? -1
          : b.dueAt
            ? 1
            : (a.createdAt ?? '').localeCompare(b.createdAt ?? ''),
    );
    data.splice(pageSize);
  }
  // One bounded public directory read, only for people on this preview page.
  const userIds = [
    ...new Set(data.map((row) => row.applicantId).filter(Boolean)),
  ];
  if (userIds.length) {
    const users = await app.container
      .resolve(userAdministrationServiceToken)
      .list({
        userIds,
        kind: 'all',
        page: 1,
        pageSize: 100,
      });
    const names = new Map(users.items.map((user) => [user.id, user.name]));
    for (const row of data) {
      const name = names.get(row.applicantId);
      if (name) row.applicant = { id: row.applicantId, name };
    }
  }
  return {
    data,
    meta: CenterMeta.parse({
      page: 1,
      pageSize,
      total:
        pages.reduce((n, page) => n + page.meta.total, 0) +
        (view === 'pending' ? counts.revisions : 0),
      kinds: [...new Set(data.map((row) => row.kind))],
      counts,
      ...(view === 'mine'
        ? { attention: { drafts: [], revisions: [], submitted: data } }
        : {}),
    }),
  };
}
