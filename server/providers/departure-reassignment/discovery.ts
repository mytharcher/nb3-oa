import type { DatabaseManager } from '@nocobase/db';
import type { UserTaskService } from '@nocobase/app-plugin-task-center/server';
import { processOwners } from '../process-management/owners.js';
import {
  DepartureReassignmentError,
  type ReassignmentCandidate,
  type ReassignmentOwner,
} from './service.js';

/** Maintenance only. Personal projections cannot certify completeness: suspended
 * tasks are cancelled, inactive recipients can be absent, and sync may lag.
 * Supplement them with every owning business record, without guessing stage names.
 * No approval plugin storage is read here. */
export function createReassignmentDiscovery(
  db: DatabaseManager,
  reader: Pick<UserTaskService, 'list'>,
) {
  return async (from: string, owners: readonly ReassignmentOwner[]) => {
    const candidates = new Map<string, ReassignmentCandidate>();
    const add = (
      lifecycle: string,
      recordId: string,
      taskIds: string[] = [],
    ) => {
      const key = JSON.stringify([lifecycle, recordId]);
      const previous = candidates.get(key);
      candidates.set(key, {
        lifecycle,
        recordId,
        taskIds: [...new Set([...(previous?.taskIds ?? []), ...taskIds])],
      });
    };
    const registered = new Set(owners.map((owner) => owner.lifecycle));
    let after: string | undefined;
    do {
      // All statuses: cancelled includes suspended tasks and former proxies.
      const page = await reader.list(from, {
        sourceType: 'approval.task',
        pagination: 'cursor',
        orderBy: 'createdAt',
        direction: 'asc',
        includeTotal: false,
        pageSize: 100,
        after,
      });
      if (page.data.length) {
        const mappings = await db
          .repository<{
            sourceKey: string;
            subject: string;
            recordId: string;
          }>('oaTaskCenterTargets')
          .findMany({
            filter: (f) =>
              f.and([
                f.string('sourceType').eq('approval.task'),
                f.or(
                  page.data.map((entry) =>
                    f.string('sourceKey').eq(entry.sourceKey),
                  ),
                ),
              ]),
          });
        const byTask = new Map(
          mappings.map((mapping) => [mapping.sourceKey, mapping]),
        );
        for (const entry of page.data) {
          const mapping = byTask.get(entry.sourceKey);
          if (!mapping || mapping.subject !== entry.subject)
            throw new DepartureReassignmentError(
              'REASSIGNMENT_MAPPING_INCOMPLETE',
              'Repair the task-to-business mapping before retrying the handover.',
            );
          if (!registered.has(mapping.subject))
            throw new DepartureReassignmentError(
              'REASSIGNMENT_OWNER_MISSING',
              'A task candidate has no registered business owner.',
            );
          add(mapping.subject, mapping.recordId, [entry.sourceKey]);
        }
      }
      const next = page.meta.nextCursor ?? undefined;
      if (next && next === after)
        throw new DepartureReassignmentError(
          'REASSIGNMENT_CURSOR_INVALID',
          'Task candidate pagination did not advance.',
        );
      after = next;
    } while (after);
    // Always supplement, even when the durable startup backfill says done.
    // That flag is not a barrier for directory/dependency synchronization.
    for (const owner of owners) {
      const business = processOwners.find(
        (entry) => entry.kind === owner.lifecycle,
      );
      if (!business)
        throw new DepartureReassignmentError(
          'REASSIGNMENT_REGISTRY_INVALID',
          'An approval owner has no business record discovery binding.',
        );
      let afterId: string | undefined;
      for (;;) {
        const page = await db
          .repository<{ id: string }>(business.collection)
          .findMany({
            select: (s) => s.fields('id'),
            sort: (s) => s.field('id').asc(),
            cursor: afterId ? { id: afterId } : undefined,
            direction: afterId ? 'forward' : undefined,
            limit: 200,
          });
        for (const record of page) add(owner.lifecycle, record.id);
        if (page.length < 200) break;
        afterId = page.at(-1)!.id;
      }
    }
    return [...candidates.values()];
  };
}
