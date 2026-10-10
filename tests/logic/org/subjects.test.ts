// @vitest-environment node
import { definePermissionSet } from '@nocobase/authorization/permission-sets';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  DEPARTMENT_HEAD_SUBJECT,
  DEPARTMENT_SUBJECT,
  DUTY_ROLE_SUBJECT,
  ORG_SETTINGS,
  registerDepartmentScopes,
} from '../../../server/providers/org/index.ts';
import { startOrgTestApp, type OrgTestApp } from './helpers.ts';

const ctx = { actorId: 'tester' };

/** The values a scope's equality conditions name, read from its serialized form. */
function scopeValues(scope: unknown): string[] {
  if (scope === false) return [];
  const values = new Set<string>();
  JSON.stringify(scope, (key, value: unknown) => {
    if (key === 'value' && typeof value === 'string') values.add(value);
    return value;
  });
  return [...values].sort();
}

describe('organisation subjects and scopes', () => {
  /** The ids of one subject type the authorization resolves for a user, sorted. */
  async function ids(
    type: string,
    principal: { type: 'user'; id: string },
  ): Promise<string[]> {
    const subjects = await test.authz.subjects.resolveFor(principal);
    return subjects
      .filter((subject) => subject.type === type)
      .map((subject) => subject.id)
      .sort();
  }

  let test: OrgTestApp;
  let root: string;
  let child: string;
  let other: string;
  let member: string;
  let head: string;
  let outsider: string;

  beforeAll(async () => {
    test = await startOrgTestApp();
    const org = test.organization;
    member = (await test.createUser('SubjectMember')).user.id;
    head = (await test.createUser('SubjectHead')).user.id;
    outsider = (await test.createUser('SubjectOutsider')).user.id;
    root = (await org.createDepartment({ title: 'Subject root' }, ctx)).id;
    child = (
      await org.createDepartment(
        { title: 'Subject child', parentId: root, managerId: head },
        ctx,
      )
    ).id;
    other = (await org.createDepartment({ title: 'Subject other' }, ctx)).id;
    await org.addMember({ departmentId: child, userId: member }, ctx);
    await org.addMember({ departmentId: other, userId: outsider }, ctx);
  }, 120_000);

  afterAll(async () => {
    await test?.close();
  });

  it('registers the subject types, the settings items and their placement', () => {
    const types = test.authz.subjects.list();
    expect(types).toEqual(
      expect.arrayContaining([
        DEPARTMENT_SUBJECT,
        DEPARTMENT_HEAD_SUBJECT,
        DUTY_ROLE_SUBJECT,
      ]),
    );
    for (const item of Object.values(ORG_SETTINGS))
      expect(test.authz.ui.placementOf({ type: 'settings', id: item })).toEqual(
        {
          section: 'oa.org',
        },
      );
  });

  it('resolves departments with their ancestors, and drops disabled ones', async () => {
    const principal = { type: 'user' as const, id: member };
    expect(await ids(DEPARTMENT_SUBJECT, principal)).toEqual(
      [child, root].sort(),
    );
    await test.organization.setDepartmentActive(root, false, ctx);
    expect(await ids(DEPARTMENT_SUBJECT, principal)).toEqual([]);
    await test.organization.setDepartmentActive(root, true, ctx);
  });

  it('resolves heads as a fixed subject that follows appointments', async () => {
    expect(
      await ids(DEPARTMENT_HEAD_SUBJECT, {
        type: 'user',
        id: head,
      }),
    ).toEqual(['*']);
    expect(
      await ids(DEPARTMENT_HEAD_SUBJECT, {
        type: 'user',
        id: member,
      }),
    ).toEqual([]);
    await test.organization.updateDepartment(child, { managerId: member }, ctx);
    expect(
      await ids(DEPARTMENT_HEAD_SUBJECT, {
        type: 'user',
        id: head,
      }),
    ).toEqual([]);
    await test.organization.updateDepartment(child, { managerId: head }, ctx);
  });

  it('lets a set assigned to a parent department reach a member of a child, until membership ends', async () => {
    const authz = test.authz;
    const set = definePermissionSet('org-subject-inherit')
      .grant(authz.settings.grant(ORG_SETTINGS.grades, ['read']))
      .build();
    await authz.permissionSets.create(set);
    await authz.permissionSets.assign({
      permissionSet: set.key,
      subject: { type: DEPARTMENT_SUBJECT, id: root },
    });
    const session = await test.createUser('Inherit');
    await test.organization.addMember(
      { departmentId: child, userId: session.user.id },
      ctx,
    );
    expect((await session.fetch('/grades')).status).toBe(200);
    await test.organization.removeMember(child, session.user.id, ctx);
    expect((await session.fetch('/grades')).status).toBe(403);
  });

  it('resolves duty roles flat, only while the role is active', async () => {
    await test.organization.addDutyRoleMember('legal', member, ctx);
    const principal = { type: 'user' as const, id: member };
    expect(await ids(DUTY_ROLE_SUBJECT, principal)).toEqual(['legal']);
    await test.organization.setDutyRoleActive('legal', false, ctx);
    expect(await ids(DUTY_ROLE_SUBJECT, principal)).toEqual([]);
    await test.organization.setDutyRoleActive('legal', true, ctx);
  });

  it('computes the three viewer-relative department scopes', async () => {
    const refs = registerDepartmentScopes(test.authz, test.organization, {
      prefix: 'orgTest',
      targets: [
        { collection: 'orgTestOwned', ownerField: 'ownerId' },
        { collection: 'orgTestCarried', departmentField: 'departmentId' },
      ],
    });
    const resolve = (key: string, viewer: string, collection: string) =>
      test.authz.recordAccess.resolve(key, {
        principal: { type: 'user', id: viewer },
        collection,
        action: 'view',
        params: undefined,
      });

    // A member sees their own department's owners, not the parent's.
    expect(
      scopeValues(
        await resolve(refs.myDepartments.key, member, 'orgTestOwned'),
      ),
    ).toEqual([member]);
    // The head, who is no member, sees the department they head and below.
    expect(
      scopeValues(
        await resolve(refs.headedDepartments.key, head, 'orgTestCarried'),
      ),
    ).toEqual([child]);
    expect(
      scopeValues(
        await resolve(refs.myDepartmentsAndBelow.key, head, 'orgTestOwned'),
      ),
    ).toEqual([member]);
    // A member of the root sees everything below it, and never another tree.
    const rootMember = (await test.createUser('RootMember')).user.id;
    await test.organization.addMember(
      { departmentId: root, userId: rootMember },
      ctx,
    );
    expect(
      scopeValues(
        await resolve(
          refs.myDepartmentsAndBelow.key,
          rootMember,
          'orgTestCarried',
        ),
      ),
    ).toEqual([child, root].sort());
    expect(
      scopeValues(
        await resolve(
          refs.myDepartmentsAndBelow.key,
          rootMember,
          'orgTestOwned',
        ),
      ),
    ).not.toContain(outsider);
    // A disabled child drops out of the subtree; nobody in no department selects nothing.
    await test.organization.setDepartmentActive(child, false, ctx);
    expect(
      scopeValues(
        await resolve(
          refs.myDepartmentsAndBelow.key,
          rootMember,
          'orgTestCarried',
        ),
      ),
    ).toEqual([root]);
    await test.organization.setDepartmentActive(child, true, ctx);
    const loner = (await test.createUser('Loner')).user.id;
    expect(await resolve(refs.myDepartments.key, loner, 'orgTestOwned')).toBe(
      false,
    );
  });

  it('lists and resolves picker options with descriptor titles unchanged', async () => {
    const roles = await test.organization.resolveDutyRoles(['gm']);
    expect(roles[0]?.title).toEqual({
      key: 'org.dutyRoleTitles.gm',
      ns: 'nb3-oa',
    });
    const departments = await test.organization.listDepartmentOptions({
      search: 'subject ch',
      page: 1,
      pageSize: 20,
    });
    expect(departments.items).toEqual([
      { id: child, title: 'Subject child', description: 'Subject root' },
    ]);
  });
});
