// @vitest-environment node
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
describeMigration('202610120201_create_personal_schedules', {
  sources: [
    {
      packageName: 'oa-main',
      directory: path.resolve(
        import.meta.dirname,
        '../../../database/main/migrations',
      ),
    },
  ],
  up: async ({ expectCollection }) => {
    for (const field of [
      'id',
      'ownerUserId',
      'title',
      'description',
      'startAt',
      'endAt',
      'version',
    ])
      await expectCollection('personalSchedules').toHaveField(field, {
        nullable: false,
      });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('personalSchedules').not.toExist();
  },
});
