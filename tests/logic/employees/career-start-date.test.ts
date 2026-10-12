// @vitest-environment node
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { describeMigration } from '@nocobase/app-testing/server';
import { describe, expect, vi } from 'vitest';
import { calendarServiceToken } from '../../../server/providers/platform/index.ts';
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
import { json } from '../org/helpers.ts';
const test = createEmployeesAppTest();
const patch = (body: unknown) => json(body, 'PATCH');

describeMigration('202610101101_add_employee_career_start_date', {
  sources: [
    {
      packageName: 'career-date-test',
      directory: path.resolve(
        import.meta.dirname,
        '../../../database/main/migrations',
      ),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('employees').toHaveField('careerStartDate', {
      nullable: true,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('employees').not.toHaveField('careerStartDate');
  },
});

describe('first employment date', () => {
  test('keeps unknown service history null and validates merged edits without backfilling hire dates', async ({
    testApp,
  }) => {
    const unknown = await createEmployee(testApp, 'Unknown career');
    const service = employees(testApp);
    expect(
      (await service.getByUserId(unknown.userId))?.careerStartDate,
    ).toBeNull();
    await service.updateEmployee(
      unknown.employeeId,
      { careerStartDate: '2010-07-01' },
      ALL,
      unknown.userId,
    );
    expect((await service.getByUserId(unknown.userId))?.careerStartDate).toBe(
      '2010-07-01',
    );
    await expect(
      service.updateEmployee(
        unknown.employeeId,
        { hireDate: '2009-01-01' },
        ALL,
        unknown.userId,
      ),
    ).rejects.toMatchObject({ code: 'EMPLOYEE_CAREER_START_AFTER_HIRE' });
    await expect(
      service.updateEmployee(
        unknown.employeeId,
        { careerStartDate: '2025-02-01' },
        ALL,
        unknown.userId,
      ),
    ).rejects.toMatchObject({ code: 'EMPLOYEE_CAREER_START_AFTER_HIRE' });
    await expect(
      service.updateEmployee(
        unknown.employeeId,
        { careerStartDate: '2020-02-30' },
        ALL,
        unknown.userId,
      ),
    ).rejects.toMatchObject({ code: 'EMPLOYEE_CAREER_START_INVALID' });
    await service.updateEmployee(
      unknown.employeeId,
      { hireDate: null, careerStartDate: '2012-01-01' },
      ALL,
      unknown.userId,
    );
    await service.updateEmployee(
      unknown.employeeId,
      { careerStartDate: null },
      ALL,
      unknown.userId,
    );
    expect(await service.getByUserId(unknown.userId)).toMatchObject({
      hireDate: null,
      careerStartDate: null,
    });
  });
  test('uses platform local today, including null hire dates and create validation', async ({
    testApp,
  }) => {
    const person = await createPerson(testApp, 'Career calendar');
    const service = employees(testApp);
    const calendar =
      testApp.application.container.resolve(calendarServiceToken);
    const spy = vi.spyOn(calendar, 'localDate').mockReturnValue('2026-01-01');
    try {
      await expect(
        service.createEmployee(
          {
            userId: person.userId,
            code: randomUUID(),
            name: 'Future career',
            status: 'regular',
            careerStartDate: '2026-01-02',
            hireDate: null,
          },
          ALL,
          person.userId,
        ),
      ).rejects.toMatchObject({ code: 'EMPLOYEE_CAREER_START_FUTURE' });
      const created = await service.createEmployee(
        {
          userId: person.userId,
          code: randomUUID(),
          name: 'Local today',
          status: 'regular',
          careerStartDate: '2026-01-01',
          hireDate: null,
        },
        ALL,
        person.userId,
      );
      expect(created.careerStartDate).toBe('2026-01-01');
      expect(spy).toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });
  test('HR can maintain and audit the field; employees cannot edit it or read it through the directory', async ({
    testApp,
    connection,
  }) => {
    const hr = await createPerson(testApp, 'Career HR');
    await grantToUser(
      testApp,
      'career-hr',
      [
        archivePage,
        composite('oa.employees.archive', {
          view: { employees: 'allRecords' },
          manage: { employees: 'allRecords' },
        }),
      ],
      hr.userId,
    );
    const person = await createEmployee(testApp, 'Career subject');
    const session = await hr.session();
    const response = await session.fetch(
      `/employees/${person.employeeId}`,
      patch({ careerStartDate: '2010-01-01' }),
    );
    expect(response.status).toBe(200);
    expect((await response.json()).data.careerStartDate).toBe('2010-01-01');
    const audit = await connection.repository('auditLogs').findMany({
      filter: { targetId: person.employeeId, action: 'employee.update' },
    });
    expect(audit.at(-1)?.after).toMatchObject({
      careerStartDate: '2010-01-01',
    });
    const self = await person.session();
    expect(
      (
        await self.fetch(
          `/employees/${person.employeeId}`,
          patch({ careerStartDate: '2011-01-01' }),
        )
      ).status,
    ).toBe(403);
    const directory = await self.fetch(`/directory?q=Career`);
    expect(directory.status).toBe(200);
    const rows = (await directory.json()).data as Record<string, unknown>[];
    expect(rows.every((row) => !('careerStartDate' in row))).toBe(true);
    const invalid = await session.fetch(
      `/employees/${person.employeeId}`,
      patch({ careerStartDate: '2099-01-01' }),
    );
    expect(invalid.status).toBe(400);
    expect((await invalid.json()).error.fieldViolations[0].field).toBe(
      'careerStartDate',
    );
  });
});
