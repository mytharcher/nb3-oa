import { createHash } from 'node:crypto';
import type { DatabaseConnection, RepositoryPolicy } from '@nocobase/db';
import type { AuditService } from '../audit/index.js';
import type { Onboarding, OnboardingTask } from '../onboarding/contract.js';
import type {
  Asset,
  OnboardingAssetCommand,
  OnboardingAssetService,
} from './contract.js';
import { createAssetStockService } from './stock.js';
import { AssetError } from './errors.js';

/** Trusted source facade: caller holds the onboarding guard and supplies its current asset action policy. */
export function createOnboardingAssetService(d: {
  audit: AuditService;
  actor: (
    actorId: string,
    role: string,
    tx: DatabaseConnection,
  ) => Promise<boolean>;
}): OnboardingAssetService {
  const sourceId = (taskId: string) =>
    createHash('sha256')
      .update(JSON.stringify(['oa.onboarding', taskId]))
      .digest('hex');
  function denied(): never {
    throw new AssetError(
      'ASSET_ACCESS_DENIED',
      'The actual asset task and current administrative asset policy are required.',
      'permission',
    );
  }
  async function access(
    c: OnboardingAssetCommand,
    tx: DatabaseConnection,
    policy: RepositoryPolicy,
  ) {
    const task = await tx
      .repository<OnboardingTask>('onboardingTasks')
      .findOne({ filter: { id: c.taskId } });
    if (task) {
      const parentLock = await tx.repository('onboardings').updateMany({
        filter: { id: task.onboardingId },
        values: { version: { increment: 0 } },
      });
      if (parentLock.updatedCount !== 1) denied();
      const taskLock = await tx.repository('onboardingTasks').updateMany({
        filter: { id: task.id, version: task.version },
        values: { version: { increment: 0 } },
      });
      if (taskLock.updatedCount !== 1) denied();
    }
    if (
      !task ||
      ![
        'it',
        'administration',
        'recovery:it',
        'recovery:administration',
      ].includes(task.kind) ||
      !(await d.actor(
        c.actorId,
        task.kind.replace('recovery:', '') === 'it' ? 'it' : 'admin',
        tx,
      ))
    )
      denied();
    if (
      !Array.isArray(c.units) ||
      !c.units.length ||
      c.units.length > 100 ||
      c.units.some(
        (u) =>
          !u.code?.trim() ||
          u.code.length > 64 ||
          !u.serialNumber?.trim() ||
          u.serialNumber.length > 200,
      ) ||
      new Set(c.units.map((u) => u.code)).size !== c.units.length
    )
      denied();
    const update = policy.update;
    const required = [
      'status',
      'holderEmployeeId',
      'borrowDueDate',
      'version',
      'updatedAt',
    ];
    if (
      !update ||
      (update !== true &&
        (!Array.isArray(update.fields) ||
          required.some(
            (field) => !(update.fields as readonly string[]).includes(field),
          )))
    )
      denied();
    const units: { assetId: string; serialNumber: string }[] = [];
    for (const unit of c.units) {
      const asset = await tx
        .repository<Asset>('assets')
        .withPolicy(policy)
        .findOne({ filter: { code: unit.code } });
      if (
        !asset ||
        !asset.id ||
        asset.code !== unit.code ||
        asset.serialNumber !== unit.serialNumber
      )
        denied();
      units.push({ assetId: asset.id, serialNumber: unit.serialNumber });
    }
    // Match every inventory owner: acquire actual asset locks in a single global ID order, never input order.
    units.sort((a, b) => a.assetId.localeCompare(b.assetId));
    for (const unit of units) {
      const locked = await tx
        .repository('assets')
        .withPolicy(policy)
        .updateMany({
          filter: { id: unit.assetId },
          values: { version: { increment: 0 } },
        });
      if (locked.updatedCount !== 1) denied();
      const current = await tx
        .repository<Asset>('assets')
        .withPolicy(policy)
        .findOne({ filter: { id: unit.assetId } });
      if (!current || current.serialNumber !== unit.serialNumber) denied();
    }
    return units;
  }
  async function run(
    c: OnboardingAssetCommand,
    tx: DatabaseConnection,
    policy: RepositoryPolicy,
    recovery: boolean,
  ) {
    const units = await access(c, tx, policy);
    const task = await tx
      .repository<OnboardingTask>('onboardingTasks')
      .findOne({ filter: { id: c.taskId } });
    if (
      !task ||
      !(
        recovery
          ? ['recovery:it', 'recovery:administration']
          : ['it', 'administration']
      ).includes(task.kind) ||
      task.status !== 'claimed' ||
      task.assigneeId !== c.actorId
    )
      denied();
    const originalKind = task.kind.replace('recovery:', '');
    if (!(await d.actor(c.actorId, originalKind === 'it' ? 'it' : 'admin', tx)))
      denied();
    const parent = await tx
      .repository<Onboarding>('onboardings')
      .findOne({ filter: { id: task.onboardingId } });
    if (!parent || parent.status !== (recovery ? 'cancelled' : 'handling'))
      denied();
    const originTaskId = recovery ? task.facts?.sourceTaskId : task.id;
    if (!originTaskId) denied();
    if (recovery) {
      const origin = await tx
        .repository<OnboardingTask>('onboardingTasks')
        .findOne({
          filter: {
            id: originTaskId,
            onboardingId: parent.id,
            kind: originalKind,
            status: 'completed',
          },
        });
      if (!origin || origin.facts?.assetReceiptId !== sourceId(originTaskId))
        denied();
    }
    const id = sourceId(originTaskId);
    const stock = createAssetStockService({
      audit: d.audit,
      sourceKind: 'oa.onboarding',
      auditTarget: { type: 'onboardings', id: parent.id },
      source: {
        async intent(requestedId) {
          if (requestedId !== id) denied();
          return {
            sourceId: id,
            employeeId: parent.employeeId,
            operation: 'use',
            quantity: units.length,
            category: null,
            assetIds: units.map((u) => u.assetId),
            borrowDueDate: null,
            administrativeScrap: false,
          };
        },
      },
    });
    const command = {
      sourceId: id,
      actorId: c.actorId,
      reason: c.reason,
      requestKey: c.requestKey,
    };
    if (recovery) await stock.returnIssued({ ...command, units }, tx);
    else {
      await stock.reserve(
        { ...command, requestKey: `${c.requestKey}:reserve` },
        tx,
      );
      await stock.issue(
        { ...command, requestKey: `${c.requestKey}:issue`, units },
        tx,
      );
    }
    return { receiptId: id };
  }
  return {
    async assertAccess(command, tx, policy) {
      await access(command, tx, policy);
    },
    issue: (command, tx, policy) =>
      tx.transaction((inner) => run(command, inner, policy, false)),
    recover: (command, tx, policy) =>
      tx.transaction((inner) => run(command, inner, policy, true)),
    async hasOutstanding(taskId, tx) {
      const issued = await tx
        .repository<{ assetId: string; sourceId: string }>('assetIssueFacts')
        .findMany({
          filter: { sourceId: sourceId(taskId) },
          select: (s) => s.fields('assetId'),
        });
      for (const item of issued)
        if (
          !(await tx.repository('assetReturnFacts').exists({
            filter: { sourceId: sourceId(taskId), assetId: item.assetId },
          }))
        )
          return true;
      return false;
    },
  };
}
