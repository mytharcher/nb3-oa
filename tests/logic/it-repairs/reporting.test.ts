import { ruleServiceToken } from '../../../server/providers/platform/index.js';
// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect, vi } from 'vitest';
import { createAppTest } from '@nocobase/app-testing/server';
import { databaseManagerToken } from '@nocobase/db';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { createStandaloneServer } from '../../../server/standalone.js';
import { OA_TEST_DATABASE_ENV, OA_TEST_SERVER } from '../oa-test-origin.js';
import { write, ORIGIN } from '../platform/helpers.js';
import { prepareRepairs } from './helpers.js';
import { createEmployee } from '../employees/helpers.js';
import type { Repair } from '../../../server/providers/it-repairs/service.js';
import { repairServiceToken } from '../../../server/providers/it-repairs/service.js';
const test = createAppTest({
  createServer: createStandaloneServer,
  env: OA_TEST_DATABASE_ENV,
  server: OA_TEST_SERVER,
  config: {
    secrets: { keys: [{ version: 1, key: 'q'.repeat(64) }] },
    app: { publicOrigin: ORIGIN },
    oaApprovals: { inbox: 'demo-inbox' },
  },
});

test('T09–T12 native cohorts, median/P90, zero samples, scoped CSV and independent export permission', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    f = await prepareRepairs(testApp),
    authz = c.resolve(authorizationToken),
    db = c.resolve(databaseManagerToken),
    svc = c.resolve(repairServiceToken),
    e1 = await createEmployee(testApp, 'Report E1');
  for (const [p, role] of [
    [f.a, 'handling-employee'],
    [f.b, 'handling-employee'],
    [f.a, 'reportEmployee'],
    [f.b, 'reportEmployee'],
    [f.leader, 'handling-leader'],
    [f.leader, 'handling-exception'],
    [f.leader, 'reportLeader'],
    [e1, 'handling-engineer'],
  ] as const)
    await authz.permissionSets.assign({
      permissionSet: `oa-it-repairs-${role}`,
      subject: { type: 'user', id: p.userId },
    });
  const a = await f.a.session(),
    b = await f.b.session(),
    l = await f.leader.session(),
    e = await e1.session(),
    s = await f.admin.session();
  expect(
    (
      await s.fetch(
        '/itRepairs/groups/report',
        write('POST', {
          requestKey: randomUUID(),
          expectedVersion: 0,
          title: 'Report IT',
          leaderIds: [f.leader.userId],
          engineerIds: [e1.userId],
          categories: ['network'],
          active: true,
        }),
      )
    ).status,
  ).toBe(200);
  await c.resolve(ruleServiceToken).set({
    key: 'calendar.timeZone',
    value: 'Asia/Singapore',
    actorId: f.admin.userId,
  });
  const at = (time: string) =>
    vi.setSystemTime(new Date(`2026-11-${time}+08:00`));
  const create = async (session = a, title = 'Report fixture') => {
    at('02T09:00:00');
    const saved = (
      await (
        await session.fetch(
          '/itRepairs/save',
          write('POST', {
            requestKey: randomUUID(),
            draft: {
              title,
              description: 'Only public synthetic fault',
              category: 'network',
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
    const r = await session.fetch(
      `/itRepairs/${saved.id}/submit`,
      write('POST', {
        requestKey: randomUUID(),
        expectedVersion: saved.version,
      }),
    );
    expect(r.status).toBe(200);
    return (await r.json()).data as Repair;
  };
  const act = async (
    row: Repair,
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
    expect(r.status).toBe(200);
    return (await r.json()).data as Repair;
  };
  vi.useFakeTimers({ toFake: ['Date'] });
  try {
    for (let i = 0; i < 5; i++) {
      let row = await create(a, i === 0 ? '=SYNTHETIC()' : `Report ${i}`);
      at(`02T${[10, 11, 12, 15, 16][i]}:00:00`);
      row = await act(row, l, 'triage', {
        priority: 'P3',
        advice: 'Investigate',
        assigneeId: e1.userId,
      });
      row = await act(row, e, 'start');
      if (i === 0)
        row = await act(row, e, 'internal', {
          message: 'PRIVATE-REPORT-SECRET',
        });
      at(i === 3 ? '04T10:00:00' : '02T17:00:00');
      row = await act(row, e, 'resolve', {
        cause: 'Cause',
        solution: 'Solution',
        completion: 'Done',
        resultType: 'restored',
      });
      if (i < 4)
        await act(row, a, 'accept', i < 2 ? { rating: i === 0 ? 4 : 5 } : {});
    }
    let row = await create();
    at('02T10:00:00');
    await act(row, l, 'manageClose', {
      reason: 'Exception',
      completion: 'Management result',
    });
    row = await create();
    at('02T11:00:00');
    await act(row, a, 'cancel', { reason: 'Withdraw' });
    await create();
    await create(b, 'B-only hidden repair');
    at('04T17:00:00');
    const query = 'from=2026-11-01T16%3A00%3A00Z&to=2026-11-05T16%3A00%3A00Z';
    const response = await a.fetch(`/itRepairs/reports?${query}`);
    expect(response.status).toBe(200);
    const r = (await response.json()).data;
    expect(r.counts).toMatchObject({
      submitted: 8,
      responses: 5,
      responseMet: 3,
      userClosed: 4,
      solutionMet: 3,
      managementClosed: 1,
      cancelled: 1,
      currentOpen: 2,
      responseOverdue: 1,
      solutionOverdue: 1,
      rated: 2,
    });
    expect(r.responseRate).toBe(0.6);
    expect(r.solutionRate).toBe(0.75);
    expect(r.satisfaction).toBe(4.5);
    expect(r.participation).toBe(0.5);
    const overdueReport = (
      await (
        await a.fetch(`/itRepairs/reports?${query}&overdue=response`)
      ).json()
    ).data;
    expect(overdueReport.counts.submitted).toBe(1);
    expect(overdueReport.counts.responses).toBe(0);
    const overdueList = (
      await (await a.fetch(`/itRepairs?${query}&overdue=response`)).json()
    ).data;
    expect(overdueList.total).toBe(overdueReport.counts.submitted);

    expect(r.durations.responseHours).toMatchObject({
      samples: 5,
      mean: 3.4,
      median: 3,
      p90: 6,
    });
    expect(r.durations.solutionHours).toMatchObject({
      samples: 4,
      mean: 9.5,
      median: 7,
      p90: 17,
    });
    const empty = (
      await (
        await a.fetch(
          '/itRepairs/reports?from=2027-01-01T00%3A00%3A00Z&to=2027-02-01T00%3A00%3A00Z',
        )
      ).json()
    ).data;
    expect(empty.responseRate).toBeNull();
    expect(empty.solutionRate).toBeNull();
    expect(empty.satisfaction).toBeNull();
    expect(empty.durations.solutionHours).toMatchObject({
      samples: 0,
      mean: null,
      median: null,
      p90: null,
    });
    expect(empty.counts.currentOpen).toBe(2);
    const exportKey = randomUUID();
    const download = () =>
      a.fetch(
        '/itRepairs/export',
        write('POST', {
          requestKey: exportKey,
          query: { from: '2026-11-01T16:00:00Z', to: '2026-11-05T16:00:00Z' },
        }),
      );
    let exported = await download();
    expect(exported.status).toBe(200);
    expect(exported.headers.get('content-type')).toContain('text/csv');
    const csv = await exported.text();
    expect(csv).not.toContain('B-only');
    expect(csv).not.toContain('PRIVATE-REPORT-SECRET');
    expect(csv).toContain("'=SYNTHETIC()");
    expect(csv.trim().split('\r\n')).toHaveLength(9);
    exported = await download();
    expect(exported.status).toBe(200);
    await exported.text();
    expect(
      await db
        .repository('auditLogs')
        .count({ filter: { action: 'itRepair.export', actorId: f.a.userId } }),
    ).toBe(1);
    const br = (await (await b.fetch(`/itRepairs/reports?${query}`)).json())
      .data;
    expect(br.counts.submitted).toBe(1);
    const lr = (await (await l.fetch(`/itRepairs/reports?${query}`)).json())
      .data;
    expect(lr.counts.submitted).toBe(9);
    const scoped = await a.fetch('/itRepairs?cohort=userClosed');
    expect((await scoped.json()).data.total).toBe(4);
    const grouped = await a.fetch('/itRepairs/queryOptions');
    expect(grouped.status).toBe(200);
    expect((await grouped.json()).data.timeZone).toBe('Asia/Singapore');
    for (const session of [e, s]) {
      expect((await session.fetch('/itRepairs/reports')).status).toBe(403);
      expect(
        (
          await session.fetch(
            '/itRepairs/export',
            write('POST', { requestKey: randomUUID(), query: {} }),
          )
        ).status,
      ).toBe(403);
    }
    expect(
      (
        await a.fetch(
          '/itRepairs?from=2026-11-05T00%3A00%3A00Z&to=2026-11-01T00%3A00%3A00Z',
        )
      ).status,
    ).toBe(400);
    const filtered = await a.fetch(
      `/itRepairs?cohort=userClosed&status=closed&groupId=report&assigneeId=${e1.userId}&category=network&priority=P3&sort=resolutionDueAt&direction=asc&pageSize=2`,
    );
    const firstPage = (await filtered.json()).data;
    expect(firstPage.total).toBe(4);
    expect(firstPage.items).toHaveLength(2);
    const secondPage = (
      await (
        await a.fetch(
          `/itRepairs?cohort=userClosed&status=closed&groupId=report&assigneeId=${e1.userId}&category=network&priority=P3&sort=resolutionDueAt&direction=asc&pageSize=2&page=2`,
        )
      ).json()
    ).data;
    expect(secondPage.items).toHaveLength(2);
    expect(
      new Set(
        [...firstPage.items, ...secondPage.items].map(
          (item: Repair) => item.id,
        ),
      ).size,
    ).toBe(4);
    // Synthetic legacy rows exercise the native query adapter's second CSV batch
    // and bounded projection migration without fabricating business transitions.
    const template = await db
      .repository<Repair>('itRepairs')
      .findOne({ filter: { status: 'closed', requesterId: f.a.userId } });
    const clones = Array.from({ length: 101 }, (_, i) => ({
      ...template!,
      id: randomUUID(),
      number: `CSV-${i}`,
      title: `Bulk query ${i}`,
      metricRevision: i === 0 ? null : 1,
    }));
    await db.repository('itRepairs').createMany({ values: clones });
    expect((await a.fetch('/itRepairs/reports?q=Bulk')).status).toBe(503);
    expect(await svc.rebuildMetrics(1)).toBe(1);
    const recovered = await db
      .repository<Repair>('itRepairs')
      .findOne({ filter: { id: clones[0].id } });
    expect(recovered).toMatchObject({
      version: template!.version,
      number: 'CSV-0',
      metricRevision: 1,
    });
    expect(String(recovered!.submittedAt)).toBe(String(template!.submittedAt));
    expect((await a.fetch('/itRepairs/reports?q=Bulk')).status).toBe(200);
    const pagedCsv = await a.fetch(
      '/itRepairs/export',
      write('POST', { requestKey: randomUUID(), query: { q: 'Bulk' } }),
    );
    expect(pagedCsv.status).toBe(200);
    const lines = (await pagedCsv.text()).trim().split('\r\n');
    expect(lines).toHaveLength(102);
    expect(new Set(lines.slice(1)).size).toBe(101);
    const ruleScope = {
      read: { scope: { requesterId: f.a.userId }, fields: ['id'] },
      create: false,
      update: false,
      delete: false,
    } as const;
    await expect(
      svc.query.reports(f.a.userId, ruleScope, {}),
    ).rejects.toMatchObject({ code: 'ACCESS_DENIED' });
  } finally {
    vi.useRealTimers();
  }
});
