// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
import { dictionaryServiceToken } from '../../../server/providers/platform/index.js';
import { createAssetService } from '../../../server/providers/assets/service.js';
import { createPlatformAppTest } from '../platform/helpers.js';
const test = createPlatformAppTest();

test('legacy physical return requires authority and exact custody, rolls back with caller and audit, and replays the receipt', async ({
  app,
}) => {
  const db = app.container.resolve(databaseManagerToken);
  const audit = app.container.resolve(auditServiceToken);
  const dictionaries = app.container.resolve(dictionaryServiceToken);
  const service = createAssetService({
    audit,
    dictionaries,
    returnActor: async (id) => id === 'actual-admin',
  });
  const category = (await dictionaries.list('assetCategory'))[0]!.code;
  const asset = await db.transaction((tx) =>
    service.create(
      {
        code: randomUUID(),
        category,
        name: 'Legacy laptop',
        serialNumber: 'LEGACY-1',
        originalValueCents: 10000,
        actorId: 'actual-admin',
        reason: 'Received',
      },
      tx,
    ),
  );
  await db
    .repository('assets')
    .updateMany({
      filter: { id: asset.id },
      values: { status: 'assigned', holderEmployeeId: 'legacy-holder' },
    });
  const policy = { read: true, create: false, update: true, delete: false };
  const command = {
    assetId: asset.id,
    holderEmployeeId: 'legacy-holder',
    serialNumber: 'LEGACY-1',
    version: asset.version,
    actorId: 'actual-admin',
    reason: 'Physically received and checked',
    requestKey: 'receipt-1',
  };
  await expect(
    service.assertAllReturned('legacy-holder', db.connection()),
  ).rejects.toMatchObject({ code: 'ASSET_DEPARTURE_NOT_CLEARED' });
  await expect(
    service.returnHeld(
      { ...command, actorId: 'employee' },
      db.connection(),
      policy,
    ),
  ).rejects.toMatchObject({ code: 'ASSET_RETURN_FORBIDDEN' });
  await expect(
    service.returnHeld(
      { ...command, serialNumber: 'another item' },
      db.connection(),
      policy,
    ),
  ).rejects.toMatchObject({ code: 'ASSET_RETURN_INELIGIBLE' });
  await expect(
    db.transaction(async (tx) => {
      await service.returnHeld(command, tx, policy);
      await service.assertAllReturned('legacy-holder', tx);
      throw new Error('Caller abort');
    }),
  ).rejects.toThrow('Caller abort');
  expect((await service.get(asset.id, db.connection()))?.status).toBe(
    'assigned',
  );
  expect(
    await db
      .repository('assetReturnFacts')
      .count({ filter: { assetId: asset.id } }),
  ).toBe(0);
  const originalAudit = audit.record.bind(audit);
  const mocked = vi
    .spyOn(audit, 'record')
    .mockImplementation(async (entry, tx) => {
      if (entry.action === 'asset.legacyReturn')
        throw new Error('Audit unavailable');
      return originalAudit(entry, tx);
    });
  await expect(
    service.returnHeld(command, db.connection(), policy),
  ).rejects.toThrow('Audit unavailable');
  mocked.mockRestore();
  expect((await service.get(asset.id, db.connection()))?.status).toBe(
    'assigned',
  );
  const receipt = await db.transaction(async (tx) => {
    const value = await service.returnHeld(command, tx, policy);
    await service.assertAllReturned('legacy-holder', tx);
    return value;
  });
  expect(await service.returnHeld(command, db.connection(), policy)).toEqual(
    receipt,
  );
  await expect(
    service.returnHeld(
      { ...command, reason: 'Changed receipt' },
      db.connection(),
      policy,
    ),
  ).rejects.toMatchObject({ code: 'ASSET_REQUEST_REUSED' });
  expect(
    await db
      .repository('assetReturnFacts')
      .count({ filter: { assetId: asset.id } }),
  ).toBe(1);
});
