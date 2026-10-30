// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect, vi } from 'vitest';
import { createAppTest } from '@nocobase/app-testing/server';
import { databaseManagerToken } from '@nocobase/db';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { createStandaloneServer } from '../../../server/standalone.js';
import { OA_TEST_DATABASE_ENV, OA_TEST_SERVER } from '../oa-test-origin.js';
import { ORIGIN, write } from '../platform/helpers.js';
import { prepareRepairs } from './helpers.js';
import { createEmployee } from '../employees/helpers.js';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
const test = createAppTest({
  createServer: createStandaloneServer,
  env: OA_TEST_DATABASE_ENV,
  server: OA_TEST_SERVER,
  config: {
    secrets: { keys: [{ version: 1, key: 'h'.repeat(64) }] },
    app: { publicOrigin: ORIGIN },
    oaApprovals: { inbox: 'demo-inbox' },
  },
});
const draft = {
  title: 'Handling fault',
  description: 'Synthetic only',
  category: 'device',
  impact: 'partial',
  location: 'Test',
  contact: '',
  occurredAt: null,
  assetId: null,
};
test('processing, real identities, concurrent claim, rollback, acceptance return and private materials', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    f = await prepareRepairs(testApp),
    authz = c.resolve(authorizationToken);
  const e1 = await createEmployee(testApp, 'Handling E1'),
    e2 = await createEmployee(testApp, 'Handling E2');
  for (const [person, role] of [
    [f.a, 'employee'],
    [f.leader, 'leader'],
    [e1, 'engineer'],
    [e2, 'engineer'],
  ] as const)
    await authz.permissionSets.assign({
      permissionSet: `oa-it-repairs-handling-${role}`,
      subject: { type: 'user', id: person.userId },
    });
  const a = await f.a.session(),
    l = await f.leader.session(),
    s = await f.admin.session(),
    e = await e1.session(),
    other = await e2.session(),
    b = await f.b.session();
  const configure = await s.fetch(
    '/itRepairs/groups/handling',
    write('POST', {
      requestKey: randomUUID(),
      expectedVersion: 0,
      title: 'Handling',
      leaderIds: [f.leader.userId],
      engineerIds: [f.a.userId, e1.userId, e2.userId],
      categories: ['device'],
      active: true,
    }),
  );
  expect(configure.status).toBe(200);
  const create = async () => {
    const saved = (
      await (
        await a.fetch(
          '/itRepairs/save',
          write('POST', { requestKey: randomUUID(), draft }),
        )
      ).json()
    ).data;
    const res = await a.fetch(
      `/itRepairs/${saved.id}/submit`,
      write('POST', {
        requestKey: randomUUID(),
        expectedVersion: saved.version,
      }),
    );
    expect(res.status).toBe(200);
    return (await res.json()).data;
  };
  let row = await create();
  const original = { number: row.number, submittedAt: row.submittedAt };
  const call = (
    session: typeof a,
    action: string,
    data: Record<string, unknown> = {},
    version = row.version,
    key = randomUUID(),
  ) =>
    session.fetch(
      `/itRepairs/${row.id}/actions`,
      write('POST', {
        action,
        data,
        expectedVersion: version,
        requestKey: key,
      }),
    );
  const act = async (
    session: typeof a,
    action: string,
    data: Record<string, unknown> = {},
  ) => {
    const r = await call(session, action, data);
    const json = await r.json();
    expect({ status: r.status, body: json }).toMatchObject({ status: 200 });
    row = json.data;
    return row;
  };
  await act(l, 'requestSupplement', { reason: 'Please add context' });
  expect(row.status).toBe('supplement');
  await act(a, 'supplement', { message: 'Supplement supplied' });
  expect(row).toMatchObject({ ...original, status: 'triage' });
  await act(l, 'triage', {
    priority: 'P3',
    advice: 'Please restart the test device',
  });
  expect(row.status).toBe('pool');
  const pool = (await (await e.fetch(`/itRepairs/${row.id}`)).json()).data;
  expect(pool.description).toBeUndefined();
  const claims = await Promise.all([call(e, 'claim'), call(other, 'claim')]);
  expect(claims.map((r) => r.status).sort()).toEqual([200, 409]);
  row = (await (await l.fetch(`/itRepairs/${row.id}`)).json()).data;
  const engineer = row.assigneeId === e1.userId ? e : other,
    stale = row.assigneeId === e1.userId ? other : e;
  expect((await call(stale, 'start')).status).toBe(403);
  await act(engineer, 'release', { reason: 'Not started' });
  expect(row.status).toBe('pool');
  await act(l, 'assign', { assigneeId: e1.userId, reason: 'Assign E1' });
  await act(e, 'start');
  expect((await call(e, 'release', { reason: 'Already started' })).status).toBe(
    403,
  );
  const before = await db
      .repository('itRepairs')
      .findOne({ filter: { id: row.id } }),
    beforeEvents = await db
      .repository('itRepairEvents')
      .count({ filter: { repairId: row.id } });
  expect(
    (
      await call(e, 'resolve', {
        cause: 'Cause',
        solution: 'Solution',
        resultType: 'restored',
      })
    ).status,
  ).toBe(400);
  expect(
    await db.repository('itRepairs').findOne({ filter: { id: row.id } }),
  ).toEqual(before);
  expect(
    await db
      .repository('itRepairEvents')
      .count({ filter: { repairId: row.id } }),
  ).toBe(beforeEvents);
  const audit = c.resolve(auditServiceToken),
    record = audit.record.bind(audit),
    fail = vi.spyOn(audit, 'record').mockImplementation(async (input, tx) => {
      if (input.action === 'itRepair.resolve') throw Error('Injected');
      return record(input, tx);
    });
  const key = randomUUID(),
    result = {
      cause: 'Synthetic cause',
      solution: 'Synthetic solution',
      completion: 'Restored',
      resultType: 'restored',
    };
  expect((await call(e, 'resolve', result, row.version, key)).status).toBe(500);
  fail.mockRestore();
  expect(
    await db.repository('itRepairs').findOne({ filter: { id: row.id } }),
  ).toEqual(before);
  await act(e, 'internal', { message: 'IT private diagnostic' });
  await act(e, 'comment', {
    message: 'Public advice',
    effective: true,
    advice: 'Retest',
  });
  const repeatKey = randomUUID(),
    repeatVersion = row.version;
  const firstReply = await call(
    e,
    'comment',
    { message: 'One public reply' },
    repeatVersion,
    repeatKey,
  );
  expect(firstReply.status).toBe(200);
  row = (await firstReply.json()).data;
  const repeat = await call(
    e,
    'comment',
    { message: 'One public reply' },
    repeatVersion,
    repeatKey,
  );
  expect(repeat.status).toBe(200);
  expect((await repeat.json()).data.version).toBe(row.version);
  expect(
    (
      await call(
        e,
        'comment',
        { message: 'Changed payload' },
        repeatVersion,
        repeatKey,
      )
    ).status,
  ).toBe(409);
  const ha = (await (await a.fetch(`/itRepairs/${row.id}/handling`)).json())
      .data,
    he = (await (await e.fetch(`/itRepairs/${row.id}/handling`)).json()).data;
  expect(JSON.stringify(ha)).not.toContain('IT private diagnostic');
  expect(JSON.stringify(he)).toContain('IT private diagnostic');
  const payload = new FormData();
  payload.set(
    'file',
    new File(['IT-private-log'], 'internal.log', { type: 'text/plain' }),
  );
  const uploaded = await e.fetch(`/itRepairs/${row.id}/upload`, {
    method: 'POST',
    headers: {
      Origin: ORIGIN,
      'x-request-key': randomUUID(),
      'x-expected-version': String(row.version),
      'x-file-purpose': 'processing',
      'x-file-visibility': 'internal',
    },
    body: payload,
  });
  expect(uploaded.status).toBe(200);
  const file = (await uploaded.json()).data;
  row.version = file.version;
  expect(
    (await a.fetch(new URL(file.file.contentUrl, ORIGIN).href)).status,
  ).toBe(403);
  expect(
    (await e.fetch(new URL(file.file.contentUrl, ORIGIN).href)).status,
  ).toBe(200);
  await act(e, 'resolve', result);
  expect(row.status).toBe('acceptance');
  expect((await call(l, 'accept')).status).toBe(403);
  expect((await call(b, 'accept')).status).toBe(403);
  await act(a, 'return', { reason: 'Still fails' });
  expect(row.status).toBe('processing');
  await act(e, 'resolve', result);
  expect(row.processing.round).toBe(2);
  const race = await Promise.all([
    call(a, 'accept', { rating: 4, evaluation: 'Fixed' }),
    call(a, 'return', { reason: 'Concurrent return' }),
  ]);
  expect(race.map((r) => r.status).sort()).toEqual([200, 409]);
  row = (await (await a.fetch(`/itRepairs/${row.id}`)).json()).data;
  if (row.status === 'processing') {
    await act(e, 'resolve', result);
    await act(a, 'accept', { rating: 4 });
  }
  expect(row).toMatchObject({
    ...original,
    status: 'closed',
    processing: { closureMode: 'user', rating: 4 },
  });
  const final = await db
    .repository('itRepairs')
    .findOne({ filter: { id: row.id } });
  expect((await call(e, 'resolve', result)).status).toBe(403);
  expect((await call(a, 'comment', { message: 'After close' })).status).toBe(
    403,
  );
  expect(
    await db.repository('itRepairs').findOne({ filter: { id: row.id } }),
  ).toEqual(final);

  // Cancellation remains an audited request while processing continues.
  row = await create();
  await act(l, 'triage', {
    priority: 'P3',
    advice: 'Qualified response',
    assigneeId: e1.userId,
  });
  await act(e, 'start');
  const started = row.submittedAt;
  await act(a, 'cancel', { reason: 'No longer needed' });
  expect(row.status).toBe('processing');
  expect(row.processing.cancelPending).toBe(true);
  expect((await call(e, 'resolve', result)).status).toBe(403);
  const cancelBefore = await db
    .repository('itRepairs')
    .findOne({ filter: { id: row.id } });
  const cancelFailure = vi
    .spyOn(audit, 'record')
    .mockImplementation(async (input, tx) => {
      if (input.action === 'itRepair.reviewCancel')
        throw Error('Injected review failure');
      return record(input, tx);
    });
  expect(
    (await call(l, 'reviewCancel', { reason: 'Approve', approve: true }))
      .status,
  ).toBe(500);
  cancelFailure.mockRestore();
  expect(
    await db.repository('itRepairs').findOne({ filter: { id: row.id } }),
  ).toEqual(cancelBefore);
  await act(l, 'reviewCancel', { reason: 'Continue repair', approve: false });
  expect(row.processing.cancelPending).toBe(false);
  expect(row.submittedAt).toBe(started);
  await act(a, 'cancel', { reason: 'Duplicate equipment replaced' });
  await act(l, 'reviewCancel', {
    reason: 'Confirmed with requester',
    approve: true,
  });
  expect(row.status).toBe('cancelled');
  row = await create();
  const duplicateId = row.id;
  await act(a, 'cancel', { reason: 'Direct cancellation' });
  expect(row.status).toBe('cancelled');
  row = await create();
  expect(
    (
      await call(l, 'duplicate', {
        mainId: duplicateId,
        reason: 'Invalid terminal main',
      })
    ).status,
  ).toBe(400);
  expect(
    (
      await call(l, 'assign', {
        assigneeId: f.a.userId,
        reason: 'Self handling forbidden',
      })
    ).status,
  ).toBe(403);
  expect(
    (
      await call(l, 'manageClose', {
        reason: 'Exception',
        completion: 'Manual closure',
      })
    ).status,
  ).toBe(403);
  await authz.permissionSets.assign({
    permissionSet: 'oa-it-repairs-handling-exception',
    subject: { type: 'user', id: f.leader.userId },
  });
  await act(l, 'manageClose', {
    reason: 'Confirmed service exception',
    completion: 'Documented management closure',
  });
  expect(row.processing.closureMode).toBe('management');
  expect((await call(a, 'rate', { rating: 5 })).status).toBe(403);
  // Membership removal immediately revokes detail, materials and mutation access.
  row = await create();
  await act(l, 'triage', {
    priority: 'P3',
    advice: 'Retest',
    assigneeId: e1.userId,
  });
  await act(e, 'start');
  const group = (await db
    .repository('itRepairGroups')
    .findOne({ filter: { id: 'handling' } }))!;
  const changed = await s.fetch(
    '/itRepairs/groups/handling',
    write('POST', {
      requestKey: randomUUID(),
      expectedVersion: group.version,
      title: 'Handling',
      leaderIds: [f.leader.userId],
      engineerIds: [e2.userId],
      categories: ['device'],
      active: true,
    }),
  );
  expect(changed.status).toBe(200);
  expect((await e.fetch(`/itRepairs/${row.id}`)).status).toBe(403);
  expect((await call(e, 'comment', { message: 'Stale engineer' })).status).toBe(
    403,
  );
  const listing = await (await e.fetch('/itRepairs')).json();
  expect(JSON.stringify(listing.data)).not.toContain(row.id);
  row = (await (await l.fetch(`/itRepairs/${row.id}`)).json()).data;
  await act(l, 'assign', {
    assigneeId: e2.userId,
    reason: 'Qualification changed',
  });
  expect((await other.fetch(`/itRepairs/${row.id}`)).status).toBe(200);

  row = await create();
  const mainId = row.id;
  row = await create();
  expect(
    (await call(l, 'duplicate', { mainId: row.id, reason: 'Self' })).status,
  ).toBe(400);
  await act(l, 'duplicate', { mainId, reason: 'Same incident' });
  expect(row.status).toBe('cancelled');
  expect(row.processing.duplicateId).toBe(mainId);
  const employeeCopy = (await (await a.fetch(`/itRepairs/${row.id}`)).json())
    .data;
  expect(employeeCopy.processing.duplicateId).toBeUndefined();
  expect(employeeCopy.processing.duplicateLinked).toBe(true);
  row = await create();
  expect(
    (
      await call(l, 'triage', {
        priority: 'P3',
        advice: 'Cannot handle own repair',
        assigneeId: f.a.userId,
      })
    ).status,
  ).toBe(400);
  await act(l, 'triage', {
    priority: 'P3',
    advice: 'Qualified engineer',
    assigneeId: e2.userId,
  });
  await act(other, 'start');
  await act(other, 'resolve', result);
  await act(a, 'cancel', { reason: 'Review before acceptance' });
  expect((await call(a, 'accept')).status).toBe(403);
  await act(l, 'reviewCancel', {
    reason: 'Continue to acceptance',
    approve: false,
  });
  const { userAdministrationServiceToken } =
    await import('@nocobase/app-plugin-authentication');
  await c.resolve(userAdministrationServiceToken).disable(f.a.userId);
  expect((await call(a, 'accept')).status).toBe(401);
  expect((await call(l, 'accept')).status).toBe(403);
  await act(l, 'manageClose', {
    reason: 'Requester disabled, independent exception grant',
    completion: 'Management decision, no rating',
  });
  expect(row.processing.closureMode).toBe('management');
}, 120000);
