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
import { repairServiceToken } from '../../../server/providers/it-repairs/service.js';
const test = createAppTest({
  createServer: createStandaloneServer,
  env: OA_TEST_DATABASE_ENV,
  server: OA_TEST_SERVER,
  config: {
    secrets: { keys: [{ version: 1, key: 'c'.repeat(64) }] },
    app: { publicOrigin: ORIGIN },
    oaApprovals: { inbox: 'demo-inbox' },
  },
});
test('T03–T08 frozen clocks, approved pause, acceptance return, priority and restart-safe alerts', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    svc = c.resolve(repairServiceToken),
    f = await prepareRepairs(testApp),
    e1 = await createEmployee(testApp, 'Clock E1'),
    authz = c.resolve(authorizationToken);
  for (const [p, role] of [
    [f.a, 'employee'],
    [f.leader, 'leader'],
    [e1, 'engineer'],
  ] as const)
    await authz.permissionSets.assign({
      permissionSet: `oa-it-repairs-handling-${role}`,
      subject: { type: 'user', id: p.userId },
    });
  const a = await f.a.session(),
    l = await f.leader.session(),
    e = await e1.session(),
    s = await f.admin.session();
  expect(
    (
      await s.fetch(
        '/itRepairs/groups/clocks',
        write('POST', {
          requestKey: randomUUID(),
          expectedVersion: 0,
          title: 'Clock IT',
          leaderIds: [f.leader.userId],
          engineerIds: [e1.userId],
          categories: ['network'],
          active: true,
        }),
      )
    ).status,
  ).toBe(200);
  const at = (time: string) =>
    vi.setSystemTime(new Date(`2026-11-${time}+08:00`));
  vi.useFakeTimers({ toFake: ['Date'] });
  try {
    let row: Record<string, any>;
    const create = async () => {
      at('02T09:00:00');
      const save = (
        await (
          await a.fetch(
            '/itRepairs/save',
            write('POST', {
              requestKey: randomUUID(),
              draft: {
                title: 'Clock fault',
                description: 'Synthetic clock case',
                category: 'network',
                impact: 'partial',
                location: 'Test',
                contact: '',
                occurredAt: null,
                assetId: null,
              },
            }),
          )
        ).json()
      ).data;
      row = (
        await (
          await a.fetch(
            `/itRepairs/${save.id}/submit`,
            write('POST', {
              requestKey: randomUUID(),
              expectedVersion: save.version,
            }),
          )
        ).json()
      ).data;
      return row;
    };
    const act = async (
      session: typeof a,
      action: string,
      data: Record<string, unknown> = {},
    ) => {
      const r = await session.fetch(
        `/itRepairs/${row.id}/actions`,
        write('POST', {
          requestKey: randomUUID(),
          expectedVersion: row.version,
          action,
          data,
        }),
      );
      expect({ status: r.status, body: await r.clone().json() }).toMatchObject({
        status: 200,
      });
      row = (await r.json()).data;
    };
    const refresh = async () => {
      row = (await (await a.fetch(`/itRepairs/${row.id}`)).json()).data;
    };
    const alerts = async () =>
      await db
        .repository('itRepairEvents')
        .findMany({ filter: { repairId: row.id, type: 'alert' } });
    const result = {
      cause: 'Cause',
      solution: 'Solution',
      completion: 'Done',
      resultType: 'restored',
    };
    const assign = async () => {
      await act(l, 'triage', {
        priority: 'P3',
        advice: 'Check the test connection',
        assigneeId: e1.userId,
      });
      await act(e, 'start');
    };
    await create();
    const beforeQuietSweep = await db
      .repository('oaLifecycleEffectRuns')
      .count();
    at('02T12:00:00');
    await svc.tick();
    expect(await alerts()).toHaveLength(0);
    at('02T13:11:00');
    await svc.tick();
    expect(await alerts()).toHaveLength(0);
    expect(await db.repository('oaLifecycleEffectRuns').count()).toBe(
      beforeQuietSweep,
    );
    at('02T13:12:00');
    await svc.tick();
    expect(
      (await alerts()).map((x) => (x.data as { key: string }).key),
    ).toEqual(['response80']);
    at('02T14:00:00');
    await svc.tick();
    const n = (await alerts()).length;
    await svc.tick();
    expect(await alerts()).toHaveLength(n);
    expect(
      (await alerts()).some(
        (x) => (x.data as { key: string }).key === 'responseOverdue',
      ),
    ).toBe(true);
    await refresh();
    await act(a, 'cancel', { reason: 'Close timer fixture' });
    // T05: 6 hours consumed; only the 5 hours after approval are excluded.
    await create();
    await assign();
    const first = row.processing.firstResponseAt;
    at('02T16:00:00');
    await act(e, 'internal', {
      message: 'Internal does not overwrite first response',
    });
    expect(row.processing.firstResponseAt).toBe(first);
    await act(e, 'wait', {
      reason: 'Vendor response',
      party: 'vendor',
      followUpAt: '2026-11-03T13:00:00+08:00',
      pauseRequested: true,
    });
    expect(row.processing.runningSince).toBeUndefined();
    await act(l, 'approvePause', { reason: 'External dependency confirmed' });
    expect(row.processing.consumedHours).toBe(6);
    at('03T13:00:00');
    await svc.tick();
    await refresh();
    await act(e, 'resume', { reason: 'Vendor responded' });
    expect(row.processing).toMatchObject({ consumedHours: 6, pausedHours: 5 });
    expect(row.resolutionDueAt).toBe('2026-11-04T07:00:00.000Z');
    await act(a, 'cancel', { reason: 'Stop fixture' });
    await act(l, 'reviewCancel', { reason: 'Approved', approve: true });
    // T06: 6 + 2 hours, excluding three hours of acceptance waiting.
    await create();
    await assign();
    at('02T16:00:00');
    await act(e, 'resolve', result);
    at('03T10:00:00');
    await act(a, 'return', { reason: 'Still fails' });
    expect(row.processing.acceptanceHours).toBe(3);
    at('03T12:00:00');
    await act(e, 'resolve', result);
    expect(row.processing.consumedHours).toBe(8);
    await act(a, 'accept');
    // T07: changing the priority never resets the original start or erases a breach.
    await create();
    at('02T15:00:00');
    await act(l, 'priority', { priority: 'P1', reason: 'Impact increased' });
    expect(row.responseDueAt).toBe('2026-11-02T02:00:00.000Z');
    expect(row.resolutionDueAt).toBe('2026-11-02T06:00:00.000Z');
    await svc.tick();
    await refresh();
    const keys = (await alerts()).map((x) => (x.data as { key: string }).key);
    expect(keys).toContain('responseOverdue');
    expect(keys).toContain('resolutionOverdue');
    const count = keys.length;
    await svc.tick();
    expect(await alerts()).toHaveLength(count);
    await act(a, 'cancel', { reason: 'Stop fixture' });
    // T08: a service start uses the same durable index; repeated catch-up cannot close or duplicate.
    await create();
    await assign();
    at('02T16:00:00');
    await act(e, 'resolve', result);
    expect(row.processing.acceptanceDueAt).toBe('2026-11-04T08:00:00.000Z');
    at('04T16:00:00');
    const { createRepairService } =
      await import('../../../server/providers/it-repairs/service.js');
    const { auditServiceToken } =
      await import('../../../server/providers/audit/index.js');
    const { employeeServiceToken } =
      await import('../../../server/providers/employees/contract.js');
    const { orgServiceToken } =
      await import('../../../server/providers/org/contract.js');
    const { assetServiceToken } =
      await import('../../../server/providers/assets/contract.js');
    const {
      ruleServiceToken,
      sequenceServiceToken,
      dictionaryServiceToken,
      calendarServiceToken,
    } = await import('../../../server/providers/platform/index.js');
    const { userAdministrationServiceToken } =
      await import('@nocobase/app-plugin-authentication');
    const { createUserTaskService } =
      await import('@nocobase/app-plugin-task-center/server');
    const { serverFileRepositoryManagerToken } =
      await import('@nocobase/app-plugin-file/server');
    const restarted = createRepairService({
      db,
      audit: c.resolve(auditServiceToken),
      employees: c.resolve(employeeServiceToken),
      org: c.resolve(orgServiceToken),
      users: c.resolve(userAdministrationServiceToken),
      assets: c.resolve(assetServiceToken),
      calendar: c.resolve(calendarServiceToken),
      rules: c.resolve(ruleServiceToken),
      sequences: c.resolve(sequenceServiceToken),
      dictionaries: c.resolve(dictionaryServiceToken),
      files: c.resolve(serverFileRepositoryManagerToken),
      writer: createUserTaskService(db).registerSource('oa.itRepair'),
      notify: async () => {},
      dispatcher: { dispatch: async () => {} },
    });
    await restarted.tick();
    await svc.tick();
    await refresh();
    expect(row.status).toBe('acceptance');
    expect(
      (await alerts()).filter(
        (x) => (x.data as { key: string }).key === 'acceptance:1',
      ),
    ).toHaveLength(1);
    await svc.tick();
    expect(
      (await alerts()).filter(
        (x) => (x.data as { key: string }).key === 'acceptance:1',
      ),
    ).toHaveLength(1);
    await refresh();
    await act(a, 'cancel', { reason: 'Awaiting cancellation review' });
    at('06T16:00:00');
    await svc.tick();
    await refresh();
    expect(row.status).toBe('acceptance');
    expect(row.processing.cancelPending).toBe(true);
    expect(
      (await alerts()).filter((x) =>
        String((x.data as { key: string }).key).startsWith('cancelFollowUp:'),
      ),
    ).toHaveLength(1);
  } finally {
    vi.useRealTimers();
  }
}, 60000);
