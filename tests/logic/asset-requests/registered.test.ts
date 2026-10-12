// @vitest-environment node
import { expect } from 'vitest';
import { createAssetRequestsAppTest } from './helpers.js';
import { assetRequestServiceToken } from '../../../server/providers/asset-requests/contract.js';
import { assetStockSourceToken } from '../../../server/providers/assets/contract.js';
const test = createAssetRequestsAppTest();
test('test-only registered asset graph boots its public services and refuses unguarded stock access', async ({
  app,
}) => {
  expect(app.container.resolve(assetRequestServiceToken)).toHaveProperty(
    'maintenanceReassign',
  );
  const source = app.container.resolve(assetStockSourceToken);
  await expect(
    source.intent(
      'missing',
      'missing',
      'issue',
      app.container
        .resolve((await import('@nocobase/db')).databaseManagerToken)
        .connection(),
    ),
  ).rejects.toMatchObject({ code: 'ASSET_SOURCE_FORBIDDEN' });
});
