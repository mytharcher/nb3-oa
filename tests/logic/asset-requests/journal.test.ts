// @vitest-environment node
import { expect, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
import { createAssetRequestJournal } from '../../../server/providers/asset-requests/journal.js';
import { createAssetRequestStockSource } from '../../../server/providers/asset-requests/stock-source.js';
import { createPlatformAppTest } from '../platform/helpers.js';
const test = createPlatformAppTest();
test('durable command binds generated record and payload before SDK execution, including concurrent retries', async ({
  app,
}) => {
  const db = app.container.resolve(databaseManagerToken),
    audit = app.container.resolve(auditServiceToken),
    journal = createAssetRequestJournal(db, audit);
  const command = {
    actorId: 'asset-journal-user',
    requestId: 'create-stable',
    operation: 'create',
    payload: { quantity: 2, purpose: 'Work', assetIds: ['a', 'b'] },
  };
  const results = await Promise.all([
    journal.reserve(command),
    journal.reserve(command),
  ]);
  expect(results[0]).toEqual(results[1]);
  expect(
    await db
      .repository('assetRequestCommands')
      .count({ filter: { actorId: command.actorId } }),
  ).toBe(1);
  await expect(
    journal.reserve({
      ...command,
      payload: { ...command.payload, quantity: 3 },
    }),
  ).rejects.toMatchObject({ code: 'ASSET_REQUEST_REUSED' });
  await expect(
    journal.reserve({ ...command, recordId: 'other-record' }),
  ).rejects.toMatchObject({ code: 'ASSET_REQUEST_REUSED' });
  expect(
    await journal.reserve({ ...command, recordId: results[0]!.recordId }),
  ).toEqual(results[0]);
  const failed = { ...command, requestId: 'failed-audit' },
    spy = vi
      .spyOn(audit, 'record')
      .mockRejectedValueOnce(new Error('Audit unavailable'));
  try {
    await expect(journal.reserve(failed)).rejects.toThrow('Audit unavailable');
  } finally {
    spy.mockRestore();
  }
  expect(
    await db
      .repository('assetRequestCommands')
      .exists({ filter: { requestKey: failed.requestId } }),
  ).toBe(false);
  // Resolving public inventory does not authorize an arbitrary caller to manufacture a source intent.
  await expect(
    createAssetRequestStockSource().source.intent(
      'unknown',
      command.actorId,
      'reserve',
      db.connection(),
    ),
  ).rejects.toMatchObject({ code: 'ASSET_SOURCE_FORBIDDEN' });
});
