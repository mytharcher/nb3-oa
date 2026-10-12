// @vitest-environment node
import { readFile, writeFile, mkdtemp, rm, symlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createTestDatabase } from '@nocobase/app-testing/server';
import {
  createMigrator,
  databaseManagerToken,
  type DatabaseManager,
} from '@nocobase/db';
import { ServiceContainer } from '@nocobase/service-provider';
import { expect, it } from 'vitest';
import {
  createEmployeesAppTest,
  createEmployee,
} from '../employees/helpers.ts';
import { json } from '../org/helpers.ts';
import { OA_TEST_ORIGIN } from '../oa-test-origin.ts';

async function migrate(
  database: DatabaseManager,
  packageName = 'reimbursement-files-repair-test',
) {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), 'reimbursement-files-repair-'),
  );
  try {
    await symlink(
      path.resolve(import.meta.dirname, '../../../node_modules'),
      path.join(directory, 'node_modules'),
      'dir',
    );
    const migration =
      '202610110009_complete_reimbursement_attachment_collection.ts';
    // Main startup already recorded this name. Give the isolated fixture a
    // distinct identity so it actually executes after modelling the legacy gap.
    const source = await readFile(
      path.resolve(
        import.meta.dirname,
        '../../../database/main/migrations',
        migration,
      ),
      'utf8',
    );
    const originalName = migration.slice(0, -3);
    const fixtureName = originalName + '_' + packageName.replaceAll('-', '_');
    await writeFile(
      path.join(directory, fixtureName + '.ts'),
      source.replace(originalName, fixtureName),
    );
    const container = new ServiceContainer();
    container.instance(databaseManagerToken, database);
    await createMigrator({
      database,
      container,
      sources: [{ packageName, directory }],
    }).latest();
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

it('creates the missing file collection and preserves files on repeated reconciliation', async () => {
  const testDb = await createTestDatabase();
  try {
    await migrate(testDb.database);
    const repository = testDb.database.repository(
      'reimbursementAttachmentFiles',
    );
    const values = {
      id: 'b994e1e5-7e63-4014-9716-4f2e316b7c01',
      disk: 'local',
      key: 'evidence-key',
      filename: 'evidence.pdf',
      ext: 'pdf',
      mimeType: 'application/pdf',
      size: '12',
      createdAt: new Date('2026-10-11T00:00:00Z'),
      updatedAt: new Date('2026-10-11T00:00:00Z'),
      reimbursementId: 'draft',
      ownerId: 'owner',
      uploadVersion: 0,
    };
    await repository.createOne({ values });
    // A separate migration history forces the existing-collection branch too.
    await migrate(testDb.database, 'reimbursement-files-existing-test');
    expect(
      await repository.findOne({ filter: { id: values.id } }),
    ).toMatchObject({
      id: values.id,
      key: values.key,
      reimbursementId: values.reimbursementId,
      ownerId: values.ownerId,
      uploadVersion: 0,
    });
  } finally {
    await testDb.destroy();
  }
});

const test = createEmployeesAppTest();
test('uploads and downloads evidence through the actual guarded HTTP routes after upgrading a missing file collection', async ({
  testApp,
}) => {
  // The test database is disposable. Model the actual installed legacy schema,
  // rather than relying on fresh migrations that already create this collection.
  await testApp.database
    .builder()
    .dropCollection('reimbursementAttachmentFiles');
  await migrate(testApp.database);
  const owner = await createEmployee(testApp, 'Legacy reimbursement applicant');
  const session = await owner.session();
  const created = await session.fetch(
    '/reimbursementRequests',
    json({
      reason: 'Evidence upgrade',
      authorizationId: null,
      loanId: null,
      offsetCents: 0,
      overrunReason: '',
      lines: [],
    }),
  );
  expect(created.status).toBe(201);
  const draft = (await created.json()).data.record;
  const id = draft.id;
  const bytes = '%PDF-1.7\nEvidence\n%%EOF';
  const body = new FormData();
  body.append(
    'file',
    new File([bytes], 'evidence.pdf', { type: 'application/pdf' }),
  );
  const uploaded = await session.fetch('/reimbursementAttachments/uploadOne', {
    method: 'POST',
    headers: { origin: OA_TEST_ORIGIN, 'x-reimbursement-request-id': id },
    body,
  });
  expect(uploaded.status).toBe(201);
  const file = (await uploaded.json()).data.record;
  expect(file.filename).toBe('evidence.pdf');
  const downloaded = await session.fetch(
    new URL(file.contentUrl, OA_TEST_ORIGIN).href,
  );
  expect(downloaded.status).toBe(200);
  expect(await downloaded.text()).toBe(bytes);
  const stored = await testApp.database
    .repository('reimbursementAttachmentFiles')
    .findOne({ filter: { id: file.id } });
  expect(stored).toMatchObject({
    reimbursementId: id,
    ownerId: owner.userId,
    uploadVersion: draft.lifecycleVersion,
  });
}, 120000);
