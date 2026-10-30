// @vitest-environment node
import { expect, test, vi } from 'vitest';
import { createAuthorization } from '@nocobase/authorization/core';
import {
  permissionSetsPlugin,
  type PermissionSet,
  type PermissionSetStore,
} from '@nocobase/authorization/permission-sets';

function fixture(batch: boolean) {
  const sets: PermissionSet[] = ['b', 'a', 'root'].map((key) => ({
    key,
    revision: `revision-${key}`,
    title: key,
    grants: [
      { resource: { type: 'page', id: key }, actions: [{ action: 'access' }] },
    ],
  }));
  const get = vi.fn(async (key: string) => sets.find((set) => set.key === key));
  const getMany = vi.fn(async (keys: readonly string[]) =>
    Promise.all(keys.map(get)),
  );
  const findAssignments = vi.fn(async () =>
    ['b', 'a', 'b', 'root'].map((key, i) => ({
      id: String(i),
      permissionSet: key,
      subject: { type: 'user', id: 'u' },
    })),
  );
  const store: PermissionSetStore = {
    get,
    ...(batch ? { getMany } : {}),
    findAssignments,
    list: async () => sets,
    create: async (s) => s,
    update: async (_, s) => s,
    delete: async () => {},
    assign: async (s) => s,
    revoke: async () => {},
    listAssignments: async () => [],
    withTransaction: () => store,
  };
  const plugin = permissionSetsPlugin({
    store,
    rootSet: { key: 'root', requireActiveAssignment: false },
  });
  const auth = createAuthorization({ plugins: [plugin] });
  return { auth, plugin, get, getMany, sets, findAssignments };
}
test('optional batch resolution preserves ordered deduplication, merging, protected root and fallback', async () => {
  const batch = fixture(true),
    fallback = fixture(false);
  const identity = {
    principal: { type: 'user', id: 'u' },
    subjects: [{ type: 'team', id: 't' }],
  };
  const effective = await batch.auth.permissionSets.getEffective(identity);
  expect(effective.map((s) => s.key)).toEqual(['b', 'a', 'root']);
  expect(batch.getMany).toHaveBeenCalledWith(['b', 'a', 'root']);
  expect(effective).toEqual(
    await fallback.auth.permissionSets.getEffective(identity),
  );
  expect(await batch.auth.for(identity).snapshot()).toEqual(
    await fallback.auth.for(identity).snapshot(),
  );
  expect((await batch.auth.for(identity).snapshot()).unrestricted).toBe(true);
  expect(await batch.plugin.grants!.resolveAll(identity)).toEqual(
    await fallback.plugin.grants!.resolveAll(identity),
  );
  batch.sets.pop();
  fallback.sets.pop();
  await expect(
    batch.auth.permissionSets.getEffective(identity),
  ).rejects.toThrow('Unknown Permission Set: root');
  await expect(
    fallback.auth.permissionSets.getEffective(identity),
  ).rejects.toThrow('Unknown Permission Set: root');
  batch.findAssignments.mockResolvedValue([]);
  expect(await batch.auth.permissionSets.getEffective(identity)).toEqual([]);
});
