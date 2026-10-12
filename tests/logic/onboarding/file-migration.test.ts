// @vitest-environment node
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
describeMigration('202610104604_create_onboarding_files', {
  sources: [
    {
      packageName: 'nb3-oa',
      directory: path.resolve(
        import.meta.dirname,
        '../../../database/main/migrations',
      ),
    },
  ],
  up: async ({ expectCollection }) => {
    for (const field of [
      'id',
      'disk',
      'key',
      'filename',
      'ext',
      'mimeType',
      'size',
      'createdAt',
      'updatedAt',
      'onboardingId',
      'taskId',
      'ownerId',
      'uploadVersion',
    ])
      await expectCollection('onboardingFiles').toHaveField(field, {
        nullable: false,
      });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('onboardingFiles').not.toExist();
  },
});
