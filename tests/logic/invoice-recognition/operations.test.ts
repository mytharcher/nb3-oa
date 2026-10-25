// @vitest-environment node
import { expect, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
import { createInvoiceOperations } from '../../../server/providers/invoice-recognition/operations.js';
import {
  invoiceEnvelope,
  type InvoiceResult,
} from '../../../server/providers/invoice-recognition/gateway.js';
import { createEmployeesAppTest, createPerson } from '../employees/helpers.js';
vi.setConfig({ testTimeout: 120000 });
const test = createEmployeesAppTest();
test('persists isolated invoice operations, serializes concurrent sends and recovers uncertain/stale leases', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken).connection(),
    audit = c.resolve(auditServiceToken);
  const user = await createPerson(testApp, 'Invoice operator');
  let now = new Date('2026-10-25T07:00:00Z');
  const store = createInvoiceOperations(db, audit, () => now);
  const envelope = (lineId: string) =>
    invoiceEnvelope(
      {
        instanceId: 'fixture',
        actorId: user.userId,
        recordId: 'record',
        lineId,
        fileId: 'file',
        fileHash: 'a'.repeat(64),
      },
      'verify',
      { number: 'INV-TEST', date: '2026-10-25', amountCents: 100 },
    );
  const other = await createPerson(testApp, 'Invoice current reviewer');
  const audited = vi.spyOn(audit, 'record');
  const auditedEnvelope = envelope('audited-actor');
  await store.run(
    auditedEnvelope,
    'destination',
    async () => ({ state: 'unknown', code: 'transport' }),
    'submit',
    other.userId,
  );
  expect(audited.mock.calls.at(-1)?.[0].actorId).toBe(other.userId);
  expect((await store.read(auditedEnvelope.operationKey))?.ownerId).toBe(
    user.userId,
  );
  audited.mockRestore();
  const first = envelope('one');
  const receipt = (value = first): InvoiceResult => ({
    operationKey: value.operationKey,
    contentHash: value.contentHash,
    state: 'valid',
    reference: 'R-1',
    checkedAt: now.toISOString(),
  });
  let start!: () => void, finish!: (result: InvoiceResult) => void;
  const started = new Promise<void>((resolve) => {
    start = resolve;
  });
  const network = vi.fn(() => {
    start();
    return new Promise<InvoiceResult>((resolve) => {
      finish = resolve;
    });
  });
  const pending = store.run(first, 'destination', network, 'submit');
  await started;
  expect((await store.run(first, 'destination', network, 'submit')).state).toBe(
    'running',
  );
  expect(network).toHaveBeenCalledTimes(1);
  finish(receipt());
  expect((await pending).state).toBe('valid');
  expect((await store.run(first, 'destination', network, 'submit')).state).toBe(
    'valid',
  );
  expect(network).toHaveBeenCalledTimes(1);
  await expect(store.run(first, 'changed', network, 'submit')).rejects.toThrow(
    'destination',
  );
  const uncertain = envelope('uncertain');
  expect(
    (
      await store.run(
        uncertain,
        'destination',
        async () => {
          throw new Error('secret upstream');
        },
        'submit',
      )
    ).state,
  ).toBe('unknown');
  const restarted = createInvoiceOperations(db, audit, () => now);
  expect(
    (
      await restarted.run(
        uncertain,
        'destination',
        async () => receipt(uncertain),
        'lookup',
      )
    ).state,
  ).toBe('valid');
  const stale = envelope('stale');
  let oldFinish!: (result: InvoiceResult) => void, oldStart!: () => void;
  const oldStarted = new Promise<void>((resolve) => {
    oldStart = resolve;
  });
  const old = store.run(
    stale,
    'destination',
    () => {
      oldStart();
      return new Promise<InvoiceResult>((resolve) => {
        oldFinish = resolve;
      });
    },
    'submit',
  );
  await oldStarted;
  now = new Date(now.getTime() + 61000);
  expect(
    (
      await restarted.run(
        stale,
        'destination',
        async () => receipt(stale),
        'lookup',
      )
    ).state,
  ).toBe('valid');
  oldFinish({ state: 'unknown', code: 'transport' });
  expect((await old).state).toBe('valid');
  const record = (await store.read(stale.operationKey))!;
  expect(record.receivedAt).toBeTruthy();
  expect(JSON.stringify(record)).not.toContain('base64');
  const rollback = envelope('rollback');
  const failAudit = {
    ...audit,
    record: vi.fn().mockRejectedValue(new Error('audit unavailable')),
  };
  const unreachable = vi.fn().mockResolvedValue(receipt(rollback));
  await expect(
    createInvoiceOperations(db, failAudit).run(
      rollback,
      'destination',
      unreachable,
      'submit',
    ),
  ).rejects.toThrow('audit unavailable');
  expect(unreachable).not.toHaveBeenCalled();
  expect(await store.read(rollback.operationKey)).toBeUndefined();
});
