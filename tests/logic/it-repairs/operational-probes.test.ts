// @vitest-environment node
import { expect, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { Knex } from 'knex';
import { databaseManagerToken } from '@nocobase/db';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { createPlatformAppTest, write } from '../platform/helpers.js';
import { prepareRepairs } from './helpers.js';
import { createEmployee } from '../employees/helpers.js';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
import { ruleServiceToken } from '../../../server/providers/platform/index.js';
import {
  repairServiceToken,
  type Repair,
} from '../../../server/providers/it-repairs/service.js';
import { SUMMARY_FIELDS } from '../../../server/providers/it-repairs/reporting.js';
const test = createPlatformAppTest();
test('a target group disabled during native transfer cannot receive the repair', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    f = await prepareRepairs(testApp),
    auth = c.resolve(authorizationToken),
    k = await createEmployee(testApp, 'Probe security L');
  for (const role of ['handling-leader', 'securityTransfer'])
    await auth.permissionSets.assign({
      permissionSet: `oa-it-repairs-${role}`,
      subject: { type: 'user', id: f.leader.userId },
    });
  const a = await f.a.session(),
    s = await f.admin.session(),
    l = await f.leader.session();
  for (const [id, group] of [
    [
      'probe-normal',
      {
        title: 'Probe normal',
        security: false,
        categories: ['network'],
        leaderIds: [f.leader.userId],
      },
    ],
    [
      'probe-target',
      {
        title: 'Probe security',
        security: true,
        categories: [],
        leaderIds: [k.userId],
      },
    ],
  ] as const)
    expect(
      (
        await s.fetch(
          `/itRepairs/groups/${id}`,
          write('POST', {
            requestKey: randomUUID(),
            expectedVersion: 0,
            active: true,
            engineerIds: [],
            ...group,
          }),
        )
      ).status,
    ).toBe(200);
  await c.resolve(ruleServiceToken).set({
    key: 'itRepair.securityTransfer',
    value: 1,
    actorId: f.admin.userId,
  });
  let row = (
    await (
      await a.fetch(
        '/itRepairs/save',
        write('POST', {
          requestKey: randomUUID(),
          draft: {
            title: 'Probe transfer',
            description: 'Synthetic',
            category: 'network',
            impact: 'partial',
            location: 'Lab',
            contact: '',
            assetId: null,
            occurredAt: null,
          },
        }),
      )
    )
      .json()
      .then((body) => body as { data: Repair })
  ).data;
  row = (
    await (
      await a.fetch(
        `/itRepairs/${row.id}/submit`,
        write('POST', {
          requestKey: randomUUID(),
          expectedVersion: row.version,
        }),
      )
    )
      .json()
      .then((body) => body as { data: Repair })
  ).data;
  const audit = c.resolve(auditServiceToken),
    original = audit.record.bind(audit);
  let reached!: () => void, release!: () => void;
  const held = new Promise<void>((r) => {
      reached = r;
    }),
    gate = new Promise<void>((r) => {
      release = r;
    });
  const spy = vi
    .spyOn(audit, 'record')
    .mockImplementation(async (input, tx) => {
      if (
        input.action === 'itRepair.configure' &&
        input.targetId === 'probe-target'
      ) {
        reached();
        await gate;
      }
      return original(input, tx);
    });
  try {
    const config = s.fetch(
      '/itRepairs/groups/probe-target',
      write('POST', {
        requestKey: randomUUID(),
        expectedVersion: 1,
        title: 'Probe security',
        security: true,
        categories: [],
        leaderIds: [k.userId],
        engineerIds: [],
        active: false,
      }),
    );
    await held;
    const transfer = l.fetch(
      `/itRepairs/${row.id}/actions`,
      write('POST', {
        requestKey: randomUUID(),
        expectedVersion: row.version,
        action: 'transferSecurity',
        data: { groupId: 'probe-target', reason: 'Synthetic boundary' },
      }),
    );
    const knex = await db.connection().client<Knex>();
    let waits: unknown[] = [];
    const until = Date.now() + 2000;
    while (!waits.length && Date.now() < until) {
      waits = (
        await knex.raw(
          "SELECT wait_event FROM pg_stat_activity WHERE datname=current_database() AND pid<>pg_backend_pid() AND wait_event_type='Lock'",
        )
      ).rows;
      if (!waits.length) await new Promise((r) => setTimeout(r, 10));
    }
    release();
    expect((await config).status).toBe(200);
    expect([400, 403]).toContain((await transfer).status);
    expect(
      await db.repository('itRepairs').findOne({ filter: { id: row.id } }),
    ).toMatchObject({ groupId: 'probe-normal', version: row.version });
    expect(
      await db
        .repository('auditLogs')
        .count({ filter: { action: 'itRepair.transferSecurity' } }),
    ).toBe(0);
  } finally {
    release();
    spy.mockRestore();
  }
});
test('rated cohort cannot filter by an unreadable metric field', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    f = await prepareRepairs(testApp);
  await expect(
    c.resolve(repairServiceToken).query.list(
      f.a.userId,
      {
        read: {
          scope: { requesterId: f.a.userId },
          fields: [...SUMMARY_FIELDS],
        },
        create: false,
        update: false,
        delete: false,
      },
      1,
      20,
      { cohort: 'rated' },
    ),
  ).rejects.toMatchObject({ code: 'FIELD_READ_FORBIDDEN' });
});
