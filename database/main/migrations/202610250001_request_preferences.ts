import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202610250001_request_preferences',
  async up({ builder }) {
    await builder.createCollection('requestPreferences', (collection) => {
      collection.string('userId', { length: 255, nullable: false });
      collection.primary('userId');
      collection.json('favorites', { nullable: true });
      collection.json('recent', { nullable: false });
      collection.datetimeTz('updatedAt', { nullable: false });
    });
  },
  async down({ builder }) {
    await builder.dropCollection('requestPreferences');
  },
});
