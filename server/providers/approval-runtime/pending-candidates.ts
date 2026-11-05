import type { Application } from '@nocobase/app-server/application';
import { databaseManagerToken, type RepositoryPolicy } from '@nocobase/db';
import { userTaskServiceToken } from '@nocobase/app-plugin-task-center/server';
import { processOwners } from '../process-management/owners.js';
import { approvalDirectoryServiceToken } from '../approval-directory/contract.js';

/** Personal index entries only locate candidates. Business list/detail readers
 * still enforce record scopes, fields, current ownership and offered actions. */
export async function pendingCandidateRecordIds(
  app: Application,
  kind: string,
  actorId: string,
  policy: RepositoryPolicy,
): Promise<readonly string[] | undefined> {
  if (kind === 'oa.certificateRequest') return undefined;
  const owner = processOwners.find((entry) => entry.kind === kind);
  if (!owner) return undefined;
  const db = app.container.resolve(databaseManagerToken);
  if (policy.read !== true) {
    if (policy.read === false || !Array.isArray(policy.read.fields))
      return undefined;
    const fields = policy.read.fields;
    const collection = await db.collections().get(owner.collection);
    if (
      !collection?.fields ||
      collection.fields.some((field) => !fields.includes(field.name))
    )
      return undefined;
  }
  const directory = await app.container
    .resolve(approvalDirectoryServiceToken)
    .snapshot();
  const principals = new Set([
    actorId,
    ...((await directory.principalsFor?.(
      actorId,
      kind,
      new Date().toISOString(),
    )) ?? []),
  ]);
  const index = app.container.resolve(userTaskServiceToken);
  const ids = new Set<string>();
  for (const principal of principals) {
    let after: string | undefined;
    do {
      const page = await index.list(principal, {
        sourceType: 'approval.task',
        subject: kind,
        status: 'pending',
        pagination: 'cursor',
        pageSize: 100,
        after,
      });
      if (page.data.length) {
        const keys = page.data.map((task) => task.sourceKey);
        // This is the application's projection, never a plugin-internal task table.
        const targets = await db
          .repository<{ sourceKey: string; recordId: string }>(
            'oaTaskCenterTargets',
          )
          .findMany({
            filter: (f) =>
              f.and([
                f.string('sourceType').eq('approval.task'),
                f.or(keys.map((key) => f.string('sourceKey').eq(key))),
              ]),
            select: (s) => s.fields('sourceKey', 'recordId'),
          });
        if (
          new Set(targets.map((target) => target.sourceKey)).size !==
          new Set(keys).size
        )
          return undefined; // An incomplete projection falls back to authoritative business discovery.
        for (const target of targets) ids.add(target.recordId);
      }
      after = page.meta.nextCursor ?? undefined;
    } while (after);
  }
  return [...ids];
}
