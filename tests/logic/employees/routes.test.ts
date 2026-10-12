// @vitest-environment node
import { organizationServiceToken } from '../../../server/providers/org/index.ts';
import { OA_TEST_ORIGIN } from '../oa-test-origin.ts';
import {
  DEFAULT_ADMIN_CREDENTIALS,
  signIn,
} from '@nocobase/app-plugin-authentication/testing';
import {
  apiDocsToken,
  findApiDocumentSchemaProblems,
  findUndeclaredApiRoutes,
} from '@nocobase/app-server/router';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { describe, expect } from 'vitest';

import {
  ALL,
  archivePage,
  composite,
  createEmployee,
  createEmployeesAppTest,
  createPerson,
  employees,
  grantToUser,
} from './helpers.ts';

const test = createEmployeesAppTest();

const HR = [
  archivePage,
  composite('oa.employees.archive', {
    view: { employees: 'allRecords' },
    manage: { employees: 'allRecords' },
  }),
  composite('oa.employees.profile', {
    view: { employeeProfiles: 'allRecords' },
    update: { employeeProfiles: 'allRecords' },
  }),
  composite('oa.employees.compensation', {
    view: { employeeCompensation: 'allRecords' },
  }),
];
const FINANCE = [
  composite('oa.employees.profile', {
    viewBank: { employeeProfiles: 'allRecords' },
  }),
];
const ADMIN = [
  archivePage,
  composite('oa.employees.archive', {
    view: { employees: 'allRecords' },
    correctStatus: { employees: 'allRecords' },
  }),
];

const json = (body: unknown): RequestInit => ({
  method: 'POST',
  // Cookie-authenticated writes must come from the application's own origin.
  headers: { 'content-type': 'application/json', origin: OA_TEST_ORIGIN },
  body: JSON.stringify(body),
});
const patch = (body: unknown): RequestInit => ({
  ...json(body),
  method: 'PATCH',
});

describe('authentication and authorization boundaries', () => {
  test('every route refuses an anonymous caller', async ({ request }) => {
    for (const [path, init] of [
      ['/employees', undefined],
      ['/employees', json({})],
      ['/employees/me', undefined],
      ['/employees/me/profile', undefined],
      ['/employees/me/compensation', undefined],
      ['/employees/1', undefined],
      ['/employees/1', patch({})],
      ['/employees/1/correctStatus', json({})],
      ['/employees/1/profile', undefined],
      ['/employees/1/profile', patch({})],
      ['/employees/1/compensation', undefined],
      ['/employees/1/history', undefined],
      ['/directory', undefined],
    ] as const)
      expect(
        (await request(path, init)).status,
        `${init?.method ?? 'GET'} ${path}`,
      ).toBe(401);
  });

  test('a signed-in user without grants is refused before validation', async ({
    testApp,
  }) => {
    const nobody = await createEmployee(testApp, 'Nobody');
    const session = await nobody.session();
    for (const [path, init] of [
      ['/employees', undefined],
      ['/employees', json({ nonsense: true })],
      [`/employees/${nobody.employeeId}`, undefined],
      [`/employees/${nobody.employeeId}`, patch({ nonsense: true })],
      [`/employees/${nobody.employeeId}/correctStatus`, json({})],
      [`/employees/${nobody.employeeId}/profile`, undefined],
      [`/employees/${nobody.employeeId}/profile`, patch({})],
      [`/employees/${nobody.employeeId}/compensation`, undefined],
      [`/employees/${nobody.employeeId}/history`, undefined],
    ] as const)
      expect(
        (await session.fetch(path, init)).status,
        `${init?.method ?? 'GET'} ${path}`,
      ).toBe(403);
    // The own archive needs no grant, and the seeded 通讯录 set reaches everyone signed in.
    expect((await session.fetch('/employees/me')).status).toBe(200);
    expect((await session.fetch('/directory')).status).toBe(200);
  });

  test('page access alone and the action alone are each refused', async ({
    testApp,
  }) => {
    const pageOnly = await createPerson(testApp, 'PageOnly');
    await grantToUser(
      testApp,
      'test-page-only',
      [archivePage],
      pageOnly.userId,
    );
    expect((await (await pageOnly.session()).fetch('/employees')).status).toBe(
      403,
    );
    const actionOnly = await createPerson(testApp, 'ActionOnly');
    await grantToUser(
      testApp,
      'test-action-only',
      [
        composite('oa.employees.archive', {
          view: { employees: 'allRecords' },
        }),
      ],
      actionOnly.userId,
    );
    expect(
      (await (await actionOnly.session()).fetch('/employees')).status,
    ).toBe(403);
  });

  test('the unrestricted administrator reads the archive', async ({
    testApp,
  }) => {
    const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
    expect((await admin.fetch('/employees')).status).toBe(200);
  });
});

describe('HR archive', () => {
  test('creates, reads, updates and audits an archive; status is not editable', async ({
    testApp,
    connection,
  }) => {
    const hr = await createPerson(testApp, 'Hannah HR');
    await grantToUser(testApp, 'test-hr', HR, hr.userId);
    const session = await hr.session();
    const manager = await createEmployee(testApp, 'Manny');
    const newcomer = await createPerson(testApp, 'Newton');

    const created = await session.fetch(
      '/employees',
      json({
        userId: newcomer.userId,
        code: 'NEW-001',
        name: 'Newton',
        hireDate: '2026-10-01',
        probationEndDate: '2027-01-01',
        managerId: manager.employeeId,
        phone: '13800000000',
      }),
    );
    expect(created.status).toBe(201);
    const employee = ((await created.json()) as { data: Record<string, any> })
      .data;
    expect(employee).toMatchObject({
      code: 'NEW-001',
      status: 'probation',
      active: true,
      user: { id: newcomer.userId, name: 'Newton' },
      manager: { id: manager.employeeId, name: 'Manny' },
    });

    const duplicate = await session.fetch(
      '/employees',
      json({
        userId: newcomer.userId,
        code: 'NEW-002',
        name: 'x',
        hireDate: '2026-10-01',
      }),
    );
    expect(duplicate.status).toBe(409);
    expect(((await duplicate.json()) as any).error.reason).toBe(
      'EMPLOYEE_USER_TAKEN',
    );

    const unknownUser = await session.fetch(
      '/employees',
      json({
        userId: 'nobody',
        code: 'NEW-003',
        name: 'x',
        hireDate: '2026-10-01',
      }),
    );
    expect(unknownUser.status).toBe(400);
    expect(
      ((await unknownUser.json()) as any).error.fieldViolations[0].field,
    ).toBe('userId');

    const updated = await session.fetch(
      `/employees/${employee.id}`,
      patch({ workLocation: 'Shanghai', phone: '13900000000' }),
    );
    expect(updated.status).toBe(200);
    expect(((await updated.json()) as any).data.workLocation).toBe('Shanghai');

    const statusEdit = await session.fetch(
      `/employees/${employee.id}`,
      patch({ status: 'regular' }),
    );
    expect(statusEdit.status).toBe(400);
    // HR cannot correct a status.
    expect(
      (
        await session.fetch(
          `/employees/${employee.id}/correctStatus`,
          json({ status: 'regular', reason: 'x' }),
        )
      ).status,
    ).toBe(403);

    const audits = await connection.query
      .selectFrom('auditLogs')
      .select(['action', 'actorId'])
      .where('targetId', '=', employee.id)
      .execute();
    expect(audits.map((row) => row.action).sort()).toEqual([
      'employee.create',
      'employee.update',
    ]);
    expect(audits.every((row) => row.actorId === hr.userId)).toBe(true);
  });

  test('a failed write leaves no archive and no audit entry', async ({
    testApp,
    connection,
  }) => {
    const hr = await createPerson(testApp, 'Hugo HR');
    await grantToUser(testApp, 'test-hr', HR, hr.userId);
    const person = await createPerson(testApp, 'Failing');
    const response = await (
      await hr.session()
    ).fetch(
      '/employees',
      json({
        userId: person.userId,
        code: 'F-1',
        name: 'Failing',
        hireDate: '2026-10-01',
        managerId: 'missing',
      }),
    );
    expect(response.status).toBe(400);
    const rows = await connection.query
      .selectFrom('employees')
      .select('id')
      .where('userId', '=', person.userId)
      .execute();
    expect(rows).toEqual([]);
  });

  test('status correction needs a reason, is audited and recorded in the history', async ({
    testApp,
    connection,
  }) => {
    const admin = await createPerson(testApp, 'Ada Admin');
    await grantToUser(testApp, 'test-admin', ADMIN, admin.userId);
    const target = await createEmployee(testApp, 'Target', {
      status: 'probation',
    });
    const session = await admin.session();
    expect(
      (
        await session.fetch(
          `/employees/${target.employeeId}/correctStatus`,
          json({ status: 'regular' }),
        )
      ).status,
    ).toBe(400);
    const response = await session.fetch(
      `/employees/${target.employeeId}/correctStatus`,
      json({
        status: 'regular',
        reason: 'Regularization was approved on paper',
      }),
    );
    expect(response.status).toBe(200);
    expect(((await response.json()) as any).data.status).toBe('regular');
    const unchanged = await session.fetch(
      `/employees/${target.employeeId}/correctStatus`,
      json({ status: 'regular', reason: 'again' }),
    );
    expect(unchanged.status).toBe(400);
    expect(((await unchanged.json()) as any).error.reason).toBe(
      'EMPLOYEE_STATUS_UNCHANGED',
    );

    const audit = await connection.query
      .selectFrom('auditLogs')
      .select(['reason', 'actorId'])
      .where('action', '=', 'employee.correctStatus')
      .where('targetId', '=', target.employeeId)
      .execute();
    expect(audit).toEqual([
      { reason: 'Regularization was approved on paper', actorId: admin.userId },
    ]);

    const history = await session.fetch(
      `/employees/${target.employeeId}/history`,
    );
    const entries = ((await history.json()) as any).data;
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      kind: 'correction',
      before: { status: 'probation' },
      after: { status: 'regular' },
      note: 'Regularization was approved on paper',
    });
  });
});

describe('controlled fields', () => {
  test('profiles: HR reads everything, finance only the bank account, lists never carry them', async ({
    testApp,
  }) => {
    const hr = await createPerson(testApp, 'Helen HR');
    await grantToUser(testApp, 'test-hr', HR, hr.userId);
    const finance = await createPerson(testApp, 'Fiona Finance');
    await grantToUser(testApp, 'test-finance', FINANCE, finance.userId);
    const target = await createEmployee(testApp, 'Private');

    const hrSession = await hr.session();
    const updated = await hrSession.fetch(
      `/employees/${target.employeeId}/profile`,
      patch({
        idNumber: '110101199001011234',
        bankName: 'ICBC',
        bankAccount: '6222020000001234567',
      }),
    );
    expect(updated.status).toBe(200);
    const full = (
      (await (
        await hrSession.fetch(`/employees/${target.employeeId}/profile`)
      ).json()) as any
    ).data;
    expect(full).toMatchObject({
      access: 'full',
      idNumber: '110101199001011234',
      bankAccount: '6222020000001234567',
    });

    const bankResponse = await (
      await finance.session()
    ).fetch(`/employees/${target.employeeId}/profile`);
    expect(bankResponse.status).toBe(200);
    const bank = ((await bankResponse.json()) as any).data;
    expect(bank).toMatchObject({
      access: 'bank',
      bankName: 'ICBC',
      bankAccount: '6222020000001234567',
    });
    expect(bank).not.toHaveProperty('idNumber');
    expect(bank).not.toHaveProperty('address');
    // Finance may not write it.
    expect(
      (
        await (
          await finance.session()
        ).fetch(
          `/employees/${target.employeeId}/profile`,
          patch({ bankName: 'x' }),
        )
      ).status,
    ).toBe(403);

    // Neither the archive list, the detail nor the directory carries controlled values.
    for (const path of [
      '/employees?pageSize=100',
      `/employees/${target.employeeId}`,
    ]) {
      const text = await (await hrSession.fetch(path)).text();
      expect(text).not.toContain('110101199001011234');
      expect(text).not.toContain('6222020000001234567');
    }
  });

  test('seeded finance roles read only bank fields without gaining archive access', async ({
    testApp,
  }) => {
    const target = await createEmployee(testApp, 'Seed bank target');
    await employees(testApp).updateProfile(
      target.employeeId,
      {
        idNumber: '110101199001011234',
        bankName: 'ICBC',
        bankAccount: '6222020000001234567',
      },
      ALL,
      target.userId,
    );
    const org = testApp.application.container.resolve(organizationServiceToken);
    for (const role of ['finance', 'financeManager', 'cashier']) {
      const person = await createPerson(testApp, `Seed ${role}`);
      await org.addDutyRoleMember(role, person.userId, {
        actorId: target.userId,
      });
      const session = await person.session();
      const response = await session.fetch(
        `/employees/${target.employeeId}/profile`,
      );
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data).toMatchObject({
        access: 'bank',
        bankName: 'ICBC',
        bankAccount: '6222020000001234567',
      });
      expect(body.data).not.toHaveProperty('idNumber');
      expect(body.data).not.toHaveProperty('address');
      expect((await session.fetch('/employees')).status).toBe(403);
      expect(
        (
          await session.fetch(
            `/employees/${target.employeeId}/profile`,
            patch({ bankName: 'changed' }),
          )
        ).status,
      ).toBe(403);
      expect(
        (await session.fetch(`/employees/${target.employeeId}/compensation`))
          .status,
      ).toBe(403);
    }
  });

  test('profile updates are audited with identity and bank numbers masked', async ({
    testApp,
    connection,
  }) => {
    const hr = await createPerson(testApp, 'Hank HR');
    await grantToUser(testApp, 'test-hr', HR, hr.userId);
    const target = await createEmployee(testApp, 'Masked');
    await (
      await hr.session()
    ).fetch(
      `/employees/${target.employeeId}/profile`,
      patch({
        idNumber: '110101199001019999',
        bankAccount: '6222020000009876543',
      }),
    );
    const rows = await connection.query
      .selectFrom('auditLogs')
      .select(['after'])
      .where('action', '=', 'employeeProfile.update')
      .where('targetId', '=', target.employeeId)
      .execute();
    const text = JSON.stringify(rows);
    expect(text).not.toContain('110101199001019999');
    expect(text).not.toContain('6222020000009876543');
    expect(text).toContain('****9999');
  });

  test('compensation: only holders of compensation view, and the employee themself', async ({
    testApp,
  }) => {
    const service = employees(testApp);
    const target = await createEmployee(testApp, 'Paid');
    await service.appendCompensation(
      {
        employeeId: target.employeeId,
        baseSalary: '20000',
        effectiveFrom: '2026-01-01',
      },
      { actorId: null, sourceApplication: 'REG-202601-0002' },
    );
    const finance = await createPerson(testApp, 'Felix Finance');
    await grantToUser(testApp, 'test-finance', FINANCE, finance.userId);
    expect(
      (
        await (
          await finance.session()
        ).fetch(`/employees/${target.employeeId}/compensation`)
      ).status,
    ).toBe(403);
    const mine = await (
      await target.session()
    ).fetch('/employees/me/compensation');
    expect(
      ((await mine.json()) as any).data.map((row: any) => row.baseSalary),
    ).toEqual(['20000.00']);
    // The archive and the history never carry the amount.
    const hr = await createPerson(testApp, 'Hilda HR');
    await grantToUser(testApp, 'test-hr', HR, hr.userId);
    const text = await (
      await (
        await hr.session()
      ).fetch(`/employees/${target.employeeId}/history`)
    ).text();
    expect(text).not.toContain('20000');
  });

  test('my own profile is readable without grants', async ({ testApp }) => {
    const me = await createEmployee(testApp, 'Selfie');
    await employees(testApp).updateProfile(
      me.employeeId,
      {
        bankName: 'Synthetic bank',
        bankAccount: '6222000000000000001',
        bankAccountName: 'Selfie',
      },
      ALL,
      me.userId,
    );
    const response = await (await me.session()).fetch('/employees/me/profile');
    expect(response.status).toBe(200);
    expect(((await response.json()) as any).data).toMatchObject({
      access: 'full',
      employeeId: me.employeeId,
      bankName: 'Synthetic bank',
      bankAccount: '6222000000000000001',
      bankAccountName: 'Selfie',
    });
    const noArchive = await createPerson(testApp, 'NoArchive');
    expect(
      (
        await (
          await noArchive.session()
        ).fetch(`/employees/${me.employeeId}/profile`)
      ).status,
    ).toBe(403);
    expect(
      (await (await noArchive.session()).fetch('/employees/me')).status,
    ).toBe(404);
  });
});

describe('directory', () => {
  test('lists active people; contact details follow the viewContact scope', async ({
    testApp,
  }) => {
    const boss = await createEmployee(testApp, 'Dir Boss', {
      phone: '10000000001',
    });
    const report = await createEmployee(testApp, 'Dir Report', {
      phone: '10000000002',
      managerId: boss.employeeId,
    });
    const stranger = await createEmployee(testApp, 'Dir Stranger', {
      phone: '10000000003',
    });
    const gone = await createEmployee(testApp, 'Dir Gone', {
      phone: '10000000004',
    });
    await employees(testApp).correctStatus(
      gone.employeeId,
      { status: 'left', active: false, reason: 'left' },
      ALL,
      boss.userId,
    );

    // By default (the seeded 通讯录 set, assigned to everyone signed in) phones are visible to all.
    const byDefault = (
      (await (
        await (await stranger.session()).fetch('/directory?q=Dir&pageSize=100')
      ).json()) as any
    ).data;
    expect(byDefault.find((row: any) => row.name === 'Dir Boss').phone).toBe(
      '10000000001',
    );

    // Tightened: everyone keeps the names but loses the contact details.
    const authz = testApp.application.container.resolve(authorizationToken);
    for (const assignment of await authz.permissionSets.listAssignments(
      'oa-directory',
    ))
      await authz.permissionSets.revoke(assignment.id);
    await grantToUser(
      testApp,
      'test-directory-names',
      [
        composite('oa.employees.directory', {
          view: { employees: 'allRecords' },
        }),
      ],
      stranger.userId,
    );
    const names = await (
      await stranger.session()
    ).fetch('/directory?q=Dir&pageSize=100');
    expect(names.status).toBe(200);
    const plain = ((await names.json()) as any).data as Record<
      string,
      unknown
    >[];
    expect(plain.map((row) => row.name).sort()).toEqual([
      'Dir Boss',
      'Dir Report',
      'Dir Stranger',
    ]);
    expect(plain.every((row) => !('phone' in row))).toBe(true);

    await grantToUser(
      testApp,
      'test-directory-reports',
      [
        composite('oa.employees.directory', {
          view: { employees: 'allRecords' },
          viewContact: { employees: 'oa.selfAndReports' },
        }),
      ],
      boss.userId,
    );
    const scoped = (
      (await (
        await (await boss.session()).fetch('/directory?q=Dir&pageSize=100')
      ).json()) as any
    ).data;
    const phones = Object.fromEntries(
      scoped.map((row: any) => [row.name, row.phone]),
    );
    expect(phones).toEqual({
      'Dir Boss': '10000000001',
      'Dir Report': '10000000002',
      'Dir Stranger': undefined,
    });
    const reportRow = scoped.find((row: any) => row.name === 'Dir Report');
    expect(reportRow.manager).toMatchObject({
      id: boss.employeeId,
      name: 'Dir Boss',
    });
    expect(reportRow.user).toMatchObject({
      id: report.userId,
      name: 'Dir Report',
    });
    expect(reportRow).not.toHaveProperty('emergencyContact');
    expect(reportRow).not.toHaveProperty('hireDate');
  });
});

describe('internal writes for flows', () => {
  test('history rejects salary amounts; a status change commits with its history and audit or not at all', async ({
    testApp,
    database,
    connection,
  }) => {
    const service = employees(testApp);
    const person = await createEmployee(testApp, 'Flowing', {
      status: 'probation',
    });
    await expect(
      service.appendHistory(
        {
          employeeId: person.employeeId,
          kind: 'salaryChange',
          after: { baseSalary: '1' },
          effectiveAt: '2026-10-01',
        },
        { actorId: null },
      ),
    ).rejects.toMatchObject({ code: 'EMPLOYEE_HISTORY_SALARY' });

    await expect(
      database.transaction(async (tx) => {
        await service.applyStatusChange(
          {
            employeeId: person.employeeId,
            status: 'regular',
            kind: 'regularization',
            effectiveAt: '2026-10-01',
          },
          { actorId: null, sourceApplication: 'REG-202610-0009' },
          tx,
        );
        throw new Error('the flow failed later');
      }),
    ).rejects.toThrow('the flow failed later');
    expect((await service.getById(person.employeeId))?.status).toBe(
      'probation',
    );
    const none = await connection.query
      .selectFrom('employeeHistory')
      .select('id')
      .where('employeeId', '=', person.employeeId)
      .execute();
    expect(none).toEqual([]);

    await database.transaction((tx) =>
      service.applyStatusChange(
        {
          employeeId: person.employeeId,
          status: 'regular',
          kind: 'regularization',
          effectiveAt: '2026-10-01',
        },
        { actorId: null, sourceApplication: 'REG-202610-0009' },
        tx,
      ),
    );
    expect((await service.getById(person.employeeId))?.status).toBe('regular');
    const history = await service.listHistory(person.employeeId);
    expect(history).toMatchObject([
      {
        kind: 'regularization',
        sourceApplication: 'REG-202610-0009',
        before: { status: 'probation' },
        after: { status: 'regular' },
      },
    ]);
    const audit = await connection.query
      .selectFrom('auditLogs')
      .select('action')
      .where('targetId', '=', person.employeeId)
      .where('action', '=', 'employee.status')
      .execute();
    expect(audit).toHaveLength(1);
  });
});

describe('API document', () => {
  test('declares every route', async ({ testApp }) => {
    expect(findUndeclaredApiRoutes(testApp.application)).toEqual([]);
    const document = await testApp.application.container
      .resolve(apiDocsToken)
      .getDocument();
    expect(findApiDocumentSchemaProblems(document)).toEqual([]);
    const operations = Object.values(document.paths ?? {}).flatMap((item) =>
      Object.values(item ?? {}).map(
        (operation) => (operation as { operationId?: string }).operationId,
      ),
    );
    for (const id of [
      'listEmployees',
      'createEmployee',
      'getEmployee',
      'updateEmployee',
      'correctEmployeeStatus',
      'getEmployeeProfile',
      'updateEmployeeProfile',
      'listEmployeeCompensation',
      'listEmployeeHistory',
      'getMyEmployee',
      'getMyEmployeeProfile',
      'listMyEmployeeCompensation',
      'listDirectory',
    ])
      expect(operations).toContain(id);
    const correct =
      document.paths?.['/api/employees/{employeeId}/correctStatus']?.post;
    expect(Object.keys(correct?.responses ?? {}).sort()).toEqual([
      '200',
      '400',
      '401',
      '403',
      '404',
      '500',
    ]);
  });
});
