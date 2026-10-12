// @vitest-environment node
import { readFile, writeFile, mkdtemp, rm, symlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { beforeAll, afterAll, expect, it } from 'vitest';
import {
  createMigrator,
  databaseManagerToken,
  type DatabaseManager,
} from '@nocobase/db';
import { ServiceContainer } from '@nocobase/service-provider';
import { startOrgTestApp, type OrgTestApp } from './org/helpers.ts';
let fixture: OrgTestApp;
let db: DatabaseManager;
beforeAll(async () => {
  fixture = await startOrgTestApp();
  db = fixture.testApp.application.container.resolve(databaseManagerToken);
}, 120000);
afterAll(async () => {
  await fixture?.close();
});
async function migrate(
  key: string,
  original = '202610120302_complete_legacy_oa_contracts',
) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'oa-legacy-schema-'));
  try {
    await symlink(
      path.resolve('node_modules'),
      path.join(directory, 'node_modules'),
      'dir',
    );
    const source = await readFile(
      `database/main/migrations/${original}.ts`,
      'utf8',
    );
    await writeFile(
      path.join(directory, `${original}_${key}.ts`),
      source.replace(original, `${original}_${key}`),
    );
    const container = new ServiceContainer();
    container.instance(databaseManagerToken, db);
    await createMigrator({
      database: db,
      container,
      sources: [{ packageName: `oa-legacy-${key}`, directory }],
    }).latest();
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
it('restores legacy fields and missing file tables while preserving an existing record', async () => {
  await db.builder().dropCollection('headcountOccupancies');
  await db.builder().createCollection('headcountOccupancies', (c) => {
    c.string('id', { length: 64, nullable: false }).primary();
    for (const field of ['accountId', 'employeeId'])
      c.string(field, { length: 64, nullable: false });
    c.string('state', { length: 32, nullable: false });
    c.string('claimSeatId', { length: 64, nullable: true });
    c.string('sourceReference', { length: 192, nullable: false });
    c.datetime('createdAt', { nullable: false });
    c.datetime('releasedAt', { nullable: true });
    c.unique(['accountId', 'employeeId']);
    c.index(['employeeId', 'state']);
  });
  await db.builder().dropField('paymentRequests', 'gmMerged');
  await db.builder().dropField('loanRequests', 'quotaSnapshot');
  await db.builder().dropCollection('contractAttachmentFiles');
  await db.repository('vendorRemovalConfiguration').createOne({
    values: {
      id: 'preserved',
      personId: null,
      version: 7,
      updatedAt: new Date(),
    },
  });
  await migrate('restore');
  await migrate('repeat');
  const occupancy = {
    accountId: 'account',
    employeeId: 'employee',
    state: 'occupied',
    claimSeatId: null,
    sourceReference: 'fixture',
    createdAt: new Date(),
    releasedAt: null,
    releaseKind: null,
    generation: 1,
  };
  await db.repository('headcountOccupancies').createOne({
    values: { ...occupancy, id: 'first', activeKey: 'active-key' },
  });
  await db.repository('headcountOccupancies').createOne({
    values: {
      ...occupancy,
      id: 'history',
      state: 'released',
      activeKey: 'released-key',
    },
  });
  await expect(
    db.repository('headcountOccupancies').createOne({
      values: { ...occupancy, id: 'duplicate', activeKey: 'active-key' },
    }),
  ).rejects.toThrow();
  expect(await db.repository('headcountOccupancies').count()).toBe(2);

  expect(
    (await db.connection().collections.get('paymentRequests'))?.fields.some(
      (f) => f.name === 'gmMerged',
    ),
  ).toBe(true);
  expect(await db.builder().hasCollection('contractAttachmentFiles')).toBe(
    true,
  );
  expect(
    await db
      .repository('vendorRemovalConfiguration')
      .findOne({ filter: { id: 'preserved' } }),
  ).toMatchObject({ version: 7 });
}, 120000);
it('refuses unknown historical receipt backfills and rolls back all earlier schema changes', async () => {
  await db.builder().dropCollection('contractAttachmentFiles');
  await db.builder().dropField('sealReceipts', 'contractConfirmation');
  await db.repository('sealReceipts').createOne({
    values: {
      id: 'historical',
      ledgerId: 'l',
      requestId: 'r',
      sealId: 's',
      confirmedById: 'u',
      returnedAt: new Date(),
      sealedAt: new Date(),
      actualCopies: 1,
      reason: 'Preserved fixture',
    },
  });
  await expect(migrate('refuse')).rejects.toThrow(
    'LEGACY_OA_BACKFILL_REQUIRED',
  );
  expect(await db.builder().hasCollection('contractAttachmentFiles')).toBe(
    false,
  );
  expect(
    await db
      .repository('sealReceipts')
      .findOne({ filter: { id: 'historical' } }),
  ).toMatchObject({ reason: 'Preserved fixture', actualCopies: 1 });
}, 120000);

it('relaxes old placeholder constraints without deleting archival timestamps', async () => {
  await db.builder().alterField('printTemplateCommands', 'receipt', {
    type: 'json',
    nullable: false,
  });
  await db.builder().addField('vendorQualifications', {
    name: 'stateEnteredAt',
    type: 'datetime',
    nullable: false,
  });
  await migrate('constraints', '202610120303_reconcile_legacy_oa_constraints');
  await db.repository('printTemplateCommands').createOne({
    values: {
      id: 'nullable-receipt',
      actorId: 'fixture',
      requestKey: 'fixture',
      bodyHash: 'fixture',
      receipt: null,
      createdAt: new Date(),
    },
  });
  expect(
    (
      await db.connection().collections.get('vendorQualifications')
    )?.fields.find((f) => f.name === 'stateEnteredAt')?.nullable,
  ).toBe(true);
  expect(
    (await db.connection().collections.get('budgetLedger'))?.fields.find(
      (f) => f.name === 'usedDelta',
    )?.type,
  ).toBe('bigInt');
}, 120000);
