// @vitest-environment node
/* eslint vitest/no-standalone-expect: ["error", {"additionalTestBlockFunctions": ["benchmark"]}] */
import { createAppTest } from '@nocobase/app-testing/server';
import { expect, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { writeFile, mkdir } from 'node:fs/promises';
import { databaseManagerToken } from '@nocobase/db';
import knexFactory from 'knex';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { createStandaloneServer } from '../../../server/standalone.js';
import {
  OA_TEST_DATABASE_ENV,
  OA_TEST_SERVER,
} from '../../logic/oa-test-origin.js';
import { prepareRepairs } from '../../logic/it-repairs/helpers.js';
import { createEmployee } from '../../logic/employees/helpers.js';
import { write, ORIGIN } from '../../logic/platform/helpers.js';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
import type { Repair } from '../../../server/providers/it-repairs/service.js';
import { createUserTaskService } from '@nocobase/app-plugin-task-center/server';
const test = createAppTest({
  createServer: createStandaloneServer,
  env: OA_TEST_DATABASE_ENV,
  server: OA_TEST_SERVER,
  config: {
    secrets: { keys: [{ version: 1, key: 'g'.repeat(64) }] },
    app: { publicOrigin: ORIGIN },
    oaApprovals: { inbox: 'demo-inbox' },
    itRepairs: { scanEveryMs: 86400000, batchSize: 100 },
  },
});
const benchmark = test.runIf(process.env.OA_IT_REPAIR_OPERATIONS === '1');
benchmark(
  'real 100-record membership configuration blocks a different actor through the PG group fence',
  async ({ testApp }) => {
    const c = testApp.application.container,
      db = c.resolve(databaseManagerToken),
      f = await prepareRepairs(testApp),
      auth = c.resolve(authorizationToken),
      e1 = await createEmployee(testApp, 'Blocking E1'),
      e2 = await createEmployee(testApp, 'Blocking E2');
    await auth.permissionSets.assign({
      permissionSet: 'oa-it-repairs-handling-leader',
      subject: { type: 'user', id: f.leader.userId },
    });
    const a = await f.a.session(),
      s = await f.admin.session(),
      l = await f.leader.session();
    const group = {
      title: 'Blocking group',
      active: true,
      categories: ['network'],
      leaderIds: [f.leader.userId],
      engineerIds: [e1.userId],
    };
    expect(
      (
        await s.fetch(
          '/itRepairs/groups/blocking',
          write('POST', {
            ...group,
            expectedVersion: 0,
            requestKey: randomUUID(),
          }),
        )
      ).status,
    ).toBe(200);
    let row = (
      await (
        await a.fetch(
          '/itRepairs/save',
          write('POST', {
            requestKey: randomUUID(),
            draft: {
              title: 'Blocking fixture',
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
    row = (
      await (
        await l.fetch(
          `/itRepairs/${row.id}/actions`,
          write('POST', {
            requestKey: randomUUID(),
            expectedVersion: row.version,
            action: 'triage',
            data: { advice: 'Synthetic public advice', priority: 'P3' },
          }),
        )
      )
        .json()
        .then((body) => body as { data: Repair })
    ).data;
    const source = (await db
      .repository<Repair>('itRepairs')
      .findOne({ filter: { id: row.id } }))!;
    // The native source plus99 clones are the configured batch; highest UUID is the independent blocked write.
    const rows = Array.from({ length: 100 }, (_, i) => ({
      ...source,
      id: i === 99 ? 'ffffffff-ffff-4fff-afff-ffffffffffff' : randomUUID(),
      number: `BLOCK-${i}`,
    }));
    await db
      .repository('itRepairs')
      .createMany({ values: [rows[0], ...rows.slice(1)] });
    const writer = createUserTaskService(db).registerSource('oa.itRepair');
    await db.transaction(async (tx) => {
      for (const r of rows)
        await writer.put(
          {
            userId: e1.userId,
            sourceKey: r.id,
            subject: 'oa.itRepair',
            status: 'pending',
            title: r.number!,
          },
          tx,
        );
    });
    let reached!: () => void, release!: () => void;
    const held = new Promise<void>((r) => {
        reached = r;
      }),
      gate = new Promise<void>((r) => {
        release = r;
      });
    const audit = c.resolve(auditServiceToken),
      original = audit.record.bind(audit);
    let first = true;
    let firstAuditAt = 0;
    const spy = vi
      .spyOn(audit, 'record')
      .mockImplementation(async (input, tx) => {
        if (first && input.action === 'itRepair.refreshMembership') {
          first = false;
          firstAuditAt = performance.now();
          reached();
          await gate;
        }
        return original(input, tx);
      });
    // Diagnostic connection cannot queue behind the deliberately blocked application pool.
    const knex = knexFactory({
      client: 'pg',
      connection: {
        host: OA_TEST_DATABASE_ENV.POSTGRES_HOST,
        port: Number(OA_TEST_DATABASE_ENV.POSTGRES_PORT),
        user: OA_TEST_DATABASE_ENV.POSTGRES_USER,
        password: OA_TEST_DATABASE_ENV.POSTGRES_PASSWORD,
        database: OA_TEST_DATABASE_ENV.POSTGRES_DATABASE,
      },
      pool: { min: 0, max: 1 },
    });
    try {
      const start = performance.now();
      let configurationMs = 0;
      let lockedWorkMs = 0;
      const config = s
        .fetch(
          '/itRepairs/groups/blocking',
          write('POST', {
            ...group,
            engineerIds: [e2.userId],
            expectedVersion: 1,
            requestKey: randomUUID(),
          }),
        )
        .then((response) => {
          configurationMs = performance.now() - start;
          lockedWorkMs = performance.now() - firstAuditAt;
          return response;
        });
      await held;
      const target = rows[99],
        begin = performance.now();
      const concurrency =
        process.env.OA_CONFIGURATION_CONCURRENCY === '50' ? 50 : 1;
      const targets = [...rows]
        .sort((a, b) => a.id.localeCompare(b.id))
        .slice(-concurrency);
      const blocked = Promise.all(
        targets.map(async (target) => {
          const began = performance.now();
          const response = await l.fetch(
            `/itRepairs/${target.id}/actions`,
            write('POST', {
              requestKey: randomUUID(),
              expectedVersion: target.version,
              action: 'comment',
              data: { message: 'Synthetic concurrent comment' },
            }),
          );
          await response.arrayBuffer();
          return { status: response.status, ms: performance.now() - began };
        }),
      );
      let waits: unknown[] = [];
      const deadline = performance.now() + 2000;
      while (!waits.length && performance.now() < deadline) {
        waits = (
          await knex.raw(
            "SELECT wait_event_type, wait_event FROM pg_stat_activity WHERE datname=current_database() AND pid<>pg_backend_pid() AND wait_event_type='Lock'",
          )
        ).rows;
        if (!waits.length) await new Promise((r) => setTimeout(r, 10));
      }
      release();
      const [configured, writes] = await Promise.all([config, blocked]);
      expect(configured.status).toBe(200);
      expect(writes.map((write) => write.status)).toEqual(
        Array(concurrency).fill(200),
      );
      expect(waits.length).toBeGreaterThan(0);
      const refreshed = await db
        .repository('auditLogs')
        .count({ filter: { action: 'itRepair.refreshMembership' } });
      expect(refreshed).toBe(5);
      const configuredBody = (await configured.json()) as {
        data: { recovery: { hasMore: boolean } };
      };
      expect(configuredBody.data.recovery.hasMore).toBe(true);
      // Old membership is denied before the remaining task indices have caught up.
      expect(
        (await (await e1.session()).fetch(`/itRepairs/${target.id}`)).status,
      ).toBe(403);
      const blockedWriteMs = performance.now() - begin;
      const firstBatchMs = performance.now() - start;
      let batches = 1,
        hasMore = true;
      while (hasMore) {
        const next = await s.fetch(
          '/itRepairs/groups/blocking/recoverRouting',
          write('POST', { requestKey: randomUUID(), expectedVersion: 2 }),
        );
        expect(next.status).toBe(200);
        hasMore = ((await next.json()) as { data: { hasMore: boolean } }).data
          .hasMore;
        expect(++batches).toBeLessThanOrEqual(22);
      }
      expect(
        await db
          .repository('auditLogs')
          .count({ filter: { action: 'itRepair.refreshMembership' } }),
      ).toBe(101 - concurrency);
      for (const r of rows) {
        const tasks = await writer.listBySourceKey(r.id, db.connection());
        expect(
          tasks.filter((t) => t.status === 'pending').map((t) => t.userId),
        ).toEqual([e2.userId]);
      }
      const result = {
        date: new Date().toISOString(),
        fixture:
          '101 same-group pool records;5 per configuration or continuation; old member denied before convergence',
        configurationMs,
        lockedWorkMs,
        lockMeasurement:
          'first membership audit while holding the group fence through configuration response; includes controlled gate, commit and response',
        initialWriteBatchMs: firstBatchMs,
        convergenceMs: performance.now() - start,
        batches,
        blockedWriteMs,
        configurationStatus: configured.status,
        writeStatuses: writes.map((write) => write.status),
        writeConcurrency: concurrency,
        writeP95Ms: writes.map((write) => write.ms).sort((a, b) => a - b)[
          Math.ceil(writes.length * 0.95) - 1
        ],
        writeP95Pass:
          writes.map((write) => write.ms).sort((a, b) => a - b)[
            Math.ceil(writes.length * 0.95) - 1
          ] <= 3000,
        refreshed,
        lockWaits: waits,
        gate: 'released as soon as PG reports a real Lock wait; no arbitrary hold duration',
        p95: concurrency === 50,
      };
      const output = process.env.OA_OPERATIONS_OUTPUT!;
      await mkdir(output, { recursive: true });
      await writeFile(
        `${output}/configuration.json`,
        JSON.stringify(result, null, 2) + '\n',
      );
    } finally {
      release();
      spy.mockRestore();
      await knex.destroy();
    }
  },
  120000,
);
