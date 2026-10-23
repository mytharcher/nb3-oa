import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202610220004_travel_overlap_index',
  async up({ builder }) {
    await builder.alterCollection('travelRequests', (c) => {
      c.index(['status', 'startAt', 'endAt'], {
        name: 'travel_overlap_interval',
      });
    });
  },
  async down({ builder }) {
    await builder.alterCollection('travelRequests', (c) => {
      c.dropIndex('travel_overlap_interval');
    });
  },
});
