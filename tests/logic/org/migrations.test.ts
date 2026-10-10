// @vitest-environment node
import path from 'node:path';

import { describeMigration } from '@nocobase/app-testing/server';
import type { MigrationSource } from '@nocobase/db';
import { expect } from 'vitest';

const sources: readonly MigrationSource[] = [
  {
    packageName: 'org-migration-test',
    directory: path.resolve(
      import.meta.dirname,
      '../../../database/main/migrations',
    ),
  },
];

describeMigration('202610100201_create_departments', {
  sources,
  up: async ({ connection, expectCollection }) => {
    const departments = await expectCollection('departments').toExist();
    expect(Object.keys(departments.fields)).toEqual([
      'id',
      'title',
      'code',
      'parentId',
      'managerId',
      'executiveId',
      'active',
      'sortOrder',
    ]);
    expect(departments.primaryKey).toEqual(['id']);
    await expectCollection('departments').toHaveIndex(['parentId'], {
      unique: false,
    });
    await expectCollection('departments').toHaveIndex(['managerId'], {
      unique: false,
    });
    await expectCollection('departments').toHaveField('code', {
      nullable: true,
    });
    const members = await expectCollection('departmentMembers').toExist();
    expect(Object.keys(members.fields)).toEqual([
      'id',
      'departmentId',
      'userId',
      'primary',
      'active',
    ]);
    await expectCollection('departmentMembers').toHaveIndex(['userId'], {
      unique: false,
    });

    const query = connection.query;
    await query
      .insertInto('departments')
      .values({ id: 'd1', title: 'A', code: 'A' })
      .execute();
    // Several departments may have no code, but a code is unique.
    await query
      .insertInto('departments')
      .values({ id: 'd2', title: 'B', code: null })
      .execute();
    await query
      .insertInto('departments')
      .values({ id: 'd3', title: 'C', code: null })
      .execute();
    await expect(
      query
        .insertInto('departments')
        .values({ id: 'd4', title: 'D', code: 'A' })
        .execute(),
    ).rejects.toThrow();
    await query
      .insertInto('departmentMembers')
      .values({ id: 'm1', departmentId: 'd1', userId: 'u1' })
      .execute();
    await expect(
      query
        .insertInto('departmentMembers')
        .values({ id: 'm2', departmentId: 'd1', userId: 'u1' })
        .execute(),
    ).rejects.toThrow();
    const row = await query
      .selectFrom('departments')
      .select(['active', 'sortOrder'])
      .where('id', '=', 'd1')
      .executeTakeFirstOrThrow();
    expect(Boolean(row.active)).toBe(true);
    expect(Number(row.sortOrder)).toBe(0);
  },
  down: async ({ expectCollection }) => {
    await expectCollection('departments').not.toExist();
    await expectCollection('departmentMembers').not.toExist();
  },
});

describeMigration('202610100202_create_positions_and_grades', {
  sources,
  up: async ({ connection, expectCollection }) => {
    const positions = await expectCollection('positions').toExist();
    expect(Object.keys(positions.fields)).toEqual([
      'id',
      'code',
      'title',
      'active',
      'sortOrder',
    ]);
    const grades = await expectCollection('grades').toExist();
    expect(Object.keys(grades.fields)).toEqual([
      'id',
      'code',
      'title',
      'rank',
      'active',
    ]);
    await connection.query
      .insertInto('grades')
      .values({ id: 'g1', code: 'P5', title: 'P5', rank: 5 })
      .execute();
    await expect(
      connection.query
        .insertInto('grades')
        .values({ id: 'g2', code: 'P5', title: 'Again', rank: 6 })
        .execute(),
    ).rejects.toThrow();
  },
  down: async ({ expectCollection }) => {
    await expectCollection('positions').not.toExist();
    await expectCollection('grades').not.toExist();
  },
});

describeMigration('202610100203_create_duty_roles', {
  sources,
  up: async ({ connection, expectCollection }) => {
    const roles = await expectCollection('dutyRoles').toExist();
    expect(roles.primaryKey).toEqual(['code']);
    const members = await expectCollection('dutyRoleMembers').toExist();
    expect(Object.keys(members.fields)).toEqual([
      'id',
      'dutyRoleCode',
      'userId',
      'active',
    ]);
    await connection.query
      .insertInto('dutyRoleMembers')
      .values({ id: 'r1', dutyRoleCode: 'gm', userId: 'u1' })
      .execute();
    await expect(
      connection.query
        .insertInto('dutyRoleMembers')
        .values({ id: 'r2', dutyRoleCode: 'gm', userId: 'u1' })
        .execute(),
    ).rejects.toThrow();
  },
  down: async ({ expectCollection }) => {
    await expectCollection('dutyRoles').not.toExist();
    await expectCollection('dutyRoleMembers').not.toExist();
  },
});
