// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { startOrgTestApp, json, type OrgTestApp } from '../org/helpers.ts';

describe('on-demand access reads and role revisions', () => {
  let app: OrgTestApp;
  const resource = { type: 'settings', id: 'oa.org.positions' };
  beforeAll(async () => {
    app = await startOrgTestApp();
  }, 120_000);
  afterAll(async () => {
    await app?.close();
  });
  it('independently protects lightweight and detail endpoints', async () => {
    const denied = await app.createUser('OnDemandDenied');
    for (const path of [
      '/access/roles',
      '/access/options',
      '/access/subjects/org.dutyRole/hr',
    ]) {
      expect((await app.testApp.request(path)).status).toBe(401);
      expect((await denied.fetch(path)).status).toBe(403);
    }
  });
  it('does not scan permission definitions, assignments or members for the list and catalog', async () => {
    const admin = await app.admin();
    const list = vi.spyOn(app.authz.permissionSets, 'list');
    const assignments = vi.spyOn(app.authz.permissionSets, 'listAssignments');
    const memberships = vi.spyOn(app.organization, 'accessMemberships');
    const collections = vi.spyOn(app.testApp.connection.collections, 'list');
    try {
      const roles = await admin.fetch('/access/roles');
      expect(roles.status).toBe(200);
      const data = (await roles.json()).data;
      expect(data).toContainEqual(
        expect.objectContaining({ type: 'org.dutyRole', id: 'hr' }),
      );
      expect(
        data.every(
          (role: object) => Object.keys(role).sort().join() === 'id,title,type',
        ),
      ).toBe(true);
      const options = await admin.fetch('/access/options');
      expect(options.status).toBe(200);
      const catalog = (await options.json()).data;
      expect(catalog.collections).toEqual([]);
      expect(
        catalog.sections.flatMap((s: any) =>
          s.subsections.flatMap((s: any) => s.resources),
        ),
      ).toContainEqual(
        expect.objectContaining({ type: 'composite', id: 'oa.leave' }),
      );
      expect(list).not.toHaveBeenCalled();
      expect(assignments).not.toHaveBeenCalled();
      expect(memberships).not.toHaveBeenCalled();
      expect(collections).not.toHaveBeenCalled();
    } finally {
      vi.restoreAllMocks();
    }
  });
  async function fixture() {
    const admin = await app.admin();
    const position = await app.organization.createPosition(
      { code: `on-demand-${crypto.randomUUID()}`, title: 'On demand fixture' },
      { actorId: admin.user.id },
    );
    const subject = { type: 'org.position', id: position.id };
    const key = `on-demand-${position.id}`;
    await app.authz.permissionSets.create({
      key,
      grants: [{ resource, actions: [{ action: 'read' }] }],
    });
    await app.authz.permissionSets.assign({ permissionSet: key, subject });
    const path = `/access/subjects/${subject.type}/${subject.id}`;
    const read = async () => (await (await admin.fetch(path)).json()).data;
    const save = (state: { revision: string }, sharedSets = 'split') =>
      admin.fetch(
        `${path}/grants`,
        json(
          {
            expectedRevision: state.revision,
            revisionScope: 'subject',
            sharedSets,
            changes: [{ resource, action: 'update', value: {} }],
          },
          'PUT',
        ),
      );
    return { admin, key, subject, path, read, save };
  }
  it('reads only relevant definitions and includes their complete shared audiences', async () => {
    const f = await fixture();
    await app.authz.permissionSets.assign({
      permissionSet: f.key,
      subject: { type: 'org.dutyRole', id: 'hr' },
    });
    const list = vi.spyOn(app.authz.permissionSets, 'list');
    try {
      const state = await f.read();
      expect(state.revisionScope).toBe('subject');
      expect(state.subject).toEqual(f.subject);
      expect(state.role.title).toBe('On demand fixture');
      expect(
        state.assignments.filter((a: any) => a.permissionSet === f.key),
      ).toHaveLength(2);
      expect(state.sets.some((s: any) => s.unrestricted)).toBe(false);
      expect(list).not.toHaveBeenCalled();
    } finally {
      list.mockRestore();
    }
  });
  it('allows unrelated role changes while preserving scoped revisions after save', async () => {
    const f = await fixture();
    const state = await f.read();
    await app.authz.permissionSets.create({
      key: 'unrelated-on-demand',
      grants: [],
    });
    const response = await f.save(state);
    expect(response.status).toBe(200);
    const saved = (await response.json()).data;
    expect(saved.revisionScope).toBe('subject');
    expect(saved.subject).toEqual(f.subject);
    expect(saved.sets.some((s: any) => s.key === 'unrelated-on-demand')).toBe(
      false,
    );
    expect(saved.rules).toBeDefined();
  });
  it('rejects changes to shared audiences after a detail read', async () => {
    const f = await fixture();
    const state = await f.read();
    await app.authz.permissionSets.assign({
      permissionSet: f.key,
      subject: { type: 'org.dutyRole', id: 'hr' },
    });
    expect((await f.save(state, 'all')).status).toBe(409);
    expect(
      (await app.authz.permissionSets.get(f.key))?.grants[0].actions,
    ).toEqual([{ action: 'read' }]);
  });
  it('rejects baseline changes after a detail read', async () => {
    const f = await fixture();
    const state = await f.read();
    await app.authz.permissionSets.create({
      key: 'on-demand-new-baseline',
      grants: [],
    });
    await app.authz.permissionSets.assign({
      permissionSet: 'on-demand-new-baseline',
      subject: { type: 'authenticated', id: '*' },
    });
    expect((await f.save(state)).status).toBe(409);
  });
  it('returns not found for unknown and invalid role identities', async () => {
    const admin = await app.admin();
    for (const path of [
      '/access/subjects/org.position/missing',
      '/access/subjects/system/missing',
      '/access/subjects/authenticated/missing',
      '/access/subjects/user/missing',
    ])
      expect((await admin.fetch(path)).status).toBe(404);
  });
});
