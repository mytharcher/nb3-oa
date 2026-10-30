import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
// @vitest-environment node
/* eslint vitest/no-standalone-expect: ["error", {"additionalTestBlockFunctions": ["benchmark"]}] */
import { createAppTest } from '@nocobase/app-testing/server';
import { expect } from 'vitest';
import { spawn, execFileSync } from 'node:child_process';
import { createInterface } from 'node:readline';
import {
  writeFile,
  mkdir,
  appendFile,
  symlink,
  copyFile,
} from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { databaseManagerToken } from '@nocobase/db';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { inAppNotificationStoreToken } from '@nocobase/app-plugin-notification-in-app/server';
import { createStandaloneServer } from '../../../server/standalone.js';
import {
  OA_TEST_DATABASE_ENV,
  OA_TEST_SERVER,
} from '../../logic/oa-test-origin.js';
import { prepareRepairs } from '../../logic/it-repairs/helpers.js';
import { createEmployee } from '../../logic/employees/helpers.js';
import { write, ORIGIN } from '../../logic/platform/helpers.js';
import {
  repairServiceToken,
  type Repair,
} from '../../../server/providers/it-repairs/service.js';
const test = createAppTest({
  createServer: createStandaloneServer,
  env: OA_TEST_DATABASE_ENV,
  server: OA_TEST_SERVER,
  config: {
    secrets: { keys: [{ version: 1, key: 'o'.repeat(64) }] },
    app: { publicOrigin: ORIGIN },
    oaApprovals: { inbox: 'demo-inbox' },
    itRepairs: { scanEveryMs: 86400000, batchSize: 100 },
    jobs: {
      default: 'redis',
      redis: {
        connection: { host: '127.0.0.1', port: 16385, db: 0 },
        namespace: `isolated-repair-operations-${randomUUID()}`,
        attempts: 3,
      },
    },
  },
});
const benchmark = test.runIf(process.env.OA_IT_REPAIR_OPERATIONS === '1');
benchmark(
  'two native OS instances share PG/Redis and recover due effects after restart',
  async ({ testApp }) => {
    const c = testApp.application.container,
      db = c.resolve(databaseManagerToken),
      svc = c.resolve(repairServiceToken),
      auth = c.resolve(authorizationToken),
      f = await prepareRepairs(testApp),
      engineer = await createEmployee(testApp, 'Ops E');
    for (const [p, role] of [
      [f.a, 'employee'],
      [f.leader, 'leader'],
      [engineer, 'engineer'],
    ] as const)
      await auth.permissionSets.assign({
        permissionSet: `oa-it-repairs-handling-${role}`,
        subject: { type: 'user', id: p.userId },
      });
    const a = await f.a.session(),
      s = await f.admin.session();
    expect(
      (
        await s.fetch(
          '/itRepairs/groups/operations',
          write('POST', {
            requestKey: randomUUID(),
            expectedVersion: 0,
            title: 'Operations',
            active: true,
            categories: ['network'],
            leaderIds: [f.leader.userId],
            engineerIds: [engineer.userId],
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
              title: 'Operations restart',
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
    // Prepared backlog uses the same frozen calendar with an old authoritative submission.
    const old = new Date(Date.now() - 7 * 86400000);

    const output = process.env.OA_OPERATIONS_OUTPUT!;
    await mkdir(output, { recursive: true });
    const runs: unknown[] = [];
    for (const directory of ['rollback-code', 'rollback-compatible']) {
      const root = path.join(process.env.TMPDIR!, directory);
      await mkdir(root, { recursive: true });
      execFileSync('tar', ['-x', '-C', root], {
        input: execFileSync(
          'git',
          ['archive', '5415f2305b130cef6f9092957e1459e4307ab71c'],
          { maxBuffer: 32 * 1024 * 1024 },
        ),
      });
      try {
        await symlink(
          path.resolve('node_modules'),
          path.join(root, 'node_modules'),
          'dir',
        );
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      }
    }
    for (const name of [
      'database/main/migrations/202610300001_it_repair_reporting.ts',
      'database/main/seeds/202610300002_it_repair_reporting_permissions.ts',
    ])
      await copyFile(
        path.resolve(name),
        path.join(process.env.TMPDIR!, 'rollback-compatible', name),
      );
    async function worker(rollback: false | 'raw' | 'compatible' = false) {
      const child = spawn(
        process.execPath,
        [
          '--import',
          'tsx',
          path.resolve('tests/fixtures/it-repairs/operations-worker.ts'),
        ],
        {
          env: {
            ...process.env,
            OA_OPS_CONFIG: testApp.config.path,
            ...(rollback
              ? {
                  OA_OPS_SERVER: path.join(
                    process.env.TMPDIR!,
                    `${rollback === 'raw' ? 'rollback-code' : 'rollback-compatible'}/server/standalone.ts`,
                  ),
                }
              : {}),
            OA_OPS_STORAGE: path.join(
              process.env.TMPDIR!,
              'ops-worker-storage',
            ),
          },
          stdio: ['pipe', 'pipe', 'pipe'],
        },
      );
      const lines = createInterface({ input: child.stdout });
      let ready!: () => void;
      const prepared = new Promise<void>((resolve, reject) => {
        ready = resolve;
        child.once('exit', (code) =>
          reject(Error(`worker startup exit ${code}`)),
        );
      });
      const pending = new Map<string, (v: unknown) => void>();
      lines.on('line', (line) => {
        if (!line.startsWith('CAPACITY_WORKER_'))
          void appendFile(
            path.join(output, 'worker-diagnostics.log'),
            line + '\n',
          );
        if (line === 'CAPACITY_WORKER_READY') ready();
        else if (line.startsWith('CAPACITY_WORKER_RESULT ')) {
          const value = JSON.parse(line.slice(23));
          pending.get(value.id)?.(value);
          pending.delete(value.id);
        }
      });
      child.stderr.on('data', (data: Buffer) => {
        void appendFile(path.join(output, 'worker-diagnostics.log'), data);
      });
      await prepared;
      return {
        async tick(operation = 'tick') {
          const id = randomUUID();
          return new Promise((resolve) => {
            pending.set(id, resolve);
            child.stdin.write(
              JSON.stringify({
                id,
                operation,
                recordId: row.id,
                cookie: a.cookie,
              }) + '\n',
            );
          });
        },
        async close() {
          if (child.exitCode !== null || child.signalCode !== null) return;
          const done = new Promise<void>((resolve) =>
            child.once('exit', () => resolve()),
          );
          child.stdin.end(
            JSON.stringify({ id: 'close', operation: 'close' }) + '\n',
          );
          await done;
        },
        kill() {
          child.kill('SIGTERM');
        },
      };
    }
    let other = await worker();
    await db.repository('itRepairs').updateMany({
      filter: { id: row.id },
      values: {
        submittedAt: old,
        responseDueAt: old,
        resolutionDueAt: old,
        nextDueAt: old,
        processing: {
          ...row.processing,
          runningSince: old.toISOString(),
          alerted: [],
        },
      },
    });
    try {
      runs.push(await Promise.allSettled([svc.tick(100), other.tick()]));
      const scheduler = c
        .resolve(jobExecutorServiceToken)
        .getScheduleExecutor('oa-it-repair-timers');
      const parentFirings: { name: string; jobId: string }[] = [];
      const unsubscribe = scheduler.subscribe(async (event) => {
        if (event.name === 'ScheduleEnd')
          parentFirings.push({ name: event.name, jobId: event.jobId });
      });
      let childFirings: { name: string; jobId: string }[] = [];
      await scheduler.addJob({
        name: 'deadlines',
        options: { every: 1000, limit: 1 },
        payload: {},
        execute: async () => {
          await svc.tick(100);
        },
      });
      await expect
        .poll(async () => {
          const reply = (await other.tick('events')) as {
            result: typeof childFirings;
          };
          childFirings = reply.result;
          return parentFirings.length + childFirings.length;
        })
        .toBe(1);
      unsubscribe();
      const firingProof = [...parentFirings, ...childFirings];
      await other.close();
      other = await worker();
      runs.push(await Promise.allSettled([svc.tick(100), other.tick()]));
      await other.close();
      const verifiedRow = await db
        .repository<Repair>('itRepairs')
        .findOne({ filter: { id: row.id } });
      const verifiedAlerts = verifiedRow!.processing!.alerted as string[];
      const verifiedEvents = await db
        .repository('itRepairEvents')
        .findMany({ filter: { repairId: row.id, type: 'alert' } });
      expect(verifiedEvents.length).toBe(verifiedAlerts.length);
      expect(new Set(verifiedEvents.map((e) => e.id)).size).toBe(
        verifiedEvents.length,
      );
      await expect
        .poll(async () =>
          (await svc.runtime.listEffectRuns({ recordId: row.id })).every(
            (e) => e.status === 'succeeded',
          ),
        )
        .toBe(true);
      await writeFile(
        path.join(output, 'multi-instance.json'),
        JSON.stringify(
          {
            processes: 2,
            backend: 'shared isolated PG and unique Redis7 namespace with AOF',
            runs,
            sharedScheduleFirings: firingProof,
            alerts: verifiedAlerts,
            alertEvents: verifiedEvents.length,
            effects: (
              await svc.runtime.listEffectRuns({ recordId: row.id })
            ).map((e) => ({ status: e.status })),
            restart:
              'secondary native application stopped and recreated before this checkpoint; no duplicate alert',
          },
          null,
          2,
        ) + '\n',
      );
      await expect(worker('raw')).rejects.toThrow('worker startup exit 1');
      await writeFile(
        path.join(output, 'raw-rollback.json'),
        JSON.stringify(
          {
            status: 'rejected',
            reason:
              'executed reporting migration missing in raw5415 sources; diagnostic log retained',
            businessDataRetained: true,
          },
          null,
          2,
        ),
      );
      other = await worker('compatible');
      const rollbackRead = (await other.tick('read')) as {
        result: { status: number; body: { data: Repair } };
      };
      expect(rollbackRead.result.status).toBe(200);
      expect(rollbackRead.result.body.data.number).toBe(row.number);
      await other.close();
      other = await worker();
      const current = await db
        .repository<Repair>('itRepairs')
        .findOne({ filter: { id: row.id } });
      const eventRows = await db
        .repository('itRepairEvents')
        .findMany({ filter: { repairId: row.id } });
      const alerts = current!.processing!.alerted as string[];
      expect(new Set(alerts).size).toBe(alerts.length);
      expect(alerts).toContain('responseOverdue');
      expect(alerts).toContain('resolutionOverdue');
      const events = eventRows.filter((e) => e.type === 'alert');
      expect(events.length).toBe(alerts.length);
      expect(new Set(events.map((e) => e.id)).size).toBe(events.length);
      await expect
        .poll(async () =>
          (await svc.runtime.listEffectRuns({ recordId: row.id })).every(
            (e) => e.status === 'succeeded',
          ),
        )
        .toBe(true);
      const inbox = c.resolve(inAppNotificationStoreToken),
        messages = (
          await inbox.list({ userId: f.leader.userId, limit: 100 })
        ).filter((m) => m.body.includes(row.number!));
      expect(new Set(messages.map((m) => m.id)).size).toBe(messages.length);
      await writeFile(
        path.join(output, 'operations.json'),
        JSON.stringify(
          {
            date: new Date().toISOString(),
            processes: 2,
            sharedScheduleFiring: firingProof,
            codeRollback: {
              from: 'f938c3a44733',
              to: '5415f2305b13',
              status: rollbackRead.result.status,
              numberPreserved: true,
              structure:
                'retained all additive fields plus immutable migration/seed manifest in compatibility rollback bundle; raw old artifact rejected at migration validation',
            },
            database: 'shared isolated PG schema',
            jobs: 'shared Redis7 AOF/noeviction;3attempts',
            runs,
            alerts,
            alertEvents: events.length,
            notifications: messages.length,
            effects: (
              await svc.runtime.listEffectRuns({ recordId: row.id })
            ).map((e) => ({ status: e.status })),
            restart:
              'secondary OS application stopped and recreated; repeated sweep did not add alert events',
          },
          null,
          2,
        ) + '\n',
      );
    } finally {
      await other.close();
    }
  },
  180000,
);
