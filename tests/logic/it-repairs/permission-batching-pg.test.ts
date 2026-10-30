// @vitest-environment node
import { expect } from 'vitest';
import type { Knex } from 'knex';
import { randomUUID } from 'node:crypto';
import { databaseManagerToken } from '@nocobase/db';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { createPlatformAppTest } from '../platform/helpers.js';
import { createEmployee } from '../employees/helpers.js';
const test = createPlatformAppTest();
test('PG owner resolves 49 sets in one parameterized query, chunks all keys and reads its transaction', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    auth = c.resolve(authorizationToken);
  const person = await createEmployee(testApp, 'Batch permission subject');
  const identity = { principal: { type: 'user', id: person.userId } };
  const keys = Array.from(
    { length: 205 },
    (_, i) => `batch-${String(i).padStart(3, '0')}`,
  );
  for (const key of keys) {
    await auth.permissionSets.create({ key, title: key, grants: [] });
    if (keys.indexOf(key) < 48)
      await auth.permissionSets.assign({
        permissionSet: key,
        subject: identity.principal,
      });
  }
  const knex = (await db.connection().client()) as Knex;
  const selects: { sql: string; bindings?: readonly unknown[] }[] = [];
  const capture = (query: { sql: string; bindings?: readonly unknown[] }) => {
    if (
      /^select/i.test(query.sql) &&
      /authorization_permission_sets|authorizationPermissionSets/.test(
        query.sql,
      )
    )
      selects.push(query);
  };
  knex.on('query', capture);
  try {
    const effective = await auth.permissionSets.getEffective(identity);
    expect(effective.map((s) => s.key).sort()).toEqual([
      ...keys.slice(0, 48),
      'member',
    ]);
    expect(selects).toHaveLength(1);
    expect(selects[0].sql).toMatch(/\bin\s*\(/i);
    expect(selects[0].bindings).toHaveLength(49);
    for (const key of keys.slice(48))
      await auth.permissionSets.assign({
        permissionSet: key,
        subject: identity.principal,
      });
    selects.length = 0;
    expect(
      (await auth.permissionSets.getEffective(identity))
        .map((s) => s.key)
        .sort(),
    ).toEqual([...keys, 'member']);
    expect(selects).toHaveLength(2);
    expect(selects.map((q) => q.bindings!.length)).toEqual([200, 6]);
    selects.length = 0;
    expect(
      await auth.permissionSets.getEffective({
        principal: { type: 'user', id: randomUUID() },
      }),
    ).toEqual([]);
    expect(selects).toHaveLength(0);
    const transactional = `transaction-${randomUUID()}`;
    await expect(
      db.transaction(async (tx) => {
        const owner = auth.permissionSets.withTransaction(tx);
        await owner.create({ key: transactional, grants: [] });
        await owner.assign({
          permissionSet: transactional,
          subject: identity.principal,
        });
        expect(
          (await owner.getEffective(identity)).some(
            (s) => s.key === transactional,
          ),
        ).toBe(true);
        expect(
          (await auth.permissionSets.getEffective(identity)).some(
            (s) => s.key === transactional,
          ),
        ).toBe(false);
        throw Error('deliberate rollback');
      }),
    ).rejects.toThrow('deliberate rollback');
    expect(await auth.permissionSets.get(transactional)).toBeUndefined();
  } finally {
    knex.off('query', capture);
  }
});
