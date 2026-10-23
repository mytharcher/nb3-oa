import { writeTaskSummary } from './summary.js';
import { taskReference, taskDate } from './values.js';
import { demoNow } from '../demo-data/context.js';
import type { DatabaseConnection, DatabaseManager } from '@nocobase/db';
import { taskCenterIntegration } from '../approval-runtime/task-center.js';

/** Trusted source adapters run at the same store write boundary as their business facts. */
export async function synchronizeOrdinaryTask(
  db: DatabaseManager,
  collection: string,
  row: Readonly<Record<string, unknown>>,
  connection: DatabaseConnection,
): Promise<void> {
  const services = taskCenterIntegration(db);
  if (!services) return;
  if (collection === 'announcements') {
    const receipts = await connection
      .repository('announcementReceipts')
      .findMany({ filter: { announcementId: taskReference(row.id) } });
    for (const receipt of receipts)
      await synchronizeOrdinaryTask(
        db,
        'announcementReceipts',
        receipt,
        connection,
      );
    return;
  }
  if (collection !== 'workItems' && collection !== 'announcementReceipts')
    return;
  const work = collection === 'workItems';
  const writer = work ? services.workItems : services.receipts;
  const sourceType = work ? 'oa.workItem' : 'oa.announcementReceipt';
  const sourceKey = taskReference(row.id);
  const previous = await writer.listBySourceKey(sourceKey, connection);
  let title = work && typeof row.title === 'string' ? row.title : sourceType;
  let createdAt: Date | undefined;
  let recipients: string[];
  let status: 'pending' | 'completed' | 'cancelled';
  if (work) {
    if (row.status === 'draft') return;
    await writeTaskSummary(
      connection,
      sourceType,
      row,
      row.creatorUserId ? taskReference(row.creatorUserId) : null,
    );
    if (row.createdAt ?? row.statusChangedAt)
      createdAt = taskDate(row.createdAt ?? row.statusChangedAt);
    status =
      row.status === 'completed'
        ? 'completed'
        : row.status === 'cancelled'
          ? 'cancelled'
          : 'pending';
    recipients =
      row.status === 'awaitingConfirmation'
        ? row.confirmationOwnerUserId
          ? [taskReference(row.confirmationOwnerUserId)]
          : []
        : row.status === 'open' && row.dutyRoleCode
          ? [
              ...(await services.dutyMembers(
                taskReference(row.dutyRoleCode),
                connection,
              )),
            ]
          : row.assigneeUserId
            ? [taskReference(row.assigneeUserId)]
            : [];
    if (row.status === 'blocked' && row.creatorUserId)
      recipients.push(taskReference(row.creatorUserId));
  } else {
    const announcement = await connection
      .repository('announcements')
      .findOne({ filter: { id: taskReference(row.announcementId) } });
    if (!announcement || !announcement.requiresConfirmation) return;
    title =
      typeof announcement.title === 'string' ? announcement.title : sourceType;
    await writeTaskSummary(
      connection,
      sourceType,
      {
        ...announcement,
        id: row.announcementId,
        dueAt: announcement.validUntil,
      },
      announcement.publisherUserId
        ? taskReference(announcement.publisherUserId)
        : null,
    );
    if (announcement.publishedAt)
      createdAt = taskDate(announcement.publishedAt);
    status =
      row.status === 'confirmed'
        ? 'completed'
        : announcement.status === 'revoked' ||
            taskDate(announcement.validUntil).getTime() <= demoNow().getTime()
          ? 'cancelled'
          : 'pending';
    recipients =
      announcement.status === 'scheduled' ? [] : [taskReference(row.userId)];
    if (status === 'pending')
      await connection.repository('oaTaskCenterTimers').upsertOne({
        filter: { id: sourceKey },
        create: { id: sourceKey, dueAt: announcement.validUntil },
        update: { dueAt: announcement.validUntil },
      });
    else
      await connection
        .repository('oaTaskCenterTimers')
        .deleteMany({ filter: { id: sourceKey } });
  }
  if (status === 'pending') {
    const active: string[] = [];
    for (const userId of new Set(recipients)) {
      const employee = await connection
        .repository('employees')
        .findOne({ filter: { userId } });
      if (employee?.active && employee.status !== 'left') active.push(userId);
    }
    recipients = active;
  } else
    recipients = [
      ...new Set([
        ...recipients,
        ...previous
          .filter((item) => item.status === 'pending')
          .map((item) => item.userId),
      ]),
    ];
  for (const item of previous) {
    if (item.status === 'pending' && !recipients.includes(item.userId))
      await writer.setStatus(
        { userId: item.userId, sourceKey },
        work &&
          row.status === 'awaitingConfirmation' &&
          item.userId === taskReference(row.assigneeUserId)
          ? 'completed'
          : 'cancelled',
        connection,
      );
  }
  for (const userId of recipients) {
    if (
      status === 'cancelled' &&
      previous.some(
        (item) => item.userId === userId && item.status === 'completed',
      )
    )
      continue;
    await writer.put(
      {
        userId,
        sourceKey,
        subject: sourceType,
        title,
        status,
        ...(createdAt ? { createdAt } : {}),
      },
      connection,
    );
  }
  await connection.repository('oaTaskCenterTargets').upsertOne({
    filter: { sourceType, sourceKey },
    create: {
      sourceType,
      sourceKey,
      subject: sourceType,
      recordId: taskReference(work ? row.id : row.announcementId),
    },
    update: { recordId: taskReference(work ? row.id : row.announcementId) },
  });
}
