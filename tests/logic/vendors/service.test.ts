// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { describe, expect, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { auditServiceToken } from '../../../server/providers/audit/index.ts';
import { createVendorService } from '../../../server/providers/vendors/service.ts';
import { createPlatformAppTest } from '../platform/helpers.ts';
const test = createPlatformAppTest();
const input = () => ({
  code: `V-${randomUUID()}`,
  name: 'Vendor with bank',
  category: 'Services',
  contactName: 'Sales',
  contactPhone: '+86 10 123456',
  contactEmail: 'sales@example.test',
  bankName: 'Bank',
  bankAccount: '0000123400',
  bankAccountName: 'Vendor Ltd',
  actorId: 'root',
  reason: 'Procurement setup',
});
describe('vendor foundation immutable snapshots and audited maintenance', () => {
  test('keeps textual bank account, supplies safe options and denies inactive purchase/payment references', async ({
    app,
  }) => {
    const db = app.container.resolve(databaseManagerToken),
      audit = app.container.resolve(auditServiceToken),
      service = createVendorService({ db, audit });
    const row = await db.transaction((tx) => service.create(input(), tx));
    expect(row).toMatchObject({
      bankAccount: '0000123400',
      status: 'manual',
      version: 1,
    });
    const snapshot = await db.transaction((tx) =>
      service.snapshotForPurchase(row.id, tx),
    );
    expect(snapshot).not.toHaveProperty('bankAccount');
    const options = await service.options();
    expect(options.find((r) => r.id === row.id)).not.toHaveProperty(
      'bankAccount',
    );
    expect(options.find((r) => r.id === row.id)).not.toHaveProperty(
      'contactEmail',
    );
    const changed = await db.transaction((tx) =>
      service.update(
        row.id,
        {
          version: 1,
          actorId: 'root',
          reason: 'Rename',
          name: 'Changed vendor',
        },
        tx,
      ),
    );
    expect(changed.version).toBe(2);
    expect(snapshot.name).toBe('Vendor with bank');
    await expect(
      db.transaction((tx) =>
        service.update(
          row.id,
          { version: 1, actorId: 'root', reason: 'Stale', name: 'Wrong' },
          tx,
        ),
      ),
    ).rejects.toMatchObject({ code: 'VENDOR_VERSION_CONFLICT' });
    await db.transaction((tx) =>
      service.update(
        row.id,
        { version: 2, actorId: 'root', reason: 'Inactive', active: false },
        tx,
      ),
    );
    await expect(
      db.transaction((tx) => service.snapshotForPurchase(row.id, tx)),
    ).rejects.toMatchObject({ code: 'VENDOR_INACTIVE' });
    await expect(
      db.transaction((tx) => service.paymentAccountOf(row.id, tx)),
    ).rejects.toMatchObject({ code: 'VENDOR_INACTIVE' });
  });
  test('rejects duplicate codes and malformed contacts and rolls data/version back on audit failure', async ({
    app,
  }) => {
    const db = app.container.resolve(databaseManagerToken),
      audit = app.container.resolve(auditServiceToken),
      service = createVendorService({ db, audit });
    const values = input(),
      row = await db.transaction((tx) => service.create(values, tx));
    await expect(
      db.transaction((tx) => service.create(values, tx)),
    ).rejects.toMatchObject({ code: 'VENDOR_CODE_EXISTS' });
    await expect(
      db.transaction((tx) =>
        service.create({ ...input(), contactEmail: 'broken' }, tx),
      ),
    ).rejects.toMatchObject({ code: 'VENDOR_INVALID_INPUT' });
    const spy = vi
      .spyOn(audit, 'record')
      .mockRejectedValueOnce(new Error('Audit failed'));
    try {
      await expect(
        db.transaction((tx) =>
          service.update(
            row.id,
            {
              version: 1,
              actorId: 'root',
              reason: 'Change bank',
              bankAccount: '9999',
            },
            tx,
          ),
        ),
      ).rejects.toThrow('Audit failed');
    } finally {
      spy.mockRestore();
    }
    expect(await service.get(row.id)).toMatchObject({
      version: 1,
      bankAccount: '0000123400',
    });
  });
});
