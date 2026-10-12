// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
import { dictionaryServiceToken } from '../../../server/providers/platform/index.js';
import { createAssetService } from '../../../server/providers/assets/service.js';
import { createPlatformAppTest } from '../platform/helpers.js';
const test = createPlatformAppTest();
test('administrative asset writes validate category and exact amounts, retain custody and roll back with audit', async ({
  app,
}) => {
  const c = app.container;
  const db = c.resolve(databaseManagerToken);
  const audit = c.resolve(auditServiceToken);
  const dictionaries = c.resolve(dictionaryServiceToken);
  const service = createAssetService({ audit, dictionaries });
  const category = (await dictionaries.list('assetCategory'))[0]?.code;
  expect(category).toBeTruthy();
  const input = {
    code: `A-${randomUUID()}`,
    category: category!,
    name: 'Laptop',
    serialNumber: 'S-1',
    originalValueCents: 10001,
    actorId: 'test-administrator',
    reason: 'Recorded receipt',
  };
  const asset = await db.transaction((tx) => service.create(input, tx));
  expect(asset).toMatchObject({
    status: 'available',
    holderEmployeeId: null,
    originalValueCents: 10001,
    version: 1,
  });
  await expect(
    db.transaction((tx) =>
      service.create(
        { ...input, code: randomUUID(), originalValueCents: 1.5 },
        tx,
      ),
    ),
  ).rejects.toMatchObject({ code: 'ASSET_INVALID_INPUT' });
  await expect(
    db.transaction((tx) =>
      service.create({ ...input, code: randomUUID(), category: 'unknown' }, tx),
    ),
  ).rejects.toMatchObject({ code: 'ASSET_CATEGORY_INACTIVE' });
  await expect(
    db.transaction((tx) => service.create(input, tx)),
  ).rejects.toMatchObject({ code: 'ASSET_CODE_EXISTS' });
  await db.transaction(async (tx) => {
    await tx.repository('assets').updateMany({
      filter: { id: asset.id },
      values: { status: 'assigned', holderEmployeeId: 'employee-1' },
    });
    const after = await service.update(
      asset.id,
      {
        actorId: input.actorId,
        reason: 'Inventory name correction',
        version: 1,
        name: 'Updated laptop',
      },
      tx,
    );
    expect(after).toMatchObject({
      status: 'assigned',
      holderEmployeeId: 'employee-1',
      version: 2,
    });
  });
  await expect(
    db.transaction((tx) =>
      service.update(
        asset.id,
        {
          actorId: input.actorId,
          reason: 'Stale correction',
          version: 1,
          name: 'Stale',
        },
        tx,
      ),
    ),
  ).rejects.toMatchObject({ code: 'ASSET_VERSION_CONFLICT' });
  const spy = vi
    .spyOn(audit, 'record')
    .mockRejectedValueOnce(new Error('Audit unavailable'));
  try {
    await expect(
      db.transaction((tx) =>
        service.update(
          asset.id,
          {
            actorId: input.actorId,
            reason: 'Failed correction',
            version: 2,
            name: 'Must roll back',
          },
          tx,
        ),
      ),
    ).rejects.toThrow('Audit unavailable');
  } finally {
    spy.mockRestore();
  }
  expect(await service.get(asset.id, db.connection())).toMatchObject({
    name: 'Updated laptop',
    version: 2,
  });
});

test('policy-projected writes retain full audit facts and reject unauthorized correction fields', async ({
  app,
}) => {
  const { buildRepositoryPolicy } = await import('@nocobase/db');
  const c = app.container,
    db = c.resolve(databaseManagerToken),
    audit = c.resolve(auditServiceToken),
    dictionaries = c.resolve(dictionaryServiceToken);
  const service = createAssetService({ audit, dictionaries });
  const policy = buildRepositoryPolicy((p) =>
    p
      .read((r) => r.scope(true).fields('id', 'name', 'version'))
      .create(true)
      .update((u) => u.scope(true).fields('name', 'version', 'updatedAt')),
  );
  const input = {
    code: `A-${randomUUID()}`,
    category: (await dictionaries.list('assetCategory'))[0]!.code,
    name: 'Projected write',
    serialNumber: null,
    originalValueCents: 76543,
    actorId: 'asset-test-admin',
    reason: 'Receipt',
  };
  const auditSpy = vi.spyOn(audit, 'record');
  const asset = await db.transaction((tx) => service.create(input, tx, policy));
  expect(asset.originalValueCents).toBe(76543);
  expect(await service.read(asset.id, db.connection(), policy)).toEqual({
    id: asset.id,
    name: 'Projected write',
    version: 1,
  });
  expect(auditSpy).toHaveBeenCalledWith(
    expect.objectContaining({
      after: expect.objectContaining({
        originalValueCents: 76543,
        status: 'available',
      }),
    }),
    expect.anything(),
  );
  auditSpy.mockRestore();
  await db.transaction((tx) =>
    service.update(
      asset.id,
      {
        name: 'Allowed label',
        version: 1,
        actorId: input.actorId,
        reason: 'Correction',
      },
      tx,
      policy,
    ),
  );
  await expect(
    db.transaction((tx) =>
      service.update(
        asset.id,
        {
          originalValueCents: 1,
          version: 2,
          actorId: input.actorId,
          reason: 'Unauthorized price',
        },
        tx,
        policy,
      ),
    ),
  ).rejects.toMatchObject({ code: 'FIELD_WRITE_FORBIDDEN' });
  expect(await service.get(asset.id, db.connection())).toMatchObject({
    name: 'Allowed label',
    version: 2,
    originalValueCents: 76543,
  });
  const failedCode = `A-${randomUUID()}`,
    fail = vi
      .spyOn(audit, 'record')
      .mockRejectedValueOnce(new Error('Audit failure'));
  try {
    await expect(
      db.transaction((tx) =>
        service.create({ ...input, code: failedCode }, tx, policy),
      ),
    ).rejects.toThrow('Audit failure');
  } finally {
    fail.mockRestore();
  }
  expect(
    await db.repository('assets').exists({ filter: { code: failedCode } }),
  ).toBe(false);
});
