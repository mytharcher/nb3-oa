import { assetServiceToken } from '../../../server/providers/assets/contract.js';
import { dictionaryServiceToken } from '../../../server/providers/platform/index.js';
// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { createPlatformAppTest, write, ORIGIN } from '../platform/helpers.js';
import { prepareRepairs } from './helpers.js';
const test = createPlatformAppTest();
test('real identities enforce API, field, file and service-group isolation with no denied write effects', async ({
  testApp,
  request,
}) => {
  const f = await prepareRepairs(testApp),
    a = await f.a.session(),
    b = await f.b.session(),
    l = await f.leader.session(),
    s = await f.admin.session(),
    db = testApp.application.container.resolve(databaseManagerToken);
  const assets = testApp.application.container.resolve(assetServiceToken),
    category = (
      await testApp.application.container
        .resolve(dictionaryServiceToken)
        .list('assetCategory')
    )[0].code;
  const asset = await assets.create(
    {
      code: 'REPAIR-TEST',
      name: 'Synthetic laptop',
      category,
      serialNumber: null,
      originalValueCents: 10000,
      actorId: f.admin.userId,
      reason: 'Fixture',
    },
    db.connection(),
  );
  await db.repository('assets').updateMany({
    filter: { id: asset.id },
    values: { status: 'assigned', holderEmployeeId: f.a.employeeId },
  });
  const draft = {
    title: 'Printer unavailable',
    description: 'Test failure',
    category: 'device',
    impact: 'partial',
    location: 'Test office',
    contact: '',
    occurredAt: null,
    assetId: asset.id,
  };
  expect((await request('/itRepairs')).status).toBe(401);
  const config = await s.fetch(
    '/itRepairs/groups/default',
    write('POST', {
      requestKey: randomUUID(),
      expectedVersion: 0,
      title: 'IT',
      leaderIds: [f.leader.userId],
      engineerIds: [],
      categories: ['device'],
      active: true,
    }),
  );
  expect(config.status).toBe(200);
  expect((await s.fetch('/itRepairs')).status).toBe(403);
  const create = await a.fetch(
    '/itRepairs/save',
    write('POST', { requestKey: randomUUID(), draft }),
  );
  expect(create.status).toBe(200);
  const row = (await create.json()).data;
  expect((await b.fetch(`/itRepairs/${row.id}`)).status).toBe(403);
  expect((await l.fetch(`/itRepairs/${row.id}`)).status).toBe(403);
  expect(
    (
      await b.fetch(
        `/itRepairs/${row.id}/submit`,
        write('POST', {
          requestKey: randomUUID(),
          expectedVersion: row.version,
        }),
      )
    ).status,
  ).toBe(403);
  expect(
    (await db.repository('itRepairs').findOne({ filter: { id: row.id } }))
      ?.version,
  ).toBe(1);
  const form = new FormData();
  form.set(
    'file',
    new File(['UTF-8 test log'], 'fault.log', { type: 'text/plain' }),
  );
  const upload = await a.fetch(`/itRepairs/${row.id}/upload`, {
    method: 'POST',
    headers: {
      origin: ORIGIN,
      'x-request-key': randomUUID(),
      'x-expected-version': '1',
    },
    body: form,
  });
  expect(upload.status).toBe(200);
  const file = (await upload.json()).data.file;
  expect(file.key).toBeUndefined();
  expect(file.disk).toBeUndefined();
  const path = new URL(file.contentUrl, ORIGIN).href;
  expect((await request(path)).status).toBe(401);
  expect((await b.fetch(path)).status).toBe(403);
  const download = await a.fetch(path);
  expect(download.status).toBe(200);
  expect(await download.text()).toBe('UTF-8 test log');
  const deniedMetadata = await b.fetch('/itRepairAttachments/findMany', {
    ...write('POST', { limit: 10 }),
    headers: { ...write('POST').headers, 'x-repair-id': row.id },
  });
  expect(deniedMetadata.status).toBe(403);
  const submitKey = randomUUID(),
    submitted = await a.fetch(
      `/itRepairs/${row.id}/submit`,
      write('POST', { requestKey: submitKey, expectedVersion: 2 }),
    );
  expect(submitted.status).toBe(200);
  expect((await l.fetch(`/itRepairs/${row.id}`)).status).toBe(200);
  expect((await s.fetch(`/itRepairs/${row.id}`)).status).toBe(403);
  const list = (await (await b.fetch('/itRepairs')).json()).data;
  expect(list.total).toBe(0);
  const replay = await a.fetch(
    `/itRepairs/${row.id}/submit`,
    write('POST', { requestKey: submitKey, expectedVersion: 2 }),
  );
  expect((await replay.json()).data.version).toBe(3);
  expect(
    (
      await a.fetch(`/itRepairs/${row.id}/upload`, {
        method: 'POST',
        headers: {
          origin: ORIGIN,
          'x-request-key': randomUUID(),
          'x-expected-version': '3',
        },
        body: form,
      })
    ).status,
  ).toBe(409);
  expect(
    (await db.repository('itRepairs').findOne({ filter: { id: row.id } }))
      ?.version,
  ).toBe(3);
  const unchanged = await assets.get(asset.id, db.connection());
  expect(unchanged).toMatchObject({
    status: 'assigned',
    holderEmployeeId: f.a.employeeId,
  });
  const foreign = await b.fetch(
    '/itRepairs/save',
    write('POST', { requestKey: randomUUID(), draft }),
  );
  expect(foreign.status).toBe(200);
  const foreignRow = (await foreign.json()).data;
  expect(
    (
      await b.fetch(
        `/itRepairs/${foreignRow.id}/submit`,
        write('POST', { requestKey: randomUUID(), expectedVersion: 1 }),
      )
    ).status,
  ).toBe(400);
  expect(
    (
      await db
        .repository('itRepairs')
        .findOne({ filter: { id: foreignRow.id } })
    )?.number,
  ).toBeNull();
  const result = await s.fetch(
    '/itRepairs/groups/default',
    write('POST', {
      requestKey: randomUUID(),
      expectedVersion: 1,
      title: 'IT',
      leaderIds: [],
      engineerIds: [],
      categories: ['device'],
      active: true,
    }),
  );
  expect(result.status).toBe(200);
  expect((await l.fetch(`/itRepairs/${row.id}`)).status).toBe(403);
}, 60000);
