// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect } from 'vitest';
import { createAppTest } from '@nocobase/app-testing/server';
import { databaseManagerToken } from '@nocobase/db';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { inAppNotificationStoreToken } from '@nocobase/app-plugin-notification-in-app/server';
import { createStandaloneServer } from '../../../server/standalone.js';
import { OA_TEST_DATABASE_ENV, OA_TEST_SERVER } from '../oa-test-origin.js';
import { ORIGIN, write } from '../platform/helpers.js';
import { prepareRepairs } from './helpers.js';
import { createEmployee } from '../employees/helpers.js';
import { ruleServiceToken } from '../../../server/providers/platform/index.js';
import {
  repairServiceToken,
  type Repair,
} from '../../../server/providers/it-repairs/service.js';
const test = createAppTest({
  createServer: createStandaloneServer,
  env: OA_TEST_DATABASE_ENV,
  server: OA_TEST_SERVER,
  config: {
    secrets: { keys: [{ version: 1, key: 's'.repeat(64) }] },
    app: { publicOrigin: ORIGIN },
    oaApprovals: { inbox: 'demo-inbox' },
  },
});
test('V21/V22/V30 native security transfer isolation across details, files, search, CSV, reports and old tasks', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    f = await prepareRepairs(testApp),
    authz = c.resolve(authorizationToken),
    db = c.resolve(databaseManagerToken),
    svc = c.resolve(repairServiceToken),
    inbox = c.resolve(inAppNotificationStoreToken),
    e1 = await createEmployee(testApp, 'Security old E1'),
    k = await createEmployee(testApp, 'Security lead'),
    e2 = await createEmployee(testApp, 'Security E2'),
    e3 = await createEmployee(testApp, 'Other E3');
  for (const [p, role] of [
    [f.a, 'handling-employee'],
    [f.a, 'reportEmployee'],
    [f.leader, 'handling-leader'],
    [f.leader, 'reportLeader'],
    [f.leader, 'securityTransfer'],
    [e1, 'handling-engineer'],
    [e1, 'reportLeader'],
    [k, 'handling-leader'],
    [k, 'reportLeader'],
    [e2, 'handling-engineer'],
    [e3, 'handling-engineer'],
    [e3, 'reportLeader'],
  ] as const)
    await authz.permissionSets.assign({
      permissionSet: `oa-it-repairs-${role}`,
      subject: { type: 'user', id: p.userId },
    });
  const a = await f.a.session(),
    l = await f.leader.session(),
    s = await f.admin.session(),
    e = await e1.session(),
    ks = await k.session(),
    cross = await e3.session(),
    b = await f.b.session();
  const configure = (id: string, body: Record<string, unknown>) =>
    s.fetch(
      `/itRepairs/groups/${id}`,
      write('POST', {
        requestKey: randomUUID(),
        expectedVersion: 0,
        active: true,
        ...body,
      }),
    );
  expect(
    (
      await configure('normal', {
        title: 'General IT',
        leaderIds: [f.leader.userId],
        engineerIds: [e1.userId],
        categories: ['account'],
      })
    ).status,
  ).toBe(200);
  expect(
    (
      await configure('secure', {
        title: 'Restricted response',
        leaderIds: [k.userId],
        engineerIds: [e2.userId],
        categories: [],
        security: true,
      })
    ).status,
  ).toBe(200);
  expect(
    (
      await configure('other', {
        title: 'Other IT',
        leaderIds: [k.userId],
        engineerIds: [e3.userId],
        categories: ['software'],
      })
    ).status,
  ).toBe(200);
  const saved = (
    await (
      await a.fetch(
        '/itRepairs/save',
        write('POST', {
          requestKey: randomUUID(),
          draft: {
            title: 'Guarded Unique Incident',
            description: 'Public synthetic description',
            category: 'account',
            impact: 'partial',
            location: 'Lab',
            contact: '',
            occurredAt: null,
            assetId: null,
          },
        }),
      )
    ).json()
  ).data as Repair;
  let row = (
    await (
      await a.fetch(
        `/itRepairs/${saved.id}/submit`,
        write('POST', {
          requestKey: randomUUID(),
          expectedVersion: saved.version,
        }),
      )
    ).json()
  ).data as Repair;
  const request = (
    session: typeof a,
    action: string,
    data: Record<string, unknown>,
  ) =>
    session.fetch(
      `/itRepairs/${row.id}/actions`,
      write('POST', {
        requestKey: randomUUID(),
        expectedVersion: row.version,
        action,
        data,
      }),
    );
  const act = async (
    session: typeof a,
    action: string,
    data: Record<string, unknown> = {},
  ) => {
    const r = await request(session, action, data);
    expect(r.status).toBe(200);
    row = (await r.json()).data as Repair;
  };
  await act(l, 'triage', {
    priority: 'P3',
    advice: 'Investigate',
    assigneeId: e1.userId,
  });
  await act(e, 'start');
  await act(e, 'internal', { message: 'PRIVATE-SECURITY-DIAGNOSIS' });
  const bytes = new FormData();
  bytes.set(
    'file',
    new File(['PRIVATE-SECURITY-FILE'], 'private.log', { type: 'text/plain' }),
  );
  const upload = await e.fetch(`/itRepairs/${row.id}/upload`, {
    method: 'POST',
    headers: {
      Origin: ORIGIN,
      'x-request-key': randomUUID(),
      'x-expected-version': String(row.version),
      'x-file-purpose': 'processing',
      'x-file-visibility': 'internal',
    },
    body: bytes,
  });
  expect(upload.status).toBe(200);
  const attachment = (await upload.json()).data;
  row.version = attachment.version;
  const content = new URL(attachment.file.contentUrl, ORIGIN).href;
  expect((await e.fetch(content)).status).toBe(200);
  expect((await a.fetch(content)).status).toBe(403);
  const before = await db
    .repository('itRepairs')
    .findOne({ filter: { id: row.id } });
  expect(
    (
      await request(l, 'transferSecurity', {
        groupId: 'secure',
        reason: 'Restricted handling',
      })
    ).status,
  ).toBe(403);
  expect(
    await db.repository('itRepairs').findOne({ filter: { id: row.id } }),
  ).toEqual(before);
  await c.resolve(ruleServiceToken).set({
    key: 'itRepair.securityTransfer',
    value: 1,
    actorId: f.admin.userId,
  });
  const transferred = await request(l, 'transferSecurity', {
    groupId: 'secure',
    reason: 'Requires restricted handling',
  });
  expect(transferred.status).toBe(200);
  expect((await transferred.json()).data.transferred).toBe(true);
  const current = await db
    .repository<Repair>('itRepairs')
    .findOne({ filter: { id: row.id } });
  expect(current).toMatchObject({
    id: row.id,
    groupId: 'secure',
    status: 'triage',
    assigneeId: null,
    number: row.number,
    submittedAt: row.submittedAt,
  });
  for (const session of [e, l, cross, b, s]) {
    expect((await session.fetch(`/itRepairs/${row.id}`)).status).toBe(403);
    expect((await session.fetch(content)).status).toBe(403);
    expect(
      (await request(session, 'comment', { message: 'Old role attempt' }))
        .status,
    ).toBe(403);
  }
  for (const session of [e, l, cross]) {
    expect(
      (await (await session.fetch('/itRepairs?q=Guarded%20Unique')).json()).data
        .total,
    ).toBe(0);
    const search = await session.fetch('/requestSearch?q=Guarded%20Unique');
    expect(search.status).toBe(200);
    expect(JSON.stringify(await search.json())).not.toContain(row.id);
    const exported = await session.fetch(
      '/itRepairs/export',
      write('POST', {
        requestKey: randomUUID(),
        query: { q: 'Guarded Unique' },
      }),
    );
    expect(exported.status).toBe(200);
    expect(await exported.text()).not.toContain('Guarded Unique Incident');
    const reports = await session.fetch(
      '/itRepairs/reports?q=Guarded%20Unique',
    );
    expect(reports.status).toBe(200);
    expect((await reports.json()).data.counts.submitted).toBe(0);
  }
  expect((await ks.fetch(`/itRepairs/${row.id}`)).status).toBe(200);
  expect((await ks.fetch(content)).status).toBe(200);
  const publicDetail = await a.fetch(`/itRepairs/${row.id}/handling`);
  expect(publicDetail.status).toBe(200);
  expect(JSON.stringify(await publicDetail.json())).not.toContain(
    'PRIVATE-SECURITY',
  );
  const exportA = await a.fetch(
    '/itRepairs/export',
    write('POST', { requestKey: randomUUID(), query: {} }),
  );
  expect(exportA.status).toBe(200);
  const safeCSV = await exportA.text();
  expect(safeCSV).toContain('Guarded Unique Incident');
  expect(safeCSV).not.toContain('PRIVATE-SECURITY');
  expect(
    await db.repository('userTasks').count({
      filter: {
        sourceType: 'oa.itRepair',
        sourceKey: row.id,
        userId: e1.userId,
        status: 'pending',
      },
    }),
  ).toBe(0);
  expect(
    await db.repository('userTasks').count({
      filter: {
        sourceType: 'oa.itRepair',
        sourceKey: row.id,
        userId: k.userId,
        status: 'pending',
      },
    }),
  ).toBe(1);
  await expect
    .poll(async () =>
      (await svc.runtime.listEffectRuns({ recordId: row.id })).every(
        (r) => r.status === 'succeeded',
      ),
    )
    .toBe(true);
  const oldMessages = await inbox.list({ userId: e1.userId, limit: 100 });
  expect(
    oldMessages.filter(
      (m) => m.target?.type === 'route' && m.target.path === '/it-repairs',
    ),
  ).toHaveLength(1);
  expect(oldMessages.some((m) => m.body.includes('PRIVATE-SECURITY'))).toBe(
    false,
  );
  expect(
    (
      await s.fetch(
        '/itRepairs/groups/secure',
        write('POST', {
          requestKey: randomUUID(),
          expectedVersion: 1,
          title: 'No implicit declassification',
          leaderIds: [k.userId],
          engineerIds: [e2.userId],
          categories: [],
          active: true,
          security: false,
        }),
      )
    ).status,
  ).toBe(400);
  const totals = await db
    .repository('itRepairEvents')
    .count({ filter: { repairId: row.id } });
  expect(totals).toBeGreaterThan(0);
});
