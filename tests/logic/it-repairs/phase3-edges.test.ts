// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect, vi } from 'vitest';
import { createAppTest } from '@nocobase/app-testing/server';
import { databaseManagerToken } from '@nocobase/db';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { inAppNotificationStoreToken } from '@nocobase/app-plugin-notification-in-app/server';
import { userTaskServiceToken } from '@nocobase/app-plugin-task-center/server';
import { createStandaloneServer } from '../../../server/standalone.js';
import { OA_TEST_DATABASE_ENV, OA_TEST_SERVER } from '../oa-test-origin.js';
import { write, ORIGIN } from '../platform/helpers.js';
import { prepareRepairs } from './helpers.js';
import { createEmployee } from '../employees/helpers.js';
import {
  repairServiceToken,
  type Repair,
} from '../../../server/providers/it-repairs/service.js';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
import { assetServiceToken } from '../../../server/providers/assets/contract.js';
import { dictionaryServiceToken } from '../../../server/providers/platform/index.js';
const test = createAppTest({
  createServer: createStandaloneServer,
  env: OA_TEST_DATABASE_ENV,
  server: OA_TEST_SERVER,
  config: {
    secrets: { keys: [{ version: 1, key: 'g'.repeat(64) }] },
    app: { publicOrigin: ORIGIN },
    oaApprovals: { inbox: 'demo-inbox' },
  },
});
async function setup(
  testApp: Parameters<typeof prepareRepairs>[0],
  category: string,
) {
  const c = testApp.application.container,
    f = await prepareRepairs(testApp),
    authz = c.resolve(authorizationToken),
    db = c.resolve(databaseManagerToken),
    svc = c.resolve(repairServiceToken),
    e1 = await createEmployee(testApp, `Edge E1 ${category}`),
    e2 = await createEmployee(testApp, `Edge E2 ${category}`);
  for (const [p, role] of [
    [f.a, 'employee'],
    [f.leader, 'leader'],
    [e1, 'engineer'],
    [e2, 'engineer'],
  ] as const)
    await authz.permissionSets.assign({
      permissionSet: `oa-it-repairs-handling-${role}`,
      subject: { type: 'user', id: p.userId },
    });
  const a = await f.a.session(),
    l = await f.leader.session(),
    e = await e1.session(),
    s = await f.admin.session();
  const group = {
    title: `Edge ${category}`,
    leaderIds: [f.leader.userId],
    engineerIds: [e1.userId, e2.userId],
    categories: [category],
    active: true,
  };
  expect(
    (
      await s.fetch(
        `/itRepairs/groups/edge-${category}`,
        write('POST', {
          requestKey: randomUUID(),
          expectedVersion: 0,
          ...group,
        }),
      )
    ).status,
  ).toBe(200);
  const create = async (assetId: string | null = null) => {
    const saved = (
      await (
        await a.fetch(
          '/itRepairs/save',
          write('POST', {
            requestKey: randomUUID(),
            draft: {
              title: 'Edge synthetic',
              description: 'Public fault',
              category,
              impact: 'partial',
              location: 'Lab',
              contact: '',
              occurredAt: null,
              assetId,
            },
          }),
        )
      ).json()
    ).data as Repair;
    const r = await a.fetch(
      `/itRepairs/${saved.id}/submit`,
      write('POST', {
        requestKey: randomUUID(),
        expectedVersion: saved.version,
      }),
    );
    expect(r.status).toBe(200);
    return (await r.json()).data as Repair;
  };
  const call = (
    row: Repair,
    session: typeof a,
    action: string,
    data: Record<string, unknown> = {},
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
    row: Repair,
    session: typeof a,
    action: string,
    data: Record<string, unknown> = {},
  ) => {
    const r = await call(row, session, action, data);
    expect(r.status).toBe(200);
    return (await r.json()).data as Repair;
  };
  const start = async (row: Repair) =>
    act(
      await act(row, l, 'triage', {
        priority: 'P3',
        advice: 'Investigate',
        assigneeId: e1.userId,
      }),
      e,
      'start',
    );
  return { c, f, db, svc, e1, e2, a, l, e, s, group, create, call, act, start };
}
const resolution = {
  cause: 'Cause',
  solution: 'Solution',
  completion: 'Restored',
  resultType: 'restored',
};
test('V15 cancellation approval versus resolve and acceptance guards have no losing side effects', async ({
  testApp,
}) => {
  const { c, db, a, l, e, create, call, act, start } = await setup(
    testApp,
    'device',
  );
  let row = await start(await create());
  row = await act(row, a, 'cancel', { reason: 'Needs review' });
  const beforeEvents = await db
      .repository('itRepairEvents')
      .count({ filter: { repairId: row.id } }),
    audit = c.resolve(auditServiceToken),
    record = audit.record.bind(audit);
  let release!: () => void, entered!: () => void;
  const held = new Promise<void>((r) => {
      release = r;
    }),
    ready = new Promise<void>((r) => {
      entered = r;
    });
  const fault = vi
    .spyOn(audit, 'record')
    .mockImplementation(async (input, tx) => {
      if (
        input.action === 'itRepair.reviewCancel' &&
        input.targetId === row.id
      ) {
        entered();
        await held;
      }
      return record(input, tx);
    });
  let approve: Promise<Response> | undefined;
  try {
    approve = call(row, l, 'reviewCancel', {
      approve: true,
      reason: 'Confirmed',
    });
    await ready;
    const loser = await call(row, e, 'resolve', resolution);
    expect(loser.status).toBe(403);
    release();
    expect((await approve).status).toBe(200);
  } finally {
    release();
    await approve;
    fault.mockRestore();
  }
  expect(
    await db
      .repository('itRepairEvents')
      .count({ filter: { repairId: row.id } }),
  ).toBe(beforeEvents + 1);
  expect(
    (
      await db
        .repository<Repair>('itRepairs')
        .findOne({ filter: { id: row.id } })
    )?.status,
  ).toBe('cancelled');
  row = await start(await create());
  row = await act(row, e, 'resolve', resolution);
  row = await act(row, a, 'cancel', { reason: 'Review before accepting' });
  const prior = await db
    .repository('itRepairs')
    .findOne({ filter: { id: row.id } });
  expect((await call(row, a, 'accept')).status).toBe(403);
  expect(
    (await call(row, a, 'return', { reason: 'Still failing' })).status,
  ).toBe(403);
  expect(
    await db.repository('itRepairs').findOne({ filter: { id: row.id } }),
  ).toEqual(prior);
});
test('V16 native duplicate links reject cycles, including a deliberately corrupted legacy multi-node chain', async ({
  testApp,
}) => {
  const { db, a, l, create, call, act } = await setup(testApp, 'software');
  let first = await create(),
    second = await create();
  const third = await create();
  first = await act(first, l, 'duplicate', {
    mainId: second.id,
    reason: 'Same fault',
  });
  expect(first.status).toBe('cancelled');
  second = await act(second, l, 'duplicate', {
    mainId: third.id,
    reason: 'Common cause',
  });
  expect(second.status).toBe('cancelled');
  expect(
    (
      await call(third, l, 'duplicate', {
        mainId: first.id,
        reason: 'Would create cycle',
      })
    ).status,
  ).toBe(400);
  const left = await create(),
    right = await create();
  await db.repository('itRepairs').updateMany({
    filter: { id: left.id },
    values: { processing: { duplicateId: right.id } },
  });
  await db.repository('itRepairs').updateMany({
    filter: { id: right.id },
    values: { processing: { duplicateId: left.id } },
  });
  const facts = await db.repository('itRepairEvents').count(),
    before = await db
      .repository('itRepairs')
      .findOne({ filter: { id: third.id } });
  expect(
    (
      await call(third, l, 'duplicate', {
        mainId: left.id,
        reason: 'Legacy cycle',
      })
    ).status,
  ).toBe(400);
  expect(await db.repository('itRepairEvents').count()).toBe(facts);
  expect(
    await db.repository('itRepairs').findOne({ filter: { id: third.id } }),
  ).toEqual(before);
  expect(
    JSON.stringify(
      (await (await a.fetch(`/itRepairs/${first.id}`)).json()).data,
    ),
  ).not.toContain(second.id);
});
test('V18/V24/V26 qualified-routing alerts, native notification reads and accepted closure preserve assets', async ({
  testApp,
}) => {
  const { c, f, db, svc, e1, e2, a, l, e, s, group, create, act, start } =
    await setup(testApp, 'other');
  const category = (
    await c.resolve(dictionaryServiceToken).list('assetCategory')
  )[0].code;
  const asset = await c.resolve(assetServiceToken).create(
    {
      code: randomUUID(),
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
    values: { holderEmployeeId: f.a.employeeId, status: 'assigned' },
  });
  const before = await db
    .repository('assets')
    .findOne({ filter: { id: asset.id } });
  let row = await start(await create(asset.id));
  const inbox = c.resolve(inAppNotificationStoreToken),
    tasks = c.resolve(userTaskServiceToken);
  await expect
    .poll(
      async () =>
        (await inbox.list({ userId: e1.userId, limit: 100 })).filter((m) =>
          m.body.includes(row.number!),
        ).length,
    )
    .toBeGreaterThan(0);
  const counts = await tasks.statistics(e1.userId, {
      sourceType: 'oa.itRepair',
    }),
    persisted = await db
      .repository('itRepairs')
      .findOne({ filter: { id: row.id } });
  const messages = (await inbox.list({ userId: e1.userId, limit: 100 })).filter(
    (m) => m.body.includes(row.number!),
  );
  for (const m of messages)
    await inbox.update({ id: m.id, userId: e1.userId, action: 'read' });
  expect(
    await tasks.statistics(e1.userId, { sourceType: 'oa.itRepair' }),
  ).toEqual(counts);
  expect(
    await db.repository('itRepairs').findOne({ filter: { id: row.id } }),
  ).toEqual(persisted);
  await c.resolve(userAdministrationServiceToken).disable(e1.userId);
  expect((await e.fetch(`/itRepairs/${row.id}`)).status).toBe(401);
  await svc.tick();
  expect(
    await db
      .repository('itRepairEvents')
      .count({ filter: { repairId: row.id, type: 'alert' } }),
  ).toBeGreaterThan(0);
  const alerts = await db
    .repository('itRepairEvents')
    .count({ filter: { repairId: row.id, type: 'alert' } });
  await svc.tick();
  expect(
    await db
      .repository('itRepairEvents')
      .count({ filter: { repairId: row.id, type: 'alert' } }),
  ).toBe(alerts);
  row = (await (await l.fetch(`/itRepairs/${row.id}`)).json()).data as Repair;
  row = await act(row, l, 'assign', {
    assigneeId: e2.userId,
    reason: 'Replace inactive engineer',
  });
  const replacement = await e2.session();
  row = await act(row, replacement, 'resolve', resolution);
  row = await act(row, a, 'accept');
  expect(row.status).toBe('closed');
  expect(
    await db.repository('assets').findOne({ filter: { id: asset.id } }),
  ).toEqual(before);
  expect(
    (
      await s.fetch(
        '/itRepairs/groups/edge-other',
        write('POST', {
          ...group,
          engineerIds: [],
          expectedVersion: 1,
          requestKey: randomUUID(),
        }),
      )
    ).status,
  ).toBe(200);
  row = await create();
  row = await act(row, l, 'triage', {
    priority: 'P3',
    advice: 'No candidate available',
  });
  expect(row.status).toBe('triage');
  const emptyAlert = await db
    .repository('itRepairEvents')
    .findMany({ filter: { repairId: row.id, type: 'alert' } });
  expect(
    emptyAlert.some((e) =>
      String((e.data as { key: string }).key).startsWith('noCandidates:'),
    ),
  ).toBe(true);
  await expect
    .poll(
      async () =>
        (await inbox.list({ userId: f.leader.userId, limit: 100 })).filter(
          (m) => m.body.includes(row.number!),
        ).length,
    )
    .toBeGreaterThan(0);
});

test('V18 membership recovery continues a 101-record legacy queue in bounded batches without changing numbers or clocks', async ({
  testApp,
}) => {
  const { db, svc, e1, e2, s, group, create, start } = await setup(
    testApp,
    'network',
  );
  const first = await start(await create());
  const base = await db
    .repository<Repair>('itRepairs')
    .findOne({ filter: { id: first.id } });
  expect(base).toBeTruthy();
  const clones = Array.from({ length: 100 }, (_, i) => ({
    ...base!,
    id: randomUUID(),
    number: `LEGACY-EDGE-${i}`,
  }));
  const { createUserTaskService } =
    await import('@nocobase/app-plugin-task-center/server');
  const writer = createUserTaskService(db).registerSource('oa.itRepair');
  await db.transaction(async (tx) => {
    await tx.repository('itRepairs').createMany({ values: clones });
    for (const row of clones)
      await writer.put(
        {
          userId: e1.userId,
          sourceKey: row.id,
          subject: 'oa.itRepair',
          status: 'pending',
          title: row.number!,
        },
        tx,
      );
  });
  expect(
    await db.repository('userTasks').count({
      filter: {
        sourceType: 'oa.itRepair',
        userId: e1.userId,
        status: 'pending',
      },
    }),
  ).toBe(101);
  expect(
    (
      await s.fetch(
        '/itRepairs/groups/edge-network',
        write('POST', {
          ...group,
          engineerIds: [e2.userId],
          expectedVersion: 1,
          requestKey: randomUUID(),
        }),
      )
    ).status,
  ).toBe(200);
  expect(
    await db.repository('userTasks').count({
      filter: {
        sourceType: 'oa.itRepair',
        userId: e1.userId,
        status: 'pending',
      },
    }),
  ).toBe(91);
  expect(
    (
      await db
        .repository('itRepairGroups')
        .findOne({ filter: { id: 'edge-network' } })
    )?.routingCursor,
  ).toBeTruthy();
  for (let batch = 0; batch < 10; batch++) await svc.tick(1);
  expect(
    await db.repository('userTasks').count({
      filter: {
        sourceType: 'oa.itRepair',
        userId: e1.userId,
        status: 'pending',
      },
    }),
  ).toBe(0);
  expect(
    (
      await db
        .repository('itRepairGroups')
        .findOne({ filter: { id: 'edge-network' } })
    )?.routingCursor,
  ).toBeNull();
  const after = await db
    .repository<Repair>('itRepairs')
    .findOne({ filter: { id: first.id } });
  for (const key of [
    'number',
    'submittedAt',
    'responseDueAt',
    'resolutionDueAt',
    'calendarSnapshot',
    'ruleSnapshot',
  ] as const)
    expect(after?.[key]).toEqual(base?.[key]);
});
