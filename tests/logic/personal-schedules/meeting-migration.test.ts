// @vitest-environment node
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
describeMigration('202610250201_personal_schedule_meetings', {
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
    await expectCollection('personalSchedules').toHaveField('sourceBookingId', {
      nullable: true,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('personalSchedules').not.toHaveField(
      'sourceBookingId',
    );
  },
});
