// @vitest-environment node
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
import { expect } from 'vitest';

describeMigration('202610100601_create_approval_delegations', {
  sources: [
    {
      packageName: 'approval-directory-test',
      directory: path.resolve(
        import.meta.dirname,
        '../../../database/main/migrations',
      ),
    },
  ],
  up: async ({ connection, expectCollection }) => {
    const collection = await expectCollection('approvalDelegations').toExist();
    expect(collection.primaryKey).toEqual(['id']);
    await expectCollection('approvalDelegations').toHaveIndex(
      ['principalId', 'active'],
      { unique: false },
    );
    await expectCollection('approvalDelegations').toHaveIndex(
      ['sourceApplication'],
      { unique: true },
    );
    const values = {
      principalId: 'a',
      delegateId: 'b',
      scope: 'all',
      from: new Date('2026-10-10T00:00:00Z'),
      to: new Date('2026-10-12T00:00:00Z'),
      source: 'leave',
      sourceApplication: 'LV-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await connection
      .repository('approvalDelegations')
      .createOne({ values: { ...values, id: 'd1' } });
    await expect(
      connection
        .repository('approvalDelegations')
        .createOne({ values: { ...values, id: 'd2' } }),
    ).rejects.toThrow();
  },
  down: async ({ expectCollection }) => {
    await expectCollection('approvalDelegations').not.toExist();
  },
});
