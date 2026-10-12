// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
import { dictionaryServiceToken } from '../../../server/providers/platform/index.js';
import { createAssetService } from '../../../server/providers/assets/service.js';
import type { AssetStockIntent } from '../../../server/providers/assets/stock-contract.js';
import { createPlatformAppTest } from '../platform/helpers.js';
const test = createPlatformAppTest();

test('real persisted source reserves a whole batch, issues exact serials and clears custody only after actual return', async ({
  app,
}) => {
  const db = app.container.resolve(databaseManagerToken),
    audit = app.container.resolve(auditServiceToken),
    dictionaries = app.container.resolve(dictionaryServiceToken);
  const service = createAssetService({
    audit,
    dictionaries,
    source: {
      async intent(sourceId, actorId, _phase, tx) {
        const row = await tx
          .repository<AssetStockIntent & { applicantId: string }>(
            'assetRequests',
          )
          .findOne({ filter: { id: sourceId } });
        if (!row || row.applicantId !== actorId)
          throw new Error('Source access denied');
        // A real application row is locked before the globally ordered stock rows.
        await tx.repository('assetRequests').updateMany({
          filter: { id: sourceId },
          values: { lifecycleVersion: { increment: 0 } },
        });
        return {
          sourceId,
          employeeId: row.employeeId,
          operation: row.operation,
          quantity: row.quantity,
          category: row.category,
          assetIds: row.assetIds,
          borrowDueDate: row.borrowDueDate,
          administrativeScrap: false,
        };
      },
    },
  });
  const actorId = 'stock-actor',
    employeeId = 'stock-employee',
    category = (await dictionaries.list('assetCategory'))[0]!.code;
  const assets = await db.transaction(async (tx) =>
    Promise.all(
      [1, 2].map((n) =>
        service.create(
          {
            code: randomUUID(),
            category,
            name: `Laptop ${n}`,
            serialNumber: `STOCK-${n}`,
            originalValueCents: 10000,
            actorId,
            reason: 'Receipt',
          },
          tx,
        ),
      ),
    ),
  );
  async function request(ids: string[], quantity = ids.length) {
    const id = randomUUID();
    await db.repository('assetRequests').createOne({
      values: {
        id,
        applicantId: actorId,
        createdById: actorId,
        employeeId,
        operation: 'borrow',
        category,
        assetIds: ids,
        quantity,
        purpose: 'Work',
        borrowDueDate: '2027-01-01',
        scrapReason: '',
        photos: [],
        status: 'draft',
        statusChangedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    return {
      sourceId: id,
      actorId,
      reason: 'Actual stock operation',
      requestKey: 'reserve-1',
    };
  }
  const first = await request(assets.map((a) => a.id)),
    second = await request([assets[0]!.id]);
  const held = await db.transaction((tx) => service.reserve(first, tx));
  expect(held.map((a) => a.id).sort()).toEqual(assets.map((a) => a.id).sort());
  expect(await db.transaction((tx) => service.reserve(first, tx))).toEqual(
    held,
  );
  await expect(
    db.transaction((tx) =>
      service.reserve({ ...first, reason: 'Different command' }, tx),
    ),
  ).rejects.toMatchObject({ code: 'ASSET_REQUEST_REUSED' });
  await expect(
    db.transaction((tx) => service.reserve(second, tx)),
  ).rejects.toMatchObject({ code: 'ASSET_ALREADY_RESERVED' });
  await expect(
    service.assertAllReturned(employeeId, db.connection()),
  ).rejects.toThrow();
  const units = assets.map((a) => ({
    assetId: a.id,
    serialNumber: a.serialNumber!,
  }));
  await expect(
    db.transaction((tx) =>
      service.issue(
        { ...first, requestKey: 'issue-1', units: units.slice(0, 1) },
        tx,
      ),
    ),
  ).rejects.toMatchObject({ code: 'ASSET_UNITS_INCOMPLETE' });
  expect(
    (await service.stockFacts(first.sourceId, db.connection())).held,
  ).toHaveLength(2);
  await db.transaction((tx) =>
    service.issue({ ...first, requestKey: 'issue-1', units }, tx),
  );
  expect(
    (await service.stockFacts(first.sourceId, db.connection())).issued,
  ).toHaveLength(2);
  expect(await service.get(assets[0]!.id, db.connection())).toMatchObject({
    status: 'borrowed',
    holderEmployeeId: employeeId,
    borrowDueDate: '2027-01-01',
  });
  const spy = vi
    .spyOn(audit, 'record')
    .mockRejectedValueOnce(new Error('Audit unavailable'));
  try {
    await expect(
      db.transaction((tx) =>
        service.returnIssued({ ...first, requestKey: 'return-1', units }, tx),
      ),
    ).rejects.toThrow('Audit unavailable');
  } finally {
    spy.mockRestore();
  }
  expect(
    (await service.stockFacts(first.sourceId, db.connection())).returned,
  ).toHaveLength(0);
  await expect(
    db.transaction((tx) =>
      service.returnIssued(
        {
          ...first,
          requestKey: 'return-1',
          units: [{ ...units[0]!, serialNumber: 'WRONG' }, units[1]!],
        },
        tx,
      ),
    ),
  ).rejects.toThrow();
  await db.transaction((tx) =>
    service.returnIssued({ ...first, requestKey: 'return-1', units }, tx),
  );
  await db.transaction((tx) =>
    service.returnIssued({ ...first, requestKey: 'return-1', units }, tx),
  );
  expect(
    (await service.stockFacts(first.sourceId, db.connection())).returned,
  ).toHaveLength(2);
  await service.assertAllReturned(employeeId, db.connection());
  expect(await service.get(assets[0]!.id, db.connection())).toMatchObject({
    status: 'available',
    holderEmployeeId: null,
    borrowDueDate: null,
  });
  await db.transaction((tx) => service.reserve(second, tx));
  await db.transaction((tx) =>
    service.release({ ...second, requestKey: 'release-1' }, tx),
  );
  expect(
    (await service.stockFacts(second.sourceId, db.connection())).held,
  ).toHaveLength(0);
  const competitorA = await request([assets[0]!.id]),
    competitorB = await request([assets[0]!.id]);
  const competing = await Promise.allSettled(
    [competitorA, competitorB].map((command) =>
      db.transaction((tx) => service.reserve(command, tx)),
    ),
  );
  expect(competing.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  expect(
    await db
      .repository('assetActiveHolds')
      .count({ filter: { assetId: assets[0]!.id } }),
  ).toBe(1);
  const winner =
    competing[0]!.status === 'fulfilled' ? competitorA : competitorB;
  await db.transaction((tx) =>
    service.release({ ...winner, requestKey: 'release-race' }, tx),
  );
  const disposal = await request([assets[0]!.id]);
  await db.repository('assetRequests').updateMany({
    filter: { id: disposal.sourceId },
    values: { operation: 'scrap' },
  });
  // Use explicit administrative eligibility read from the persisted source, rather than a caller boolean.
  const scrapService = createAssetService({
    audit,
    dictionaries,
    source: {
      async intent(sourceId, actor, _phase, tx) {
        await tx.repository('assetRequests').updateMany({
          filter: { id: sourceId },
          values: { lifecycleVersion: { increment: 0 } },
        });
        const row = await tx
          .repository<AssetStockIntent & { applicantId: string }>(
            'assetRequests',
          )
          .findOne({ filter: { id: sourceId } });
        if (!row || row.applicantId !== actor || row.operation !== 'scrap')
          throw new Error('Source access denied');
        return { ...row, sourceId, administrativeScrap: true };
      },
    },
  });
  await db.transaction((tx) => scrapService.reserve(disposal, tx));
  const baseline = await service.get(assets[0]!.id, db.connection());
  await db.transaction((tx) =>
    service.update(
      assets[0]!.id,
      {
        version: baseline!.version,
        name: 'Inventory revaluation correction',
        actorId,
        reason: 'Inventory correction',
      },
      tx,
    ),
  );
  await expect(
    db.transaction((tx) =>
      scrapService.scrap({ ...disposal, requestKey: 'scrap-1' }, tx),
    ),
  ).rejects.toMatchObject({ code: 'ASSET_BASELINE_CONFLICT' });
  expect(
    (await scrapService.stockFacts(disposal.sourceId, db.connection()))
      .disposed,
  ).toHaveLength(0);
  expect(
    (await scrapService.stockFacts(disposal.sourceId, db.connection())).held,
  ).toHaveLength(1);
  expect(await service.get(assets[0]!.id, db.connection())).toMatchObject({
    status: 'available',
  });
  await db.transaction((tx) =>
    scrapService.release({ ...disposal, requestKey: 'release-conflict' }, tx),
  );
  await db.transaction((tx) =>
    scrapService.reserve({ ...disposal, requestKey: 'reserve-2' }, tx),
  );
  await db.transaction((tx) =>
    scrapService.scrap({ ...disposal, requestKey: 'scrap-2' }, tx),
  );
  expect(
    (await scrapService.stockFacts(disposal.sourceId, db.connection()))
      .disposed,
  ).toHaveLength(1);
  expect(await service.get(assets[0]!.id, db.connection())).toMatchObject({
    status: 'scrapped',
    holderEmployeeId: null,
  });
  const shortage = await request([], 100);
  await expect(
    db.transaction((tx) => service.reserve(shortage, tx)),
  ).rejects.toMatchObject({ code: 'ASSET_STOCK_SHORTAGE' });
  expect(
    await db
      .repository('assetActiveHolds')
      .count({ filter: { sourceId: shortage.sourceId } }),
  ).toBe(0);
});
