import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '202610103402_create_asset_request_photos',
  async up({ builder }) {
    await builder.createCollection('assetRequestPhotos', (c) => {
      c.string('id', { length: 64, nullable: false });
      c.primary('id');
      c.string('disk', { length: 255, nullable: false });
      c.text('key', { nullable: false });
      c.text('filename', { nullable: false });
      c.string('ext', { length: 32, nullable: false });
      c.string('mimeType', { length: 255, nullable: false });
      c.bigInt('size', { nullable: false });
      c.datetimeTz('createdAt', { nullable: false });
      c.datetimeTz('updatedAt', { nullable: false });
      c.string('requestId', { length: 64, nullable: false });
      c.string('ownerId', { length: 64, nullable: false });
      c.integer('uploadVersion', { nullable: false });
      c.index('requestId');
    });
  },
  async down({ builder }) {
    await builder.dropCollection('assetRequestPhotos');
  },
});
