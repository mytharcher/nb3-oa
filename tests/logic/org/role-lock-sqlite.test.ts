// @vitest-environment node
import { createTestDatabase } from '@nocobase/app-testing/server';
import { expect, it } from 'vitest';
/** Supplement to the PostgreSQL service/concurrency suite, not an alternate primary test database. */
it('supports conditional no-op role updates and transactional rollback on isolated SQLite', async () => {
  const db = await createTestDatabase({
    env: { NOCOBASE_TEST_DB_DIALECT: 'sqlite' },
  });
  try {
    await db.connection.builder.createCollection('dutyRoles', (c) => {
      c.string('code').primary();
      c.boolean('active');
    });
    await db.connection
      .repository('dutyRoles')
      .createOne({ values: { code: 'hr', active: true } });
    await expect(
      db.connection.transaction(async (tx) => {
        const result = await tx.query
          .updateTable('dutyRoles')
          .set({ active: true })
          .where('code', '=', 'hr')
          .where('active', '=', true)
          .execute();
        expect(result.updatedCount).toBe(1);
        expect(
          (await tx.repository('dutyRoles').findOne({ filter: { code: 'hr' } }))
            ?.active,
        ).toBe(true);
        await tx.repository('dutyRoles').updateMany({
          filter: { code: 'hr', active: true },
          values: { active: false },
        });
        expect(
          (
            await tx.query
              .updateTable('dutyRoles')
              .set({ active: true })
              .where('code', '=', 'hr')
              .where('active', '=', true)
              .execute()
          ).updatedCount,
        ).toBe(0);
        throw new Error('rollback fixture');
      }),
    ).rejects.toThrow('rollback fixture');
    expect(
      (
        await db.connection
          .repository('dutyRoles')
          .findOne({ filter: { code: 'hr' } })
      )?.active,
    ).toBe(true);
  } finally {
    await db.destroy();
  }
});
