import { currentDemo } from '../demo-data/context.js';
import { contractHttpServiceToken } from '../contracts/service.js';
import { assetRequestServiceToken } from '../asset-requests/index.js';
import { vendorQualificationHttpServiceToken } from '../vendor-qualification/service.js';
import { recruitmentServiceToken } from '../recruitment/service.js';
import { sealRequestServiceToken } from '../seals/index.js';
import { transferServiceToken } from '../transfer/service.js';
import { departureServiceToken } from '../departure/index.js';
import { certificateRequestServiceToken } from '../certificates/index.js';
import type { ProcessOwner } from './owners.js';
import { isOpenRun } from '@nocobase/app-plugin-approval/server';
import { randomUUID } from 'node:crypto';
import type { Application } from '@nocobase/app-server/application';
import { databaseManagerToken, type DatabaseConnection } from '@nocobase/db';
import { processOwners } from './owners.js';
import { withProcessManagement } from './context.js';

// These adapters intentionally do not add management UI capabilities. They are
// available only after the orchestrator proves exact dataset ownership.
function retirement(app: Application, kind: string): ProcessOwner['terminate'] {
  const c = app.container;
  switch (kind) {
    case 'oa.contract':
      return (_a, id, actor, v, key, reason, p) =>
        c
          .resolve(contractHttpServiceToken)
          .transition(id, actor, 'terminate', { reason }, key, v, p, p);
    case 'oa.assetRequest':
      return (_a, id, actor, v, key, reason, p) =>
        c
          .resolve(assetRequestServiceToken)
          .act(
            id,
            actor,
            'terminate',
            { lifecycleVersion: v, requestId: key, comment: reason },
            p,
          );
    case 'oa.vendorQualification':
      return (_a, id, actor, v, key, reason, p) =>
        c
          .resolve(vendorQualificationHttpServiceToken)
          .transition(id, actor, 'terminate', v, key, { reason }, p, p);
    case 'oa.recruitment':
      return (_a, id, actor, v, key, reason, p) =>
        c
          .resolve(recruitmentServiceToken)
          .transition(
            id,
            'terminate',
            v,
            { actorId: actor, requestKey: key, reason },
            p,
          );
    case 'oa.sealRequest':
      return (_a, id, actor, v, key, reason, p) =>
        c
          .resolve(sealRequestServiceToken)
          .change(id, actor, 'terminate', { reason }, key, v, {
            requests: p,
            view: p,
            contract: p,
          });
    case 'oa.transfer':
      return (_a, id, actor, v, key, reason, p) =>
        c
          .resolve(transferServiceToken)
          .transition(
            id,
            'terminate',
            v,
            { actorId: actor, requestKey: key, reason },
            { view: p, write: p, salary: p },
          );
    case 'oa.departure':
      return (_a, id, actor, v, key, reason, p) =>
        c
          .resolve(departureServiceToken)
          .transition(id, 'terminate', actor, v, key, { reason }, p, p);
    case 'oa.certificateRequest':
      return (_a, id, actor, v, key, reason, p) =>
        c
          .resolve(certificateRequestServiceToken)
          .change(id, actor, 'terminate', { reason }, key, v, {
            requests: p,
            view: p,
            issue: p,
            income: p,
          });
  }
}

/** Trusted maintenance API: the caller must prove ownership again inside each
 * business transaction. Termination uses the owner's lifecycle and resource exits. */
export async function retireOwnedProcesses(
  app: Application,
  records: readonly { collection: string; id: string }[],
  actorId: string,
  verify: (
    collection: string,
    id: string,
    connection?: DatabaseConnection,
  ) => Promise<void>,
) {
  const db = app.container.resolve(databaseManagerToken);
  for (const record of records) {
    const owner = processOwners.find((o) => o.collection === record.collection);
    if (!owner) continue;
    const terminate = owner.terminate ?? retirement(app, owner.kind);
    if (!terminate) throw new Error(`DEMO_RETIRE_UNSUPPORTED:${owner.kind}`);
    let operator = [
      'oa.sealRequest',
      'oa.certificateRequest',
      'oa.transfer',
    ].includes(owner.kind)
      ? (currentDemo()?.identities?.admin ?? actorId)
      : actorId;
    await verify(record.collection, record.id);
    const row = await db
      .repository(record.collection)
      .findOne({ filter: { id: record.id } });
    if (!row) continue;
    if (owner.kind === 'oa.outing') {
      if (
        typeof row.managerApproverId !== 'string' ||
        !currentDemo()?.users.has(row.managerApproverId)
      )
        throw new Error('DEMO_RETIRE_MANAGER_MISSING');
      operator = row.managerApproverId;
    }
    const sdk = await owner.sdk(app);
    const open = (
      await sdk.read(() => sdk.approvals.runsFor(owner.kind, record.id))
    ).some(isOpenRun);
    if (!open) continue;
    try {
      await withProcessManagement(
        {
          kind: owner.kind,
          actorId: operator,
          verify: (tx) => verify(record.collection, record.id, tx),
        },
        () =>
          terminate(
            app,
            record.id,
            operator,
            Number(row.lifecycleVersion),
            randomUUID(),
            'Remove this dataset’s demonstration workflow',
            { read: true, create: true, update: true, delete: false },
          ),
      );
    } catch (error) {
      throw new Error(
        `DEMO_RETIRE:${owner.kind}:${typeof row.status === 'string' ? row.status : 'unknown'}:${error instanceof Error ? error.message : 'failed'}`,
        { cause: error },
      );
    }
    const remaining = await sdk.read(() =>
      sdk.approvals.runsFor(owner.kind, record.id),
    );
    if (remaining.some(isOpenRun)) throw new Error('DEMO_PROCESS_STILL_ACTIVE');
  }
}
