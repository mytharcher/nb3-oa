// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { describe, expect, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { auditServiceToken } from '../../../server/providers/audit/index.ts';
import { organizationServiceToken } from '../../../server/providers/org/index.ts';
import { financeAssignmentServiceToken } from '../../../server/providers/finance-assignments/contract.ts';
import {
  createPlatformAppTest,
  createUser,
  grantSettings,
  write,
} from '../platform/helpers.ts';
import type { Assignment } from '../../../client/pages/finance-assignments/types.ts';
const test = createPlatformAppTest();
const body = async (response: Response) =>
  (await response.json()) as {
    data: Assignment;
    meta: { page: number; total: number };
  };
describe('department finance assignments', () => {
  test('identity, finite eligible pool, independent read/update, department uniqueness and optimistic locking', async ({
    app,
    testApp,
    request,
  }) => {
    const reader = await createUser(testApp, 'reader'),
      editor = await createUser(testApp, 'editor'),
      accountant = await createUser(testApp, 'accountant'),
      stranger = await createUser(testApp, 'stranger');
    await grantSettings(testApp, reader.user.id, 'oa.financeAssignments', [
      'read',
    ]);
    await grantSettings(testApp, editor.user.id, 'oa.financeAssignments', [
      'read',
      'update',
    ]);
    const db = app.container.resolve(databaseManagerToken),
      org = app.container.resolve(organizationServiceToken),
      service = app.container.resolve(financeAssignmentServiceToken);
    await db
      .connection()
      .repository('employees')
      .createOne({
        values: {
          id: randomUUID(),
          code: randomUUID(),
          name: 'accountant',
          userId: accountant.user.id,
          status: 'regular',
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    await org.addDutyRoleMember('finance', accountant.user.id, {
      actorId: editor.user.id,
    });
    const dept = await org.createDepartment(
      { title: 'Finance test' },
      { actorId: editor.user.id },
    );
    const input = {
      departmentId: dept.id,
      accountantId: accountant.user.id,
      reason: 'Configured reviewer',
    };
    expect((await request('/financeAssignments')).status).toBe(401);
    expect((await stranger.fetch('/financeAssignments')).status).toBe(403);
    expect(
      (await reader.fetch('/financeAssignments', write('POST', input))).status,
    ).toBe(403);
    expect((await reader.fetch('/financeAssignments/options')).status).toBe(
      200,
    );
    expect(await service.candidates()).toContain(accountant.user.id);
    expect(await service.candidates()).not.toContain(stranger.user.id);
    expect(
      (
        await editor.fetch(
          '/financeAssignments',
          write('POST', { ...input, accountantId: stranger.user.id }),
        )
      ).status,
    ).toBe(400);
    const created = await editor.fetch(
      '/financeAssignments',
      write('POST', input),
    );
    expect(created.status).toBe(201);
    const row = (await body(created)).data;
    expect(row.accountant.name).toBe('accountant');
    expect(row.department.title).toBe('Finance test');
    expect(
      (await editor.fetch('/financeAssignments', write('POST', input))).status,
    ).toBe(409);
    const page = await body(await reader.fetch('/financeAssignments?page=999'));
    expect(page).toHaveProperty('meta');
    expect(page.meta).toMatchObject({ page: 1, total: 1 });
    const empty = await body(
      await reader.fetch(
        `/financeAssignments?page=999&departmentId=${randomUUID()}`,
      ),
    );
    expect(empty.meta).toMatchObject({ page: 1, total: 0 });
    const changes = await Promise.all([
      editor.fetch(
        `/financeAssignments/${row.id}`,
        write('PATCH', {
          active: false,
          version: row.version,
          reason: 'Disable',
        }),
      ),
      editor.fetch(
        `/financeAssignments/${row.id}`,
        write('PATCH', {
          active: true,
          version: row.version,
          reason: 'Concurrent edit',
        }),
      ),
    ]);
    expect(changes.map((r) => r.status).sort()).toEqual([200, 409]);
    const secondDept = await org.createDepartment(
      { title: 'Finance second' },
      { actorId: editor.user.id },
    );
    const second = await db.transaction((tx) =>
      service.create(
        { ...input, departmentId: secondDept.id, actorId: editor.user.id },
        tx,
      ),
    );
    for (const id of [row.id, second.id])
      await db
        .connection()
        .repository('financeAssignments')
        .updateOne({
          filter: { id },
          values: { updatedAt: new Date('2026-01-01T00:00:00Z') },
        });
    const stable = await service.list({ page: 999, pageSize: 1, order: 'asc' });
    expect(stable.meta).toMatchObject({ page: 2, total: 2 });
    expect(stable.data[0].id).toBe([row.id, second.id].sort()[1]);
    const current = (await service.get(row.id))!;
    const audit = app.container.resolve(auditServiceToken),
      spy = vi
        .spyOn(audit, 'record')
        .mockRejectedValueOnce(new Error('audit rollback'));
    await expect(
      db.transaction((tx) =>
        service.update(
          row.id,
          {
            active: !current.active,
            version: current.version,
            reason: 'Rollback',
            actorId: editor.user.id,
          },
          tx,
        ),
      ),
    ).rejects.toThrow('audit rollback');
    spy.mockRestore();
    expect((await service.get(row.id))!.version).toBe(current.version);
  });
  test('nearest eligible ancestor, unique finance manager fallback, self-manager override and inactive membership are resolved fresh', async ({
    app,
    testApp,
  }) => {
    const db = app.container.resolve(databaseManagerToken),
      org = app.container.resolve(organizationServiceToken),
      service = app.container.resolve(financeAssignmentServiceToken);
    const accountant = await createUser(testApp, 'ancestor accountant'),
      manager = await createUser(testApp, 'manager'),
      other = await createUser(testApp, 'second manager');
    for (const user of [accountant, manager, other])
      await db
        .connection()
        .repository('employees')
        .createOne({
          values: {
            id: randomUUID(),
            code: randomUUID(),
            name: user.user.name,
            userId: user.user.id,
            status: 'regular',
            active: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
    const root = await org.createDepartment(
        { title: 'Finance root' },
        { actorId: manager.user.id },
      ),
      child = await org.createDepartment(
        { title: 'Finance child', parentId: root.id },
        { actorId: manager.user.id },
      );
    await org.addDutyRoleMember('finance', accountant.user.id, {
      actorId: manager.user.id,
    });
    await org.addDutyRoleMember('financeManager', manager.user.id, {
      actorId: manager.user.id,
    });
    await db.transaction((tx) =>
      service.create(
        {
          departmentId: root.id,
          accountantId: accountant.user.id,
          actorId: manager.user.id,
          reason: 'Ancestor routing',
        },
        tx,
      ),
    );
    expect(
      await db.transaction((tx) => service.resolve(child.id, 'applicant', tx)),
    ).toBe(accountant.user.id);
    expect(
      await db.transaction((tx) =>
        service.resolve(child.id, accountant.user.id, tx),
      ),
    ).toBeUndefined();
    await db
      .connection()
      .repository('dutyRoleMembers')
      .updateMany({
        filter: { userId: accountant.user.id, dutyRoleCode: 'finance' },
        values: { active: false },
      });
    expect(
      await db.transaction((tx) => service.resolve(child.id, 'applicant', tx)),
    ).toBe(manager.user.id);
    const assignment = (
      await service.list({
        departmentId: root.id,
        page: 1,
        pageSize: 20,
        order: 'desc',
      })
    ).data[0];
    await db.transaction((tx) =>
      service.update(
        assignment.id,
        {
          active: false,
          version: assignment.version,
          actorId: manager.user.id,
          reason: 'Disable stale accountant',
        },
        tx,
      ),
    );
    expect((await service.get(assignment.id))!.active).toBe(false);

    await org.addDutyRoleMember('financeManager', other.user.id, {
      actorId: manager.user.id,
    });
    expect(
      await db.transaction((tx) => service.resolve(child.id, 'applicant', tx)),
    ).toBeUndefined();
  });
});
