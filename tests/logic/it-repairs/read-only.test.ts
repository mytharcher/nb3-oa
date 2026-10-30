// @vitest-environment node
import { expect } from 'vitest';
import { createAppTest } from '@nocobase/app-testing/server';
import { databaseManagerToken } from '@nocobase/db';
import { createStandaloneServer } from '../../../server/standalone.js';
import { repairServiceToken } from '../../../server/providers/it-repairs/service.js';
import { OA_TEST_DATABASE_ENV, OA_TEST_SERVER } from '../oa-test-origin.js';
import { ORIGIN, write } from '../platform/helpers.js';
import { prepareRepairs } from './helpers.js';
const test = createAppTest({
  createServer: createStandaloneServer,
  env: OA_TEST_DATABASE_ENV,
  server: OA_TEST_SERVER,
  config: {
    secrets: { keys: [{ version: 1, key: 'r'.repeat(64) }] },
    app: { publicOrigin: ORIGIN },
    itRepairs: { mode: 'readOnly' },
  },
});
test('native read-only compatibility start preserves registration and denies writes and schedules without side effects', async ({
  testApp,
}) => {
  const f = await prepareRepairs(testApp),
    a = await f.a.session(),
    s = await f.admin.session();
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    svc = c.resolve(repairServiceToken);
  expect(svc.mode).toBe('readOnly');
  expect((await a.fetch('/itRepairs')).status).toBe(200);
  const before = await db.repository('itRepairCommands').count();
  for (const path of [
    '/itRepairs/save',
    '/itRepairs/export',
    '/itRepairs/groups/readonly',
    '/itRepairs/id/actions',
  ]) {
    expect(
      (await (path.includes('groups') ? s : a).fetch(path, write('POST', {})))
        .status,
    ).toBe(503);
  }
  await expect(svc.tick()).rejects.toMatchObject({ code: 'READ_ONLY' });
  await expect(
    svc.save(
      { actorId: f.a.userId, requestKey: 'readonly' },
      {} as never,
      {} as never,
    ),
  ).rejects.toMatchObject({ code: 'READ_ONLY' });
  expect(await db.repository('itRepairCommands').count()).toBe(before);
});
