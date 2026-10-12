import { AsyncLocalStorage } from 'node:async_hooks';
import { defineLifecycle, type LifecycleRuntime } from '@nocobase/lifecycle';
import { lockUserForAdministration } from '@nocobase/app-plugin-authentication';
import type { DatabaseConnection } from '@nocobase/db';
import {
  DEPARTURE_EXECUTION_LIFECYCLE,
  type DepartureExecutionRecord,
} from './contract.js';
import type { DepartureDependencies } from './service.js';
import type { DepartureServices } from './approval.js';
interface Types {
  record: DepartureExecutionRecord;
  state: 'ready' | 'transferring' | 'blocked' | 'executed' | 'cancelled';
  services: DepartureServices;
}
const SYSTEM = 'system:departure';
export function departureExecution(
  d: DepartureDependencies,
  runtime: LifecycleRuntime,
) {
  const transferred = new AsyncLocalStorage<string>();
  const definition = defineLifecycle<Types>({
    name: DEPARTURE_EXECUTION_LIFECYCLE,
    collection: 'departureExecutions',
    initial: 'ready',
    states: [
      'ready',
      'transferring',
      'blocked',
      { name: 'executed', final: true },
      { name: 'cancelled', final: true },
    ],
    create: {
      guard: async ({ values, services }) => {
        const parent = await services.connection
          .repository('departureRequests')
          .findOne({
            filter: { id: String(values.departureId), status: 'handover' },
          });
        return (
          !!parent &&
          parent.employeeId === values.employeeId &&
          parent.applicantId === values.applicantId &&
          parent.lastWorkingDay === values.lastWorkingDay &&
          parent.managerApproverId === values.managerId
        );
      },
    },
    transitions: {
      cancel: {
        from: ['ready', 'blocked', 'transferring'],
        to: 'cancelled',
        manual: false,
        guard: async ({ record, actor, services }) =>
          services.directory.hasRole(actor.id, 'hr') &&
          (await services.connection.repository('departureRequests').exists({
            filter: { id: record.departureId, status: 'cancelled' },
          })),
      },
      begin: {
        from: ['ready', 'blocked'],
        to: 'transferring',
        manual: false,
        guard: ({ actor, record, now }) =>
          actor.id === SYSTEM &&
          record.lastWorkingDay <= d.calendar.localDate(now),
        set: () => ({ failureCode: null }),
      },
      block: {
        from: 'transferring',
        to: 'blocked',
        manual: false,
        guard: ({ actor }) => actor.id === SYSTEM,
        accept: ['failureCode'],
      },
      execute: {
        from: 'transferring',
        to: 'executed',
        manual: false,
        guard: ({ record, actor }) =>
          actor.id === SYSTEM && transferred.getStore() === record.id,
        onTransition: async ({ record, tx, now }) => {
          const connection = tx.handle as DatabaseConnection;
          if (
            !(await connection.repository('departureRequests').exists({
              filter: (f) =>
                f.and([
                  f.string('id').eq(record.departureId),
                  f.or([
                    f.string('status').eq('handover'),
                    f.string('status').eq('completed'),
                  ]),
                ]),
            }))
          )
            throw new Error('DEPARTURE_CANCELLATION_PENDING');
          await lockUserForAdministration(connection, record.applicantId);
          if (
            !(await connection
              .repository('departureRequests')
              .exists({
                filter: (f) =>
                  f.and([
                    f.string('id').eq(record.departureId),
                    f.or([
                      f.string('status').eq('handover'),
                      f.string('status').eq('completed'),
                    ]),
                  ]),
              }))
          )
            throw new Error('DEPARTURE_CANCELLATION_PENDING');
          const employee = await d.employees.getById(
            record.employeeId,
            connection,
          );
          if (
            !employee ||
            employee.userId !== record.applicantId ||
            employee.status !== 'leaving' ||
            employee.lastWorkingDay !== record.lastWorkingDay
          )
            throw new Error('DEPARTURE_EXECUTION_BASELINE_CHANGED');
          const organization = d.organization;
          if (!organization)
            throw new Error('DEPARTURE_ORGANIZATION_WRITES_UNAVAILABLE');
          // Ordinary work items are a separate lifecycle source. Their owner shares this user lock
          // for assignment writes; an approval-only zero scan cannot prove these records are clear.
          await d.ordinaryWork?.assertCleared(record.applicantId, connection);
          await d.custody?.assertCleared(record.employeeId, connection);
          await d.users.withConnection(connection).disable(record.applicantId);
          const origin = { actorId: null, connection };
          for (const membership of await organization.membershipsOf(
            record.applicantId,
            connection,
          ))
            await organization.removeMember(
              membership.departmentId,
              record.applicantId,
              origin,
            );
          for (const role of await organization.dutyRolesOf(
            record.applicantId,
            connection,
          ))
            await organization.removeDutyRoleMember(
              role,
              record.applicantId,
              origin,
            );
          await d.employees.applyStatusChange(
            {
              employeeId: record.employeeId,
              status: 'left',
              kind: 'departure',
              lastWorkingDay: record.lastWorkingDay,
              active: false,
              effectiveAt: d.calendar.localDate(now),
            },
            {
              actorId: null,
              sourceApplication: `oa.departure:${record.departureId}`,
            },
            connection,
          );
          if (d.headcounts)
            await d.headcounts.releaseEmployee(
              {
                employeeId: record.employeeId,
                actorId: SYSTEM,
                requestKey: `departure:${record.departureId}:release`,
                reason: `Actual departure ${record.departureId}`,
              },
              connection,
            );
          await d.audit.record(
            {
              actorId: null,
              action: 'departure.execute',
              targetType: 'departureRequests',
              targetId: record.departureId,
              after: { status: 'left', accountDisabled: true },
            },
            connection,
          );
        },
      },
    },
  });
  async function reconcile(now = new Date()) {
    const rows = await d.db
      .repository<DepartureExecutionRecord>('departureExecutions')
      .findMany();
    const result = { executed: 0, blocked: 0 };
    for (const row of rows) {
      if (
        ['executed', 'cancelled'].includes(row.status) ||
        row.lastWorkingDay > d.calendar.localDate(now)
      )
        continue;
      if (
        !(await d.db.repository('departureRequests').exists({
          filter: (f) =>
            f.and([
              f.string('id').eq(row.departureId),
              f.or([
                f.string('status').eq('handover'),
                f.string('status').eq('completed'),
              ]),
            ]),
        }))
      )
        continue;
      if (row.status !== 'transferring')
        await runtime.fire(DEPARTURE_EXECUTION_LIFECYCLE, row.id, 'begin', {
          actor: { id: SYSTEM },
          expect: { version: row.lifecycleVersion },
          requestId: `${row.id}:begin:${row.lifecycleVersion}`,
        });
      try {
        const adapter = d.reassignment?.();
        if (!adapter) throw new Error('DEPARTURE_REASSIGNMENT_UNAVAILABLE');
        const manager = row.managerId
          ? await d.employees.getByUserId(row.managerId)
          : undefined;
        if (
          !manager?.active ||
          !['probation', 'regular'].includes(manager.status)
        )
          throw new Error('DEPARTURE_REASSIGNMENT_MANAGER_UNAVAILABLE');
        const report = await adapter.reassign({
          from: row.applicantId,
          to: manager.userId,
          reason: `Departure ${row.departureId}`,
          requestKey: `departure:${row.departureId}:reassign`,
        });
        if (!Number.isSafeInteger(report.remaining) || report.remaining !== 0)
          throw new Error('DEPARTURE_REASSIGNMENT_INCOMPLETE');
        await transferred.run(row.id, () =>
          runtime.fire(DEPARTURE_EXECUTION_LIFECYCLE, row.id, 'execute', {
            actor: { id: SYSTEM },
            requestId: `${row.id}:execute`,
          }),
        );
        result.executed++;
      } catch (error) {
        const code =
          error instanceof Error && /^DEPARTURE_[A-Z_]+$/.test(error.message)
            ? error.message
            : 'DEPARTURE_EXECUTION_FAILED';
        await runtime.fire(DEPARTURE_EXECUTION_LIFECYCLE, row.id, 'block', {
          actor: { id: SYSTEM },
          requestId: `${row.id}:block:${row.lifecycleVersion}`,
          input: { failureCode: code },
        });
        await d.notifications?.alarm({
          kind: 'oa.departure',
          reason: code,
          recordId: row.departureId,
          recipients: d.administrators ?? [],
          eventId: `departure:${row.id}:blocked:${row.lifecycleVersion}`,
        });
        result.blocked++;
      }
    }
    return result;
  }
  return { definition, reconcile };
}
