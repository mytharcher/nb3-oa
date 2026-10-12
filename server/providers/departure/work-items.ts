import { DepartureError } from './errors.js';
import { defineLifecycle } from '@nocobase/lifecycle';
import type { DatabaseConnection } from '@nocobase/db';
import {
  DEPARTURE_WORK_LIFECYCLE,
  type DepartureWorkRecord,
  type DepartureWorkKind,
} from './contract.js';
import type { DepartureDependencies } from './service.js';
import type { DepartureServices } from './approval.js';
interface Types {
  record: DepartureWorkRecord;
  state: 'open' | 'claimed' | 'completed' | 'cancelled';
  services: DepartureServices;
}
const roleOf: Partial<Record<DepartureWorkKind, string>> = {
  it: 'it',
  admin: 'admin',
  finance: 'finance',
};
export function departureWorkLifecycle(d: DepartureDependencies) {
  async function eligible(
    record: DepartureWorkRecord,
    actorId: string,
    connection: DatabaseConnection,
  ) {
    if (
      actorId === record.applicantId ||
      !(await connection
        .repository('departureRequests')
        .exists({ filter: { id: record.departureId, status: 'handover' } }))
    )
      return false;
    if (record.kind === 'work') return record.managerId === actorId;
    return d.org.hasDutyRole(actorId, roleOf[record.kind]!, connection);
  }
  return defineLifecycle<Types>({
    name: DEPARTURE_WORK_LIFECYCLE,
    collection: 'departureWorkItems',
    initial: 'open',
    states: [
      'open',
      'claimed',
      { name: 'completed', final: true },
      { name: 'cancelled', final: true },
    ],
    create: {
      guard: async ({ values, actor, services }) => {
        const parent = await services.connection
          .repository('departureRequests')
          .findOne({
            filter: { id: String(values.departureId), status: 'handover' },
          });
        return (
          !!parent &&
          parent.employeeId === values.employeeId &&
          parent.applicantId === values.applicantId &&
          parent.managerApproverId === values.managerId &&
          parent.handoverUserId === values.receiverId &&
          ((await d.org.hasDutyRole(actor.id, 'hr', services.connection)) ||
            (await d.org.hasDutyRole(actor.id, 'gm', services.connection)))
        );
      },
    },
    transitions: {
      cancel: {
        from: ['open', 'claimed'],
        to: 'cancelled',
        manual: false,
        guard: async ({ record, actor, services }) =>
          services.directory.hasRole(actor.id, 'hr') &&
          (await services.connection.repository('departureRequests').exists({
            filter: { id: record.departureId, status: 'cancelled' },
          })),
      },
      claim: {
        from: 'open',
        to: 'claimed',
        guard: ({ record, actor, services }) =>
          eligible(record, actor.id, services.connection),
        set: ({ actor }) => ({ claimedById: actor.id }),
      },
      confirmChecklist: {
        from: 'claimed',
        to: 'claimed',
        guard: async ({ record, actor, services, input }) =>
          record.claimedById === actor.id &&
          input.confirmed === true &&
          (await eligible(record, actor.id, services.connection)),
        set: () => ({ checklistConfirmed: true }),
      },
      acknowledgeReceipt: {
        from: ['open', 'claimed'],
        to: ['open', 'claimed'],
        route: ({ record }) => record.status as 'open' | 'claimed',
        guard: async ({ record, actor, input, services }) =>
          (await services.connection
            .repository('departureRequests')
            .exists({
              filter: { id: record.departureId, status: 'handover' },
            })) &&
          record.kind === 'work' &&
          record.receiverId === actor.id &&
          actor.id !== record.applicantId &&
          input.received === true,
        set: () => ({ receiverAcknowledged: true }),
      },
      complete: {
        from: 'claimed',
        to: 'completed',
        guard: async ({ record, actor, services }) => {
          if (
            record.claimedById !== actor.id ||
            !(await eligible(record, actor.id, services.connection))
          )
            return false;
          if (!record.checklistConfirmed)
            throw new DepartureError(
              'DEPARTURE_CHECKLIST_REQUIRED',
              'Departure requirements have not been satisfied.',
            );
          if (record.kind === 'work' && !record.receiverAcknowledged)
            throw new DepartureError(
              'DEPARTURE_RECEIPT_REQUIRED',
              'Departure requirements have not been satisfied.',
            );
          if (record.kind === 'admin') {
            await d.custody?.assertCleared(
              record.employeeId,
              services.connection,
            );
            const assets = d.assets?.();
            if (!assets)
              throw new DepartureError(
                'DEPARTURE_ASSET_SERVICE_UNAVAILABLE',
                'Departure requirements have not been satisfied.',
              );
            await assets.assertAllReturned(
              record.employeeId,
              services.connection,
            );
          }
          if (record.kind === 'finance') {
            const ledger = d.loans;
            if (!ledger)
              throw new DepartureError(
                'DEPARTURE_LOAN_LEDGER_UNAVAILABLE',
                'Departure requirements have not been satisfied.',
              );
            const balances = await ledger.listFor(
              record.applicantId,
              services.connection,
            );
            if (
              balances.some(
                (balance) =>
                  balance.outstandingCents !== 0 || balance.heldCents !== 0,
              )
            )
              throw new DepartureError(
                'DEPARTURE_LOAN_UNCLEARED',
                'Departure requirements have not been satisfied.',
              );
            const finances = d.finances?.();
            if (!finances)
              throw new DepartureError(
                'DEPARTURE_REIMBURSEMENT_SERVICE_UNAVAILABLE',
                'Departure requirements have not been satisfied.',
              );
            await finances.assertReimbursementsCleared(
              record.applicantId,
              services.connection,
            );
          }
          return true;
        },
      },
      forceComplete: {
        from: ['open', 'claimed'],
        to: 'completed',
        guard: async ({ record, actor, services, input }) =>
          actor.id !== record.applicantId &&
          (await services.connection
            .repository('departureRequests')
            .exists({
              filter: { id: record.departureId, status: 'handover' },
            })) &&
          (await d.org.hasDutyRole(actor.id, 'hr', services.connection)) &&
          typeof input.reason === 'string' &&
          input.reason.trim().length > 0,
        set: ({ actor, input }) => ({
          forcedById: actor.id,
          forceReason: typeof input.reason === 'string' ? input.reason : null,
        }),
      },
    },
    onEnterState: Object.fromEntries(
      ['open', 'claimed', 'completed'].map((state) => [
        state,
        async ({
          record,
          actor,
          input,
          transition,
          tx,
        }: import('@nocobase/lifecycle').StateHookContext<Types>) =>
          d.audit.record(
            {
              actorId: actor.id,
              action: `departure.work.${transition}`,
              targetType: 'departureWorkItems',
              targetId: record.id,
              after: {
                departureId: record.departureId,
                kind: record.kind,
                status: record.status,
                claimedById: record.claimedById,
                forcedById: record.forcedById,
              },
              reason: typeof input.reason === 'string' ? input.reason : null,
            },
            tx.handle as DatabaseConnection,
          ),
      ]),
    ),
  });
}
