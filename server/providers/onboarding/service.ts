import { demoNow } from '../demo-data/context.js';
import { projectTimeline } from './timeline.js';
import { RepositoryError } from '@nocobase/db';
import { lockUserForAdministration } from '@nocobase/app-plugin-authentication';
import type { OnboardingAssetService } from '../assets/contract.js';
import { AssetError } from '../assets/errors.js';
import { createHash, randomBytes } from 'node:crypto';
import type {
  DatabaseConnection,
  DatabaseManager,
  RepositoryRecord,
} from '@nocobase/db';
import type { UserAdministrationService } from '@nocobase/app-plugin-authentication';
import type { EmployeeService } from '../employees/contract.js';
import type { OrganizationService } from '../org/index.js';
import type { HeadcountService } from '../headcounts/contract.js';
import type {
  RequisitionService,
  Requisition,
} from '../recruitment/requisitions.js';
import type { CalendarService } from '../platform/index.js';
import type { AuditService } from '../audit/index.js';
import {
  ONBOARDING_FIELDS,
  ONBOARDING_TASK_FIELDS,
  type Onboarding,
  type OnboardingService,
  type OnboardingTask,
} from './contract.js';
export class OnboardingError extends Error {
  constructor(
    public readonly code:
      | 'ONBOARDING_FORBIDDEN'
      | 'ONBOARDING_SOURCE_INVALID'
      | 'ONBOARDING_IDEMPOTENCY_CONFLICT',
  ) {
    super(code);
  }
}
const canonical = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonical)
    : value !== null && typeof value === 'object'
      ? Object.fromEntries(
          Object.entries(value)
            .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
            .map(([key, item]) => [key, canonical(item)]),
        )
      : value;
const digest = (value: unknown) =>
  createHash('sha256')
    .update(JSON.stringify(canonical(value)))
    .digest('hex');
export function createOnboardingService(d: {
  database: DatabaseManager;
  users: UserAdministrationService;
  employees: EmployeeService;
  organization: OrganizationService;
  headcounts: HeadcountService;
  assets?: OnboardingAssetService;
  requisitions: RequisitionService;
  calendar: CalendarService;
  audit: AuditService;
  now?: () => Date;
  notify?: (input: {
    eventId: string;
    onboardingId: string;
    taskId: string;
    recipientIds: string[];
  }) => Promise<boolean>;
}): OnboardingService {
  async function requireActor(id: string, tx: DatabaseConnection) {
    const employee = await d.employees.getByUserId(id, tx),
      user = await d.users.withConnection(tx).get(id);
    if (
      !employee?.active ||
      employee.status === 'left' ||
      !user ||
      user.disabledAt ||
      user.kind === 'service'
    )
      throw new OnboardingError('ONBOARDING_FORBIDDEN');
  }
  return {
    async list(query, tx, viewPolicy) {
      if (
        !Number.isSafeInteger(query.page) ||
        query.page < 1 ||
        !Number.isSafeInteger(query.pageSize) ||
        query.pageSize < 1 ||
        query.pageSize > 100
      )
        throw new OnboardingError('ONBOARDING_SOURCE_INVALID');
      const repository = tx
          .repository<Onboarding>('onboardings')
          .withPolicy(viewPolicy),
        filtered = query.status ? { filter: { status: query.status } } : {};
      let total = await repository.count(filtered);
      let rows = await repository.findMany({
        ...filtered,
        ...(!query.q
          ? { offset: (query.page - 1) * query.pageSize, limit: query.pageSize }
          : {}),
        sort: (s) => [
          query.desc === false
            ? s.field('hireDate').asc()
            : s.field('hireDate').desc(),
          s.field('id').asc(),
        ],
      });
      if (
        rows.some((row) => ONBOARDING_FIELDS.some((field) => !(field in row)))
      )
        throw new OnboardingError('ONBOARDING_FORBIDDEN');
      if (query.q) {
        const names = new Map<string, string>();
        const ids = [...new Set(rows.map((row) => String(row.userId)))];
        for (let offset = 0; offset < ids.length; offset += 100) {
          const users = await d.users.withConnection(tx).list({
            userIds: ids.slice(offset, offset + 100),
            pageSize: 100,
            kind: 'all',
          });
          for (const user of users.items) names.set(user.id, user.name);
        }
        const needle = query.q.toLocaleLowerCase();
        rows = rows.filter((row) =>
          names.get(String(row.userId))?.toLocaleLowerCase().includes(needle),
        );
        total = rows.length;
        rows = rows.slice(
          (query.page - 1) * query.pageSize,
          query.page * query.pageSize,
        );
      }
      return {
        items: rows.map(
          (row) =>
            Object.fromEntries(
              ONBOARDING_FIELDS.map((field) => [field, row[field]]),
            ) as Onboarding,
        ),
        total,
      };
    },
    async authorizeAttachment(taskId, actorId, tx) {
      await requireActor(actorId, tx);
      const task = await tx
        .repository<OnboardingTask>('onboardingTasks')
        .findOne({ filter: { id: taskId } });
      const parent = task
        ? await tx
            .repository<Onboarding>('onboardings')
            .findOne({ filter: { id: task.onboardingId } })
        : null;
      if (
        !task ||
        !parent ||
        task.status !== 'claimed' ||
        task.assigneeId !== actorId ||
        ['finance', 'recovery:finance'].includes(task.kind) ||
        !(
          parent.status === 'handling' ||
          (parent.status === 'cancelled' && task.kind.startsWith('recovery:'))
        ) ||
        !(
          task.targetUserId === actorId ||
          (task.dutyRoleCode &&
            (await d.organization.hasDutyRole(actorId, task.dutyRoleCode, tx)))
        )
      )
        throw new OnboardingError('ONBOARDING_FORBIDDEN');
      return task;
    },
    async maintenance() {
      const today = d.calendar.localDate(d.now?.() ?? demoNow());
      await d.database.transaction(async (tx) => {
        const tasks = await tx
          .repository<OnboardingTask>('onboardingTasks')
          .findMany({
            filter: (f) =>
              f.and([
                f.or([
                  f.string('status').eq('open'),
                  f.string('status').eq('claimed'),
                ]),
              ]),
          });
        for (const task of tasks) {
          if (task.dueDate >= today) continue;
          const parent = await tx
            .repository<Onboarding>('onboardings')
            .findOne({ filter: { id: task.onboardingId } });
          if (
            !parent ||
            (parent.status !== 'handling' &&
              !(
                parent.status === 'cancelled' &&
                task.kind.startsWith('recovery:')
              ))
          )
            continue;
          const responsible = task.assigneeId
            ? [task.assigneeId]
            : task.targetUserId
              ? [task.targetUserId]
              : task.dutyRoleCode
                ? [
                    ...(await d.organization.dutyRoleMembers(
                      task.dutyRoleCode,
                      tx,
                    )),
                  ]
                : [];
          const recipients = new Set<string>();
          for (const userId of responsible) {
            const employee = await d.employees.getByUserId(userId, tx);
            if (!employee?.active || employee.status === 'left') continue;
            recipients.add(userId);
            const manager = await d.employees.managerOf(userId, tx);
            if (manager) recipients.add(manager.userId);
          }
          if (!recipients.size) continue;
          const id = digest(['overdue', task.id, today]),
            repository = tx.repository('onboardingReminders');
          if (!(await repository.findOne({ filter: { id } })))
            await repository.createOne({
              values: {
                id,
                taskId: task.id,
                onboardingId: parent.id,
                recipientIds: [...recipients],
                status: 'pending',
                createdAt: demoNow(),
              },
            });
        }
      });
      const pending = await d.database
        .repository<{
          id: string;
          taskId: string;
          onboardingId: string;
          recipientIds: string[];
          status: string;
        }>('onboardingReminders')
        .findMany({ filter: { status: 'pending' } });
      let sent = 0;
      for (const reminder of pending) {
        const task = await d.database
          .repository<OnboardingTask>('onboardingTasks')
          .findOne({ filter: { id: reminder.taskId } });
        if (!task || !['open', 'claimed'].includes(task.status)) {
          await d.database.repository('onboardingReminders').updateMany({
            filter: { id: reminder.id, status: 'pending' },
            values: { status: 'obsolete' },
          });
          continue;
        }
        if (
          !(await d.notify?.({
            eventId: reminder.id,
            onboardingId: reminder.onboardingId,
            taskId: reminder.taskId,
            recipientIds: reminder.recipientIds,
          }))
        )
          continue;
        await d.database.repository('onboardingReminders').updateMany({
          filter: { id: reminder.id, status: 'pending' },
          values: { status: 'sent', sentAt: demoNow() },
        });
        sent++;
      }
      return {
        pending: await d.database
          .repository('onboardingReminders')
          .count({ filter: { status: 'pending' } }),
        sent,
      };
    },
    async detail(id, tx, viewPolicy, taskPolicy) {
      const record = await tx
        .repository<Onboarding>('onboardings')
        .withPolicy(viewPolicy)
        .findOne({ filter: { id } });
      if (!record || ONBOARDING_FIELDS.some((field) => !(field in record)))
        throw new OnboardingError('ONBOARDING_FORBIDDEN');
      const taskRows = await tx
        .repository<OnboardingTask>('onboardingTasks')
        .withPolicy(taskPolicy)
        .findMany({ filter: { onboardingId: id } });
      if (
        taskRows.some((task) =>
          ONBOARDING_TASK_FIELDS.some((field) => !(field in task)),
        )
      )
        throw new OnboardingError('ONBOARDING_FORBIDDEN');
      // The public audit facade is the historical authority, never today's mutable task status.
      const entries = [];
      for (let page = 1; ; page++) {
        const batch = await d.audit.list(
          {
            targetType: 'onboardings',
            targetId: id,
            order: 'asc',
            page,
            pageSize: 100,
          },
          tx,
        );
        entries.push(...batch.items);
        if (page * 100 >= batch.total) break;
      }
      const reminders = await tx
        .repository('onboardingReminders')
        .findMany({ filter: { onboardingId: id } });
      return {
        timeline: projectTimeline(
          entries,
          reminders,
          taskRows as OnboardingTask[],
        ),
        record: Object.fromEntries(
          ONBOARDING_FIELDS.map((field) => [field, record[field]]),
        ) as Onboarding,
        tasks: taskRows.map(
          (task) =>
            Object.fromEntries(
              ONBOARDING_TASK_FIELDS.map((field) => [field, task[field]]),
            ) as OnboardingTask,
        ),
      };
    },
    async privateFacts(id, kind, tx, viewPolicy, privatePolicy) {
      const records = tx.repository<Onboarding>('onboardings');
      const visible = await records
        .withPolicy(viewPolicy)
        .findOne({ filter: { id } });
      const privateReadable = await records
        .withPolicy(privatePolicy)
        .findOne({ filter: { id } });
      if (
        !visible ||
        !privateReadable ||
        ONBOARDING_FIELDS.some(
          (field) => !(field in visible) || !(field in privateReadable),
        )
      )
        throw new OnboardingError('ONBOARDING_FORBIDDEN');
      let key = `${id}:salary`;
      if (kind === 'bank') {
        const task = await tx
          .repository<OnboardingTask>('onboardingTasks')
          .findOne({ filter: { onboardingId: id, kind: 'finance' } });
        key = task?.facts?.privateFactsId ?? '';
      }
      if (!key) return null;
      const row = await tx
        .repository('onboardingPrivateFacts')
        .findOne({ filter: { id: key, onboardingId: id } });
      return (row?.facts as Record<string, unknown> | null) ?? null;
    },
    async cancel(
      id,
      expectedVersion,
      command,
      connection,
      viewPolicy,
      cancelPolicy,
    ) {
      return d.headcounts.within(connection, async (tx) => {
        await requireActor(command.actorId, tx);
        if (
          !command.actorId ||
          !command.requestKey ||
          !command.reason.trim() ||
          !cancelPolicy.update ||
          !(await d.organization.hasDutyRole(command.actorId, 'hr', tx))
        )
          throw new OnboardingError('ONBOARDING_FORBIDDEN');
        const records = tx.repository<Onboarding>('onboardings');
        const visible = await records
          .withPolicy(viewPolicy)
          .findOne({ filter: { id } });
        const permitted = await records
          .withPolicy(cancelPolicy)
          .findOne({ filter: { id } });
        if (
          !visible ||
          !permitted ||
          !visible.employeeId ||
          !visible.userId ||
          !visible.status
        )
          throw new OnboardingError('ONBOARDING_FORBIDDEN');
        if (
          ONBOARDING_FIELDS.some(
            (field) => !(field in visible) || !(field in permitted),
          )
        )
          throw new OnboardingError('ONBOARDING_FORBIDDEN');
        const key = digest([command.actorId, command.requestKey]),
          fingerprint = digest(['cancel', id, expectedVersion, command.reason]);
        const commands = tx.repository('onboardingCommands'),
          prior = await commands.findOne({ filter: { id: key } });
        if (prior) {
          if (prior.fingerprint !== fingerprint)
            throw new OnboardingError('ONBOARDING_IDEMPOTENCY_CONFLICT');
          return prior.result as Onboarding;
        }
        if (
          visible.version !== expectedVersion ||
          visible.status !== 'handling'
        )
          throw new OnboardingError('ONBOARDING_SOURCE_INVALID');
        const employee = await d.employees.getById(visible.employeeId, tx);
        if (!employee || employee.status !== 'probation')
          throw new OnboardingError('ONBOARDING_SOURCE_INVALID');
        await d.users.withConnection(tx).disable(visible.userId);
        await d.employees.applyStatusChange(
          {
            employeeId: employee.id,
            status: 'left',
            kind: 'departure',
            active: false,
            effectiveAt: d.calendar.localDate(demoNow()),
            lastWorkingDay: d.calendar.localDate(demoNow()),
            note: command.reason,
          },
          {
            actorId: command.actorId,
            sourceApplication: `oa.onboarding:${id}`,
          },
          tx,
        );
        await d.headcounts.releaseEmployee(
          {
            ...command,
            requestKey: `${command.requestKey}:release`,
            employeeId: employee.id,
          },
          tx,
        );
        const tasks = tx.repository<OnboardingTask>('onboardingTasks'),
          old = await tasks.findMany({ filter: { onboardingId: id } });
        const now = demoNow();
        for (const task of old) {
          if (task.status === 'completed')
            await tasks.createOne({
              values: {
                id: `${task.id}:recovery`,
                onboardingId: id,
                kind: `recovery:${task.kind}`,
                status: 'open',
                assigneeId: null,
                targetUserId: task.targetUserId,
                dutyRoleCode: task.dutyRoleCode,
                dueDate: d.calendar.localDate(now),
                facts: { sourceTaskId: task.id },
                forced: false,
                version: 1,
                createdAt: now,
                updatedAt: now,
              },
            });
          else
            await tasks.updateMany({
              filter: { id: task.id, version: task.version },
              values: {
                status: 'cancelled',
                version: task.version + 1,
                updatedAt: now,
              },
            });
        }
        const changed = await records.withPolicy(cancelPolicy).updateMany({
          filter: { id, version: expectedVersion },
          values: {
            status: 'cancelled',
            version: expectedVersion + 1,
            updatedAt: now,
          },
        });
        if (changed.updatedCount !== 1)
          throw new OnboardingError('ONBOARDING_SOURCE_INVALID');
        await d.audit.record(
          {
            actorId: command.actorId,
            action: 'onboarding.cancel',
            targetType: 'onboardings',
            targetId: id,
            after: {
              employeeId: employee.id,
              status: 'cancelled',
              recoveryTasks: old.filter((task) => task.status === 'completed')
                .length,
            },
            reason: command.reason,
          },
          tx,
        );
        const stored = await records.findOne({ filter: { id } });
        const result = stored
          ? (Object.fromEntries(
              ONBOARDING_FIELDS.map((field) => [field, stored[field]]),
            ) as Onboarding)
          : null;
        if (!result) throw new OnboardingError('ONBOARDING_SOURCE_INVALID');
        await commands.createOne({
          values: { id: key, fingerprint, result, createdAt: now },
        });
        return result;
      });
    },
    async act(
      input,
      command,
      connection,
      viewPolicy,
      taskPolicy,
      assetPolicy,
      ordinaryTaskPolicy = taskPolicy,
    ) {
      const run = (
        work: (tx: DatabaseConnection) => Promise<OnboardingTask>,
      ) =>
        ['transfer', 'reassignMentor'].includes(input.action)
          ? connection.transaction(work)
          : d.headcounts.within(connection, work);
      return run(async (tx) => {
        let reassignmentTarget: string | null | undefined = null;
        if (input.action === 'reassignMentor') {
          const source = await tx
            .repository<Onboarding>('onboardings')
            .withPolicy(viewPolicy)
            .findOne({ filter: { id: input.id } });
          if (!source?.departmentId)
            throw new OnboardingError('ONBOARDING_FORBIDDEN');
          reassignmentTarget = await d.organization.headOf(
            source.departmentId,
            tx,
          );
          if (!reassignmentTarget)
            throw new OnboardingError('ONBOARDING_SOURCE_INVALID');
        }
        if (['transfer', 'reassignMentor'].includes(input.action)) {
          for (const id of [
            ...new Set([
              command.actorId,
              ...(reassignmentTarget ? [reassignmentTarget] : []),
              ...(input.action === 'transfer' && input.targetUserId
                ? [input.targetUserId]
                : []),
            ]),
          ].sort())
            await lockUserForAdministration(tx, id);
        }
        await requireActor(command.actorId, tx);
        if (
          !command.actorId ||
          !command.requestKey ||
          !command.reason.trim() ||
          !taskPolicy.update
        )
          throw new OnboardingError('ONBOARDING_FORBIDDEN');
        if (
          (input.targetUserId && input.action !== 'transfer') ||
          (input.attachmentIds?.length && input.action !== 'complete') ||
          (['transfer', 'reassignMentor'].includes(input.action) &&
            (input.facts || input.assetUnits?.length))
        )
          throw new OnboardingError('ONBOARDING_SOURCE_INVALID');
        const records = tx.repository<Onboarding>('onboardings');
        const parent = await records
          .withPolicy(viewPolicy)
          .findOne({ filter: { id: input.id } });
        if (
          !parent ||
          !parent.status ||
          !['handling', 'cancelled', 'completed'].includes(parent.status) ||
          !parent.employeeId ||
          !parent.userId ||
          !parent.hireDate ||
          !parent.departmentId
        )
          throw new OnboardingError('ONBOARDING_FORBIDDEN');
        const tasks = tx.repository<OnboardingTask>('onboardingTasks');
        const task = await tasks
          .withPolicy(taskPolicy)
          .findOne({ filter: { id: input.taskId, onboardingId: input.id } });
        if (!task || !task.kind || !task.status || !task.version)
          throw new OnboardingError('ONBOARDING_FORBIDDEN');
        const ordinaryTask = await tasks
          .withPolicy(ordinaryTaskPolicy)
          .findOne({ filter: { id: task.id, onboardingId: input.id } });
        if (
          !ordinaryTask ||
          ONBOARDING_TASK_FIELDS.some((field) => !(field in ordinaryTask))
        )
          throw new OnboardingError('ONBOARDING_FORBIDDEN');
        if (parent.status === 'cancelled' && !task.kind.startsWith('recovery:'))
          throw new OnboardingError('ONBOARDING_FORBIDDEN');
        if (ONBOARDING_TASK_FIELDS.some((field) => !(field in task)))
          throw new OnboardingError('ONBOARDING_FORBIDDEN');
        const stillEligible =
          task.targetUserId === command.actorId ||
          (task.dutyRoleCode
            ? await d.organization.hasDutyRole(
                command.actorId,
                task.dutyRoleCode,
                tx,
              )
            : false);
        if (
          ['forceComplete', 'reassignMentor'].includes(input.action)
            ? !(await d.organization.hasDutyRole(command.actorId, 'hr', tx))
            : !stillEligible
        )
          throw new OnboardingError('ONBOARDING_FORBIDDEN');
        if (input.assetUnits?.length) {
          if (input.action !== 'complete')
            throw new OnboardingError('ONBOARDING_FORBIDDEN');
          if (!d.assets || !assetPolicy)
            throw new OnboardingError('ONBOARDING_FORBIDDEN');
          try {
            await d.assets.assertAccess(
              { ...command, taskId: input.taskId, units: input.assetUnits },
              tx,
              assetPolicy,
            );
          } catch (error) {
            if (error instanceof AssetError)
              throw new OnboardingError('ONBOARDING_FORBIDDEN');
            throw error;
          }
        }
        if (reassignmentTarget) {
          await requireActor(reassignmentTarget, tx);
          if (
            reassignmentTarget !==
            (await d.organization.headOf(parent.departmentId, tx))
          )
            throw new OnboardingError('ONBOARDING_FORBIDDEN');
        }
        const key = digest([command.actorId, command.requestKey]),
          fingerprint = digest(['act', input, command.reason]);
        const commands = tx.repository('onboardingCommands'),
          prior = await commands.findOne({ filter: { id: key } });
        if (prior) {
          if (prior.fingerprint !== fingerprint)
            throw new OnboardingError('ONBOARDING_IDEMPOTENCY_CONFLICT');
          return prior.result as OnboardingTask;
        }
        if (parent.status === 'completed')
          throw new OnboardingError('ONBOARDING_FORBIDDEN');
        if (task.version !== input.expectedVersion)
          throw new OnboardingError('ONBOARDING_SOURCE_INVALID');
        const candidate =
          task.targetUserId === command.actorId ||
          (task.dutyRoleCode
            ? await d.organization.hasDutyRole(
                command.actorId,
                task.dutyRoleCode,
                tx,
              )
            : false);
        let values: Partial<OnboardingTask>;
        if (input.action === 'claim') {
          if (!candidate || task.status !== 'open')
            throw new OnboardingError('ONBOARDING_FORBIDDEN');
          values = { status: 'claimed', assigneeId: command.actorId };
        } else if (input.action === 'transfer') {
          if (
            !candidate ||
            task.status !== 'claimed' ||
            task.assigneeId !== command.actorId ||
            !task.dutyRoleCode ||
            !input.targetUserId ||
            input.targetUserId === command.actorId
          )
            throw new OnboardingError('ONBOARDING_FORBIDDEN');
          await requireActor(input.targetUserId, tx);
          if (
            !(await d.organization.hasDutyRole(
              input.targetUserId,
              task.dutyRoleCode,
              tx,
            ))
          )
            throw new OnboardingError('ONBOARDING_FORBIDDEN');
          values = { status: 'claimed', assigneeId: input.targetUserId };
        } else if (input.action === 'reassignMentor') {
          if (
            task.kind !== 'mentor' ||
            task.dutyRoleCode ||
            !['open', 'claimed'].includes(task.status) ||
            !reassignmentTarget ||
            task.targetUserId === reassignmentTarget ||
            reassignmentTarget !==
              (await d.organization.headOf(parent.departmentId, tx))
          )
            throw new OnboardingError('ONBOARDING_FORBIDDEN');
          await requireActor(reassignmentTarget, tx);
          values = {
            targetUserId: reassignmentTarget,
            ...(task.status === 'claimed'
              ? { assigneeId: reassignmentTarget }
              : {}),
          };
        } else if (input.action === 'release') {
          if (
            !candidate ||
            task.status !== 'claimed' ||
            task.assigneeId !== command.actorId
          )
            throw new OnboardingError('ONBOARDING_FORBIDDEN');
          values = { status: 'open', assigneeId: null };
        } else {
          const forced = input.action === 'forceComplete';
          if (forced) {
            if (
              !(await d.organization.hasDutyRole(command.actorId, 'hr', tx)) ||
              task.status === 'completed' ||
              task.status === 'cancelled' ||
              (task.kind === 'it' &&
                d.calendar.localDate(demoNow()) < parent.hireDate)
            )
              throw new OnboardingError('ONBOARDING_FORBIDDEN');
          } else if (
            !candidate ||
            task.status !== 'claimed' ||
            task.assigneeId !== command.actorId
          )
            throw new OnboardingError('ONBOARDING_FORBIDDEN');
          const facts = input.facts ?? {};
          const fields: Record<string, string[]> = {
            it: ['accountId', 'deviceReference'],
            administration: ['workstation', 'badgeReference'],
            finance: [
              'bankName',
              'bankAccount',
              'bankAccountName',
              'socialInsuranceReference',
            ],
            mentor: ['mentorEmployeeId', 'plan'],
          };
          const allowed = task.kind.startsWith('recovery:')
            ? ['returnReceipt']
            : fields[task.kind];
          if (
            !allowed ||
            Object.keys(facts).some((field) => !allowed.includes(field)) ||
            (!forced && allowed.some((field) => !facts[field]?.trim()))
          )
            throw new OnboardingError('ONBOARDING_SOURCE_INVALID');
          if (
            task.kind === 'it' &&
            facts.accountId &&
            facts.accountId !== parent.userId
          )
            throw new OnboardingError('ONBOARDING_SOURCE_INVALID');
          if (task.kind === 'mentor' && facts.mentorEmployeeId) {
            const mentor = await d.employees.getById(
              facts.mentorEmployeeId,
              tx,
            );
            if (
              !mentor?.active ||
              mentor.status === 'left' ||
              mentor.id === parent.employeeId
            )
              throw new OnboardingError('ONBOARDING_SOURCE_INVALID');
          }
          const attachmentIds = input.attachmentIds ?? [];
          if (
            attachmentIds.length &&
            (forced ||
              task.kind === 'finance' ||
              task.kind === 'recovery:finance')
          )
            throw new OnboardingError('ONBOARDING_FORBIDDEN');
          for (const fileId of attachmentIds) {
            const file = await tx.repository('onboardingFiles').findOne({
              filter: {
                id: fileId,
                taskId: task.id,
                ownerId: command.actorId,
                uploadVersion: task.version,
              },
            });
            if (!file) throw new OnboardingError('ONBOARDING_SOURCE_INVALID');
          }
          let safeFacts = facts;
          const recoveryOrigin = [
            'recovery:it',
            'recovery:administration',
          ].includes(task.kind)
            ? task.facts?.sourceTaskId
            : undefined;
          const outstanding = recoveryOrigin
            ? await d.assets?.hasOutstanding(recoveryOrigin, tx)
            : false;
          if (forced && outstanding)
            throw new OnboardingError('ONBOARDING_SOURCE_INVALID');
          if (outstanding && !input.assetUnits?.length)
            throw new OnboardingError('ONBOARDING_SOURCE_INVALID');
          if (input.assetUnits?.length) {
            if (
              forced ||
              !d.assets ||
              !assetPolicy ||
              ![
                'it',
                'administration',
                'recovery:it',
                'recovery:administration',
              ].includes(task.kind)
            )
              throw new OnboardingError('ONBOARDING_FORBIDDEN');
            try {
              const receipt = await d.assets[
                task.kind.startsWith('recovery:') ? 'recover' : 'issue'
              ](
                {
                  ...command,
                  requestKey: digest([command.actorId, command.requestKey]),
                  taskId: input.taskId,
                  units: input.assetUnits,
                },
                tx,
                assetPolicy,
              );
              safeFacts = { ...facts, assetReceiptId: receipt.receiptId };
            } catch (error) {
              if (error instanceof AssetError)
                throw new OnboardingError(
                  error.kind === 'permission'
                    ? 'ONBOARDING_FORBIDDEN'
                    : 'ONBOARDING_SOURCE_INVALID',
                );
              throw error;
            }
          }
          if (task.kind === 'finance' && Object.keys(facts).length) {
            const privateFactsId = `${task.id}:${task.version}`;
            await tx.repository('onboardingPrivateFacts').createOne({
              values: {
                id: privateFactsId,
                onboardingId: input.id,
                facts,
                createdAt: demoNow(),
              },
            });
            safeFacts = { privateFactsId };
          }
          if (attachmentIds.length)
            safeFacts = {
              ...safeFacts,
              attachmentIds: JSON.stringify(attachmentIds),
            };
          values = {
            status: 'completed',
            forced,
            facts: safeFacts,
            assigneeId: task.assigneeId ?? command.actorId,
          };
          if (forced && task.kind === 'it')
            await d.users.withConnection(tx).enable(parent.userId);
        }
        const changed = await tasks.withPolicy(taskPolicy).updateMany({
          filter: {
            id: task.id,
            onboardingId: input.id,
            version: input.expectedVersion,
          },
          values: {
            ...values,
            version: input.expectedVersion + 1,
            updatedAt: demoNow(),
          },
        });
        if (changed.updatedCount !== 1)
          throw new OnboardingError('ONBOARDING_SOURCE_INVALID');
        let parentCompleted = false;
        if (
          parent.status === 'handling' &&
          values.status === 'completed' &&
          (await tasks.count({
            filter: (f) =>
              f.and([
                f.string('onboardingId').eq(input.id),
                f.string('status').ne('completed'),
              ]),
          })) === 0
        ) {
          await d.users.withConnection(tx).enable(parent.userId);
          const updated = await records.updateMany({
            filter: { id: input.id, version: parent.version },
            values: {
              status: 'completed',
              version: Number(parent.version) + 1,
              updatedAt: demoNow(),
            },
          });
          if (updated.updatedCount !== 1)
            throw new OnboardingError('ONBOARDING_SOURCE_INVALID');
          parentCompleted = true;
        }
        await d.audit.record(
          {
            actorId: command.actorId,
            action: `onboarding.task.${input.action}`,
            targetType: 'onboardings',
            targetId: input.id,
            after: {
              taskId: task.id,
              kind: task.kind,
              parentCompleted,
              accountEnabled:
                parentCompleted ||
                (values.forced === true && task.kind === 'it'),
              ...(input.action === 'reassignMentor'
                ? {
                    fromUserId: task.targetUserId,
                    toUserId: reassignmentTarget,
                  }
                : {}),
              ...(typeof (values.facts as Record<string, unknown> | undefined)
                ?.assetReceiptId === 'string'
                ? {
                    assetReceiptId: (values.facts as Record<string, unknown>)
                      .assetReceiptId,
                  }
                : {}),
              ...(task.facts?.sourceTaskId
                ? { sourceTaskId: task.facts.sourceTaskId }
                : {}),
              forced: values.forced ?? false,
              status: values.status,
              ...(input.action === 'transfer'
                ? { fromUserId: command.actorId, toUserId: input.targetUserId }
                : {}),
            },
            reason: command.reason,
          },
          tx,
        );
        const stored = await tasks.findOne({ filter: { id: task.id } });
        const result = stored
          ? (Object.fromEntries(
              ONBOARDING_TASK_FIELDS.map((field) => [field, stored[field]]),
            ) as OnboardingTask)
          : null;
        if (!result) throw new OnboardingError('ONBOARDING_SOURCE_INVALID');
        await commands.createOne({
          values: { id: key, fingerprint, result, createdAt: demoNow() },
        });
        return result;
      });
    },
    async create(
      input,
      command,
      connection,
      policy,
      requisitionPolicy,
      mentorPolicy,
    ) {
      // Existing identities lock before the capacity guard, matching departure/org writers.
      // Callers must enter with a plain transaction, without already holding the capacity guard.
      return connection.transaction(async (outer) => {
        if (
          input.mentorEmployeeId &&
          (!mentorPolicy?.read ||
            (mentorPolicy.read !== true &&
              mentorPolicy.read.fields !== undefined &&
              (mentorPolicy.read.fields === false ||
                !['id', 'name'].every(
                  (field) =>
                    mentorPolicy.read !== true &&
                    mentorPolicy.read &&
                    mentorPolicy.read.fields !== false &&
                    mentorPolicy.read.fields?.includes(field),
                ))))
        )
          throw new OnboardingError('ONBOARDING_FORBIDDEN');
        const visibleMentor =
          input.mentorEmployeeId && mentorPolicy
            ? await outer
                .repository('employees')
                .withPolicy(mentorPolicy)
                .findOne({ filter: { id: input.mentorEmployeeId } })
                .catch((error: unknown) => {
                  if (
                    error instanceof RepositoryError &&
                    [
                      'READ_FORBIDDEN',
                      'FIELD_READ_FORBIDDEN',
                      'SCOPE_VIOLATION',
                      'RECORD_OUTSIDE_SCOPE',
                    ].includes(error.code)
                  )
                    throw new OnboardingError('ONBOARDING_FORBIDDEN');
                  throw error;
                })
            : null;
        if (
          input.mentorEmployeeId &&
          (!visibleMentor?.id || !visibleMentor.name)
        )
          throw new OnboardingError('ONBOARDING_FORBIDDEN');
        const mentor = input.mentorEmployeeId
          ? await d.employees.getById(input.mentorEmployeeId, outer)
          : null;
        if (input.mentorEmployeeId && !mentor)
          throw new OnboardingError('ONBOARDING_SOURCE_INVALID');
        for (const userId of [
          ...new Set([command.actorId, ...(mentor ? [mentor.userId] : [])]),
        ].sort())
          await lockUserForAdministration(outer, userId);
        return d.headcounts.within(outer, async (tx: DatabaseConnection) => {
          await requireActor(command.actorId, tx);
          if (
            !command.actorId ||
            !command.requestKey ||
            !command.reason.trim() ||
            !policy.create ||
            !(await d.organization.hasDutyRole(command.actorId, 'hr', tx))
          )
            throw new OnboardingError('ONBOARDING_FORBIDDEN');
          const key = digest([command.actorId, command.requestKey]),
            fingerprint = digest([input, command.reason]);
          const commands = tx.repository('onboardingCommands');
          const prior = await commands.findOne({ filter: { id: key } });
          if (prior) {
            if (prior.fingerprint !== fingerprint)
              throw new OnboardingError('ONBOARDING_IDEMPOTENCY_CONFLICT');
            const readable = await tx
              .repository<Onboarding>('onboardings')
              .withPolicy(policy)
              .findOne({ filter: { id: (prior.result as Onboarding).id } });
            if (!readable) throw new OnboardingError('ONBOARDING_FORBIDDEN');
            if (
              Object.keys(prior.result as Onboarding).some(
                (field) => !(field in readable),
              )
            )
              throw new OnboardingError('ONBOARDING_FORBIDDEN');
            return prior.result as Onboarding;
          }
          let source = (await d.requisitions.get(
            input.requisitionId,
            tx,
            requisitionPolicy,
          )) as Requisition | null;
          if (
            !source ||
            source.status !== 'recruiting' ||
            source.remaining < 1 ||
            source.version !== input.requisitionVersion
          )
            throw new OnboardingError('ONBOARDING_SOURCE_INVALID');
          const hireYear = Number(input.employee.hireDate.slice(0, 4)),
            companyYear = Number(
              d.calendar.localDate(d.now?.() ?? demoNow()).slice(0, 4),
            );
          if (source.sourceYear !== hireYear) {
            if (!input.targetAccountId || hireYear !== companyYear)
              throw new OnboardingError('ONBOARDING_SOURCE_INVALID');
            source = await d.requisitions.rebind(
              source.id,
              input.targetAccountId,
              companyYear,
              source.version,
              { ...command, requestKey: `${command.requestKey}:rebind` },
              tx,
            );
          } else if (
            input.targetAccountId &&
            input.targetAccountId !== source.accountId
          ) {
            throw new OnboardingError('ONBOARDING_SOURCE_INVALID');
          }
          if (
            input.workstationRequirement != null &&
            (!input.workstationRequirement.trim() ||
              input.workstationRequirement.length > 2000)
          )
            throw new OnboardingError('ONBOARDING_SOURCE_INVALID');
          if (input.mentorEmployeeId) {
            const mentor = await d.employees.getById(
              input.mentorEmployeeId,
              tx,
            );
            if (!mentor?.active || mentor.status === 'left')
              throw new OnboardingError('ONBOARDING_SOURCE_INVALID');
            await requireActor(mentor.userId, tx);
            const currentMentor = await d.employees.getById(
              input.mentorEmployeeId,
              tx,
            );
            if (!currentMentor?.active || currentMentor.status === 'left')
              throw new OnboardingError('ONBOARDING_SOURCE_INVALID');
          }
          const account = await d.users.withConnection(tx).create({
            ...input.account,
            password: randomBytes(32).toString('hex'),
          });
          await d.organization.addMember(
            {
              departmentId: source.departmentId,
              userId: account.id,
              primary: true,
            },
            { actorId: command.actorId, connection: tx },
          );
          await d.users.withConnection(tx).disable(account.id);
          await d.users
            .withConnection(tx)
            .resetPassword(account.id, input.account.password);
          const origin = {
            actorId: command.actorId,
            sourceApplication: `oa.onboarding:${input.id}`,
          };
          const employee = await d.employees.createForOnboarding(
            {
              ...input.employee,
              userId: account.id,
              positionId: source.positionId,
              gradeId: source.gradeId,
            },
            origin,
            tx,
          );
          const compensation = await d.employees.appendCompensation(
            {
              employeeId: employee.id,
              gradeId: source.gradeId,
              baseSalary: input.baseSalary,
              effectiveFrom: employee.hireDate!,
            },
            origin,
            tx,
          );
          await tx.repository('onboardingPrivateFacts').createOne({
            values: {
              id: `${input.id}:salary`,
              onboardingId: input.id,
              facts: {
                compensationId: compensation.id,
                baseSalary: input.baseSalary,
                gradeId: source.gradeId,
                effectiveFrom: input.employee.hireDate,
              },
              createdAt: demoNow(),
            },
          });
          await d.requisitions.consume(
            source.id,
            employee.id,
            source.version,
            { ...command, requestKey: `${command.requestKey}:consume` },
            tx,
          );
          const now = demoNow();
          const record: Onboarding = {
            id: input.id,
            creatorId: command.actorId,
            employeeId: employee.id,
            userId: account.id,
            requisitionId: source.id,
            departmentId: source.departmentId,
            positionId: source.positionId,
            gradeId: source.gradeId,
            hireDate: input.employee.hireDate,
            mentorEmployeeId: input.mentorEmployeeId ?? null,
            mentorName: (visibleMentor?.name as string | null) ?? null,
            workstationRequirement:
              input.workstationRequirement?.trim() ?? null,
            status: 'handling',
            version: 1,
          };
          await tx
            .repository<Onboarding>('onboardings')
            .withPolicy(policy)
            .createOne({
              values: { ...record, createdAt: now, updatedAt: now },
            });
          const head = await d.organization.headOf(source.departmentId, tx);
          if (!head) throw new OnboardingError('ONBOARDING_SOURCE_INVALID');
          const tasks = [
            { kind: 'it', dutyRoleCode: 'it', targetUserId: null, days: -1 },
            {
              kind: 'administration',
              dutyRoleCode: 'admin',
              targetUserId: null,
              days: -1,
            },
            {
              kind: 'finance',
              dutyRoleCode: 'finance',
              targetUserId: null,
              days: 3,
            },
            { kind: 'mentor', dutyRoleCode: null, targetUserId: head, days: 0 },
          ];
          for (const task of tasks)
            await tx.repository('onboardingTasks').createOne({
              values: {
                id: `${input.id}:${task.kind}`,
                onboardingId: input.id,
                kind: task.kind,
                dutyRoleCode: task.dutyRoleCode,
                targetUserId: task.targetUserId,
                status: 'open',
                assigneeId: null,
                facts: null,
                forced: false,
                version: 1,
                dueDate: d.calendar.addWorkdays(
                  input.employee.hireDate,
                  task.days,
                ),
                createdAt: now,
                updatedAt: now,
              },
            });
          await d.audit.record(
            {
              actorId: command.actorId,
              action: 'onboarding.create',
              targetType: 'onboardings',
              targetId: input.id,
              after: { employeeId: employee.id, requisitionId: source.id },
              reason: command.reason,
            },
            tx,
          );
          const readable = await tx
            .repository<Onboarding>('onboardings')
            .withPolicy(policy)
            .findOne({ filter: { id: input.id } });
          if (!readable) throw new OnboardingError('ONBOARDING_FORBIDDEN');
          await commands.createOne({
            values: {
              id: key,
              fingerprint,
              result: record as RepositoryRecord,
              createdAt: now,
            },
          });
          if (Object.keys(record).some((field) => !(field in readable)))
            throw new OnboardingError('ONBOARDING_FORBIDDEN');
          return record;
        });
      });
    },
  };
}
