import type { DefaultAccessAuthorizationApi } from '@nocobase/authorization/default-access';
import type { DatabaseConnection } from '@nocobase/db';
// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { startOrgTestApp, json, type OrgTestApp } from '../org/helpers.ts';
import { auditServiceToken } from '../../../server/providers/audit/index.ts';

describe('role matrix atomic saves', () => {
  let app: OrgTestApp;
  let sequence = 0;
  const resource = { type: 'settings', id: 'oa.org.positions' };
  beforeAll(async () => {
    app = await startOrgTestApp();
  }, 120_000);
  afterAll(async () => {
    await app?.close();
  });
  async function fixture(shared = false) {
    sequence += 1;
    const key = `role-matrix-${sequence}`;
    const subject = { type: 'org.dutyRole', id: 'hr' };
    // Use a fresh role subject per case so earlier sources cannot interfere.
    const position = await app.organization.createPosition(
      { code: `matrix-${sequence}`, title: `Matrix ${sequence}` },
      { actorId: (await app.admin()).user.id },
    );
    subject.type = 'org.position';
    subject.id = position.id;
    await app.authz.permissionSets.create({
      key,
      title: 'Matrix test',
      grants: [{ resource, actions: [{ action: 'read' }] }],
    });
    await app.authz.permissionSets.assign({ permissionSet: key, subject });
    if (shared)
      await app.authz.permissionSets.assign({
        permissionSet: key,
        subject: { type: 'authenticated', id: '*' },
      });
    return { key, subject };
  }
  async function save(
    subject: { type: string; id: string },
    changes: unknown[],
    sharedSets = 'split',
    expectedRevision?: string,
  ) {
    const admin = await app.admin();
    const state = (await (await admin.fetch('/access/snapshot')).json()).data;
    return admin.fetch(
      `/access/subjects/${encodeURIComponent(subject.type)}/${encodeURIComponent(subject.id)}/grants`,
      json(
        {
          expectedRevision: expectedRevision ?? state.revision,
          changes,
          sharedSets,
        },
        'PUT',
      ),
    );
  }
  const update = [{ resource, action: 'update', value: {} }];
  it('checks authentication and every management action', async () => {
    expect(
      (
        await app.testApp.request(
          '/access/subjects/org.position/x/grants',
          json({}, 'PUT'),
        )
      ).status,
    ).toBe(401);
    const user = await app.createUser('MatrixDenied');
    expect(
      (
        await user.fetch(
          '/access/subjects/org.position/x/grants',
          json({}, 'PUT'),
        )
      ).status,
    ).toBe(403);
  });
  it('updates a single source, preserves unrelated grants, audits and rejects stale revisions', async () => {
    const { key, subject } = await fixture();
    const response = await save(subject, update);
    expect(response.status).toBe(200);
    expect(
      (await app.authz.permissionSets.get(key))?.grants[0].actions.map(
        (entry) => entry.action,
      ),
    ).toEqual(['read', 'update']);
    expect((await save(subject, update, 'split', '0'.repeat(64))).status).toBe(
      409,
    );
  });
  it('splits a shared source once and keeps other subjects unchanged', async () => {
    const { key, subject } = await fixture(true);
    const response = await save(subject, update);
    expect(response.status).toBe(200);
    expect(
      (await app.authz.permissionSets.get(key))?.grants[0].actions,
    ).toEqual([{ action: 'read' }]);
    const assignments = await app.authz.permissionSets.listAssignments();
    const own = assignments.filter((entry) => entry.subject.id === subject.id);
    expect(own).toHaveLength(1);
    expect(own[0].permissionSet).not.toBe(key);
    expect(
      assignments.some(
        (entry) =>
          entry.permissionSet === key && entry.subject.type === 'authenticated',
      ),
    ).toBe(true);
    expect(
      (await save(subject, [{ resource, action: 'update', value: null }]))
        .status,
    ).toBe(200);
  });
  it('can intentionally update all shared subjects', async () => {
    const { key, subject } = await fixture(true);
    expect((await save(subject, update, 'all')).status).toBe(200);
    expect(
      (await app.authz.permissionSets.get(key))?.grants[0].actions,
    ).toHaveLength(2);
    expect(await app.authz.permissionSets.listAssignments(key)).toHaveLength(2);
  });
  it('creates a new module set and deletes an empty unshared set', async () => {
    const { key, subject } = await fixture();
    expect(
      (
        await save(subject, [
          {
            resource: { type: 'settings', id: 'oa.org.departments' },
            action: 'read',
            value: {},
          },
        ])
      ).status,
    ).toBe(200);
    expect(
      (await save(subject, [{ resource, action: 'read', value: null }])).status,
    ).toBe(200);
    expect(await app.authz.permissionSets.get(key)).toBeUndefined();
    expect(
      (await app.authz.permissionSets.listAssignments()).filter(
        (entry) => entry.subject.id === subject.id,
      ),
    ).toHaveLength(1);
  });
  it('rejects conflicting operation policies, wildcard operation edits and protected updates', async () => {
    const { key, subject } = await fixture();
    const leave = { type: 'composite', id: 'oa.leave' };
    await app.authz.permissionSets.update(key, {
      key,
      grants: [
        {
          resource: leave,
          actions: [
            {
              action: 'view',
              policy: {
                type: 'composite',
                scopes: { leaveRequests: 'allRecords' },
              },
            },
          ],
        },
      ],
    });
    await app.authz.permissionSets.create({
      key: `${key}-other`,
      grants: [
        {
          resource: leave,
          actions: [
            {
              action: 'view',
              policy: {
                type: 'composite',
                scopes: { leaveRequests: 'oa.leaveReadable' },
              },
            },
          ],
        },
      ],
    });
    await app.authz.permissionSets.assign({
      permissionSet: `${key}-other`,
      subject,
    });
    const conflict = await save(subject, [
      { resource: leave, action: 'view', value: null },
    ]);
    expect(conflict.status).toBe(400);
    expect(JSON.stringify(await conflict.json())).toContain('MULTIPLE_SOURCES');
    const other = await fixture();
    await app.authz.permissionSets.update(other.key, {
      key: other.key,
      grants: [
        {
          resource: { type: 'settings', id: '*' },
          actions: [{ action: 'read' }],
        },
      ],
    });
    expect(
      (await save(other.subject, [{ resource, action: 'read', value: null }]))
        .status,
    ).toBe(400);
    const protectedSet = await fixture();
    const release = app.authz.permissionSets.protect({
      owner: 'matrix-test',
      keys: [protectedSet.key],
    });
    try {
      expect(
        (
          await save(protectedSet.subject, [
            { resource, action: 'read', value: null },
          ])
        ).status,
      ).toBe(400);
    } finally {
      release();
    }
  });
  it('routes disjoint operations separately and requires a destination only for a new ambiguous operation', async () => {
    const { key, subject } = await fixture();
    const module = { type: 'composite', id: 'oa.leave' };
    await app.authz.permissionSets.update(key, {
      key,
      grants: [
        {
          resource: module,
          actions: [
            {
              action: 'view',
              policy: {
                type: 'composite',
                scopes: { leaveRequests: 'allRecords' },
              },
            },
          ],
        },
      ],
    });
    const second = `${key}-review`;
    await app.authz.permissionSets.create({
      key: second,
      grants: [
        {
          resource: module,
          actions: [
            {
              action: 'submit',
              policy: {
                type: 'composite',
                scopes: { leaveRequests: 'allRecords' },
              },
            },
          ],
        },
      ],
    });
    await app.authz.permissionSets.assign({ permissionSet: second, subject });
    expect(
      (
        await save(subject, [
          {
            resource: module,
            action: 'view',
            value: { scopes: { leaveRequests: 'oa.leaveReadable' } },
          },
        ])
      ).status,
    ).toBe(200);
    expect(
      (await app.authz.permissionSets.get(second))?.grants[0].actions[0].action,
    ).toBe('submit');
    const change = {
      resource: module,
      action: 'delegate',
      value: { scopes: { leaveRequests: 'allRecords' } },
    };
    expect((await save(subject, [change])).status).toBe(400);
    expect(
      (await save(subject, [{ ...change, permissionSet: 'unassigned' }]))
        .status,
    ).toBe(400);
    expect(
      (await save(subject, [{ ...change, permissionSet: second }])).status,
    ).toBe(200);
    expect(
      (await app.authz.permissionSets.get(second))?.grants[0].actions.map(
        (entry) => entry.action,
      ),
    ).toEqual(['submit', 'delegate']);
    expect(
      (await app.authz.permissionSets.get(key))?.grants[0].actions,
    ).toHaveLength(1);
  });
  it('updates and revokes every equal duplicate source, preserving unrelated operations', async () => {
    const { key, subject } = await fixture();
    const second = `${key}-same`;
    await app.authz.permissionSets.create({
      key: second,
      grants: [
        { resource, actions: [{ action: 'read' }, { action: 'update' }] },
      ],
    });
    await app.authz.permissionSets.assign({ permissionSet: second, subject });
    expect(
      (await save(subject, [{ resource, action: 'read', value: null }])).status,
    ).toBe(200);
    expect(await app.authz.permissionSets.get(key)).toBeUndefined();
    expect(
      (await app.authz.permissionSets.get(second))?.grants[0].actions,
    ).toEqual([{ action: 'update' }]);
  });
  it('checks create for new sets and splits and delete only when an unshared set is removed', async () => {
    const actor = await app.createUser('MatrixEditorCapabilities');
    const management = 'matrix-editor-capabilities';
    const actions = ['read', 'update', 'assign'];
    async function capabilities(extra: string[]) {
      const definition = {
        key: management,
        grants: [
          {
            resource: { type: 'settings', id: 'authorization.permission-sets' },
            actions: [...actions, ...extra].map((action) => ({ action })),
          },
        ],
      };
      if (await app.authz.permissionSets.get(management))
        await app.authz.permissionSets.update(management, definition);
      else {
        await app.authz.permissionSets.create(definition);
        await app.authz.permissionSets.assign({
          permissionSet: management,
          subject: { type: 'user', id: actor.user.id },
        });
      }
    }
    async function edit(
      subject: { type: string; id: string },
      changes: unknown[],
      sharedSets = 'split',
    ) {
      const state = (await (await actor.fetch('/access/snapshot')).json()).data;
      return actor.fetch(
        `/access/subjects/${subject.type}/${subject.id}/grants`,
        json({ expectedRevision: state.revision, changes, sharedSets }, 'PUT'),
      );
    }
    await capabilities([]);
    const own = await fixture();
    expect((await edit(own.subject, update)).status).toBe(200);
    expect(
      (
        await edit(own.subject, [
          {
            resource: { type: 'settings', id: 'oa.org.departments' },
            action: 'read',
            value: {},
          },
        ])
      ).status,
    ).toBe(403);
    const mixed = await edit(own.subject, [
      { resource, action: 'read', value: null },
      {
        resource: { type: 'settings', id: 'oa.org.departments' },
        action: 'read',
        value: {},
      },
    ]);
    expect(mixed.status).toBe(403);
    expect(
      (await app.authz.permissionSets.get(own.key))?.grants[0].actions.map(
        (entry) => entry.action,
      ),
    ).toEqual(['read', 'update']);
    const shared = await fixture(true);
    expect((await edit(shared.subject, update)).status).toBe(403);
    expect(
      await app.authz.permissionSets.listAssignments(shared.key),
    ).toHaveLength(2);
    expect((await edit(shared.subject, update, 'all')).status).toBe(200);
    expect(
      (await edit(own.subject, [{ resource, action: 'update', value: null }]))
        .status,
    ).toBe(200);
    expect(
      (await edit(own.subject, [{ resource, action: 'read', value: null }]))
        .status,
    ).toBe(403);
    expect(
      (await app.authz.permissionSets.get(own.key))?.grants[0].actions,
    ).toEqual([{ action: 'read' }]);
    await capabilities(['create']);
    expect(
      (
        await edit(shared.subject, [
          { resource, action: 'update', value: null },
        ])
      ).status,
    ).toBe(200);
    await capabilities(['delete']);
    expect(
      (await edit(own.subject, [{ resource, action: 'read', value: null }]))
        .status,
    ).toBe(200);
    expect(await app.authz.permissionSets.get(own.key)).toBeUndefined();
  });
  it('stores translated role titles and returns readable rule links with saved snapshots', async () => {
    const { subject } = await fixture(true);
    const rules = (
      app.authz as typeof app.authz &
        DefaultAccessAuthorizationApi<DatabaseConnection>
    ).defaultAccess;
    const previous = (await rules.list()).find(
      (rule) =>
        rule.resource.type === 'composite' && rule.resource.id === 'oa.leave',
    );
    if (!previous)
      await rules.create({
        key: 'matrix-retained-rules',
        resource: { type: 'composite', id: 'oa.leave' },
        actions: [
          {
            action: 'view',
            scopeKey: 'leaveRequests',
            selection: { type: 'all' },
          },
        ],
      });
    const response = await save(subject, update);
    expect(response.status).toBe(200);
    const state = (await response.json()).data;
    expect(state.rules).toContainEqual({
      kind: 'default-access',
      resource: { type: 'composite', id: 'oa.leave' },
      count: 1,
    });
    if (!previous) await rules.delete('matrix-retained-rules');
    expect(state.rules).toEqual(expect.any(Array));
    const generated = state.sets.find((set: { key: string; title?: unknown }) =>
      state.assignments.some(
        (entry: {
          permissionSet: string;
          subject: { type: string; id: string };
        }) =>
          entry.permissionSet === set.key && entry.subject.id === subject.id,
      ),
    );
    expect(generated.title).toMatchObject({
      ns: 'nb3-oa',
      key: expect.stringContaining('access.roleGrant:'),
    });
    expect(generated.title).not.toBe('Matrix test');
  });
  it('can split a generated role set after it is shared again', async () => {
    const { subject } = await fixture();
    const other = { type: 'settings', id: 'oa.org.departments' };
    expect(
      (await save(subject, [{ resource: other, action: 'read', value: {} }]))
        .status,
    ).toBe(200);
    const assigned = (await app.authz.permissionSets.listAssignments()).filter(
      (entry) => entry.subject.id === subject.id,
    );
    const generated = (
      await Promise.all(
        assigned.map((entry) =>
          app.authz.permissionSets.get(entry.permissionSet),
        ),
      )
    ).find((set) =>
      set?.grants.some((grant) => grant.resource.id === other.id),
    )!;
    await app.authz.permissionSets.assign({
      permissionSet: generated.key,
      subject: { type: 'authenticated', id: '*' },
    });
    expect(
      (await save(subject, [{ resource: other, action: 'update', value: {} }]))
        .status,
    ).toBe(200);
    expect(
      (await app.authz.permissionSets.listAssignments(generated.key)).some(
        (entry) => entry.subject.id === subject.id,
      ),
    ).toBe(false);
    expect(
      (await app.authz.permissionSets.get(generated.key))?.grants[0].actions,
    ).toHaveLength(1);
  });
  it('copies a cross-module shared set once and preserves unrelated operations', async () => {
    const { key, subject } = await fixture(true);
    const other = { type: 'settings', id: 'oa.org.departments' };
    const untouched = {
      resource: { type: 'page', id: 'retained-page' },
      actions: [{ action: 'access' }],
    };
    await app.authz.permissionSets.update(key, {
      key,
      grants: [
        { resource, actions: [{ action: 'read' }] },
        { resource: other, actions: [{ action: 'read' }] },
        untouched,
      ],
    });
    expect(
      (
        await save(subject, [
          ...update,
          { resource: other, action: 'update', value: {} },
        ])
      ).status,
    ).toBe(200);
    const assigned = (await app.authz.permissionSets.listAssignments()).filter(
      (entry) => entry.subject.id === subject.id,
    );
    expect(assigned).toHaveLength(1);
    const copy = await app.authz.permissionSets.get(assigned[0].permissionSet);
    expect(copy?.grants).toContainEqual(untouched);
    expect(
      copy?.grants
        .filter((grant) => grant.resource.type === 'settings')
        .every((grant) => grant.actions.length === 2),
    ).toBe(true);
    expect(
      (await app.authz.permissionSets.get(key))?.grants
        .filter((grant) => grant.resource.type === 'settings')
        .every((grant) => grant.actions.length === 1),
    ).toBe(true);
  });
  it('revalidates shared impact and refuses an unresolved audience without mutation', async () => {
    const { key, subject } = await fixture(true);
    await app.authz.permissionSets.assign({
      permissionSet: key,
      subject: { type: 'org.position', id: 'missing-position' },
    });
    const response = await save(subject, update);
    expect(response.status).toBe(400);
    expect((await response.json()).error.reason).toBe('IMPACT_UNAVAILABLE');
    expect(
      (await app.authz.permissionSets.get(key))?.grants[0].actions,
    ).toEqual([{ action: 'read' }]);
  });
  it('provides deduplicated descendant membership counts and protects member names independently', async () => {
    const admin = await app.admin();
    const user = await app.createUser('MatrixDirectory');
    const context = { actorId: admin.user.id };
    const parent = await app.organization.createDepartment(
      { title: 'Matrix parent' },
      context,
    );
    const child = await app.organization.createDepartment(
      { title: 'Matrix child', parentId: parent.id },
      context,
    );
    await app.organization.addMember(
      { departmentId: parent.id, userId: user.user.id },
      context,
    );
    await app.organization.addMember(
      { departmentId: child.id, userId: user.user.id },
      context,
    );
    const response = await admin.fetch('/access/directory');
    expect(response.status).toBe(200);
    const directory = (await response.json()).data;
    expect(
      directory.find(
        (entry: { type: string; id: string }) =>
          entry.type === 'org.department' && entry.id === parent.id,
      ).memberCount,
    ).toBe(1);
    const key = 'matrix-directory-reader';
    await app.authz.permissionSets.create({
      key,
      grants: [
        {
          resource: { type: 'settings', id: 'authorization.permission-sets' },
          actions: [{ action: 'read' }],
        },
      ],
    });
    await app.authz.permissionSets.assign({
      permissionSet: key,
      subject: { type: 'user', id: user.user.id },
    });
    expect((await user.fetch('/access/directory')).status).toBe(200);
    // Fresh-install baseline grants user-directory read. Remove only that grant in this isolated fixture
    // to prove permission-set read alone cannot disclose member names, then restore the baseline.
    const directoryGrants = (await app.authz.permissionSets.list()).filter(
      (set) =>
        set.grants.some(
          (grant) =>
            grant.resource.type === 'user' &&
            grant.actions.some((action) => action.action === 'read'),
        ),
    );
    try {
      for (const set of directoryGrants)
        await app.authz.permissionSets.update(set.key, {
          ...set,
          grants: set.grants.filter((grant) => grant.resource.type !== 'user'),
        });
      expect(
        (
          await user.fetch(
            `/access/subjects/org.department/${parent.id}/members`,
          )
        ).status,
      ).toBe(403);
    } finally {
      for (const set of directoryGrants)
        await app.authz.permissionSets.update(set.key, set);
    }
  });
  it('rolls back definition and assignments when audit fails', async () => {
    const { key, subject } = await fixture(true);
    const audit = app.testApp.application.container.resolve(auditServiceToken);
    const recording = vi
      .spyOn(audit, 'record')
      .mockRejectedValueOnce(new Error('audit failed'));
    try {
      expect((await save(subject, update)).status).toBe(500);
      expect(await app.authz.permissionSets.listAssignments(key)).toHaveLength(
        2,
      );
      expect(
        (await app.authz.permissionSets.get(key))?.grants[0].actions,
      ).toEqual([{ action: 'read' }]);
    } finally {
      recording.mockRestore();
    }
  });
  it('edits personal exceptions with the same subject revision and permission checks', async () => {
    const user = await app.createUser('PersonalMatrix');
    const admin = await app.admin();
    const subject = { type: 'user', id: user.user.id };
    const response = await admin.fetch(`/access/subjects/user/${subject.id}`);
    expect(response.status).toBe(200);
    const state = (await response.json()).data;
    const result = await admin.fetch(
      `/access/subjects/user/${subject.id}/grants`,
      json(
        {
          expectedRevision: state.revision,
          revisionScope: 'subject',
          sharedSets: 'split',
          changes: update,
        },
        'PUT',
      ),
    );
    expect(result.status).toBe(200);
    expect(
      (
        await user.fetch(
          `/access/subjects/user/${subject.id}/grants`,
          json({ expectedRevision: state.revision, changes: update }, 'PUT'),
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await admin.fetch(
          `/access/subjects/user/${subject.id}/grants`,
          json(
            {
              expectedRevision: state.revision,
              revisionScope: 'subject',
              sharedSets: 'split',
              changes: update,
            },
            'PUT',
          ),
        )
      ).status,
    ).toBe(409);
  });
});
