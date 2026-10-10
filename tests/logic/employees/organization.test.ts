// @vitest-environment node
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { describe, expect } from 'vitest';

import { organizationServiceToken } from '../../../server/providers/org/index.ts';
import {
  ALL,
  archivePage,
  composite,
  createEmployee,
  createEmployeesAppTest,
  employees,
  grantToUser,
} from './helpers.ts';

const test = createEmployeesAppTest();

describe('employees with the organisation', () => {
  test('views carry the primary department and position; lists filter by a department subtree', async ({
    testApp,
  }) => {
    const org = testApp.application.container.resolve(organizationServiceToken);
    const actor = { actorId: null };
    const root = await org.createDepartment({ title: 'Org Root T1' }, actor);
    const child = await org.createDepartment(
      { title: 'Org Child T1', parentId: root.id },
      actor,
    );
    const other = await org.createDepartment({ title: 'Org Other T1' }, actor);
    const position = await org.createPosition(
      { code: 'POS-T1', title: 'Buyer' },
      actor,
    );

    const inChild = await createEmployee(testApp, 'In Child', {
      positionId: position.id,
    });
    const inRoot = await createEmployee(testApp, 'In Root');
    const outside = await createEmployee(testApp, 'Outside');
    await org.addMember(
      { departmentId: child.id, userId: inChild.userId, primary: true },
      actor,
    );
    await org.addMember(
      { departmentId: root.id, userId: inRoot.userId, primary: true },
      actor,
    );
    await org.addMember(
      { departmentId: other.id, userId: outside.userId, primary: true },
      actor,
    );

    const service = employees(testApp);
    const all = await service.listEmployees(
      { departmentId: root.id, page: 1, pageSize: 100 },
      ALL,
    );
    expect(all.items.map((e) => e.name).sort()).toEqual([
      'In Child',
      'In Root',
    ]);
    const view = all.items.find((e) => e.name === 'In Child')!;
    expect(view.primaryDepartment).toEqual({
      id: child.id,
      title: 'Org Child T1',
    });
    expect(view.position).toEqual({ id: position.id, title: 'Buyer' });

    const directory = await service.listDirectory(
      { departmentId: child.id, page: 1, pageSize: 100 },
      ALL,
      false,
    );
    expect(directory.items.map((e) => e.name)).toEqual(['In Child']);

    // A disabled position is refused on the archive.
    const retired = await org.createPosition(
      { code: 'POS-T1-OLD', title: 'Retired' },
      actor,
    );
    await org.setPositionActive(retired.id, false, actor);
    await expect(
      service.updateEmployee(
        inRoot.employeeId,
        { positionId: retired.id },
        ALL,
        inRoot.userId,
      ),
    ).rejects.toMatchObject({ code: 'EMPLOYEE_POSITION_NOT_FOUND' });
  });

  test('org.position gives a permission set to active holders of an active position', async ({
    testApp,
  }) => {
    const org = testApp.application.container.resolve(organizationServiceToken);
    const authz = testApp.application.container.resolve(authorizationToken);
    const actor = { actorId: null };
    const position = await org.createPosition(
      { code: 'POS-T2', title: 'Recruiter' },
      actor,
    );
    const holder = await createEmployee(testApp, 'Holder', {
      positionId: position.id,
    });
    const nonHolder = await createEmployee(testApp, 'Non Holder');
    await authz.permissionSets.create({
      key: 'test-position-archive',
      title: 'test',
      grants: [
        archivePage,
        composite('oa.employees.archive', {
          view: { employees: 'allRecords' },
        }),
      ],
    });
    await authz.permissionSets.assign({
      permissionSet: 'test-position-archive',
      subject: { type: 'org.position', id: position.id },
    });
    expect((await (await holder.session()).fetch('/employees')).status).toBe(
      200,
    );
    expect((await (await nonHolder.session()).fetch('/employees')).status).toBe(
      403,
    );

    await org.setPositionActive(position.id, false, actor);
    expect((await (await holder.session()).fetch('/employees')).status).toBe(
      403,
    );
  });

  test('a department head sees the archives of their department and below', async ({
    testApp,
  }) => {
    const org = testApp.application.container.resolve(organizationServiceToken);
    const actor = { actorId: null };
    const head = await createEmployee(testApp, 'Head T3');
    const dept = await org.createDepartment(
      { title: 'Dept T3', managerId: head.userId },
      actor,
    );
    const sub = await org.createDepartment(
      { title: 'Sub T3', parentId: dept.id },
      actor,
    );
    const member = await createEmployee(testApp, 'Member T3');
    const subMember = await createEmployee(testApp, 'Sub Member T3');
    await createEmployee(testApp, 'Elsewhere T3');
    await org.addMember(
      { departmentId: dept.id, userId: member.userId, primary: true },
      actor,
    );
    await org.addMember(
      { departmentId: sub.id, userId: subMember.userId, primary: true },
      actor,
    );
    await grantToUser(
      testApp,
      'test-head-archive',
      [
        archivePage,
        composite('oa.employees.archive', {
          view: { employees: 'oa.employees.myDepartmentsAndBelow' },
        }),
      ],
      head.userId,
    );
    const response = await (
      await head.session()
    ).fetch('/employees?q=T3&pageSize=100');
    expect(response.status).toBe(200);
    const names = ((await response.json()) as { data: { name: string }[] }).data
      .map((e) => e.name)
      .sort();
    expect(names).toEqual(['Member T3', 'Sub Member T3']);
  });
});
