// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { expect, vi } from 'vitest';
import { createAppTest } from '@nocobase/app-testing/server';
import { databaseManagerToken } from '@nocobase/db';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { inAppNotificationStoreToken } from '@nocobase/app-plugin-notification-in-app/server';
import { notificationServiceToken } from '@nocobase/app-plugin-notification/server';
import { createStandaloneServer } from '../../../server/standalone.js';
import { OA_TEST_DATABASE_ENV, OA_TEST_SERVER } from '../oa-test-origin.js';
import { ORIGIN, write } from '../platform/helpers.js';
import { createEmployee } from '../employees/helpers.js';
import { prepareRepairs } from './helpers.js';
import {
  repairServiceToken,
  type Repair,
} from '../../../server/providers/it-repairs/service.js';
import { auditServiceToken } from '../../../server/providers/audit/index.js';

const test = createAppTest({
  createServer: createStandaloneServer,
  env: OA_TEST_DATABASE_ENV,
  server: OA_TEST_SERVER,
  config: {
    secrets: { keys: [{ version: 1, key: 'n'.repeat(64) }] },
    app: { publicOrigin: ORIGIN },
    oaApprovals: { inbox: 'demo-inbox' },
  },
});
async function setup(
  testApp: Parameters<typeof prepareRepairs>[0],
  category = 'network',
) {
  const c = testApp.application.container,
    f = await prepareRepairs(testApp),
    e1 = await createEmployee(testApp, 'Notice E1'),
    e2 = await createEmployee(testApp, 'Notice E2'),
    authz = c.resolve(authorizationToken);
  for (const [person, role] of [
    [f.a, 'employee'],
    [f.b, 'employee'],
    [f.leader, 'leader'],
    [e1, 'engineer'],
    [e2, 'engineer'],
  ] as const)
    await authz.permissionSets.assign({
      permissionSet: `oa-it-repairs-handling-${role}`,
      subject: { type: 'user', id: person.userId },
    });
  const a = await f.a.session(),
    b = await f.b.session(),
    l = await f.leader.session(),
    e = await e1.session(),
    other = await e2.session(),
    s = await f.admin.session();
  const group = {
    title: 'Notice IT',
    leaderIds: [f.leader.userId],
    engineerIds: [e1.userId, e2.userId],
    categories: [category],
    active: true,
  };
  expect(
    (
      await s.fetch(
        `/itRepairs/groups/notice-${category}`,
        write('POST', {
          ...group,
          expectedVersion: 0,
          requestKey: randomUUID(),
        }),
      )
    ).status,
  ).toBe(200);
  const create = async (session = a) => {
    const saved = (
      await (
        await session.fetch(
          '/itRepairs/save',
          write('POST', {
            requestKey: randomUUID(),
            draft: {
              title: 'Synthetic timing',
              description: 'Synthetic fault',
              category,
              impact: 'partial',
              location: 'Test',
              contact: '',
              occurredAt: null,
              assetId: null,
            },
          }),
        )
      ).json()
    ).data as Repair;
    return (
      await (
        await session.fetch(
          `/itRepairs/${saved.id}/submit`,
          write('POST', {
            requestKey: randomUUID(),
            expectedVersion: saved.version,
          }),
        )
      ).json()
    ).data as Repair;
  };
  const act = async (
    row: Repair,
    session: typeof a,
    action: string,
    data: Record<string, unknown> = {},
  ) => {
    const res = await session.fetch(
      `/itRepairs/${row.id}/actions`,
      write('POST', {
        requestKey: randomUUID(),
        expectedVersion: row.version,
        action,
        data,
      }),
    );
    expect(res.status).toBe(200);
    return (await res.json()).data as Repair;
  };
  return {
    c,
    f,
    e1,
    e2,
    a,
    b,
    l,
    e,
    other,
    s,
    group,
    groupId: `notice-${category}`,
    create,
    act,
    db: c.resolve(databaseManagerToken),
    svc: c.resolve(repairServiceToken),
  };
}

test('R4 native pool and handover notifications survive an accepted-send failure without restoring access', async ({
  testApp,
}) => {
  const h = await setup(testApp),
    { c, db, svc, create, act, a, l, e, other, e1, e2 } = h,
    inbox = c.resolve(inAppNotificationStoreToken),
    notifications = c.resolve(notificationServiceToken);
  let row = await create();
  const count = async (id: string) =>
    (await inbox.list({ userId: id, limit: 100 })).filter((m) =>
      m.body.includes(row.number!),
    ).length;
  await expect
    .poll(async () =>
      (await svc.runtime.listEffectRuns({ recordId: row.id })).every(
        (r) => r.status === 'succeeded',
      ),
    )
    .toBe(true);
  const oldRuns = new Set(
    (await svc.runtime.listEffectRuns({ recordId: row.id })).map((r) => r.id),
  );
  const send = notifications.send.bind(notifications);
  let failed = false;
  const fault = vi
    .spyOn(notifications, 'send')
    .mockImplementation(async (input) => {
      const result = await send(input);
      const message = input.messages['demo-inbox'] as { to: string[] };
      if (!failed && message.to.includes(e1.userId)) {
        failed = true;
        throw Error('Accepted then interrupted');
      }
      return result;
    });
  try {
    row = await act(row, l, 'triage', {
      priority: 'P3',
      advice: 'Check connection',
    });
    await expect.poll(() => failed).toBe(true);
    const pending = () => svc.runtime.listEffectRuns({ recordId: row.id });
    await expect
      .poll(
        async () => (await pending()).find((r) => !oldRuns.has(r.id))?.status,
      )
      .toBe('queued');
    const run = (await pending()).find((r) => !oldRuns.has(r.id))!;
    fault.mockRestore();
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      vi.setSystemTime(Date.now() + 60000);
      await svc.runtime.runEffect(run.id);
    } finally {
      vi.useRealTimers();
    }
    await expect.poll(() => count(e1.userId)).toBe(1);
    await expect.poll(() => count(e2.userId)).toBe(1);
    await svc.runtime.runEffect(run.id);
    expect(await count(e1.userId)).toBe(1);
    expect(await count(e2.userId)).toBe(1);
    row = await act(row, l, 'assign', {
      assigneeId: e1.userId,
      reason: 'Assign E1',
    });
    await expect.poll(() => count(e1.userId)).toBe(2);
    const beforeTransfer = await count(e1.userId);
    const beforeRuns = new Set(
      (await svc.runtime.listEffectRuns({ recordId: row.id })).map((r) => r.id),
    );
    let transferInterrupted = false;
    const transferFault = vi
      .spyOn(notifications, 'send')
      .mockImplementation(async (input) => {
        const result = await send(input);
        const message = input.messages['demo-inbox'] as {
          target?: { path?: string };
        };
        if (!transferInterrupted && message.target?.path === '/it-repairs') {
          transferInterrupted = true;
          throw Error('Handover accepted then interrupted');
        }
        return result;
      });
    let transferRun: string;
    try {
      row = await act(row, l, 'assign', {
        assigneeId: e2.userId,
        reason: 'Handover to E2',
      });
      await expect.poll(() => transferInterrupted).toBe(true);
      await expect
        .poll(
          async () =>
            (await svc.runtime.listEffectRuns({ recordId: row.id })).find(
              (r) => !beforeRuns.has(r.id),
            )?.status,
        )
        .toBe('queued');
      transferRun = (
        await svc.runtime.listEffectRuns({ recordId: row.id })
      ).find((r) => !beforeRuns.has(r.id))!.id;
    } finally {
      transferFault.mockRestore();
    }
    const newCount = await count(e2.userId);
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      vi.setSystemTime(Date.now() + 60000);
      await svc.runtime.runEffect(transferRun);
    } finally {
      vi.useRealTimers();
    }
    expect(await count(e2.userId)).toBe(newCount);
    await expect.poll(() => count(e1.userId)).toBe(beforeTransfer + 1);
    const handovers = (
      await inbox.list({ userId: e1.userId, limit: 100 })
    ).filter(
      (m) => m.target?.type === 'route' && m.target.path === '/it-repairs',
    );
    expect(handovers.length).toBe(1);
    expect((await e.fetch(`/itRepairs/${row.id}`)).status).toBe(403);
    expect((await e.fetch(`/itRepairs/${row.id}/handling`)).status).toBe(403);
    expect((await other.fetch(`/itRepairs/${row.id}`)).status).toBe(200);
    const saved = await db
      .repository<Repair>('itRepairs')
      .findOne({ filter: { id: row.id } });
    expect(saved?.processing?.handoverRecipients).toEqual([e1.userId]);
    expect(row.processing?.noticeRecipients).toBeUndefined();
    expect(
      (await (await a.fetch(`/itRepairs/${row.id}`)).json()).data.processing
        .handoverRecipients,
    ).toBeUndefined();
  } finally {
    fault.mockRestore();
    vi.useRealTimers();
  }
});

test('R5/R6 settle crossed thresholds before completion, pause and termination, and freeze completed targets', async ({
  testApp,
}) => {
  const { c, db, svc, create, act, a, l, e, e1 } = await setup(
    testApp,
    'device',
  );
  const at = (time: string) =>
    vi.setSystemTime(new Date(`2026-11-${time}+08:00`));
  const keys = async (row: Repair) =>
    (
      await db
        .repository('itRepairEvents')
        .findMany({ filter: { repairId: row.id, type: 'alert' } })
    ).map((x) => (x.data as { key: string }).key);
  const refresh = async (row: Repair) =>
    (await (await a.fetch(`/itRepairs/${row.id}`)).json()).data as Repair;
  vi.useFakeTimers({ toFake: ['Date'] });
  try {
    at('02T09:00:00');
    let row = await create();
    at('02T15:00:00');
    const lateData = {
        priority: 'P3',
        advice: 'Late first response',
        assigneeId: e1.userId,
      },
      lateKey = randomUUID(),
      lateVersion = row.version;
    const lateReply = () =>
      l.fetch(
        `/itRepairs/${row.id}/actions`,
        write('POST', {
          requestKey: lateKey,
          expectedVersion: lateVersion,
          action: 'triage',
          data: lateData,
        }),
      );
    const audit = c.resolve(auditServiceToken),
      record = audit.record.bind(audit);
    const fault = vi
      .spyOn(audit, 'record')
      .mockImplementation(async (entry, tx) => {
        if (entry.action === 'itRepair.triage' && entry.targetId === row.id)
          throw Error('Threshold settlement rollback');
        return record(entry, tx);
      });
    try {
      expect((await lateReply()).status).toBe(500);
    } finally {
      fault.mockRestore();
    }
    expect(await keys(row)).toHaveLength(0);
    expect(
      (
        await db
          .repository<Repair>('itRepairs')
          .findOne({ filter: { id: row.id } })
      )?.processing?.firstResponseAt,
    ).toBeUndefined();
    const completed = await lateReply();
    expect(completed.status).toBe(200);
    row = (await completed.json()).data as Repair;
    expect((await lateReply()).status).toBe(200);
    expect(await keys(row)).toHaveLength(2);
    expect(await keys(row)).toEqual(
      expect.arrayContaining(['response80', 'responseOverdue']),
    );
    const first = row.processing?.firstResponseAt,
      due = row.responseDueAt;
    expect(row.processing?.responseTargetHours).toBe(4);
    row = await act(row, l, 'priority', {
      priority: 'P1',
      reason: 'Escalate remaining solution',
    });
    expect(row.responseDueAt).toBe(due);
    expect(row.processing?.firstResponseAt).toBe(first);
    expect(row.processing?.responseTargetHours).toBe(4);
    row = await act(row, l, 'priority', {
      priority: 'P4',
      reason: 'Lower unfinished target',
    });
    expect(row.responseDueAt).toBe(due);
    row = await act(row, l, 'priority', {
      priority: 'P1',
      reason: 'Urgent unfinished solution',
    });
    row = await act(row, e, 'start');
    at('02T16:00:00'); // Six working hours, with no scan before completing the P1 solution.
    row = await act(row, e, 'resolve', {
      cause: 'Cause',
      solution: 'Solution',
      completion: 'Done',
      resultType: 'restored',
    });
    expect(await keys(row)).toEqual(
      expect.arrayContaining(['resolution80', 'resolutionOverdue']),
    );
    const solvedDue = row.resolutionDueAt,
      solvedTarget = row.processing?.resolutionTargetHours;
    row = await act(row, l, 'priority', {
      priority: 'P1',
      reason: 'Completed round stays frozen',
    });
    expect(row.resolutionDueAt).toBe(solvedDue);
    expect(row.processing?.resolutionTargetHours).toBe(solvedTarget);
    const metricFacts = (await keys(row)).filter((k) =>
      /^(response|resolution)/.test(k),
    );
    await svc.tick();
    at('03T17:00:00');
    await svc.tick();
    expect(
      (await keys(row)).filter((k) => /^(response|resolution)/.test(k)),
    ).toEqual(metricFacts);
    row = await refresh(row);
    row = await act(row, a, 'accept');
    expect(row.nextDueAt).toBeNull();

    at('02T09:00:00');
    row = await create();
    row = await act(row, l, 'triage', {
      priority: 'P1',
      advice: 'Investigate',
      assigneeId: e1.userId,
    });
    row = await act(row, e, 'start');
    row = await act(row, e, 'wait', {
      reason: 'Vendor response',
      party: 'vendor',
      followUpAt: '2026-11-04T10:00:00+08:00',
      pauseRequested: true,
    });
    at('02T15:00:00');
    row = await act(row, l, 'approvePause', {
      reason: 'External dependency approved',
    });
    expect(await keys(row)).toEqual(
      expect.arrayContaining(['resolution80', 'resolutionOverdue']),
    );
    const before = (await keys(row)).length;
    await svc.tick();
    expect((await keys(row)).length).toBe(before);

    at('02T09:00:00');
    row = await create();
    at('02T15:00:00');
    const beforeTerminate = await db
      .repository('oaLifecycleEffectRuns')
      .count();
    row = await act(row, a, 'cancel', { reason: 'Withdraw before next sweep' });
    expect(row.status).toBe('cancelled');
    expect(await keys(row)).toEqual(
      expect.arrayContaining(['response80', 'responseOverdue']),
    );
    const terminal = await keys(row);
    at('04T17:00:00');
    await svc.tick();
    expect(await keys(row)).toEqual(terminal);
    expect(
      await db.repository('oaLifecycleEffectRuns').count(),
    ).toBeGreaterThanOrEqual(beforeTerminate + 1);
  } finally {
    vi.useRealTimers();
  }
});

test('S1 same-group actions overlap, while group configuration waits and revokes qualification', async ({
  testApp,
}) => {
  const { c, db, a, b, l, s, group, groupId, create, act } = await setup(
      testApp,
      'software',
    ),
    audit = c.resolve(auditServiceToken);
  const first = await create(a),
    second = await create(b);
  let release!: () => void, entered!: () => void;
  const held = new Promise<void>((r) => {
      release = r;
    }),
    ready = new Promise<void>((r) => {
      entered = r;
    });
  const record = audit.record.bind(audit);
  const spy = vi
    .spyOn(audit, 'record')
    .mockImplementation(async (entry, tx) => {
      if (entry.action === 'itRepair.comment' && entry.targetId === first.id) {
        entered();
        await held;
      }
      return record(entry, tx);
    });
  let pending: ReturnType<typeof act> | undefined;
  try {
    pending = act(first, l, 'comment', { message: 'Held transaction' });
    await ready;
    const start = performance.now();
    await act(second, b, 'comment', { message: 'Independent repair' });
    const overlapMs = performance.now() - start;
    expect(overlapMs).toBeGreaterThanOrEqual(0);
    let configured = false;
    const config = s
      .fetch(
        `/itRepairs/groups/${groupId}`,
        write('POST', {
          ...group,
          leaderIds: [],
          expectedVersion: 1,
          requestKey: randomUUID(),
        }),
      )
      .then((r) => {
        configured = true;
        return r;
      });
    // Observe a real DB lock wait on the dedicated cluster; no fixed sleeps or latency threshold.
    const knex = await db.connection().client<import('knex').Knex>();
    await expect
      .poll(async () =>
        Number(
          (
            await knex.raw(
              "select count(*) as n from pg_stat_activity where datname = current_database() and wait_event_type = 'Lock'",
            )
          ).rows[0].n,
        ),
      )
      .toBeGreaterThan(0);
    expect(configured).toBe(false);
    if (process.env.OA_IT_REPAIR_FENCE_EVIDENCE)
      await writeFile(
        process.env.OA_IT_REPAIR_FENCE_EVIDENCE,
        JSON.stringify({
          overlapMs,
          configurationLockWait: true,
          differentActors: true,
          differentRepairs: true,
        }),
      );
    if (process.env.OA_IT_REPAIR_FENCE_EVIDENCE)
      await writeFile(
        process.env.OA_IT_REPAIR_FENCE_EVIDENCE,
        JSON.stringify({
          overlapMs,
          configurationLockWait: true,
          differentActors: true,
          differentRepairs: true,
        }),
      );
    release();
    await pending;
    expect((await config).status).toBe(200);
    expect((await l.fetch(`/itRepairs/${second.id}`)).status).toBe(403);
    expect(
      (
        await l.fetch(
          `/itRepairs/${second.id}/actions`,
          write('POST', {
            requestKey: randomUUID(),
            expectedVersion: second.version,
            action: 'comment',
            data: { message: 'Stale role' },
          }),
        )
      ).status,
    ).toBe(403);
  } finally {
    release();
    await pending;
    spy.mockRestore();
  }
});
