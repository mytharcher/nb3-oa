// @vitest-environment node
import { expect, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import type { AuthorizationCheckRequest } from '@nocobase/authorization/core';
import { grantToUser } from '../employees/helpers.js';
import { test } from './helpers.js';
import { createUser, write } from '../platform/helpers.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { calendarServiceToken } from '../../../server/providers/platform/index.js';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
test('main raw evidence HTTP: action, HR identity, immutable replay, whole-batch rollback and revocation', async ({
  testApp,
  request,
}) => {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    org = c.resolve(organizationServiceToken);
  const hr = await createUser(testApp, 'Synthetic import HR'),
    employee = await createUser(testApp, 'Synthetic punch employee'),
    outsider = await createUser(testApp, 'No import action');
  await org.addDutyRoleMember('hr', hr.user.id, { actorId: hr.user.id });
  await db.repository('employees').createOne({
    values: {
      id: 'http-import-employee',
      userId: employee.user.id,
      code: 'http-import-employee',
      name: 'Synthetic employee',
      status: 'regular',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  });
  const row = {
    userId: employee.user.id,
    date: c.resolve(calendarServiceToken).localDate(new Date()),
    punchKind: 'in',
    punchedAt: null,
    source: 'http-test',
    sourceKey: 'one',
    sourceData: { cells: ['original', 1] },
  };
  const url = '/attendanceManagement/ingestBatch';
  expect((await request(url, write('POST', { rows: [row] }))).status).toBe(401);
  expect((await outsider.fetch(url, write('POST', {}))).status).toBe(403);
  expect(
    (
      await hr.fetch(
        url,
        write('POST', { rows: [row], actorId: outsider.user.id }),
      )
    ).status,
  ).toBe(400);
  const response = await hr.fetch(url, write('POST', { rows: [row] }));
  expect(response.status).toBe(200);
  const receipt = (await response.json()).data;
  expect(receipt).toEqual({ count: 1, recordIds: [expect.any(String)] });
  expect(
    (await (await hr.fetch(url, write('POST', { rows: [row] }))).json()).data,
  ).toEqual(receipt);
  expect(
    await db
      .repository('auditLogs')
      .count({ filter: { action: 'attendance.ingest' } }),
  ).toBe(1);
  expect(
    (
      await hr.fetch(
        url,
        write('POST', {
          rows: [
            { ...row, sourceKey: 'rolled-back' },
            { ...row, sourceData: { changed: true } },
          ],
        }),
      )
    ).status,
  ).toBe(409);
  expect(await db.repository('attendanceRecords').count()).toBe(1);
  const spy = vi
    .spyOn(c.resolve(auditServiceToken), 'record')
    .mockRejectedValueOnce(new Error('Synthetic audit failure'));
  expect(
    (
      await hr.fetch(
        url,
        write('POST', { rows: [{ ...row, sourceKey: 'audit-rollback' }] }),
      )
    ).status,
  ).toBe(500);
  spy.mockRestore();
  expect(await db.repository('attendanceRecords').count()).toBe(1);
  expect(
    (
      await hr.fetch(
        url,
        write('POST', {
          rows: [{ ...row, userId: outsider.user.id, sourceKey: 'identity' }],
        }),
      )
    ).status,
  ).toBe(400);
  const document = await (await hr.fetch('/swagger')).json();
  expect(
    document.paths['/api/attendanceManagement/ingestBatch'].post.operationId,
  ).toBe('ingestAttendanceBatch');
  await grantToUser(
    testApp,
    'import-action-only',
    [
      {
        resource: { type: 'composite', id: 'oa.attendanceImport' },
        actions: [
          {
            action: 'ingest',
            policy: {
              type: 'composite',
              scopes: { attendanceRecords: 'allRecords' },
            },
          },
        ],
      },
    ],
    outsider.user.id,
  );
  expect(
    (await outsider.fetch(url, write('POST', { rows: [row] }))).status,
  ).toBe(403);
  const authz = c.resolve(authorizationToken),
    originalFor = authz.for.bind(authz);
  let mode: 'read' | 'create' = 'read';
  const policySpy = vi.spyOn(authz, 'for').mockImplementation((identity) => {
    const context = originalFor(identity);
    return {
      ...context,
      authorize: (async (check: AuthorizationCheckRequest) => {
        const decision = await context.authorize(check);
        const policy = decision.conditions?.database?.attendanceRecords;
        if (check.resource.id !== 'oa.attendanceImport' || !policy)
          return decision;
        return {
          ...decision,
          conditions: {
            ...decision.conditions,
            database: {
              ...decision.conditions?.database,
              attendanceRecords: {
                ...policy,
                [mode]: { scope: true, fields: ['id'] },
              },
            },
          },
        };
      }) as typeof context.authorize,
    };
  });
  expect((await hr.fetch(url, write('POST', { rows: [row] }))).status).toBe(
    403,
  );
  expect(
    (
      await hr.fetch(
        url,
        write('POST', { rows: [{ ...row, sourceKey: 'unreadable-new' }] }),
      )
    ).status,
  ).toBe(403);
  mode = 'create';
  expect(
    (
      await hr.fetch(
        url,
        write('POST', { rows: [{ ...row, sourceKey: 'forbidden-fields' }] }),
      )
    ).status,
  ).toBe(403);
  policySpy.mockRestore();
  expect(await db.repository('attendanceRecords').count()).toBe(1);
  const sets = c.resolve(authorizationToken).permissionSets,
    original = (await sets.get('oa-attendance-import-hr'))!;
  await sets.update(original.key, { ...original, grants: [] });
  expect((await hr.fetch(url, write('POST', { rows: [row] }))).status).toBe(
    403,
  );
  await sets.update(original.key, original);
  await org.removeDutyRoleMember('hr', hr.user.id, { actorId: hr.user.id });
  expect((await hr.fetch(url, write('POST', { rows: [row] }))).status).toBe(
    403,
  );
});
