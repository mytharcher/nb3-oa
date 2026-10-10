// @vitest-environment node
import path from 'node:path';
import type { MigrationSource } from '@nocobase/db';
import { describeMigration } from '@nocobase/app-testing/server';
import { expect } from 'vitest';

const sources: readonly MigrationSource[] = [
  {
    packageName: 'employees-migration-test',
    directory: path.resolve(
      import.meta.dirname,
      '../../../database/main/migrations',
    ),
  },
];

describeMigration('202610100401_create_employees', {
  sources,
  up: async ({ connection, expectCollection }) => {
    const employees = await expectCollection('employees').toExist();
    expect(Object.keys(employees.fields)).toEqual([
      'id',
      'userId',
      'code',
      'name',
      'managerId',
      'positionId',
      'gradeId',
      'hireDate',
      'probationEndDate',
      'status',
      'lastWorkingDay',
      'phone',
      'email',
      'workLocation',
      'emergencyContact',
      'active',
      'createdAt',
      'updatedAt',
    ]);
    expect(employees.primaryKey).toEqual(['id']);
    // No department column: the primary department lives in departmentMembers only.
    expect(Object.keys(employees.fields)).not.toContain('departmentId');
    await expectCollection('employees').toHaveField('managerId', {
      nullable: true,
    });
    await expectCollection('employees').toHaveField('userId', {
      nullable: false,
    });

    const profiles = await expectCollection('employeeProfiles').toExist();
    expect(profiles.primaryKey).toEqual(['employeeId']);
    await expectCollection('employeeCompensation').toHaveField('baseSalary', {
      nullable: false,
    });
    await expectCollection('employeeHistory').toHaveField('kind', {
      nullable: false,
    });

    const now = new Date();
    const row = {
      name: 'A',
      status: 'regular',
      active: true,
      createdAt: now,
      updatedAt: now,
    };
    await connection.query
      .insertInto('employees')
      .values({ ...row, id: 'e1', userId: 'u1', code: 'C1' })
      .execute();
    // userId and code are each unique.
    await expect(
      connection.query
        .insertInto('employees')
        .values({ ...row, id: 'e2', userId: 'u1', code: 'C2' })
        .execute(),
    ).rejects.toThrow();
    await expect(
      connection.query
        .insertInto('employees')
        .values({ ...row, id: 'e3', userId: 'u3', code: 'C1' })
        .execute(),
    ).rejects.toThrow();
    // The status defaults to probation.
    await connection.query
      .insertInto('employees')
      .values({
        id: 'e4',
        userId: 'u4',
        code: 'C4',
        name: 'B',
        createdAt: now,
        updatedAt: now,
      })
      .execute();
    const inserted = await connection.query
      .selectFrom('employees')
      .select(['status', 'active'])
      .where('id', '=', 'e4')
      .executeTakeFirst();
    expect(inserted).toMatchObject({ status: 'probation' });
    expect(Boolean(inserted?.active)).toBe(true);
  },
  down: async ({ expectCollection }) => {
    await expectCollection('employees').not.toExist();
    await expectCollection('employeeProfiles').not.toExist();
    await expectCollection('employeeCompensation').not.toExist();
    await expectCollection('employeeHistory').not.toExist();
  },
});
