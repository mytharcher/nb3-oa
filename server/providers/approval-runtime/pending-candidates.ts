import type { Application } from '@nocobase/app-server/application';
import { databaseManagerToken, type RepositoryPolicy } from '@nocobase/db';
import { userTaskServiceToken } from '@nocobase/app-plugin-task-center/server';
import { personalTaskTargets } from './query-service.js';
import { processOwners } from '../process-management/owners.js';
import { approvalDirectoryServiceToken } from '../approval-directory/contract.js';

/** Public personal task pages locate a superset. Business readers still enforce
 * eligibility, authorization, fields and actions before business-time paging. */
export async function pendingCandidateRecordIds(
  app: Application,
  kind: string,
  actorId: string,
  policy: RepositoryPolicy,
): Promise<readonly string[] | undefined> {
  if (kind === 'oa.certificateRequest') return undefined;
  const owner = processOwners.find((entry) => entry.kind === kind);
  if (!owner) return undefined;
  if (policy.read !== true) {
    if (policy.read === false || !Array.isArray(policy.read.fields))
      return undefined;
    const fields = policy.read.fields;
    const collection = await app.container
      .resolve(databaseManagerToken)
      .collections()
      .get(owner.collection);
    if (
      !collection?.fields ||
      collection.fields.some((field) => !fields.includes(field.name))
    )
      return undefined;
  }
  const db = app.container.resolve(databaseManagerToken);
  // Startup backfills are durable and application-owned. An incomplete backfill
  // cannot prove that an empty personal index means no actionable business work.
  const backfill = await db.repository('oaTaskCenterBackfills').findOne({
    filter: { id: kind },
  });
  if (backfill?.done !== true) return undefined;
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
  const reader = app.container.resolve(userTaskServiceToken);
  const ids = new Set<string>();
  for (const principal of principals) {
    // Read principals as well as the delegate so dependency-sync timing cannot
    // hide an assignment. Current directory and owner offers still decide access.
    const targets = await personalTaskTargets(
      db,
      reader,
      principal,
      kind,
      'approval.task',
      'pending',
    );
    if (!targets) return undefined;
    for (const target of targets) ids.add(target.recordId);
  }
  return [...ids];
}
