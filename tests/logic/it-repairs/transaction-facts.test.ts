// @vitest-environment node
import { expect, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { Knex } from 'knex';
import { databaseManagerToken, type DatabaseConnection } from '@nocobase/db';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { employeeServiceToken } from '../../../server/providers/employees/contract.js';
import { repairServiceToken } from '../../../server/providers/it-repairs/service.js';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
import { createPlatformAppTest } from '../platform/helpers.js';
import { ALL } from '../employees/helpers.js';
import { prepareRepairs } from './helpers.js';
const test = createPlatformAppTest();
const draft = {
  title: 'Transaction facts',
  description: 'Synthetic',
  category: 'network',
  impact: 'partial',
  location: 'Lab',
  contact: '',
  occurredAt: null,
  assetId: null,
};
test('one attempt shares owner facts; rollback and serialization retry reread revoked identity', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    f = await prepareRepairs(testApp),
    db = c.resolve(databaseManagerToken),
    users = c.resolve(userAdministrationServiceToken),
    employees = c.resolve(employeeServiceToken),
    audit = c.resolve(auditServiceToken),
    svc = c.resolve(repairServiceToken);
  const userReads = new Map<DatabaseConnection, number>(),
    employeeReads = new Map<DatabaseConnection, number>();
  const bind = users.withConnection.bind(users),
    readEmployee = employees.getByUserId.bind(employees);
  const userSpy = vi.spyOn(users, 'withConnection').mockImplementation(
    (tx) =>
      new Proxy(bind(tx), {
        get(target, key, receiver) {
          if (key === 'get')
            return async (id: string) => {
              if (tx !== db.connection() && id === f.a.userId)
                userReads.set(tx, (userReads.get(tx) ?? 0) + 1);
              return target.get(id);
            };
          return Reflect.get(target, key, receiver);
        },
      }),
  );
  const employeeSpy = vi
    .spyOn(employees, 'getByUserId')
    .mockImplementation(async (id, tx) => {
      if (tx && tx !== db.connection() && id === f.a.userId)
        employeeReads.set(tx, (employeeReads.get(tx) ?? 0) + 1);
      return readEmployee(id, tx);
    });
  const cmd = () => ({ actorId: f.a.userId, requestKey: randomUUID() });
  try {
    const row = await svc.save(cmd(), draft, ALL);
    expect(row.version).toBe(1);
    expect([...userReads.values()]).toEqual([1]);
    expect([...employeeReads.values()]).toEqual([1]);
    const firstTx = [...userReads.keys()][0];
    await svc.save(cmd(), { ...draft, title: 'Second request' }, ALL);
    expect(userReads.size).toBe(2);
    expect([...userReads.values()]).toEqual([1, 1]);
    expect([...userReads.keys()][1]).not.toBe(firstTx);
    const before = await db.repository('itRepairs').count();
    const nativeTransaction = db.transaction.bind(db),
      record = audit.record.bind(audit);
    let fail = true,
      revoke = false;
    const fault = vi
      .spyOn(audit, 'record')
      .mockImplementation(async (entry, tx) => {
        if (fail && entry.action === 'itRepair.save') {
          fail = false;
          revoke = true;
          throw Object.assign(Error('Injected serialization'), {
            code: '40001',
          });
        }
        return record(entry, tx);
      });
    const transaction = vi
      .spyOn(db, 'transaction')
      .mockImplementation(
        async (...args: Parameters<typeof db.transaction>) => {
          try {
            return await nativeTransaction(...args);
          } catch (error) {
            if (revoke) {
              revoke = false;
              await users.disable(f.a.userId);
            }
            throw error;
          }
        },
      );
    try {
      await expect(
        svc.save(cmd(), { ...draft, title: 'Rolled back' }, ALL),
      ).rejects.toMatchObject({ code: 'ACCESS_DENIED' });
    } finally {
      transaction.mockRestore();
      fault.mockRestore();
    }
    expect(await db.repository('itRepairs').count()).toBe(before);
    expect((await users.get(f.a.userId))?.disabledAt).toBeTruthy();
    // Two prior commits, the failed attempt, then the fresh denied retry.
    expect([...userReads.values()]).toEqual([1, 1, 1, 1]);
    expect(userReads.size).toBe(4);
    expect([...employeeReads.values()]).toEqual([1, 1, 1]);
  } finally {
    userSpy.mockRestore();
    employeeSpy.mockRestore();
  }
});

test('group facts are read once after the shared fence and never reused by a group-writing configuration', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    f = await prepareRepairs(testApp),
    db = c.resolve(databaseManagerToken),
    svc = c.resolve(repairServiceToken);
  const group = {
    id: 'fact-group',
    title: 'Fact group',
    active: true,
    leaderIds: [f.leader.userId],
    engineerIds: [],
    categories: ['network'],
  };
  const command = (actorId: string) => ({ actorId, requestKey: randomUUID() });
  await svc.configure(
    { ...command(f.admin.userId), id: group.id, expectedVersion: 0 },
    group,
  );
  let row = await svc.save(command(f.a.userId), draft, ALL);
  row = await svc.submit(
    { ...command(f.a.userId), id: row.id, expectedVersion: row.version },
    ALL,
  );
  const native = await db.connection().client<Knex>();
  const locked = new Set<string>(),
    reads = new Map<string, number>();
  const capture = (query: { sql: string; __knexTxId?: string }) => {
    if (!query.__knexTxId) return;
    if (/^(commit|rollback)/i.test(query.sql)) locked.delete(query.__knexTxId);
    if (!/it_repair_groups/.test(query.sql)) return;
    if (/for share/i.test(query.sql)) locked.add(query.__knexTxId);
    else if (/^select/i.test(query.sql) && locked.has(query.__knexTxId))
      reads.set(query.__knexTxId, (reads.get(query.__knexTxId) ?? 0) + 1);
  };
  native.on('query', capture);
  try {
    const acted = await svc.act(
      { ...command(f.leader.userId), id: row.id, expectedVersion: row.version },
      'comment',
      { message: 'Fact reuse under shared lock' },
      ALL,
    );
    row = { ...row, version: acted.version };
    expect([...reads.values()]).toEqual([1]);
  } finally {
    native.off('query', capture);
  }
  // A configuration's self-written group cannot be replaced by the old fact.
  await svc.configure(
    { ...command(f.admin.userId), id: group.id, expectedVersion: 1 },
    { ...group, leaderIds: [f.b.userId] },
  );
  await expect(svc.get(row.id, f.leader.userId, ALL)).rejects.toMatchObject({
    code: 'ACCESS_DENIED',
  });
  expect((await svc.get(row.id, f.b.userId, ALL)).id).toBe(row.id);
  await c.resolve(employeeServiceToken).correctStatus(
    f.b.employeeId,
    {
      status: 'left',
      active: false,
      lastWorkingDay: '2026-10-30',
      reason: 'Synthetic qualification revocation',
    },
    ALL,
    f.admin.userId,
  );
  await expect(
    svc.act(
      { ...command(f.b.userId), id: row.id, expectedVersion: row.version },
      'comment',
      { message: 'Must be denied after departure' },
      ALL,
    ),
  ).rejects.toMatchObject({ code: 'ACCESS_DENIED' });
});
