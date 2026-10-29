import type { Application } from '@nocobase/app-server/application';
import { databaseManagerToken, type RepositoryPolicy } from '@nocobase/db';
import { OPEN } from '@nocobase/app-plugin-approval/server';
import { processOwners } from '../process-management/owners.js';
import { approvalDirectoryServiceToken } from '../approval-directory/contract.js';

/** Public SDK assignment pages locate a superset. Business readers still enforce
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
  const sdk = await owner.sdk(app);
  const ids = new Set<string>();
  const approvals = sdk.approvals;
  if (!approvals) return [...ids];
  await sdk.read(async () => {
    for (const principal of principals) {
      for (let offset = 0; ; offset += 1000) {
        const tasks = await approvals.tasksOf(principal, OPEN, {
          limit: 1000,
          offset,
        });
        for (const task of tasks)
          if (task.lifecycle === kind) ids.add(task.recordId);
        if (tasks.length < 1000) break;
      }
    }
  });
  return [...ids];
}
