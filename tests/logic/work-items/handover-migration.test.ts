// @vitest-environment node
import { copyFile, mkdtemp, rm, symlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createTestDatabase } from '@nocobase/app-testing/server';
import { createMigrator, databaseManagerToken } from '@nocobase/db';
import { ServiceContainer } from '@nocobase/service-provider';
import { expect, it } from 'vitest';
it('forward confirmation owner backfills true/false/draft/terminal while preserving creator, versions and old immutable command snapshots', async () => {
  const testDb = await createTestDatabase(),
    directory = await mkdtemp(path.join(os.tmpdir(), 'work-confirmation-'));
  try {
    await symlink(
      path.resolve(import.meta.dirname, '../../../node_modules'),
      path.join(directory, 'node_modules'),
      'dir',
    );
    await copyFile(
      path.resolve(
        import.meta.dirname,
        '../../../database/main/migrations/202610104501_create_work_items.ts',
      ),
      path.join(directory, '202610104501_create_work_items.ts'),
    );
    const container = new ServiceContainer();
    container.instance(databaseManagerToken, testDb.database);
    const migrator = createMigrator({
      database: testDb.database,
      container,
      sources: [{ packageName: 'work-confirmation-upgrade', directory }],
    });
    await migrator.latest();
    for (const [id, status, requiresConfirmation] of [
      ['draft', 'draft', true],
      ['pending', 'assigned', true],
      ['finished', 'completed', true],
      ['no-confirmation', 'assigned', false],
    ] as const) {
      await testDb.database.repository('workItems').createOne({
        values: {
          id,
          status,
          creatorUserId: 'original',
          targetUserId: 'worker',
          assigneeUserId: status === 'draft' ? null : 'worker',
          dutyRoleCode: null,
          title: 'Preserve task',
          description: 'Original',
          dueAt: new Date('2030-01-03T00:00:00Z'),
          requiresConfirmation,
          attachments: [],
          resultAttachments: [],
          result: status === 'completed' ? 'Actual proof' : null,
          reason: null,
          forced: false,
          completedAt:
            status === 'completed' ? new Date('2030-01-02T00:00:00Z') : null,
          statusChangedAt: new Date('2030-01-01T00:00:00Z'),
          version: 4,
        },
      });
    }
    const before = await testDb.database.repository('workItems').findMany(),
      legacy = {
        id: 'pending',
        creatorUserId: 'original',
        status: 'assigned',
        version: 4,
      };
    await testDb.database.repository('workItemCommands').createOne({
      values: {
        id: 'legacy',
        actorId: 'original',
        payloadHash: 'abc',
        result: legacy,
      },
    });
    const command = await testDb.database
      .repository('workItemCommands')
      .findOne({ filter: { id: 'legacy' } });
    await copyFile(
      path.resolve(
        import.meta.dirname,
        '../../../database/main/migrations/202610104502_add_work_item_confirmation_owner.ts',
      ),
      path.join(directory, '202610104502_add_work_item_confirmation_owner.ts'),
    );
    await migrator.latest();
    await migrator.latest();
    for (const original of before) {
      const row = await testDb.database
        .repository('workItems')
        .findOne({ filter: { id: original.id } });
      expect(row).toMatchObject(original);
      expect(row?.confirmationOwnerUserId).toBe(
        original.requiresConfirmation ? 'original' : null,
      );
    }
    expect(
      await testDb.database
        .repository('workItemCommands')
        .findOne({ filter: { id: 'legacy' } }),
    ).toEqual(command);
    await expect(migrator.rollback()).rejects.toThrow(/irreversible/i);
  } finally {
    await testDb.destroy();
    await rm(directory, { recursive: true, force: true });
  }
});
