// @vitest-environment node
import type { TestSession } from '@nocobase/app-plugin-authentication/testing';
import {
  apiDocsToken,
  findApiDocumentSchemaProblems,
  findUndeclaredApiRoutes,
  inspectApiRoutes,
} from '@nocobase/app-server/router';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ORG_SETTINGS } from '../../../server/providers/org/index.ts';
import { json, send, startOrgTestApp, type OrgTestApp } from './helpers.ts';

const ctx = { actorId: 'tester' };

interface Probe {
  readonly name: string;
  readonly path: string;
  readonly init?: RequestInit;
  readonly item: string;
  readonly action: 'read' | 'update';
}

describe('organisation routes', () => {
  let test: OrgTestApp;
  let nobody: TestSession;
  let readers: Record<string, TestSession>;
  let editors: Record<string, TestSession>;
  let departmentId: string;
  let positionId: string;
  let gradeId: string;
  let memberId: string;

  beforeAll(async () => {
    test = await startOrgTestApp();
    nobody = await test.createUser('Nobody');
    readers = {};
    editors = {};
    for (const [key, item] of Object.entries(ORG_SETTINGS)) {
      readers[item] = await test.createUser(`Reader-${key}`);
      await test.grantSettings(readers[item].user.id, item, ['read']);
      editors[item] = await test.createUser(`Editor-${key}`);
      await test.grantSettings(editors[item].user.id, item, ['read', 'update']);
    }
    memberId = (await test.createUser('Member')).user.id;
    const department = await test.organization.createDepartment(
      { title: 'Routes HQ' },
      ctx,
    );
    departmentId = department.id;
    await test.organization.addMember({ departmentId, userId: memberId }, ctx);
    positionId = (
      await test.organization.createPosition(
        { code: 'RT-POS', title: 'Route position' },
        ctx,
      )
    ).id;
    gradeId = (
      await test.organization.createGrade(
        { code: 'RT-G', title: 'Route grade', rank: 10 },
        ctx,
      )
    ).id;
  }, 120_000);

  afterAll(async () => {
    await test?.close();
  });

  function probes(): Probe[] {
    const d = ORG_SETTINGS.departments;
    const p = ORG_SETTINGS.positions;
    const g = ORG_SETTINGS.grades;
    const r = ORG_SETTINGS.dutyRoles;
    return [
      {
        name: 'list departments',
        path: '/departments',
        item: d,
        action: 'read',
      },
      {
        name: 'get department',
        path: `/departments/${departmentId}`,
        item: d,
        action: 'read',
      },
      {
        name: 'list members',
        path: `/departments/${departmentId}/members`,
        item: d,
        action: 'read',
      },
      {
        name: 'create department',
        path: '/departments',
        init: json({ title: 'New' }),
        item: d,
        action: 'update',
      },
      {
        name: 'update department',
        path: `/departments/${departmentId}`,
        init: json({ sortOrder: 1 }, 'PATCH'),
        item: d,
        action: 'update',
      },
      {
        name: 'disable department',
        path: `/departments/${departmentId}/disable`,
        init: send('POST'),
        item: d,
        action: 'update',
      },
      {
        name: 'add member',
        path: `/departments/${departmentId}/members`,
        init: json({ userId: memberId }),
        item: d,
        action: 'update',
      },
      { name: 'list positions', path: '/positions', item: p, action: 'read' },
      {
        name: 'create position',
        path: '/positions',
        init: json({ code: 'X', title: 'X' }),
        item: p,
        action: 'update',
      },
      {
        name: 'update position',
        path: `/positions/${positionId}`,
        init: json({ title: 'Y' }, 'PATCH'),
        item: p,
        action: 'update',
      },
      { name: 'list grades', path: '/grades', item: g, action: 'read' },
      {
        name: 'update grade',
        path: `/grades/${gradeId}`,
        init: json({ rank: 11 }, 'PATCH'),
        item: g,
        action: 'update',
      },
      { name: 'list duty roles', path: '/dutyRoles', item: r, action: 'read' },
      {
        name: 'list duty role members',
        path: '/dutyRoles/gm/members',
        item: r,
        action: 'read',
      },
      {
        name: 'add duty role member',
        path: '/dutyRoles/gm/members',
        init: json({ userId: memberId }),
        item: r,
        action: 'update',
      },
      {
        name: 'disable duty role',
        path: '/dutyRoles/gm/disable',
        init: send('POST'),
        item: r,
        action: 'update',
      },
    ];
  }

  it('answers 401 without a session', async () => {
    for (const probe of probes()) {
      const response = await test.testApp.request(probe.path, probe.init);
      expect({ probe: probe.name, status: response.status }).toEqual({
        probe: probe.name,
        status: 401,
      });
    }
    for (const path of [
      '/departments/options',
      '/positions/options',
      '/grades/options',
    ])
      expect({
        path,
        status: (await test.testApp.request(path)).status,
      }).toEqual({ path, status: 401 });
  });

  it('answers 403 without the settings item, and to a reader on writes, before validating input', async () => {
    for (const probe of probes()) {
      const denied = await nobody.fetch(probe.path, probe.init);
      expect({ probe: probe.name, status: denied.status }).toEqual({
        probe: probe.name,
        status: 403,
      });
      if (probe.action === 'update') {
        const reader = await readers[probe.item]!.fetch(probe.path, probe.init);
        expect({ probe: probe.name, reader: reader.status }).toEqual({
          probe: probe.name,
          reader: 403,
        });
      }
      // Another item's editor gets nothing here either.
      const other = Object.values(ORG_SETTINGS).find(
        (item) => item !== probe.item,
      )!;
      const foreign = await editors[other]!.fetch(probe.path, probe.init);
      expect({ probe: probe.name, other, status: foreign.status }).toEqual({
        probe: probe.name,
        other,
        status: 403,
      });
    }
    // Invalid input is still 403 for an unpermitted caller.
    expect(
      (await nobody.fetch('/departments', json({ bogus: true }))).status,
    ).toBe(403);
  });

  it('serves readers and editors', async () => {
    for (const probe of probes()) {
      const session =
        probe.action === 'read' ? readers[probe.item]! : editors[probe.item]!;
      const response = await session.fetch(probe.path, probe.init);
      expect({ probe: probe.name, ok: response.ok }).toEqual({
        probe: probe.name,
        ok: true,
      });
    }
    // Restore what the probes disabled.
    const d = editors[ORG_SETTINGS.departments]!;
    expect(
      (await d.fetch(`/departments/${departmentId}/enable`, send('POST')))
        .status,
    ).toBe(200);
    await editors[ORG_SETTINGS.dutyRoles]!.fetch('/dutyRoles/gm/enable', {
      method: 'POST',
    });
  });

  it('returns resolved users beside every user id', async () => {
    const d = editors[ORG_SETTINGS.departments]!;
    const head = await test.createUser('Head');
    const updated = await d.fetch(
      `/departments/${departmentId}`,
      json({ managerId: head.user.id }, 'PATCH'),
    );
    const body = (await updated.json()) as {
      data: { manager: { id: string; name: string }; memberCount: number };
    };
    expect(body.data.manager).toMatchObject({ id: head.user.id, name: 'Head' });
    expect(body.data.memberCount).toBe(1);

    const members = (await (
      await d.fetch(`/departments/${departmentId}/members`)
    ).json()) as { data: { userId: string; user: { name: string } }[] };
    expect(members.data).toEqual([
      expect.objectContaining({
        userId: memberId,
        primary: true,
        user: expect.objectContaining({ name: 'Member' }),
      }),
    ]);

    const roles = (await (
      await editors[ORG_SETTINGS.dutyRoles]!.fetch('/dutyRoles/gm/members')
    ).json()) as { data: { userId: string; user: { name: string } }[] };
    expect(roles.data[0]?.user.name).toBe('Member');
  });

  it('answers validation, conflicts and missing records in the standard body', async () => {
    const d = editors[ORG_SETTINGS.departments]!;
    const invalid = await d.fetch('/departments', json({ title: '' }));
    expect(invalid.status).toBe(400);
    const unknown = await d.fetch('/departments', json({ title: 'A', x: 1 }));
    expect(unknown.status).toBe(400);

    const cycle = await d.fetch(
      `/departments/${departmentId}`,
      json({ parentId: departmentId }, 'PATCH'),
    );
    expect(cycle.status).toBe(400);
    expect(
      ((await cycle.json()) as { error: { reason: string } }).error.reason,
    ).toBe('PARENT_CYCLE');

    const missing = await d.fetch('/departments/missing');
    expect(missing.status).toBe(404);
    expect(
      ((await missing.json()) as { error: { reason: string; domain: string } })
        .error,
    ).toMatchObject({ reason: 'DEPARTMENT_NOT_FOUND', domain: 'org' });

    const badUser = await d.fetch(
      `/departments/${departmentId}/members`,
      json({ userId: 'nobody' }),
    );
    expect(badUser.status).toBe(400);
    expect(
      (
        (await badUser.json()) as {
          error: { fieldViolations: { field: string }[] };
        }
      ).error.fieldViolations[0]?.field,
    ).toBe('userId');

    const p = editors[ORG_SETTINGS.positions]!;
    const conflict = await p.fetch(
      '/positions',
      json({ code: 'RT-POS', title: 'Dup' }),
    );
    expect(conflict.status).toBe(409);
  });

  it('opens the pickers to every signed-in user', async () => {
    const departments = await nobody.fetch('/departments/options');
    expect(departments.status).toBe(200);
    const body = (await departments.json()) as {
      data: { id: string; title: string }[];
      meta: { total: number };
    };
    expect(body.data.map((row) => row.id)).toContain(departmentId);
    expect(body.data[0]).not.toHaveProperty('managerId');
    expect((await nobody.fetch('/positions/options')).status).toBe(200);
    expect((await nobody.fetch('/grades/options')).status).toBe(200);
  });

  it('declares every route for the API document', async () => {
    const application = test.testApp.application;
    expect(findUndeclaredApiRoutes(application)).toEqual([]);
    const document = await application.container
      .resolve(apiDocsToken)
      .getDocument();
    expect(findApiDocumentSchemaProblems(document)).toEqual([]);
    const ids = inspectApiRoutes(application)
      .filter(({ path }) =>
        /^\/api\/(departments|positions|grades|dutyRoles)(\/|$)/u.test(path),
      )
      .map(({ operationId }) => operationId)
      .sort();
    expect(ids).toEqual(
      [
        'addDepartmentMember',
        'addDutyRoleMember',
        'createDepartment',
        'createGrade',
        'createPosition',
        'disableDepartment',
        'disableDutyRole',
        'disableGrade',
        'disablePosition',
        'enableDepartment',
        'enableDutyRole',
        'enableGrade',
        'enablePosition',
        'getDepartment',
        'getDutyRole',
        'getGrade',
        'getPosition',
        'listDepartmentMembers',
        'listDepartmentOptions',
        'listDepartments',
        'listDutyRoleMembers',
        'listDutyRoles',
        'listGradeOptions',
        'listGrades',
        'listPositionOptions',
        'listPositions',
        'makeDepartmentMemberPrimary',
        'removeDepartmentMember',
        'removeDutyRoleMember',
        'updateDepartment',
        'updateGrade',
        'updatePosition',
      ].sort(),
    );
    const update = document.paths?.['/api/departments/{departmentId}']?.patch;
    expect(Object.keys(update?.responses ?? {}).sort()).toEqual([
      '200',
      '400',
      '401',
      '403',
      '404',
      '409',
      '500',
    ]);
    const options = document.paths?.['/api/departments/options']?.get;
    expect(Object.keys(options?.responses ?? {}).sort()).toEqual([
      '200',
      '400',
      '401',
      '500',
    ]);
  });
});
