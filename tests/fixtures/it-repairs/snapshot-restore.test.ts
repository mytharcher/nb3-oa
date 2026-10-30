/* eslint vitest/no-standalone-expect: ["error", {"additionalTestBlockFunctions": ["rehearsal"]}] */
// @vitest-environment node
import { createAppTest } from '@nocobase/app-testing/server';
import { expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { randomUUID, createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import type { Knex } from 'knex';
import { databaseManagerToken } from '@nocobase/db';
import { driveManagerToken } from '@nocobase/app-server/drive';
import { createStandaloneServer } from '../../../server/standalone.js';
import {
  OA_TEST_DATABASE_ENV,
  OA_TEST_SERVER,
} from '../../logic/oa-test-origin.js';
import { prepareRepairs } from '../../logic/it-repairs/helpers.js';
import { write, ORIGIN } from '../../logic/platform/helpers.js';
const test = createAppTest({
  createServer: createStandaloneServer,
  env: OA_TEST_DATABASE_ENV,
  server: OA_TEST_SERVER,
  config: {
    secrets: { keys: [{ version: 1, key: 's'.repeat(64) }] },
    app: { publicOrigin: ORIGIN },
    itRepairs: { scanEveryMs: 86400000 },
  },
});
const rehearsal = test.runIf(process.env.OA_IT_REPAIR_OPERATIONS === '1');
rehearsal(
  'native PG schema and private file snapshot restore into a separate isolated database',
  async ({ testApp }) => {
    if (process.env.DB_HOST !== '127.0.0.1' || process.env.DB_PORT !== '15435')
      throw Error('Requires task-owned loopback PostgreSQL');
    const output = process.env.OA_OPERATIONS_OUTPUT!,
      directory = path.join(process.env.TMPDIR!, 'snapshot-' + randomUUID());
    await mkdir(directory, { recursive: true });
    await mkdir(output, { recursive: true });
    const c = testApp.application.container,
      db = c.resolve(databaseManagerToken),
      f = await prepareRepairs(testApp),
      a = await f.a.session(),
      b = await f.b.session();
    const draft = {
      title: 'Snapshot original',
      description: 'Synthetic',
      category: 'network',
      impact: 'partial',
      location: 'Lab',
      contact: '',
      occurredAt: null,
      assetId: null,
    };
    const saved = await a.fetch(
      '/itRepairs/save',
      write('POST', { requestKey: randomUUID(), draft }),
    );
    expect(saved.status).toBe(200);
    const row = (
      (await saved.json()) as { data: { id: string; version: number } }
    ).data;
    const form = new FormData();
    form.set(
      'file',
      new File(['snapshot private bytes'], 'snapshot.log', {
        type: 'text/plain',
      }),
    );
    const uploaded = await a.fetch(`/itRepairs/${row.id}/upload`, {
      method: 'POST',
      headers: {
        origin: ORIGIN,
        'x-request-key': randomUUID(),
        'x-expected-version': String(row.version),
      },
      body: form,
    });
    expect(uploaded.status).toBe(200);
    const file = (
      (await uploaded.json()) as {
        data: { file: { id: string; contentUrl: string }; version: number };
      }
    ).data;
    const stored = await db
      .repository('itRepairFiles')
      .findOne({ filter: { id: file.file.id } });
    const key = stored!.key as string,
      disk = c.resolve(driveManagerToken).use('local');
    const bytes = await disk.getBytes(key);
    await writeFile(path.join(directory, 'private-file'), bytes);
    const knex = await db.connection().client<Knex>(),
      schema = (await knex.raw('select current_schema() as schema')).rows[0]
        .schema as string;
    const backupDb = 'repair_restore_' + randomUUID().replaceAll('-', '');
    const bin = '/usr/lib/postgresql/15/bin/',
      flags = ['-h', '127.0.0.1', '-p', '15435', '-U', 'postgres'];
    const dump = path.join(directory, 'isolated.dump');
    execFileSync(bin + 'pg_dump', [
      ...flags,
      '-d',
      'nocobase_collection_builder',
      '-n',
      schema,
      '--no-owner',
      '--no-acl',
      '-Fc',
      '-f',
      dump,
    ]);
    execFileSync(bin + 'createdb', [...flags, backupDb]);
    let restored:
      Awaited<ReturnType<typeof createStandaloneServer>> | undefined;
    try {
      execFileSync(bin + 'pg_restore', [
        ...flags,
        '-d',
        backupDb,
        '--exit-on-error',
        dump,
      ]);
      // Only synthetic post-snapshot work is discarded in this rehearsal.
      await db.repository('itRepairs').updateMany({
        filter: { id: row.id },
        values: { title: 'After backup' },
      });
      await disk.delete(key);
      restored = await createStandaloneServer({
        configPath: testApp.config.path,
        env: {
          DB_DATABASE: backupDb,
          IT_REPAIR_MODE: 'readOnly',
          APP_STORAGE_DIR: path.join(directory, 'restored-storage'),
        },
        viteDevUrl: false,
      });
      await restored.application.container
        .resolve(driveManagerToken)
        .use('local')
        .put(key, await readFile(path.join(directory, 'private-file')));
      const url = `${ORIGIN}${restored.application.publicBasePath}/api/itRepairs/${row.id}`;
      const read = await restored.fetch(
        new Request(url, { headers: { cookie: a.cookie } }),
      );
      expect(read.status).toBe(200);
      expect(
        ((await read.json()) as { data: { title: string; version: number } })
          .data,
      ).toMatchObject({ title: draft.title, version: file.version });
      const download = await restored.fetch(
        new Request(new URL(file.file.contentUrl, ORIGIN), {
          headers: { cookie: a.cookie },
        }),
      );
      expect(download.status).toBe(200);
      expect(await download.text()).toBe('snapshot private bytes');
      expect(
        (
          await restored.fetch(
            new Request(new URL(file.file.contentUrl, ORIGIN), {
              headers: { cookie: b.cookie },
            }),
          )
        ).status,
      ).toBe(403);
      await writeFile(
        path.join(output, 'snapshot.json'),
        JSON.stringify(
          {
            postgres: '15.10',
            separateDatabase: true,
            nativeStartup:
              'readOnly; migrations and permission validation retained',
            schemaRestored: true,
            fileRestored: true,
            ownerRead: 200,
            crossPersonFile: 403,
            version: file.version,
            dumpSha256: createHash('sha256')
              .update(await readFile(dump))
              .digest('hex'),
            limitation:
              'Synthetic stopped-write sample only; production cutover and post-upgrade data disposition require separate authorization',
          },
          null,
          2,
        ) + '\n',
      );
    } finally {
      await restored?.close();
      execFileSync(bin + 'dropdb', [...flags, backupDb]);
      await rm(directory, { recursive: true, force: true });
    }
  },
  60000,
);
