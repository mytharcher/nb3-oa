import { AsyncLocalStorage } from 'node:async_hooks';
import type { DatabaseConnection } from '@nocobase/db';
import type {
  ApprovalDirectoryService,
  OaApprovalDirectory,
} from '../approval-directory/contract.js';

interface ManagementContext {
  kind: string;
  actorId: string;
  /** Rechecks the exact management action and target row, including inside the owner transaction. */
  verify(connection?: DatabaseConnection): Promise<void>;
}
const context = new AsyncLocalStorage<
  ManagementContext & { active: boolean }
>();
export function withProcessManagement<T>(
  value: ManagementContext,
  work: () => Promise<T>,
): Promise<T> {
  const operation = { ...value, active: true };
  return context.run(operation, async () => {
    try {
      return await work();
    } finally {
      operation.active = false;
    }
  });
}

/** Owner opt-in: never change the global approval.admin roster. The proxy consults the
 * live async context, so a directory retained by an owner cannot retain elevated access. */
export async function processDirectorySnapshot(
  directory: ApprovalDirectoryService,
  kind: string,
  connection?: DatabaseConnection,
): Promise<OaApprovalDirectory> {
  const active = context.getStore();
  if (active?.active && active.kind === kind) await active.verify(connection);
  const snapshot = await directory.snapshot(connection);
  return new Proxy(snapshot, {
    get(target, key) {
      if (key === 'hasRole')
        return (person: string, role: string) => {
          const current = context.getStore();
          return (
            (role === 'approval.admin' &&
              current?.active &&
              current.kind === kind &&
              current.actorId === person) ||
            target.hasRole(person, role)
          );
        };
      // roleMembers deliberately stays unchanged: scoped managers are not global notification recipients.
      return Reflect.get(target, key) as unknown;
    },
  });
}
