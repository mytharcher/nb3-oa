// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  databaseManagerToken,
  type DatabaseManager,
  type RepositoryRecord,
} from '@nocobase/db';
import { startOrgTestApp, type OrgTestApp } from '../org/helpers.js';
import { employeeServiceToken } from '../../../server/providers/employees/contract.js';
import { approvalDirectoryServiceToken } from '../../../server/providers/approval-directory/contract.js';
import { processOwners } from '../../../server/providers/process-management/owners.js';
import { readableOwners } from '../../fixtures/approval-performance/owners.js';
import {
  legacyReadable,
  type LegacyRow,
} from '../../fixtures/approval-performance/legacy-readable.js';

let app: OrgTestApp;
let db: DatabaseManager;
const users: Record<string, string> = {};
const rows = new Map<string, LegacyRow[]>();
beforeAll(async () => {
  app = await startOrgTestApp();
  db = app.testApp.application.container.resolve(databaseManagerToken);
  for (const name of [
    'worker',
    'former',
    'broken',
    'other',
    'creator',
    'manager',
    'middle',
    'head',
    'snapshot',
    'stranger',
    'hr',
    'finance',
  ]) {
    users[name] = (await app.createUser(`scope-${name}`)).user.id;
    await db.repository('employees').createOne({
      values: {
        id: name,
        code: name,
        name,
        userId: users[name],
        managerId: ['worker', 'former'].includes(name)
          ? 'middle'
          : name === 'middle'
            ? 'manager'
            : null,
        active: !['former', 'middle'].includes(name),
        status: ['former', 'middle'].includes(name) ? 'departed' : 'regular',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }
  for (const [id, parentId, active, managerId] of [
    ['root', null, true, users.head],
    ['child', 'root', true, null],
    ['disabled', null, false, users.head],
    ['broken', 'disabled', true, null],
    ['unrelated', null, true, null],
  ] as const)
    await db
      .repository('departments')
      .createOne({ values: { id, title: id, parentId, active, managerId } });
  for (const [user, departmentId] of [
    ['worker', 'child'],
    ['former', 'child'],
    ['broken', 'broken'],
    ['head', 'root'],
    ['other', 'unrelated'],
  ])
    await db.repository('departmentMembers').createOne({
      values: {
        id: randomUUID(),
        userId: users[user],
        departmentId,
        active: true,
        primary: true,
      },
    });
  for (const role of ['hr', 'finance'])
    await db.repository('dutyRoleMembers').createOne({
      values: {
        id: randomUUID(),
        userId: users[role],
        dutyRoleCode: role,
        active: true,
      },
    });
  for (const owner of readableOwners) {
    const metadata = await db.connection().collections.get(owner.collection);
    const records: LegacyRow[] = [];
    for (const name of ['worker', 'former', 'broken', 'other']) {
      const values: RepositoryRecord = {};
      for (const field of metadata!.fields!) {
        const type = field.type;
        if (
          [
            'belongsTo',
            'hasMany',
            'hasOne',
            'belongsToMany',
            'increments',
          ].includes(type)
        )
          continue;
        if (field.nullable !== false) {
          values[field.name] = null;
          continue;
        }
        if (['integer', 'bigInt', 'decimal', 'float', 'double'].includes(type))
          values[field.name] = 0;
        else if (type === 'boolean') values[field.name] = false;
        else if (type === 'json') values[field.name] = [];
        else if (type === 'date') values[field.name] = '2026-10-22';
        else if (['datetime', 'datetimeTz'].includes(type))
          values[field.name] = '2026-10-22T00:00:00.000Z';
        else values[field.name] = 'x';
      }
      const has = (field: string) =>
        metadata!.fields!.some((item) => item.name === field);
      const overrides: RepositoryRecord = {
        id: randomUUID(),
        applicantId: users[name],
        createdById: name === 'worker' ? users.creator : users[name],
        creatorId: name === 'worker' ? users.creator : users[name],
        employeeId: name,
        departmentId:
          name === 'broken'
            ? 'broken'
            : name === 'other'
              ? 'unrelated'
              : 'child',
        status: 'draft',
        number: null,
        snapshot: { userId: users.snapshot, executiveId: users.snapshot },
        executiveId: name === 'worker' ? users.snapshot : null,
        executiveApproverId: name === 'worker' ? users.snapshot : null,
        headApproverId: name === 'worker' ? users.head : null,
      };
      for (const [field, value] of Object.entries(overrides))
        if (has(field)) values[field] = value;
      records.push(
        (await db.repository(owner.collection).createOne({ values }))
          .record as LegacyRow,
      );
    }
    rows.set(owner.collection, records);
  }
}, 120_000);
afterAll(async () => {
  await app?.close();
});

describe('all 23 readable sources preserve the pre-optimization predicates on PostgreSQL', () => {
  it.each(readableOwners)(
    '$collection',
    async (binding) => {
      const owner = processOwners.find(
        (item) => item.collection === binding.collection,
      )!;
      const service = binding.service(app);
      const sdk = await owner.sdk(app.testApp.application);
      const directory = await app.testApp.application.container
        .resolve(approvalDirectoryServiceToken)
        .snapshot();
      const employees =
        app.testApp.application.container.resolve(employeeServiceToken);
      for (const name of [
        'worker',
        'creator',
        'manager',
        'middle',
        'head',
        'snapshot',
        'stranger',
        'hr',
        'finance',
      ]) {
        const actor = users[name];
        const expected: string[] = [];
        for (const row of rows.get(binding.collection)!)
          if (
            await legacyReadable(owner.kind, row, actor, {
              db,
              approvals: sdk.approvals,
              directory,
              org: app.organization,
              employees,
              lifecycle: owner.kind,
            })
          )
            expected.push(row.id);
        expect(
          (await service.readableIds(actor)).sort(),
          `${owner.kind}: ${name}`,
        ).toEqual(expected.sort());
      }
    },
    120_000,
  );
});
