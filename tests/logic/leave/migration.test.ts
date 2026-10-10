// @vitest-environment node
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { describeMigration } from '@nocobase/app-testing/server';
import { expect } from 'vitest';
const names = [
  'leaveRequests',
  'leaveAttendance',
  'oaLifecycleTransitions',
  'oaLifecycleEffectRuns',
];
describeMigration('202610100701_create_leave_requests', {
  sources: [
    {
      packageName: 'leave-migration-test',
      directory: path.resolve(
        import.meta.dirname,
        '../../../database/main/migrations',
      ),
    },
  ],
  up: async ({ connection, expectCollection }) => {
    for (const name of names) {
      await expectCollection(name).toExist();
      const physical = await connection.collections.getPhysical(name);
      expect(physical).toBeDefined();
      // Cache is optional on CI. Locally it gives evidence that the installed development schema matches this
      // migration's final source after formatting, without resetting or rolling back the developer's database.
      const artifact = await readFile(
        path.resolve(
          import.meta.dirname,
          `../../../database/main/collections/${name}/schema.json`,
        ),
        'utf8',
      ).catch(() => null);
      if (artifact) {
        const schema = JSON.parse(artifact) as {
          physical: {
            columns: unknown;
            indexes: unknown;
            constraints: unknown;
          };
        };
        expect(physical).toEqual(schema.physical);
      }
    }
    await expectCollection('leaveRequests').toHaveField('lifecycleVersion', {
      nullable: false,
    });
    await expectCollection('oaLifecycleTransitions').toHaveField('requestKey', {
      nullable: false,
    });
    await expectCollection('oaLifecycleEffectRuns').toHaveField(
      'continuationDueAt',
      { nullable: true },
    );
  },
  down: async ({ expectCollection }) => {
    for (const name of names) await expectCollection(name).not.toExist();
  },
});
