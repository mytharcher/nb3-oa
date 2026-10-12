// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { departureAssetClearanceToken } from '../../../server/providers/departure/contract.js';
import { assetClearanceServiceToken } from '../../../server/providers/assets/contract.js';
import { createPlatformAppTest } from '../platform/helpers.js';
const test = createPlatformAppTest();
test('clearance uses actual held and pending reservation facts in caller transaction', async ({
  app,
}) => {
  const db = app.container.resolve(databaseManagerToken);
  const service = app.container.resolve(departureAssetClearanceToken);
  expect(service).toBe(app.container.resolve(assetClearanceServiceToken));
  const id = randomUUID();
  const employeeId = randomUUID();
  const now = new Date().toISOString();
  await db.transaction(async (tx) => {
    await tx.repository('assets').createOne({
      values: {
        id,
        code: id,
        category: 'computer',
        name: 'Work laptop',
        serialNumber: null,
        originalValueCents: 12345,
        status: 'assigned',
        holderEmployeeId: employeeId,
        borrowDueDate: null,
        version: 0,
        createdAt: now,
        updatedAt: now,
      },
    });
    await expect(
      service.assertAllReturned(employeeId, tx),
    ).rejects.toMatchObject({ code: 'ASSET_DEPARTURE_NOT_CLEARED' });
    expect(
      await service.assertAllReturned('another-employee', tx),
    ).toBeUndefined();
    await tx
      .repository('assets')
      .updateMany({ filter: { id }, values: { status: 'borrowed' } });
    await expect(
      service.assertAllReturned(employeeId, tx),
    ).rejects.toMatchObject({ code: 'ASSET_DEPARTURE_NOT_CLEARED' });
    await tx.repository('assets').updateMany({
      filter: { id },
      values: { status: 'available', holderEmployeeId: null },
    });
    expect(await service.assertAllReturned(employeeId, tx)).toBeUndefined();
    const reservationId = randomUUID();
    await tx.repository('assetReservations').createOne({
      values: {
        id: reservationId,
        assetId: id,
        employeeId,
        sourceId: randomUUID(),
        state: 'pending',
        createdAt: now,
        updatedAt: now,
      },
    });
    await expect(
      service.assertAllReturned(employeeId, tx),
    ).rejects.toMatchObject({ code: 'ASSET_DEPARTURE_NOT_CLEARED' });
    await tx.repository('assetReservations').updateMany({
      filter: { id: reservationId },
      values: { state: 'released' },
    });
    expect(await service.assertAllReturned(employeeId, tx)).toBeUndefined();
  });
});
