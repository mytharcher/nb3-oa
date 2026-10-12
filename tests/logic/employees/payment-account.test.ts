// @vitest-environment node
import { describe, expect } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { employeeServiceToken } from '../../../server/providers/employees/contract.ts';
import { createEmployee, createEmployeesAppTest } from './helpers.ts';
const test = createEmployeesAppTest();

describe('private employee payment snapshots', () => {
  test('returns only bank fields and reads the caller transaction without publishing them in the archive', async ({
    testApp,
  }) => {
    const person = await createEmployee(testApp, 'Payment snapshot employee');
    const db = testApp.application.container.resolve(databaseManagerToken),
      service = testApp.application.container.resolve(employeeServiceToken);
    await db
      .repository('employeeProfiles')
      .updateOne({
        filter: { employeeId: person.employeeId },
        values: {
          bankName: 'Test bank',
          bankAccount: '001234567890',
          bankAccountName: 'Snapshot employee',
          idNumber: 'private-id',
          address: 'private-address',
        },
      });
    const snapshot = await service.paymentAccountOf(
      person.userId,
      db.connection(),
    );
    expect(snapshot).toEqual({
      bankName: 'Test bank',
      bankAccount: '001234567890',
      bankAccountName: 'Snapshot employee',
    });
    expect(await service.getByUserId(person.userId)).not.toHaveProperty(
      'bankAccount',
    );
    await expect(
      db.transaction(async (tx) => {
        await tx
          .repository('employeeProfiles')
          .updateOne({
            filter: { employeeId: person.employeeId },
            values: { bankAccount: '00009999' },
          });
        expect(
          (await service.paymentAccountOf(person.userId, tx))?.bankAccount,
        ).toBe('00009999');
        throw new Error('caller rollback');
      }),
    ).rejects.toThrow('caller rollback');
    expect(
      (await service.paymentAccountOf(person.userId, db.connection()))
        ?.bankAccount,
    ).toBe('001234567890');
    expect(
      await service.paymentAccountOf('no-such-employee', db.connection()),
    ).toBeUndefined();
  });
});
