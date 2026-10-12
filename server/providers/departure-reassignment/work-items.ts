import type { Application } from '@nocobase/app-server/application';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { databaseManagerToken } from '@nocobase/db';
import { workItemServiceToken } from '../work-items/contract.js';
import type { ReassignmentCommand } from './journal.js';
import { authorizedViewPolicy } from './owners.js';
import { taskRequestId, DepartureReassignmentError } from './service.js';

/** Runs before departure's final locked scan, never inside its single-user disable transaction. */
export async function handoverDepartureWorkItems(
  app: Application,
  input: ReassignmentCommand,
  actorId: string,
): Promise<{ remaining: number }> {
  const c = app.container,
    db = c.resolve(databaseManagerToken),
    service = c.resolve(workItemServiceToken),
    authz = c.resolve(authorizationToken);
  const before = await service.departureBlockers(input.from, db.connection());
  for (const blocker of before.items) {
    if (!blocker.reasons.includes('confirmationOwner')) continue;
    // Resolve both current grants for every item/retry; no trusted maintenance bypass.
    const policies = {
      view: await authorizedViewPolicy(
        authz,
        actorId,
        'oa.workItems',
        'workItems',
      ),
      handover: await authorizedViewPolicy(
        authz,
        actorId,
        'oa.workItems',
        'workItems',
        'handoverConfirmation',
      ),
    };
    await db.transaction(async (tx) => {
      const item = await service.get(blocker.id, actorId, tx, policies.view);
      if (!item)
        throw new DepartureReassignmentError(
          'REASSIGNMENT_VIEW_DENIED',
          'The fixed administrator cannot currently view the ordinary work item.',
        );
      if (item.confirmationOwnerUserId !== input.from)
        throw new Error('DEPARTURE_WORK_ITEM_CHANGED');
      await service.handoverConfirmation(
        {
          id: item.id,
          actorId,
          fromUserId: input.from,
          toUserId: input.to,
          expectedVersion: item.version,
          requestId: taskRequestId(input.requestKey, `workItem:${item.id}`),
          reason: input.reason,
        },
        tx,
        policies,
      );
    });
  }
  // Assignee obligations are preserved. The same-transaction final departure scan is authoritative.
  const after = await service.departureBlockers(input.from, db.connection());
  return { remaining: after.remaining };
}
