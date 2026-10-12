import { AsyncLocalStorage } from 'node:async_hooks';
import type { AssetStockSource, StockPhase } from '../assets/stock-contract.js';
import { AssetError } from '../assets/errors.js';
import type { AssetRequestRecord } from './contract.js';

/** Only validated lifecycle hooks or the authorized administrative return command open this gate. */
export function createAssetRequestStockSource() {
  const context = new AsyncLocalStorage<{
    sourceId: string;
    actorId: string;
    phase: StockPhase;
    administrativeScrap: boolean;
  }>();
  const source: AssetStockSource = {
    async intent(sourceId, actorId, phase, tx) {
      const authorized = context.getStore();
      if (
        !authorized ||
        authorized.sourceId !== sourceId ||
        authorized.actorId !== actorId ||
        authorized.phase !== phase
      )
        throw new AssetError(
          'ASSET_SOURCE_FORBIDDEN',
          'A validated application transition is required.',
        );
      // Lock the real source before reading its intent, then let stock acquire asset IDs in canonical order.
      // Incrementing by zero acquires the row lock without changing the lifecycle version carried by SDK tasks.
      const locked = await tx.repository('assetRequests').updateMany({
        filter: { id: sourceId },
        values: { lifecycleVersion: { increment: 0 } },
      });
      if (!locked.updatedCount)
        throw new AssetError(
          'ASSET_SOURCE_MISSING',
          'The application no longer exists.',
        );
      const record = await tx
        .repository<AssetRequestRecord>('assetRequests')
        .findOne({ filter: { id: sourceId } });
      if (!record?.employeeId)
        throw new AssetError(
          'ASSET_SOURCE_MISMATCH',
          'The application has no validated employee.',
        );
      if (
        (phase === 'issue' && record.operation === 'scrap') ||
        (phase === 'scrap' && record.operation !== 'scrap')
      )
        throw new AssetError(
          'ASSET_SOURCE_MISMATCH',
          'The stock operation does not match the application.',
        );
      return {
        sourceId,
        employeeId: record.employeeId,
        operation: record.operation,
        quantity: record.quantity,
        category: record.category,
        assetIds: record.assetIds,
        borrowDueDate: record.borrowDueDate,
        administrativeScrap: authorized.administrativeScrap,
      };
    },
  };
  return {
    source,
    /** Call only after the public lifecycle or administrative command has checked the actual actor and record policy. */
    perform<T>(
      authorization: {
        sourceId: string;
        actorId: string;
        phase: StockPhase;
        administrativeScrap?: boolean;
      },
      write: () => Promise<T>,
    ): Promise<T> {
      return context.run(
        {
          ...authorization,
          administrativeScrap: authorization.administrativeScrap === true,
        },
        write,
      );
    },
  };
}
