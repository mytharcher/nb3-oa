import { demoNow } from '../demo-data/context.js';
import { createHash } from 'node:crypto';
import type { DatabaseConnection, RepositoryPolicy } from '@nocobase/db';
import type { AuditService } from '../audit/index.js';
import type { Asset } from './contract.js';
import { AssetError } from './errors.js';
export interface LegacyAssetReturn {
  assetId: string;
  holderEmployeeId: string;
  serialNumber: string;
  version: number;
  actorId: string;
  reason: string;
  requestKey: string;
}
export function createLegacyAssetReturn(d: {
  audit: AuditService;
  returnActor?: (actorId: string, tx: DatabaseConnection) => Promise<boolean>;
}) {
  return async function returnHeld(
    c: LegacyAssetReturn,
    connection: DatabaseConnection,
    policy: RepositoryPolicy,
  ): Promise<{ receiptId: string }> {
    if (
      !c.reason.trim() ||
      c.reason.length > 5000 ||
      !c.actorId ||
      c.actorId.length > 64 ||
      !c.assetId ||
      c.assetId.length > 64 ||
      !c.holderEmployeeId ||
      c.holderEmployeeId.length > 64 ||
      !c.requestKey ||
      c.requestKey.length > 128 ||
      !c.serialNumber.trim() ||
      c.serialNumber.length > 200 ||
      !Number.isSafeInteger(c.version) ||
      c.version < 1
    )
      throw new AssetError(
        'ASSET_INVALID_COMMAND',
        'Confirm the holder, actual serial, current version and return reason.',
      );
    return connection.transaction(async (tx) => {
      if (!(await d.returnActor?.(c.actorId, tx)))
        throw new AssetError(
          'ASSET_RETURN_FORBIDDEN',
          'An active asset administrator is required.',
          'permission',
        );
      if (
        !(await tx
          .repository('assets')
          .withPolicy(policy)
          .exists({ filter: { id: c.assetId } }))
      )
        throw new AssetError(
          'ASSET_ACCESS_DENIED',
          'The asset is outside the return policy.',
          'permission',
        );
      const sourceId = 'oa.assetLegacyReturn',
        requestKey = createHash('sha256')
          .update(JSON.stringify([c.actorId, c.requestKey]))
          .digest('hex'),
        id = createHash('sha256')
          .update(JSON.stringify([sourceId, requestKey]))
          .digest('hex');
      const fingerprint = JSON.stringify({
        assetId: c.assetId,
        holderEmployeeId: c.holderEmployeeId,
        serialNumber: c.serialNumber,
        version: c.version,
        actorId: c.actorId,
        reason: c.reason,
      });
      const journal = tx.repository<{
        id: string;
        fingerprint: string;
        result: { receiptId: string };
      }>('assetStockCommands');
      const previous = await journal.findOne({ filter: { id } });
      if (previous) {
        if (previous.fingerprint !== fingerprint)
          throw new AssetError(
            'ASSET_REQUEST_REUSED',
            'This return key is bound to another physical receipt.',
            'conflict',
          );
        return previous.result;
      }
      const row = await tx
        .repository<Asset>('assets')
        .findOne({ filter: { id: c.assetId } });
      if (
        !row ||
        !['assigned', 'borrowed'].includes(row.status) ||
        row.holderEmployeeId !== c.holderEmployeeId ||
        row.serialNumber !== c.serialNumber
      )
        throw new AssetError(
          'ASSET_RETURN_INELIGIBLE',
          'The asset is not the confirmed legacy item in this employee’s custody.',
          'conflict',
        );
      if (row.version !== c.version || row.version >= Number.MAX_SAFE_INTEGER)
        throw new AssetError(
          'ASSET_VERSION_CONFLICT',
          'The asset changed before return.',
          'conflict',
        );
      // Acquire the single asset lock before checking facts. All issuance/disposal paths use this same row order.
      const locked = await tx
        .repository('assets')
        .withPolicy(policy)
        .updateMany({
          filter: { id: row.id, version: row.version },
          values: { version: row.version + 1 },
        });
      if (!locked.updatedCount)
        throw new AssetError(
          'ASSET_VERSION_CONFLICT',
          'The asset changed before return.',
          'conflict',
        );
      if (
        (await tx
          .repository('assetActiveHolds')
          .exists({ filter: { assetId: row.id } })) ||
        (await tx
          .repository('assetReservations')
          .exists({ filter: { assetId: row.id, state: 'pending' } }))
      )
        throw new AssetError(
          'ASSET_RETURN_FLOW_REQUIRED',
          'Resolve the active application reservation before returning this asset.',
          'conflict',
        );
      const issues = await tx
        .repository<{ sourceId: string; assetId: string }>('assetIssueFacts')
        .findMany({ filter: { assetId: row.id } });
      for (const issue of issues)
        if (
          !(await tx
            .repository('assetReturnFacts')
            .exists({ filter: issue })) &&
          !(await tx.repository('assetDisposalFacts').exists({ filter: issue }))
        )
          throw new AssetError(
            'ASSET_RETURN_FLOW_REQUIRED',
            'Confirm return through the actual issuing application.',
            'conflict',
          );
      await tx
        .repository('assets')
        .withPolicy(policy)
        .updateMany({
          filter: { id: row.id, version: row.version + 1 },
          values: {
            status: 'available',
            holderEmployeeId: null,
            borrowDueDate: null,
            updatedAt: demoNow(),
          },
        });
      const receiptId = createHash('sha256')
        .update(JSON.stringify([sourceId, row.id]))
        .digest('hex');
      await tx.repository('assetReturnFacts').createOne({
        values: {
          id: receiptId,
          sourceId,
          assetId: row.id,
          employeeId: c.holderEmployeeId,
          actorId: c.actorId,
          snapshot: {
            id: row.id,
            code: row.code,
            category: row.category,
            serialNumber: row.serialNumber,
            status: row.status,
            holderEmployeeId: row.holderEmployeeId,
            version: row.version,
            originalValueCents: Number(row.originalValueCents),
          },
          createdAt: demoNow(),
        },
      });
      await tx.repository('assetStockCommands').createOne({
        values: {
          id,
          sourceId,
          requestKey,
          fingerprint,
          result: { receiptId },
          createdAt: demoNow(),
        },
      });
      await d.audit.record(
        {
          actorId: c.actorId,
          action: 'asset.legacyReturn',
          targetType: 'assets',
          targetId: row.id,
          reason: c.reason,
          before: {
            status: row.status,
            holderEmployeeId: row.holderEmployeeId,
            serialNumber: row.serialNumber,
            version: row.version,
          },
          after: { status: 'available', holderEmployeeId: null, receiptId },
        },
        tx,
      );
      return { receiptId };
    });
  };
}
