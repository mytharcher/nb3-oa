// @vitest-environment node
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { serverFileRepositoryManagerToken } from '@nocobase/app-plugin-file/server';
import { databaseManagerToken } from '@nocobase/db';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { auditServiceToken } from '../../../server/providers/audit/index.ts';
import {
  createImportService,
  IMPORT_FILES_COLLECTION,
  IMPORT_FILES_DISK,
  IMPORT_FILES_PATH,
  type ImportRowError,
} from '../../../server/providers/import/index.ts';
import type { OrganizationService } from '../../../server/providers/org/index.ts';
import { kindFile, startImportTestApp, type ImportTestApp } from './helpers.ts';

/** Errors without the free-form parts, for comparing. */
function brief(errors: readonly ImportRowError[]) {
  return errors.map(({ row, column, code, value }) => ({
    row,
    column,
    code,
    ...(value === undefined ? {} : { value }),
  }));
}

async function auditCount(test: ImportTestApp, reason: string) {
  const rows = await test.testApp.database
    .query()
    .selectFrom('auditLogs')
    .select('id')
    .where('reason', '=', reason)
    .execute();
  return rows.length;
}

describe('import service', () => {
  let test: ImportTestApp;
  let actor: string;
  let headName: string;
  let headId: string;
  let execEmail: string;
  let execId: string;
  let staffEmail: string;
  let staffId: string;
  let otherEmail: string;
  let disabledEmail: string;

  beforeAll(async () => {
    test = await startImportTestApp();
    actor = (await test.admin()).user.id;
    const head = await test.createUser('Head', 'head.user');
    headName = 'head.user';
    headId = head.user.id;
    const exec = await test.createUser('Exec');
    execEmail = exec.user.email;
    execId = exec.user.id;
    const staff = await test.createUser('Staff');
    staffEmail = staff.user.email;
    staffId = staff.user.id;
    const other = await test.createUser('Other');
    otherEmail = other.user.email;
    const disabled = await test.createUser('Disabled');
    disabledEmail = disabled.user.email;
    await test.disableUser(disabled.user.id);
  }, 120_000);

  afterAll(async () => {
    await test?.close();
  });

  it('reports every row problem of a department file and writes nothing', async () => {
    const before = (await test.organization.listTree()).length;
    const file = await kindFile('departments', [
      { code: 'X1', title: 'One', parentCode: 'X2' },
      { code: 'X2', title: 'Two', parentCode: 'X1' },
      { code: 'X3', title: 'Three', parentCode: 'NOPE' },
      { code: 'X4', title: 'Four', manager: 'ghost@nowhere.test' },
      { code: 'X4', title: 'Four again' },
      { code: 'X5', title: 'Five', executive: disabledEmail, sortOrder: 'x' },
      { code: 'bad code', title: 'Six' },
      { code: 'X7', title: null, active: 'maybe' },
    ]);
    const report = await test.imports.preview('departments', file, actor);
    expect(report.result).toBe('invalid');
    expect(brief(report.errors)).toEqual([
      { row: 2, column: 'parentCode', code: 'PARENT_CYCLE', value: 'X2' },
      { row: 3, column: 'parentCode', code: 'PARENT_CYCLE', value: 'X1' },
      { row: 4, column: 'parentCode', code: 'PARENT_NOT_FOUND', value: 'NOPE' },
      {
        row: 5,
        column: 'manager',
        code: 'USER_NOT_FOUND',
        value: 'ghost@nowhere.test',
      },
      { row: 6, column: 'code', code: 'DUPLICATE_IN_FILE', value: 'X4' },
      {
        row: 7,
        column: 'executive',
        code: 'USER_DISABLED',
        value: disabledEmail,
      },
      { row: 7, column: 'sortOrder', code: 'INVALID_INTEGER', value: 'x' },
      { row: 8, column: 'code', code: 'INVALID_CODE', value: 'bad code' },
      { row: 9, column: 'title', code: 'REQUIRED' },
      { row: 9, column: 'active', code: 'INVALID_BOOLEAN', value: 'maybe' },
    ]);
    expect(report.errors[4]!.params).toEqual({ firstRow: 5 });
    expect(report.errors[0]!.header).toBe('上级部门编码');
    expect((await test.organization.listTree()).length).toBe(before);

    // Running it records a failed attempt with the same errors, keeps the file, and still writes nothing.
    const run = await test.imports.run('departments', file, actor);
    expect(run.status).toBe('failed');
    expect(run.errorCount).toBe(10);
    expect(run.errors).toHaveLength(10);
    expect(run.file?.contentUrl).toMatch(
      /\/uploads\/imports\/[0-9a-f-]{36}\.xlsx$/u,
    );
    expect((await test.organization.listTree()).length).toBe(before);
    expect(await auditCount(test, `import:${run.id}`)).toBe(1);
  });

  it('creates a department tree with parents defined later, then updates it by code and is idempotent', async () => {
    const file = await kindFile('departments', [
      { code: 'RD', title: '研发', parentCode: 'HQ', sortOrder: 10 },
      {
        code: 'HQ',
        title: '总公司',
        manager: headName,
        executive: execEmail,
      },
      { code: 'QA', title: '测试', parentCode: 'RD', active: '否' },
    ]);
    const preview = await test.imports.preview('departments', file, actor);
    expect(preview).toMatchObject({
      result: 'ok',
      rowCount: 3,
      createdCount: 3,
      updatedCount: 0,
    });
    // A preview writes nothing.
    expect(
      (await test.organization.listTree()).some((node) => node.code === 'HQ'),
    ).toBe(false);

    const run = await test.imports.run('departments', file, actor);
    expect(run).toMatchObject({
      status: 'succeeded',
      createdCount: 3,
      errorCount: 0,
    });
    const tree = await test.organization.listTree();
    const byCode = new Map(tree.map((node) => [node.code, node]));
    expect(byCode.get('HQ')).toMatchObject({
      parentId: null,
      managerId: headId,
      executiveId: execId,
    });
    expect(byCode.get('RD')).toMatchObject({
      parentId: byCode.get('HQ')!.id,
      sortOrder: 10,
    });
    expect(byCode.get('QA')).toMatchObject({
      parentId: byCode.get('RD')!.id,
      active: false,
    });
    // One audit entry for the import, plus one per change the services audited.
    expect(await auditCount(test, `import:${run.id}`)).toBe(1 + 3 + 1);

    // The same file again changes nothing and audits only the import itself.
    const again = await test.imports.run('departments', file, actor);
    expect(again).toMatchObject({
      status: 'succeeded',
      createdCount: 0,
      updatedCount: 0,
      unchangedCount: 3,
    });
    expect(await auditCount(test, `import:${again.id}`)).toBe(1);

    // Update by code: swap RD and QA (a move that would loop if done naively), rename, clear the head.
    const update = await kindFile('departments', [
      { code: 'QA', title: '质量', parentCode: 'HQ', active: '是' },
      { code: 'RD', title: '研发', parentCode: 'QA', sortOrder: 10 },
      { code: 'HQ', title: '总公司', manager: null, executive: execEmail },
    ]);
    const updated = await test.imports.run('departments', update, actor);
    expect(updated).toMatchObject({
      status: 'succeeded',
      createdCount: 0,
      updatedCount: 3,
    });
    const after = new Map(
      (await test.organization.listTree()).map((node) => [node.code, node]),
    );
    expect(after.get('QA')).toMatchObject({
      title: '质量',
      parentId: after.get('HQ')!.id,
      active: true,
    });
    expect(after.get('RD')!.parentId).toBe(after.get('QA')!.id);
    expect(after.get('HQ')!.managerId).toBeNull();
  });

  it('imports positions and grades by code', async () => {
    const positions = await kindFile('positions', [
      { code: 'BUYER', title: '采购专员', sortOrder: 1 },
      { code: 'ACCT', title: '会计', active: '否' },
    ]);
    expect(await test.imports.run('positions', positions, actor)).toMatchObject(
      { status: 'succeeded', createdCount: 2 },
    );
    const grades = await kindFile('grades', [
      { code: 'P5', title: 'P5', rank: 50 },
      { code: 'M2', title: '经理', rank: 'high' },
    ]);
    const invalid = await test.imports.preview('grades', grades, actor);
    expect(brief(invalid.errors)).toEqual([
      { row: 3, column: 'rank', code: 'INVALID_INTEGER', value: 'high' },
    ]);
    const fixed = await kindFile('grades', [
      { code: 'P5', title: 'P5', rank: 50 },
      { code: 'M2', title: '经理', rank: 80 },
    ]);
    expect(await test.imports.run('grades', fixed, actor)).toMatchObject({
      status: 'succeeded',
      createdCount: 2,
    });
    const renamed = await kindFile('grades', [
      { code: 'P5', title: '高级', rank: 55 },
      { code: 'M2', title: '经理', rank: 80 },
    ]);
    expect(await test.imports.run('grades', renamed, actor)).toMatchObject({
      updatedCount: 1,
      unchangedCount: 1,
    });
    const grade = (await test.organization.listGrades()).find(
      (row) => row.code === 'P5',
    );
    expect(grade).toMatchObject({ title: '高级', rank: 55 });
  });

  it('validates employee references, managers and accounts', async () => {
    const file = await kindFile('employees', [
      {
        code: 'E1',
        name: 'A',
        user: staffEmail,
        status: '正式',
        managerCode: 'E2',
      },
      {
        code: 'E2',
        name: 'B',
        user: otherEmail,
        status: '正式',
        managerCode: 'E1',
      },
      { code: 'E3', name: 'C', user: 'nobody@x.test', status: '正式' },
      {
        code: 'E4',
        name: 'D',
        user: staffEmail,
        status: '试用',
        positionCode: 'NOPE',
        gradeCode: 'P5',
      },
      {
        code: 'E5',
        name: 'E',
        user: execEmail,
        status: 'fired',
        managerCode: 'E5',
        departmentCode: 'GONE',
        hireDate: '2026-02-30',
        positionCode: 'ACCT',
        email: 'not-an-email',
      },
    ]);
    const report = await test.imports.preview('employees', file, actor);
    expect(brief(report.errors)).toEqual([
      { row: 2, column: 'managerCode', code: 'MANAGER_CYCLE', value: 'E2' },
      { row: 3, column: 'managerCode', code: 'MANAGER_CYCLE', value: 'E1' },
      {
        row: 4,
        column: 'user',
        code: 'USER_NOT_FOUND',
        value: 'nobody@x.test',
      },
      { row: 5, column: 'user', code: 'DUPLICATE_IN_FILE', value: staffEmail },
      {
        row: 6,
        column: 'hireDate',
        code: 'INVALID_DATE',
        value: '2026-02-30',
      },
      { row: 6, column: 'status', code: 'INVALID_STATUS', value: 'fired' },
      {
        row: 6,
        column: 'email',
        code: 'INVALID_EMAIL',
        value: 'not-an-email',
      },
      {
        row: 6,
        column: 'positionCode',
        code: 'POSITION_INACTIVE',
        value: 'ACCT',
      },
      {
        row: 6,
        column: 'departmentCode',
        code: 'DEPARTMENT_NOT_FOUND',
        value: 'GONE',
      },
      { row: 6, column: 'managerCode', code: 'MANAGER_SELF', value: 'E5' },
    ]);
  });

  it('checks the final department level in previews and appoints an executive after moving to the top', async () => {
    const org = test.organization;
    const parent = await org.createDepartment(
      { title: 'Exec parent', code: 'EP' },
      { actorId: actor },
    );
    const child = await org.createDepartment(
      { title: 'Exec child', code: 'EC', parentId: parent.id },
      { actorId: actor },
    );
    const executive = await test.createUser('ImportExecutive');
    const invalid = await kindFile('departments', [
      {
        code: 'EC',
        title: 'Exec child',
        parentCode: 'EP',
        executive: executive.user.email,
      },
    ]);
    const preview = await test.imports.preview('departments', invalid, actor);
    expect(preview.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'EXECUTIVE_TOP_LEVEL_ONLY',
          column: 'executive',
        }),
      ]),
    );
    expect((await org.getDepartment(child.id))?.executiveId).toBeNull();
    const promote = await kindFile('departments', [
      {
        code: 'EC',
        title: 'Exec child',
        parentCode: null,
        executive: executive.user.email,
      },
    ]);
    const result = await test.imports.run('departments', promote, actor);
    expect(result.errors).toEqual([]);
    expect(await org.getDepartment(child.id)).toMatchObject({
      parentId: null,
      executiveId: executive.user.id,
    });
    const demote = await kindFile('departments', [
      { code: 'EC', title: 'Exec child', parentCode: 'EP', executive: null },
    ]);
    expect(
      (await test.imports.run('departments', demote, actor)).errors,
    ).toEqual([]);
    expect(await org.getDepartment(child.id)).toMatchObject({
      parentId: parent.id,
      executiveId: null,
    });
  });

  it('creates archives with managers defined later and primary departments, then updates them by code', async () => {
    const tree = new Map(
      (await test.organization.listTree()).map((node) => [node.code, node]),
    );
    const file = await kindFile('employees', [
      {
        code: '0002',
        name: '员工',
        user: staffEmail,
        departmentCode: 'RD',
        managerCode: '0001',
        positionCode: 'BUYER',
        gradeCode: 'P5',
        hireDate: new Date(Date.UTC(2026, 9, 8)),
        probationEndDate: '2027/1/7',
        status: '试用',
      },
      {
        code: '0001',
        name: '经理',
        user: 'head.user',
        departmentCode: 'HQ',
        gradeCode: 'M2',
        status: 'regular',
      },
    ]);
    const run = await test.imports.run('employees', file, actor);
    expect(run).toMatchObject({ status: 'succeeded', createdCount: 2 });
    const staff = (await test.employees.getByUserId(staffId))!;
    const head = (await test.employees.getByUserId(headId))!;
    expect(staff).toMatchObject({
      code: '0002',
      managerId: head.id,
      hireDate: '2026-10-08',
      probationEndDate: '2027-01-07',
      status: 'probation',
    });
    expect((await test.organization.primaryDepartmentOf(staffId))?.id).toBe(
      tree.get('RD')!.id,
    );

    // Idempotent.
    const again = await test.imports.run('employees', file, actor);
    expect(again).toMatchObject({ createdCount: 0, unchangedCount: 2 });
    expect(await auditCount(test, `import:${again.id}`)).toBe(1);

    // Update by code: transfer, promote (a status correction with a history row), clear the position.
    const update = await kindFile('employees', [
      {
        code: '0002',
        name: '员工',
        user: staffEmail,
        departmentCode: 'QA',
        managerCode: '0001',
        positionCode: null,
        gradeCode: 'P5',
        hireDate: '2026-10-08',
        probationEndDate: '2027-01-07',
        status: '正式',
      },
    ]);
    const updated = await test.imports.run('employees', update, actor);
    expect(updated).toMatchObject({ updatedCount: 1, unchangedCount: 0 });
    const promoted = (await test.employees.getByUserId(staffId))!;
    expect(promoted).toMatchObject({ status: 'regular', positionId: null });
    const memberships = await test.organization.membershipsOf(staffId);
    expect(memberships).toEqual([
      { departmentId: tree.get('QA')!.id, primary: true },
    ]);
    const history = await test.employees.listHistory(promoted.id);
    expect(history.map((entry) => entry.kind)).toContain('correction');

    // An account already bound to another archive, and an archive whose account would change.
    const conflict = await kindFile('employees', [
      { code: '0003', name: 'X', user: staffEmail, status: '正式' },
      { code: '0001', name: '经理', user: otherEmail, status: '正式' },
    ]);
    expect(
      brief((await test.imports.preview('employees', conflict, actor)).errors),
    ).toEqual([
      { row: 2, column: 'user', code: 'USER_TAKEN', value: staffEmail },
      { row: 3, column: 'user', code: 'USER_MISMATCH', value: otherEmail },
    ]);
  });

  it('adds and removes duty-role members by role and account', async () => {
    const file = await kindFile('dutyRoleMembers', [
      { roleCode: 'finance', user: staffEmail },
      { roleCode: 'cashier', user: 'head.user', active: '是' },
      { roleCode: 'nope', user: staffEmail },
      { roleCode: 'finance', user: staffEmail },
    ]);
    expect(
      brief(
        (await test.imports.preview('dutyRoleMembers', file, actor)).errors,
      ),
    ).toEqual([
      {
        row: 4,
        column: 'roleCode',
        code: 'DUTY_ROLE_NOT_FOUND',
        value: 'nope',
      },
      { row: 5, column: 'user', code: 'DUPLICATE_IN_FILE', value: staffEmail },
    ]);
    const valid = await kindFile('dutyRoleMembers', [
      { roleCode: 'finance', user: staffEmail },
      { roleCode: 'cashier', user: 'head.user', active: '是' },
    ]);
    expect(
      await test.imports.run('dutyRoleMembers', valid, actor),
    ).toMatchObject({ status: 'succeeded', createdCount: 2 });
    expect(await test.organization.hasDutyRole(staffId, 'finance')).toBe(true);
    const remove = await kindFile('dutyRoleMembers', [
      { roleCode: 'finance', user: staffEmail, active: '否' },
      { roleCode: 'cashier', user: 'head.user' },
    ]);
    expect(
      await test.imports.run('dutyRoleMembers', remove, actor),
    ).toMatchObject({ updatedCount: 1, unchangedCount: 1 });
    expect(await test.organization.hasDutyRole(staffId, 'finance')).toBe(false);
  });

  it('rolls the whole import back when a write fails half-way, and records the failure', async () => {
    const container = test.testApp.application.container;
    const organization = test.organization;
    let calls = 0;
    // The second department write fails after the first one succeeded inside the same transaction.
    const failing = new Proxy(organization, {
      get(target, property, receiver) {
        if (property === 'createDepartment')
          return async (
            ...args: Parameters<OrganizationService['createDepartment']>
          ) => {
            calls += 1;
            if (calls === 2) throw new Error('disk on fire');
            return target.createDepartment(...args);
          };
        return Reflect.get(target, property, receiver);
      },
    });
    let id = 0;
    const imports = createImportService({
      database: container.resolve(databaseManagerToken),
      organization: () => failing,
      employees: () => test.employees,
      users: () => container.resolve(userAdministrationServiceToken),
      audit: () => container.resolve(auditServiceToken),
      files: () =>
        container
          .resolve(serverFileRepositoryManagerToken)
          .repository(IMPORT_FILES_COLLECTION, {
            disk: IMPORT_FILES_DISK,
            accessPath: IMPORT_FILES_PATH,
            policy: { read: true, create: true, update: false, delete: false },
          }),
      generateId: () => `rollback-${++id}`,
      publicBasePath: () => test.testApp.publicBasePath,
    });
    const file = await kindFile('departments', [
      { code: 'RB1', title: 'First' },
      { code: 'RB2', title: 'Second' },
    ]);
    const run = await imports.run('departments', file, actor);
    expect(run.status).toBe('failed');
    expect(run.errors).toEqual([
      {
        row: 3,
        column: null,
        header: null,
        code: 'WRITE_FAILED',
        params: { reason: 'UNKNOWN', message: 'disk on fire' },
      },
    ]);
    const codes = (await organization.listTree()).map((node) => node.code);
    expect(codes).not.toContain('RB1');
    // Only the failure is audited: the first department's entry rolled back with it.
    expect(await auditCount(test, 'import:rollback-1')).toBe(1);
  });

  it('lists the history newest first with the actor and the retained file', async () => {
    const { items, total } = await test.imports.listRuns({
      page: 1,
      pageSize: 50,
    });
    expect(total).toBeGreaterThan(5);
    expect(items[0]!.createdAt >= items.at(-1)!.createdAt).toBe(true);
    expect(items[0]!.actor?.id).toBe(actor);
    expect(items.every((item) => !('errors' in item))).toBe(true);
    // Previews are not recorded: the grade file was checked once and run twice.
    const grades = await test.imports.listRuns({
      kind: 'grades',
      page: 1,
      pageSize: 50,
    });
    expect(grades.items.every((item) => item.kind === 'grades')).toBe(true);
    expect(grades.total).toBe(2);
  });
});
