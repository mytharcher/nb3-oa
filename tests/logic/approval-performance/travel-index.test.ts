// @vitest-environment node
import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';

describeMigration('202610220004_travel_overlap_index', {
  sources: [
    {
      packageName: 'approval-performance',
      directory: path.resolve(
        import.meta.dirname,
        '../../../database/main/migrations',
      ),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('travelRequests').toHaveIndex([
      'status',
      'startAt',
      'endAt',
    ]);
  },
  down: async ({ expectCollection }) => {
    await expectCollection('travelRequests').toHaveField('startAt', {
      type: 'datetimeTz',
    });
    await expectCollection('travelRequests').toHaveField('endAt', {
      type: 'datetimeTz',
    });
  },
});
