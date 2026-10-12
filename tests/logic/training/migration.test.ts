// @vitest-environment node
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
describeMigration('202610102201_create_training_requests', {
  sources: [
    {
      packageName: 'training-migration',
      directory: path.resolve(
        import.meta.dirname,
        '../../../database/main/migrations',
      ),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('trainingRequests').toHaveField('usesWorkingTime', {
      nullable: false,
    });
    await expectCollection('trainingRequests').toHaveField('amountCents', {
      nullable: false,
    });
    await expectCollection('trainingRequests').toHaveField(
      'attendanceRecorded',
      { nullable: false },
    );
    await expectCollection('trainingRequests').toHaveField('hrRecipients', {
      nullable: false,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('trainingRequests').not.toExist();
  },
});
