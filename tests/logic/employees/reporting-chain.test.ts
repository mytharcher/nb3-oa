// @vitest-environment node
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { describe, expect } from 'vitest';

import { reportingScopesToken } from '../../../server/providers/employees/index.ts';
import {
  ALL,
  archivePage,
  composite,
  createEmployee,
  employees,
  grantToUser,
} from './helpers.ts';
import { createEmployeesAppTest } from './helpers.ts';

const test = createEmployeesAppTest();

type Org = Awaited<ReturnType<typeof buildOrg>>;

/**
 *   A ── B ── C ── D
 *   └── X (inactive) ── Y
 *   Z (no manager, no reports)
 */
async function buildOrg(testApp: Parameters<typeof createEmployee>[0]) {
  const a = await createEmployee(testApp, 'Alice');
  const b = await createEmployee(testApp, 'Bob', { managerId: a.employeeId });
  const c = await createEmployee(testApp, 'Carol', { managerId: b.employeeId });
  const d = await createEmployee(testApp, 'Dave', { managerId: c.employeeId });
  const x = await createEmployee(testApp, 'Xavier', {
    managerId: a.employeeId,
  });
  const y = await createEmployee(testApp, 'Yvonne', {
    managerId: x.employeeId,
  });
  const z = await createEmployee(testApp, 'Zed');
  // X leaves: a correction, so the line keeps pointing at them.
  await employees(testApp).correctStatus(
    x.employeeId,
    { status: 'left', active: false, reason: 'left the company' },
    ALL,
    a.userId,
  );
  return { a, b, c, d, x, y, z };
}

let org: Org | undefined;
async function orgOf(
  testApp: Parameters<typeof createEmployee>[0],
): Promise<Org> {
  org ??= await buildOrg(testApp);
  return org;
}

const names = (list: readonly { name: string }[]): string[] =>
  list.map((e) => e.name).sort();

describe('reporting line', () => {
  test('walks the manager chain nearest first, skipping inactive managers', async ({
    testApp,
  }) => {
    const { a, b, c, d, y, z } = await orgOf(testApp);
    const service = employees(testApp);
    expect((await service.managerChainOf(d.userId)).map((e) => e.name)).toEqual(
      ['Carol', 'Bob', 'Alice'],
    );
    expect((await service.managerOf(y.userId))?.id).toBe(a.employeeId);
    expect(await service.managerChainOf(z.userId)).toEqual([]);
    expect(await service.managerOf(a.userId)).toBeUndefined();
    expect(await service.isAboveInReportingLine(a.userId, d.userId)).toBe(true);
    expect(await service.isAboveInReportingLine(b.userId, d.userId)).toBe(true);
    expect(await service.isAboveInReportingLine(d.userId, b.userId)).toBe(
      false,
    );
    expect(await service.isAboveInReportingLine(z.userId, d.userId)).toBe(
      false,
    );
    expect(await service.isAboveInReportingLine(c.userId, c.userId)).toBe(
      false,
    );
  });

  test('lists direct and all reports; an inactive intermediate passes their reports up', async ({
    testApp,
  }) => {
    const { a, b, x } = await orgOf(testApp);
    const service = employees(testApp);
    expect(names(await service.directReportsOf(a.userId))).toEqual([
      'Bob',
      'Yvonne',
    ]);
    expect(names(await service.reportsOf(b.userId))).toEqual(['Carol', 'Dave']);
    expect(names(await service.reportsOf(a.userId))).toEqual([
      'Bob',
      'Carol',
      'Dave',
      'Xavier',
      'Yvonne',
    ]);
    // An inactive employee manages nobody.
    expect(await service.reportsOf(x.userId)).toEqual([]);
    expect(await service.directReportsOf(x.userId)).toEqual([]);
  });

  test('refuses a manager that would close a loop, and survives one written behind its back', async ({
    testApp,
    connection,
  }) => {
    const service = employees(testApp);
    const p = await createEmployee(testApp, 'Pat');
    const q = await createEmployee(testApp, 'Quinn', {
      managerId: p.employeeId,
    });
    await expect(
      service.updateEmployee(
        p.employeeId,
        { managerId: q.employeeId },
        ALL,
        p.userId,
      ),
    ).rejects.toMatchObject({ code: 'EMPLOYEE_MANAGER_CYCLE' });
    await expect(
      service.updateEmployee(
        p.employeeId,
        { managerId: p.employeeId },
        ALL,
        p.userId,
      ),
    ).rejects.toMatchObject({ code: 'EMPLOYEE_MANAGER_CYCLE' });

    // A cycle written directly (an import, a concurrent edit) must not hang any walk.
    await connection.query
      .updateTable('employees')
      .set({ managerId: q.employeeId })
      .where('id', '=', p.employeeId)
      .execute();
    expect((await service.managerChainOf(p.userId)).map((e) => e.name)).toEqual(
      ['Quinn'],
    );
    expect(names(await service.reportsOf(p.userId))).toEqual(['Quinn']);
    expect(names(await service.directReportsOf(q.userId))).toEqual(['Pat']);
    expect(await service.isAboveInReportingLine(p.userId, p.userId)).toBe(
      false,
    );
  });

  test('refuses an inactive or unknown manager', async ({ testApp }) => {
    const { x } = await orgOf(testApp);
    const service = employees(testApp);
    const n = await createEmployee(testApp, 'Nora');
    await expect(
      service.updateEmployee(
        n.employeeId,
        { managerId: x.employeeId },
        ALL,
        n.userId,
      ),
    ).rejects.toMatchObject({ code: 'EMPLOYEE_MANAGER_INACTIVE' });
    await expect(
      service.updateEmployee(
        n.employeeId,
        { managerId: 'missing' },
        ALL,
        n.userId,
      ),
    ).rejects.toMatchObject({ code: 'EMPLOYEE_MANAGER_NOT_FOUND' });
  });
});

describe('reporting-line data scope (oa.reports / oa.selfAndReports)', () => {
  const reportsView = [
    archivePage,
    composite('oa.employees.archive', { view: { employees: 'oa.reports' } }),
  ];

  async function listNames(
    session: Awaited<ReturnType<Org['a']['session']>>,
  ): Promise<string[]> {
    const response = await session.fetch('/employees?pageSize=100');
    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: { name: string }[] };
    return names(body.data);
  }

  test('a manager sees every report at any depth, through an inactive intermediate, and nobody else', async ({
    testApp,
  }) => {
    const { a, b, z } = await orgOf(testApp);
    await grantToUser(testApp, 'test-reports-view', reportsView, a.userId);
    await grantToUser(testApp, 'test-reports-view', reportsView, b.userId);
    await grantToUser(testApp, 'test-reports-view', reportsView, z.userId);
    expect(await listNames(await a.session())).toEqual([
      'Bob',
      'Carol',
      'Dave',
      'Xavier',
      'Yvonne',
    ]);
    expect(await listNames(await b.session())).toEqual(['Carol', 'Dave']);
    // No reports: the scope selects nothing rather than everything.
    expect(await listNames(await z.session())).toEqual([]);
  });

  test('a single out-of-scope archive answers 403, an unknown one 404', async ({
    testApp,
  }) => {
    const { b, z } = await orgOf(testApp);
    await grantToUser(testApp, 'test-reports-view', reportsView, b.userId);
    const session = await b.session();
    expect((await session.fetch(`/employees/${z.employeeId}`)).status).toBe(
      403,
    );
    expect((await session.fetch('/employees/does-not-exist')).status).toBe(404);
    expect(
      (await session.fetch(`/employees/${z.employeeId}/history`)).status,
    ).toBe(403);
  });

  test('本人及下属 adds the viewer', async ({ testApp }) => {
    const { c } = await orgOf(testApp);
    await grantToUser(
      testApp,
      'test-self-and-reports',
      [
        archivePage,
        composite('oa.employees.archive', {
          view: { employees: 'oa.selfAndReports' },
        }),
      ],
      c.userId,
    );
    expect(await listNames(await c.session())).toEqual(['Carol', 'Dave']);
  });

  test('a manager change moves access on the next request', async ({
    testApp,
  }) => {
    const service = employees(testApp);
    const m1 = await createEmployee(testApp, 'Mona');
    const m2 = await createEmployee(testApp, 'Milo');
    const r = await createEmployee(testApp, 'Rita', {
      managerId: m1.employeeId,
    });
    await grantToUser(testApp, 'test-reports-view', reportsView, m1.userId);
    await grantToUser(testApp, 'test-reports-view', reportsView, m2.userId);
    const s1 = await m1.session();
    const s2 = await m2.session();
    expect(await listNames(s1)).toEqual(['Rita']);
    expect(await listNames(s2)).toEqual([]);
    await service.updateEmployee(
      r.employeeId,
      { managerId: m2.employeeId },
      ALL,
      m1.userId,
    );
    expect(await listNames(s1)).toEqual([]);
    expect(await listNames(s2)).toEqual(['Rita']);
  });

  test('applies to employee-keyed collections: a manager reads reports’ compensation only', async ({
    testApp,
  }) => {
    const { b, c, z } = await orgOf(testApp);
    const service = employees(testApp);
    await service.appendCompensation(
      {
        employeeId: c.employeeId,
        baseSalary: '15000',
        effectiveFrom: '2026-01-01',
      },
      { actorId: null, sourceApplication: 'REG-202601-0001' },
    );
    await service.appendCompensation(
      {
        employeeId: z.employeeId,
        baseSalary: '9000.5',
        effectiveFrom: '2026-01-01',
      },
      { actorId: null },
    );
    await grantToUser(
      testApp,
      'test-reports-compensation',
      [
        archivePage,
        composite('oa.employees.compensation', {
          view: { employeeCompensation: 'oa.reports' },
        }),
      ],
      b.userId,
    );
    const session = await b.session();
    const own = await session.fetch(`/employees/${c.employeeId}/compensation`);
    expect(own.status).toBe(200);
    const rows = ((await own.json()) as { data: { baseSalary: string }[] })
      .data;
    expect(rows.map((row) => row.baseSalary)).toEqual(['15000.00']);
    const other = await session.fetch(
      `/employees/${z.employeeId}/compensation`,
    );
    expect(((await other.json()) as { data: unknown[] }).data).toEqual([]);
  });

  test('the record access is sealed once defined: use() after boot throws', async ({
    testApp,
  }) => {
    const scopes = testApp.application.container.resolve(reportingScopesToken);
    expect(() =>
      scopes.use('leaveRequests', { field: 'applicantId', identifies: 'user' }),
    ).toThrow(/register\(\)/u);
    expect([...scopes.targets().keys()].sort()).toEqual([
      'employeeCompensation',
      'employeeProfiles',
      'employees',
    ]);
  });
});

describe('subject types', () => {
  test('org.reportingManager (seeded 直属上级 set) resolves for active employees with reports only', async ({
    testApp,
  }) => {
    const { b, d, x } = await orgOf(testApp);
    const authz = testApp.application.container.resolve(authorizationToken);
    const assignments = await authz.permissionSets.listAssignments(
      'oa-employees-manager',
    );
    expect(assignments.map((a) => a.subject)).toEqual([
      { type: 'org.reportingManager', id: '*' },
    ]);
    const response = await (await b.session()).fetch('/employees?pageSize=100');
    expect(response.status).toBe(200);
    expect(
      names(((await response.json()) as { data: { name: string }[] }).data),
    ).toEqual(['Carol', 'Dave']);
    expect((await (await d.session()).fetch('/employees')).status).toBe(403);
    // Inactive: Xavier's account still signs in here, but an inactive archive manages nobody.
    expect((await (await x.session()).fetch('/employees')).status).toBe(403);
  });
});
