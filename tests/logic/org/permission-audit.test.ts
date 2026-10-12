// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { auditServiceToken } from '../../../server/providers/audit/index.ts';
import { json, startOrgTestApp, type OrgTestApp } from './helpers.ts';

describe('permission-set audit', () => {
  let app: OrgTestApp;
  beforeAll(async () => {
    app = await startOrgTestApp();
  }, 120_000);
  afterAll(async () => {
    await app?.close();
  });

  async function entries(key: string) {
    return app.testApp.connection.repository('auditLogs').findMany({
      filter: { targetType: 'permissionSets', targetId: key },
      sort: (sort) => sort.field('id').asc(),
    });
  }

  it('audits HTTP assignment and Users role replacement with the signed-in actor', async () => {
    const admin = await app.admin();
    const person = await app.createUser('AuditRecipient');
    const key = 'audit-http-role';
    await app.authz.permissionSets.create({ key, title: key, grants: [] });
    const assigned = await admin.fetch(
      `/authorization/permissionSets/${key}/assignments`,
      json({ subject: { type: 'user', id: person.user.id } }),
    );
    expect(assigned.status).toBe(201);
    expect(await entries(key)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: 'permissionSet.assign',
          actorId: admin.user.id,
        }),
      ]),
    );
    const changed = await admin.fetch(
      `/users/${person.user.id}/roleScopes/app`,
      json({ value: [] }, 'PUT'),
    );
    expect(changed.status).toBe(200);
    expect(await entries(key)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: 'permissionSet.revoke',
          actorId: admin.user.id,
        }),
      ]),
    );
  });

  it('rolls back permission mutations and notifications when auditing fails', async () => {
    const sets = app.authz.permissionSets;
    const key = 'audit-rollback-role';
    await sets.create({ key, title: key, grants: [] });
    const person = await app.createUser('AuditRollback');
    const changed = vi.fn();
    const release = app.authz.onGrantsChanged(changed);
    const audit = app.testApp.application.container.resolve(auditServiceToken);
    const recording = vi
      .spyOn(audit, 'record')
      .mockRejectedValueOnce(new Error('Audit storage failed'));
    try {
      await expect(
        sets.assign({
          permissionSet: key,
          subject: { type: 'user', id: person.user.id },
        }),
      ).rejects.toThrow('Audit storage failed');
      expect(await sets.listAssignments(key)).toEqual([]);
      expect(changed).not.toHaveBeenCalled();
      expect((await entries(key)).map((entry) => entry.action)).toEqual([
        'permissionSet.create',
      ]);
    } finally {
      recording.mockRestore();
      release();
    }
  });

  it('joins caller transactions and preserves the last-root-assignment protection', async () => {
    const sets = app.authz.permissionSets;
    const key = 'audit-caller-role';
    const person = await app.createUser('AuditCaller');
    await expect(
      app.testApp.database.transaction(async (connection) => {
        const bound = sets.withTransaction(connection);
        await bound.create({ key, title: key, grants: [] });
        await bound.assign({
          permissionSet: key,
          subject: { type: 'user', id: person.user.id },
        });
        throw new Error('Caller rollback');
      }),
    ).rejects.toThrow('Caller rollback');
    expect(await sets.get(key)).toBeUndefined();
    expect(await entries(key)).toEqual([]);
    const root = (await sets.list()).find(
      (set) => sets.protection(set.key)?.unrestricted,
    );
    expect(root).toBeDefined();
    const assignments = await sets.listAssignments(root!.key);
    expect(assignments).toHaveLength(1);
    await expect(sets.revoke(assignments[0]!.id)).rejects.toThrow();
    expect(await sets.listAssignments(root!.key)).toHaveLength(1);
  });

  it('records definition changes and skips unchanged role replacements', async () => {
    const sets = app.authz.permissionSets;
    const key = 'audit-definition';
    const person = await app.createUser('AuditNoop');
    await sets.create({ key, title: key, grants: [] });
    await sets.update(key, { key, title: 'Renamed', grants: [] });
    const input = {
      subject: { type: 'user', id: person.user.id },
      managedPermissionSets: [key],
      permissionSets: [key],
    };
    await sets.replaceSubjectAssignments(input);
    await sets.replaceSubjectAssignments(input);
    await sets.delete(key);
    expect((await entries(key)).map((entry) => entry.action)).toEqual([
      'permissionSet.create',
      'permissionSet.update',
      'permissionSet.assign',
      'permissionSet.delete',
    ]);
    expect(await sets.listAssignments(key)).toEqual([]);
  });
  it('keeps complete definition updates, their audit and notifications in the caller transaction', async () => {
    const sets = app.authz.permissionSets;
    const key = 'audit-definition-transaction';
    const person = await app.createUser('AuditDefinitionTransaction');
    await sets.create({ key, title: 'Before', grants: [] });
    await sets.assign({
      permissionSet: key,
      subject: { type: 'user', id: person.user.id },
    });
    const changed = vi.fn();
    const release = app.authz.onGrantsChanged(changed);
    const audit = app.testApp.application.container.resolve(auditServiceToken);
    const original = audit.record.bind(audit);
    const recording = vi
      .spyOn(audit, 'record')
      .mockImplementation(async (entry, connection) => {
        if (entry.action === 'permissionSet.update')
          throw new Error('Definition audit failure');
        return original(entry, connection);
      });
    try {
      await expect(
        sets.update(key, { key, title: 'Must roll back', grants: [] }),
      ).rejects.toThrow('Definition audit failure');
      expect(await sets.get(key)).toMatchObject({
        key,
        title: 'Before',
        grants: [],
      });
      expect(changed).not.toHaveBeenCalled();
      expect(
        (await entries(key)).filter(
          (entry) => entry.action === 'permissionSet.update',
        ),
      ).toEqual([]);
      recording.mockRestore();
      await expect(
        app.testApp.database.transaction(async (connection) => {
          const bound = sets.withTransaction(connection);
          await bound.update(key, { key, title: 'Caller update', grants: [] });
          expect(await bound.get(key)).toMatchObject({
            key,
            title: 'Caller update',
          });
          expect(changed).not.toHaveBeenCalled();
          throw new Error('Definition caller rollback');
        }),
      ).rejects.toThrow('Definition caller rollback');
      expect(await sets.get(key)).toMatchObject({ key, title: 'Before' });
      expect(changed).not.toHaveBeenCalled();
      expect(
        (await entries(key)).filter(
          (entry) => entry.action === 'permissionSet.update',
        ),
      ).toEqual([]);
      await app.testApp.database.transaction(async (connection) => {
        await sets
          .withTransaction(connection)
          .update(key, { key, title: 'Committed', grants: [] });
        expect(changed).not.toHaveBeenCalled();
      });
      expect(await sets.get(key)).toMatchObject({ key, title: 'Committed' });
      expect(changed).toHaveBeenCalledExactlyOnceWith({
        type: 'user',
        id: person.user.id,
      });
      expect(
        (await entries(key)).filter(
          (entry) => entry.action === 'permissionSet.update',
        ),
      ).toEqual([
        expect.objectContaining({
          before: expect.objectContaining({ title: 'Before' }),
          after: expect.objectContaining({ title: 'Committed' }),
        }),
      ]);
    } finally {
      recording.mockRestore();
      release();
    }
  });
});
