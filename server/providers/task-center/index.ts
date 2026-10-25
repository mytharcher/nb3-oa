import { writeTaskSummary } from './summary.js';
import { taskReference, taskDate } from './values.js';
import { retryTaskCenterTransaction } from './retry.js';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import type { ScheduleExecutor } from '@nocobase/jobs';
import { demoNow } from '../demo-data/context.js';
import { orgServiceToken } from '../org/contract.js';
import { synchronizeOrdinaryTask } from './ordinary.js';
import { ServiceProvider } from '@nocobase/service-provider';
import type { Application } from '@nocobase/app-server/application';
import { databaseManagerToken } from '@nocobase/db';
import { approvalTaskContributorToken } from '@nocobase/app-plugin-approval/server';
import { userTaskServiceToken } from '@nocobase/app-plugin-task-center/server';
import { withAppLifecycleTransaction } from '../approval-runtime/repository-store.js';
import {
  configureTaskCenter,
  registerTaskSynchronizer,
  taskCenterDefinition,
  taskCenterIntegration,
} from '../approval-runtime/task-center.js';
import { processOwners } from '../process-management/owners.js';
import { approvalTaskBindings } from '../approval-runtime/query-service.js';

/** Register before owner startup; enable transactional online contributions before backfill. */
export default class TaskCenterProvider extends ServiceProvider<Application> {
  readonly name = 'oa/task-center';
  private schedule?: ScheduleExecutor;
  override async boot(): Promise<void> {
    const c = this.app.container;
    configureTaskCenter(c.resolve(databaseManagerToken), {
      reader: c.resolve(userTaskServiceToken),
      contributor: c.resolve(approvalTaskContributorToken),
      applications: c
        .resolve(userTaskServiceToken)
        .registerSource('approval.application'),
      workItems: c.resolve(userTaskServiceToken).registerSource('oa.workItem'),
      receipts: c
        .resolve(userTaskServiceToken)
        .registerSource('oa.announcementReceipt'),
      dutyMembers: (role, connection) =>
        c.resolve(orgServiceToken).dutyRoleMembers(role, connection),
    });
  }
  override async start(): Promise<void> {
    const db = this.app.container.resolve(databaseManagerToken);
    if (!(await db.connection().collections.get('oaTaskCenterBackfills')))
      return;
    for (const owner of processOwners) {
      if (!(await db.connection().collections.get(owner.collection))) continue;
      const sdk = await owner.sdk(this.app);
      const binding = approvalTaskBindings(sdk.approvals);
      for (const approval of binding.approvals) {
        registerTaskSynchronizer(
          db,
          approval.name,
          async (connection, scope) => {
            const assignees = scope
              ? [...new Set(scope.assigneeIds)].sort()
              : [undefined];
            if (!assignees.length) return;
            await withAppLifecycleTransaction(connection, () =>
              sdk.read(
                () =>
                  binding.runtime.transaction(async (tx) => {
                    const services =
                      typeof binding.services === 'function'
                        ? (binding.services as (handle: unknown) => object)(
                            tx.handle,
                          )
                        : binding.services;
                    const configuration = approval.options.userTasks!(
                      services as never,
                    )!;
                    for (const assigneeId of assignees) {
                      let afterId: string | undefined;
                      do {
                        const batch =
                          await configuration.contributor.synchronizeBatch(
                            approval.name,
                            configuration,
                            {
                              transaction: tx,
                              at: tx.now,
                              directory: approval.options.directory(
                                services as never,
                              ),
                              kind: approval.kind,
                            },
                            {
                              afterId,
                              limit: 100,
                              ...(assigneeId ? { assigneeId } : {}),
                            },
                          );
                        afterId = batch.nextCursor ?? undefined;
                      } while (afterId);
                    }
                  }),
                connection,
              ),
            );
          },
        );
        for (;;) {
          const done = await retryTaskCenterTransaction(() =>
            sdk.read(() =>
              binding.runtime.transaction(async (tx) => {
                const connection =
                  tx.handle as import('@nocobase/db').DatabaseConnection;
                const jobs = connection.repository('oaTaskCenterBackfills');
                await jobs.upsertOne({
                  filter: { id: approval.name },
                  create: { id: approval.name, cursor: null, done: false },
                  update: { id: approval.name },
                });
                await jobs.updateMany({
                  filter: { id: approval.name },
                  values: { id: approval.name },
                });
                const job = await jobs.findOne({
                  filter: { id: approval.name },
                });
                if (job!.done) return true;
                const services =
                  typeof binding.services === 'function'
                    ? (binding.services as (handle: unknown) => object)(
                        tx.handle,
                      )
                    : binding.services;
                const configuration = approval.options.userTasks?.(
                  services as never,
                );
                if (!configuration)
                  throw new Error(
                    `Task center source is not configured: ${approval.name}`,
                  );
                const batch = await configuration.contributor.synchronizeBatch(
                  approval.name,
                  configuration,
                  {
                    transaction: tx,
                    at: tx.now,
                    directory: approval.options.directory(services as never),
                    kind: approval.kind,
                  },
                  {
                    afterId: job!.cursor
                      ? taskReference(job!.cursor)
                      : undefined,
                    limit: 100,
                  },
                );
                await jobs.updateMany({
                  filter: { id: approval.name },
                  values: {
                    cursor: batch.nextCursor,
                    done: batch.nextCursor === null,
                  },
                });
                return batch.nextCursor === null;
              }),
            ),
          );
          if (done) break;
        }
      }
      for (;;) {
        const done = await retryTaskCenterTransaction(() =>
          sdk.read(() =>
            binding.runtime.transaction(async (tx) => {
              const connection =
                tx.handle as import('@nocobase/db').DatabaseConnection;
              const jobs = connection.repository('oaTaskCenterBackfills');
              const id = `applications:v3:${owner.kind}`;
              await jobs.upsertOne({
                filter: { id },
                create: { id, cursor: null, done: false },
                update: { id },
              });
              await jobs.updateMany({ filter: { id }, values: { id } });
              const job = (await jobs.findOne({ filter: { id } }))!;
              if (job.done) return true;
              const rows = await connection
                .repository(owner.collection)
                .findMany({
                  ...(job.cursor
                    ? { cursor: { id: taskReference(job.cursor) } }
                    : {}),
                  sort: (s) => s.field('id').asc(),
                  limit: 100,
                });
              const definition = taskCenterDefinition(binding.runtime)!;
              const approval = binding.approvals[0];
              for (const original of rows) {
                await connection.repository(owner.collection).updateMany({
                  filter: { id: taskReference(original.id) },
                  values: { id: original.id },
                });
                const row = (await connection
                  .repository(owner.collection)
                  .findOne({ filter: { id: taskReference(original.id) } }))!;
                const state = taskReference(row[definition.stateField]);
                await writeTaskSummary(
                  connection,
                  approval.name,
                  row,
                  approval.options.applicant(row as never),
                  definition.stateField,
                );
                await taskCenterIntegration(db)!.applications.put(
                  {
                    userId: approval.options.applicant(row as never),
                    sourceKey: `${approval.name}:${taskReference(row.id)}`,
                    ...(row.createdAt
                      ? { createdAt: taskDate(row.createdAt) }
                      : {}),
                    subject: approval.name,
                    title:
                      typeof row.number === 'string' && row.number
                        ? row.number
                        : approval.name,
                    status: ['withdrawn', 'terminated', 'cancelled'].includes(
                      state,
                    )
                      ? 'cancelled'
                      : definition.stateInfo.get(state as never)?.final
                        ? 'completed'
                        : 'pending',
                  },
                  connection,
                );
              }
              const finished = rows.length < 100;
              await jobs.updateMany({
                filter: { id },
                values: {
                  done: finished,
                  cursor: rows.length
                    ? taskReference(rows.at(-1)!.id)
                    : job.cursor,
                },
              });
              return finished;
            }),
          ),
        );
        if (done) break;
      }
    }
    for (const collection of ['workItems', 'announcementReceipts']) {
      for (;;) {
        const done = await retryTaskCenterTransaction(() =>
          db.transaction(async (connection) => {
            const jobs = connection.repository('oaTaskCenterBackfills'),
              id = `ordinary:v2:${collection}`;
            await jobs.upsertOne({
              filter: { id },
              create: { id, cursor: null, done: false },
              update: { id },
            });
            await jobs.updateMany({ filter: { id }, values: { id } });
            const job = (await jobs.findOne({ filter: { id } }))!;
            if (job.done) return true;
            const rows = await connection.repository(collection).findMany({
              ...(job.cursor
                ? { cursor: { id: taskReference(job.cursor) } }
                : {}),
              sort: (s) => s.field('id').asc(),
              limit: 100,
            });
            for (const row of rows) {
              // Match the owner's lock order: announcement first, then its receipt.
              if (collection === 'announcementReceipts')
                await connection.repository('announcements').updateMany({
                  filter: { id: taskReference(row.announcementId) },
                  values: { id: row.announcementId },
                });
              // Lock the authoritative row before rereading so a backfill cannot revive completed work.
              await connection.repository(collection).updateMany({
                filter: { id: taskReference(row.id) },
                values: { id: row.id },
              });
              const current = await connection
                .repository(collection)
                .findOne({ filter: { id: taskReference(row.id) } });
              if (current)
                await synchronizeOrdinaryTask(
                  db,
                  collection,
                  current,
                  connection,
                );
            }
            const finished = rows.length < 100;
            await jobs.updateMany({
              filter: { id },
              values: {
                done: finished,
                cursor: rows.length
                  ? taskReference(rows.at(-1)!.id)
                  : job.cursor,
              },
            });
            return finished;
          }),
        );
        if (done) break;
      }
    }
    this.schedule = this.app.container
      .resolve(jobExecutorServiceToken)
      .getScheduleExecutor('oa-task-center-timers');
    await this.schedule.addJob({
      name: 'expire-receipts',
      options: { every: 1000 },
      payload: {},
      execute: async () => {
        const due = await db.repository('oaTaskCenterTimers').findMany({
          filter: (f) => f.date('dueAt').notAfter(demoNow()),
          sort: (s) => s.field('dueAt').asc(),
          limit: 100,
        });
        for (const timer of due)
          await db.transaction(async (connection) => {
            const before = await connection
              .repository('announcementReceipts')
              .findOne({ filter: { id: taskReference(timer.id) } });
            if (!before) {
              await connection
                .repository('oaTaskCenterTimers')
                .deleteMany({ filter: { id: taskReference(timer.id) } });
              return;
            }
            await connection.repository('announcements').updateMany({
              filter: { id: taskReference(before.announcementId) },
              values: { id: before.announcementId },
            });
            await connection.repository('announcementReceipts').updateMany({
              filter: { id: taskReference(timer.id) },
              values: { id: timer.id },
            });
            const receipt = await connection
              .repository('announcementReceipts')
              .findOne({ filter: { id: taskReference(timer.id) } });
            if (receipt)
              await synchronizeOrdinaryTask(
                db,
                'announcementReceipts',
                receipt,
                connection,
              );
          });
      },
    });
    await this.schedule.setup();
  }
  override async shutdown(): Promise<void> {
    await this.schedule?.shutdown();
  }
}
