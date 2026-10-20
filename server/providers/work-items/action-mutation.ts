import { demoNow } from '../demo-data/context.js';
import type { RepositoryRecord } from '@nocobase/db';
import type { WorkItem, WorkItemAction } from './contract.js';
/** Read-only capability probe covering every field this owner writes for an action.
 * Payload-dependent target/value restrictions remain enforced by the real transactional command.
 * Never persist these values or treat a successful probe as authorization for a later write.
 */
export function actionMutation(
  item: WorkItem,
  action: WorkItemAction,
  actorId: string,
): RepositoryRecord {
  const values: RepositoryRecord = {
    version: item.version + 1,
    statusChangedAt: demoNow(),
  };
  const pool = !!item.dutyRoleCode;
  values.status =
    action === 'dispatch' || action === 'reassign'
      ? pool
        ? 'open'
        : 'assigned'
      : action === 'claim'
        ? 'claimed'
        : action === 'release'
          ? 'open'
          : action === 'complete'
            ? item.requiresConfirmation
              ? 'awaitingConfirmation'
              : 'completed'
            : action === 'confirm' || action === 'forceComplete'
              ? 'completed'
              : action === 'cancel'
                ? 'cancelled'
                : action === 'block'
                  ? 'blocked'
                  : pool
                    ? 'claimed'
                    : 'assigned';
  if (
    [
      'cancel',
      'forceComplete',
      'return',
      'block',
      'resume',
      'reassign',
    ].includes(action)
  )
    values.reason = item.reason ?? 'Capability check';
  if (action === 'dispatch')
    values.assigneeUserId = pool ? null : item.targetUserId;
  if (action === 'claim') values.assigneeUserId = actorId;
  if (action === 'release') values.assigneeUserId = null;
  if (action === 'complete' || action === 'forceComplete') {
    values.result = item.result ?? 'Capability check';
    values.resultAttachments = [...item.resultAttachments];
    values.completedAt =
      action === 'forceComplete' || !item.requiresConfirmation
        ? demoNow()
        : null;
    if (action === 'forceComplete') values.forced = true;
  }
  if (action === 'confirm') values.completedAt = demoNow();
  if (action === 'return' || action === 'reassign') {
    values.result = null;
    values.resultAttachments = [];
  }
  if (action === 'reassign') {
    values.targetUserId = item.targetUserId;
    values.dutyRoleCode = item.dutyRoleCode;
    values.assigneeUserId = pool ? null : item.targetUserId;
  }
  return values;
}
