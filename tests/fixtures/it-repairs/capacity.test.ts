// @vitest-environment node
/* eslint vitest/no-standalone-expect: ["error", {"additionalTestBlockFunctions": ["benchmark"]}] */
// Opt-in capacity experiment. Threshold misses are retained measurements, not skipped assertions.
import { createAppTest } from '@nocobase/app-testing/server';
import { expect } from 'vitest';
import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import { performance } from 'node:perf_hooks';
import { randomUUID } from 'node:crypto';
import { writeFile, mkdir } from 'node:fs/promises';
import os from 'node:os';
import { chromium } from '@playwright/test';
import { databaseManagerToken } from '@nocobase/db';
import type { Knex } from 'knex';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { createStandaloneServer } from '../../../server/standalone.js';
import {
  OA_TEST_DATABASE_ENV,
  OA_TEST_SERVER,
} from '../../logic/oa-test-origin.js';
import { prepareRepairs } from '../../logic/it-repairs/helpers.js';
import { createEmployee } from '../../logic/employees/helpers.js';
import { write, ORIGIN } from '../../logic/platform/helpers.js';
import { type Repair } from '../../../server/providers/it-repairs/service.js';
const output = process.env.OA_CAPACITY_OUTPUT;
const test = createAppTest({
  createServer: createStandaloneServer,
  env: OA_TEST_DATABASE_ENV,
  server: OA_TEST_SERVER,
  config: {
    secrets: { keys: [{ version: 1, key: 'c'.repeat(64) }] },
    app: { publicOrigin: ORIGIN },
    oaApprovals: { inbox: 'demo-inbox' },
    itRepairs: { scanEveryMs: 86400000, batchSize: 100 },
  },
});
const quantiles = (values: number[]) => {
  const v = [...values].sort((a, b) => a - b);
  return {
    count: v.length,
    min: v[0],
    mean: v.reduce((a, b) => a + b, 0) / v.length,
    p50: v[Math.ceil(v.length * 0.5) - 1],
    p95: v[Math.ceil(v.length * 0.95) - 1],
    max: v.at(-1),
  };
};
const benchmark = test.runIf(process.env.OA_IT_REPAIR_CAPACITY === '1');
benchmark(
  '100k isolated PG capacity through native HTTP',
  async ({ testApp }) => {
    if (!output)
      throw Error('OA_CAPACITY_OUTPUT must be an explicit evidence directory');
    await mkdir(output, { recursive: true });
    const result: Record<string, unknown> = {
      date: new Date().toISOString(),
      base: 'f938c3a44733',
      node: process.version,
      host: {
        platform: os.platform(),
        release: os.release(),
        cpus: os.cpus().length,
        model: os.cpus()[0].model,
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        load: os.loadavg(),
      },
      method: {
        readConcurrency: 50,
        readRounds: 4,
        reportRounds: 2,
        reader:
          'native HTTP on loopback; cookie-authenticated; complete response consumed',
        clock: 'real monotonic performance.now',
        warmup: '5 sequential per list workload; 2 full reports',
        thresholds: { readP95Ms: 2000, ordinaryWriteP95Ms: 3000 },
        background:
          'repair periodic scan 24h; initial empty scan complete; all other owner jobs unchanged',
      },
    };
    const save = () =>
      writeFile(
        `${output}/capacity.json`,
        JSON.stringify(result, null, 2) + '\n',
      );
    const c = testApp.application.container,
      db = c.resolve(databaseManagerToken),
      auth = c.resolve(authorizationToken),
      f = await prepareRepairs(testApp),
      engineer = await createEmployee(testApp, 'Capacity E1');
    for (const [p, roles] of [
      [f.a, ['handling-employee', 'reportEmployee']],
      [f.leader, ['handling-leader', 'reportLeader']],
      [engineer, ['handling-engineer']],
    ] as const)
      for (const role of roles)
        await auth.permissionSets.assign({
          permissionSet: `oa-it-repairs-${role}`,
          subject: { type: 'user', id: p.userId },
        });
    const a = await f.a.session(),
      l = await f.leader.session(),
      s = await f.admin.session(),
      e = await engineer.session();
    for (let i = 0; i < 10; i++)
      expect(
        (
          await s.fetch(
            `/itRepairs/groups/capacity-${i}`,
            write('POST', {
              requestKey: randomUUID(),
              expectedVersion: 0,
              title: `Synthetic group ${i}`,
              active: true,
              categories: i === 0 ? ['network'] : [],
              leaderIds: [i < 5 ? f.leader.userId : f.b.userId],
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
              title: 'Capacity source',
              description: 'Synthetic fault',
              category: 'network',
              impact: 'partial',
              location: 'Isolated lab',
              contact: '',
              occurredAt: null,
              assetId: null,
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
    const action = async (
      session: typeof a,
      r: Repair,
      name: string,
      data: Record<string, unknown> = {},
    ) => {
      const response = await session.fetch(
        `/itRepairs/${r.id}/actions`,
        write('POST', {
          requestKey: randomUUID(),
          expectedVersion: r.version,
          action: name,
          data,
        }),
      );
      expect(response.status).toBe(200);
      return (await response.json().then((body) => body as { data: Repair }))
        .data;
    };
    row = await action(l, row, 'triage', {
      advice: 'Synthetic diagnostic',
      priority: 'P3',
      assigneeId: engineer.userId,
    });
    row = await action(e, row, 'start');
    const source = (await db
      .repository<Repair>('itRepairs')
      .findOne({ filter: { id: row.id } }))!;
    const states = [
      'triage',
      'supplement',
      'pool',
      'assigned',
      'processing',
      'waiting',
      'acceptance',
      'closed',
      'closed',
      'cancelled',
    ];
    const now = Date.now(),
      seedStart = performance.now();
    for (let offset = 1; offset < 100000; offset += 250) {
      const values = Array.from(
        { length: Math.min(250, 100000 - offset) },
        (_, j) => {
          const n = offset + j,
            status = states[n % 10],
            submitted = new Date(now - (n % 90) * 86400000),
            ended = new Date(+submitted + 86400000),
            response = new Date(+submitted + 3600000),
            hours = 1 + (n % 30);
          return {
            ...source,
            id: randomUUID(),
            number: `CAP-${String(n).padStart(6, '0')}`,
            title: `Synthetic ${n % 5 === 0 ? 'network' : 'device'} fault ${n}`,
            description:
              n % 10 === 0
                ? 'Synthetic long fault '.repeat(60)
                : 'Synthetic fault',
            groupId: `capacity-${Math.floor(n / 10) % 10}`,
            requesterId:
              Math.floor(n / 100) % 2 === 0 ? f.a.userId : f.b.userId,
            assigneeId: [
              'assigned',
              'processing',
              'waiting',
              'acceptance',
              'closed',
            ].includes(status)
              ? engineer.userId
              : null,
            status,
            priority: ['P1', 'P2', 'P3', 'P4'][Math.floor(n / 5) % 4],
            category: ['network', 'device', 'software', 'account', 'other'][
              n % 5
            ],
            createdAt: submitted,
            updatedAt: submitted,
            submittedAt: submitted,
            responseDueAt: new Date(+submitted + 4 * 3600000),
            resolutionDueAt: new Date(+submitted + 16 * 3600000),
            nextDueAt: ['closed', 'cancelled'].includes(status)
              ? null
              : new Date(now + 86400000),
            firstRespondedAt: response,
            metricEndedAt: ['closed', 'cancelled'].includes(status)
              ? ended
              : null,
            closureMode:
              status === 'closed'
                ? n % 20 === 7
                  ? 'management'
                  : 'user'
                : status === 'cancelled'
                  ? 'cancelled'
                  : null,
            responseHours: 1,
            responseOnTime: true,
            solutionHours: hours,
            solutionOnTime: hours <= 16,
            solutionExceeded: hours > 16,
            waitingHours: n % 3,
            pausedHours: n % 2,
            acceptanceHours: n % 4,
            totalHours: hours + 4,
            naturalHours: 24,
            everResponseOverdue: false,
            everSolutionOverdue: hours > 16,
            returnCount: n % 3,
            rating: status === 'closed' && n % 2 === 0 ? 1 + (n % 5) : null,
            metricRevision: 1,
            processing: {
              ...source.processing,
              closureMode: status === 'closed' ? 'user' : null,
              closedAt: ['closed', 'cancelled'].includes(status)
                ? ended.toISOString()
                : undefined,
              firstResponseAt: response.toISOString(),
              runningSince: submitted.toISOString(),
              alerted: [],
            },
          };
        },
      );
      await db
        .repository('itRepairs')
        .createMany({ values: [values[0], ...values.slice(1)] });
    }
    result.seed = {
      rows: await db.repository('itRepairs').count(),
      ms: performance.now() - seedStart,
      groups: 10,
      requesters: 2,
      distribution:
        'status and group independent; five categories; two requesters balanced;10% each triage/supplement/pool/assigned/processing/waiting/acceptance/cancelled;20%closed; priority modulo4; dates90days;10%long descriptions; leader sees5groups/50000records; requester sees50000records',
    };
    expect((result.seed as { rows: number }).rows).toBe(100000);
    const knex = await db.connection().client<Knex>();
    await knex.raw('ANALYZE');
    result.postgres = (
      await knex.raw(
        "SELECT version(), current_setting('shared_buffers') AS shared_buffers, current_setting('max_connections') AS max_connections",
      )
    ).rows[0];
    const bridge = createServer(async (req, res) => {
      if (req.url === '/capacity-client') {
        res.setHeader('content-type', 'text/html');
        res.end('<html><title>Isolated capacity client</title></html>');
        return;
      }
      try {
        const chunks: Buffer[] = [];
        for await (const b of req) chunks.push(Buffer.from(b));
        const headers = new Headers();
        for (const [k, v] of Object.entries(req.headers))
          if (k !== 'host' && v)
            headers.set(k, Array.isArray(v) ? v.join(',') : v);
        if (headers.has('origin')) headers.set('origin', ORIGIN);
        const response = await testApp.fetch(
          new Request(`${ORIGIN}${req.url}`, {
            method: req.method,
            headers,
            ...(!['GET', 'HEAD'].includes(req.method ?? 'GET')
              ? { body: Buffer.concat(chunks) }
              : {}),
          }),
        );
        res.statusCode = response.status;
        for (const [k, v] of response.headers)
          if (k !== 'set-cookie') res.setHeader(k, v);
        if (response.body)
          Readable.fromWeb(
            response.body as import('node:stream/web').ReadableStream,
          ).pipe(res);
        else res.end();
      } catch (err) {
        res.statusCode = 500;
        res.end(String(err));
      }
    });
    await new Promise<void>((resolve) =>
      bridge.listen(15436, '127.0.0.1', resolve),
    );
    const origin = 'http://127.0.0.1:15436',
      prefix = testApp.publicBasePath + '/api';
    const request = async (
      path: string,
      session = l,
      init: RequestInit = {},
    ) => {
      const r = await fetch(origin + prefix + path, {
        ...init,
        headers: { ...init.headers, cookie: session.cookie, origin: ORIGIN },
      });
      expect(r.status).toBe(200);
      return r;
    };
    const measured: Record<string, unknown> = {};
    result.workloads = measured;
    await save();
    const measure = async (
      name: string,
      concurrency: number,
      rounds: number,
      run: (i: number) => Promise<unknown>,
      warm = 5,
    ) => {
      for (let i = 0; i < warm; i++) await run(-i - 1);
      const errors: string[] = [];
      const values: number[] = [];
      const started = performance.now();
      await Promise.all(
        Array.from({ length: concurrency }, async (_, worker) => {
          for (let round = 0; round < rounds; round++) {
            const start = performance.now();
            try {
              await run(worker + round * concurrency);
            } catch (error) {
              errors.push(String(error).split('\n')[0]);
            }
            values.push(performance.now() - start);
          }
        }),
      );
      measured[name] = {
        ...quantiles(values),
        concurrency,
        errors,
        wallMs: performance.now() - started,
        thresholdMs: name.includes('write') ? 3000 : 2000,
        pass:
          errors.length === 0 &&
          quantiles(values).p95 <= (name.includes('write') ? 3000 : 2000),
      };
      await save();
    };
    const captured: { sql: string; bindings: unknown[] }[] = [];
    const capture = (q: { sql: string; bindings: unknown[] }) => {
      if (
        /it_repairs|itRepairs/.test(q.sql) &&
        /^select/i.test(q.sql) &&
        captured.length < 500
      )
        captured.push(q);
    };
    try {
      for (const [name, path] of Object.entries({
        list: '/itRepairs?pageSize=20',
        filtered:
          '/itRepairs?category=network&priority=P3&sort=resolutionDueAt&direction=asc&pageSize=20',
        deepPage:
          '/itRepairs?pageSize=20&page=2000&sort=updatedAt&direction=desc',
      })) {
        knex.on('query', capture);
        await (await request(path)).arrayBuffer();
        knex.off('query', capture);
        await measure(name, 50, 4, async () => {
          await (await request(path)).arrayBuffer();
        });
      }
      knex.on('query', capture);
      await (await request('/itRepairs/reports')).arrayBuffer();
      knex.off('query', capture);
      await measure(
        'reports38',
        50,
        2,
        async () => {
          await (await request('/itRepairs/reports')).arrayBuffer();
        },
        2,
      );
      const plans = [];
      for (const q of captured
        .filter((q) => !q.sql.includes('count(*)'))
        .slice(-12)) {
        const bindings: unknown[] = [];
        const sql = q.sql.replace(/\$(\d+)/g, (_match, n) => {
          bindings.push(q.bindings[Number(n) - 1]);
          return '?';
        });
        const plan = await knex.raw(
          `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql}`,
          bindings as Knex.RawBinding[],
        );
        plans.push({ sql: q.sql, plan: plan.rows[0]['QUERY PLAN'] });
      }
      await writeFile(
        `${output}/plans.json`,
        JSON.stringify(plans, null, 2) + '\n',
      );
      result.plans = { count: plans.length, file: 'plans.json' };
      const rss: number[] = [];
      const mem = setInterval(() => rss.push(process.memoryUsage().rss), 20);
      const csvStart = performance.now(),
        before = process.memoryUsage();
      let bytes = 0;
      const csv = await request(
        '/itRepairs/export',
        l,
        write('POST', { requestKey: randomUUID(), query: {} }),
      );
      for await (const chunk of csv.body!) bytes += chunk.byteLength;
      clearInterval(mem);
      result.csv = {
        bytes,
        ms: performance.now() - csvStart,
        before,
        after: process.memoryUsage(),
        peakRss: Math.max(...rss),
        reader:
          'streaming HTTP reader discards chunks; no server bridge buffering',
      };
      await save();
      const browser = await chromium.launch({ headless: true });
      try {
        const context = await browser.newContext();
        await context.addCookies(
          l.cookie
            .split(';')
            .filter(Boolean)
            .map((piece) => {
              const at = piece.indexOf('=');
              return {
                name: piece.slice(0, at).trim(),
                value: piece.slice(at + 1).trim(),
                url: origin,
              };
            }),
        );
        const page = await context.newPage();
        await page.goto(origin + '/capacity-client');
        const cdp = await context.newCDPSession(page);
        await cdp.send('Performance.enable');
        const beforeMetrics = await cdp.send('Performance.getMetrics');
        const blob = await page.evaluate(
          async ({ url }) => {
            const r = await fetch(url, {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({
                requestKey: crypto.randomUUID(),
                query: {},
              }),
            });
            if (!r.ok) throw Error(String(r.status));
            const b = await r.blob();
            (globalThis as unknown as { capacityBlob: Blob }).capacityBlob = b;
            return { size: b.size, type: b.type };
          },
          { url: origin + prefix + '/itRepairs/export' },
        );
        const afterMetrics = await cdp.send('Performance.getMetrics');
        result.clientCsv = {
          blob,
          before: beforeMetrics.metrics.filter((m) =>
            ['JSHeapUsedSize', 'JSHeapTotalSize'].includes(m.name),
          ),
          after: afterMetrics.metrics.filter((m) =>
            ['JSHeapUsedSize', 'JSHeapTotalSize'].includes(m.name),
          ),
          limitation:
            'Blob bytes retained separately from JS heap; peak browser RSS not inferred from JS heap',
        };
      } finally {
        await browser.close();
      }
      const hot = Array.from({ length: 160 }, (_, i) => ({
        ...source,
        id: randomUUID(),
        number: `HOT-${i}`,
        title: `Hot write ${i}`,
        status: 'processing',
        groupId: 'capacity-0',
        nextDueAt: new Date(now + 86400000),
      }));
      await db
        .repository('itRepairs')
        .createMany({ values: [hot[0], ...hot.slice(1)] });
      await measure(
        'writeSerial',
        1,
        50,
        async (i) => {
          const r = hot[i < 0 ? 159 : i];
          await (
            await request(
              `/itRepairs/${r.id}/actions`,
              l,
              write('POST', {
                requestKey: randomUUID(),
                expectedVersion: r.version,
                action: 'comment',
                data: { message: 'Synthetic ordinary write' },
              }),
            )
          ).arrayBuffer();
        },
        0,
      );
      await measure(
        'writeSameAccount',
        50,
        1,
        async (i) => {
          const r = hot[50 + i];
          await (
            await request(
              `/itRepairs/${r.id}/actions`,
              l,
              write('POST', {
                requestKey: randomUUID(),
                expectedVersion: r.version,
                action: 'comment',
                data: { message: 'Synthetic concurrent write' },
              }),
            )
          ).arrayBuffer();
        },
        0,
      );
    } finally {
      knex.off('query', capture);
      await save();
      await new Promise<void>((resolve, reject) =>
        bridge.close((err) => (err ? reject(err) : resolve())),
      );
    }
  },
  900000,
);
