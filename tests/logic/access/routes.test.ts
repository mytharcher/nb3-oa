// @vitest-environment node
import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import { startOrgTestApp, json, type OrgTestApp } from '../org/helpers.ts';
import { auditServiceToken } from '../../../server/providers/audit/index.ts';

describe('OA access management', () => {
  let app: OrgTestApp;
  beforeAll(async () => {
    app = await startOrgTestApp();
  }, 120_000);
  afterAll(async () => {
    await app?.close();
  });
  const settings = { type: 'settings', id: 'oa.org.positions' };
  async function definition(key: string) {
    const admin = await app.admin();
    const response = await admin.fetch(`/access/permissionSets/${key}`);
    expect(response.status).toBe(200);
    return (await response.json()).data;
  }
  it('authenticates and authorizes each facade independently', async () => {
    expect((await app.testApp.request('/access/snapshot')).status).toBe(401);
    const user = await app.createUser('AccessDenied');
    expect((await user.fetch('/access/snapshot')).status).toBe(403);
    expect(
      (await user.fetch('/access/permissionSets/anything', json({}, 'PUT')))
        .status,
    ).toBe(403);
    expect(
      (
        await user.fetch(
          '/access/subjects/user/anything/assignments',
          json({}, 'PUT'),
        )
      ).status,
    ).toBe(403);
  });
  it('patches only selected operations, audits the actor and rejects a stale revision', async () => {
    const admin = await app.admin();
    const key = 'access-patch-test';
    const untouched = {
      resource: { type: 'page', id: 'test-page' },
      actions: [{ action: 'access' }],
    };
    await app.authz.permissionSets.create({
      key,
      title: 'Keep this title',
      grants: [
        untouched,
        { resource: settings, actions: [{ action: 'read' }] },
      ],
    });
    const initial = await definition(key);
    const input = {
      expectedRevision: initial.revision,
      changes: [{ resource: settings, action: 'update', enabled: true }],
    };
    expect(
      (await admin.fetch(`/access/permissionSets/${key}`, json(input, 'PUT')))
        .status,
    ).toBe(200);
    const updated = await app.authz.permissionSets.get(key);
    expect(updated?.title).toBe('Keep this title');
    expect(updated?.grants).toContainEqual(untouched);
    expect(
      updated?.grants
        .find((grant) => grant.resource.id === settings.id)
        ?.actions.map((entry) => entry.action),
    ).toEqual(['read', 'update']);
    expect(
      (await admin.fetch(`/access/permissionSets/${key}`, json(input, 'PUT')))
        .status,
    ).toBe(409);
    const entries = await app.testApp.connection
      .repository('auditLogs')
      .findMany({ filter: { targetId: key, action: 'permissionSet.update' } });
    expect(entries).toHaveLength(1);
    expect(entries[0]?.actorId).toBe(admin.user.id);
  });
  it('rejects unsupported scopes, duplicate edits and protected root updates without writing', async () => {
    const admin = await app.admin();
    const key = 'access-validation-test';
    await app.authz.permissionSets.create({ key, grants: [] });
    const initial = await definition(key);
    for (const changes of [
      [
        {
          resource: { type: 'composite', id: 'oa.leave' },
          action: 'view',
          enabled: true,
          scopes: { imaginary: '*' },
        },
      ],
      [
        { resource: settings, action: 'read', enabled: true },
        { resource: settings, action: 'read', enabled: false },
      ],
    ])
      expect(
        (
          await admin.fetch(
            `/access/permissionSets/${key}`,
            json({ expectedRevision: initial.revision, changes }, 'PUT'),
          )
        ).status,
      ).toBe(400);
    expect((await app.authz.permissionSets.get(key))?.grants).toEqual([]);
    const root = (await app.authz.permissionSets.list()).find(
      (set) => app.authz.permissionSets.protection(set.key)?.unrestricted,
    )!;
    const state = await definition(root.key);
    expect(
      (
        await admin.fetch(
          `/access/permissionSets/${root.key}`,
          json(
            {
              expectedRevision: state.revision,
              changes: [{ resource: settings, action: 'read', enabled: true }],
            },
            'PUT',
          ),
        )
      ).status,
    ).toBe(400);
  });
  it('changes only the managed direct assignments, preserving other sources and rollback', async () => {
    const admin = await app.admin();
    const user = await app.createUser('AccessSources');
    const a = 'access-managed',
      b = 'access-preserved';
    for (const key of [a, b])
      await app.authz.permissionSets.create({ key, grants: [] });
    await app.authz.permissionSets.assign({
      permissionSet: b,
      subject: { type: 'user', id: user.user.id },
    });
    let response = await admin.fetch('/access/snapshot');
    let state = (await response.json()).data;
    const input = {
      expectedRevision: state.revision,
      managedPermissionSets: [a],
      permissionSets: [a],
    };
    response = await admin.fetch(
      `/access/subjects/user/${user.user.id}/assignments`,
      json(input, 'PUT'),
    );
    expect(response.status).toBe(200);
    const assignments = await app.authz.permissionSets.listAssignments();
    expect(
      assignments
        .filter((entry) => entry.subject.id === user.user.id)
        .map((entry) => entry.permissionSet),
    ).toEqual(expect.arrayContaining([a, b]));
    state = (await response.json()).data;
    const audit = app.testApp.application.container.resolve(auditServiceToken);
    const recording = vi
      .spyOn(audit, 'record')
      .mockRejectedValueOnce(new Error('audit failed'));
    try {
      response = await admin.fetch(
        `/access/subjects/user/${user.user.id}/assignments`,
        json(
          {
            expectedRevision: state.revision,
            managedPermissionSets: [a],
            permissionSets: [],
          },
          'PUT',
        ),
      );
      expect(response.status).toBe(500);
      expect(
        (await app.authz.permissionSets.listAssignments(a)).some(
          (entry) => entry.subject.id === user.user.id,
        ),
      ).toBe(true);
    } finally {
      recording.mockRestore();
    }
    response = await admin.fetch(
      `/access/subjects/user/${user.user.id}/assignments`,
      json(
        {
          expectedRevision: state.revision,
          managedPermissionSets: [a],
          permissionSets: [],
        },
        'PUT',
      ),
    );
    expect(response.status).toBe(200);
    expect(
      (await app.authz.permissionSets.listAssignments(b)).some(
        (entry) => entry.subject.id === user.user.id,
      ),
    ).toBe(true);
  });
  it('rejects a direct shared update when its affected subject cannot be resolved', async () => {
    const admin = await app.admin();
    const key = 'access-incomplete-impact';
    await app.authz.permissionSets.create({ key, grants: [] });
    await app.authz.permissionSets.assign({
      permissionSet: key,
      subject: { type: 'user', id: 'missing-impact-user' },
    });
    const current = await definition(key);
    const response = await admin.fetch(
      `/access/permissionSets/${key}`,
      json(
        {
          expectedRevision: current.revision,
          changes: [{ resource: settings, action: 'read', enabled: true }],
        },
        'PUT',
      ),
    );
    expect(response.status).toBe(400);
    expect((await response.json()).error.reason).toBe('IMPACT_UNAVAILABLE');
    expect((await app.authz.permissionSets.get(key))?.grants).toEqual([]);
  });
  it('serializes conflicting saves and rejects removal of the last active administrator', async () => {
    const admin = await app.admin();
    const key = 'access-concurrency';
    await app.authz.permissionSets.create({ key, grants: [] });
    const initial = await definition(key);
    const statuses = await Promise.all(
      ['read', 'update'].map(
        async (action) =>
          (
            await admin.fetch(
              `/access/permissionSets/${key}`,
              json(
                {
                  expectedRevision: initial.revision,
                  changes: [{ resource: settings, action, enabled: true }],
                },
                'PUT',
              ),
            )
          ).status,
      ),
    );
    expect(statuses.sort()).toEqual([200, 409]);
    const response = await admin.fetch('/access/snapshot');
    const state = (await response.json()).data;
    const root = state.sets.find(
      (set: { unrestricted?: boolean }) => set.unrestricted,
    );
    expect(
      (
        await admin.fetch(
          `/access/subjects/user/${admin.user.id}/assignments`,
          json(
            {
              expectedRevision: state.revision,
              managedPermissionSets: [root.key],
              permissionSets: [],
            },
            'PUT',
          ),
        )
      ).status,
    ).toBe(400);
  });
});
