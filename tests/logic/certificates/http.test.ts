// @vitest-environment node
import path from 'node:path';
import { expect } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import {
  apiDocsToken,
  findApiDocumentSchemaProblems,
  findUndeclaredApiRoutes,
} from '@nocobase/app-server/router';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { installCertificatePermissions } from '../../fixtures/certificates/202610104711_certificate_permissions.js';
import { createEmployee } from '../employees/helpers.js';
import { write } from '../platform/helpers.js';
import { test } from './helpers.js';
test('fixture HTTP owner policies, strict actor input, durable replay revoked grants and Swagger', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    org = c.resolve(organizationServiceToken);
  if (!(await db.collections().get('certificateRequests'))) {
    await db
      .createMigrator({
        sources: [
          {
            packageName: 'certificates-candidate',
            directory: path.resolve(
              import.meta.dirname,
              '../../fixtures/certificates/migrations',
            ),
          },
        ],
        tableName: 'certificateCandidateMigrations',
      })
      .latest();
  }
  await installCertificatePermissions(db.connection().query);
  const owner = await createEmployee(testApp, 'Certificate HTTP owner'),
    stranger = await createEmployee(testApp, 'Certificate stranger');
  const department = await org.createDepartment(
    { title: 'Certificate HTTP' },
    { actorId: owner.userId },
  );
  await org.addMember(
    { departmentId: department.id, userId: owner.userId, primary: true },
    { actorId: owner.userId },
  );
  const session = await owner.session(),
    other = await stranger.session();
  const input = {
    certificateType: 'employment',
    purpose: 'Real certificate HTTP',
    copies: 1,
    deliveryMethod: 'pickup',
    requestKey: 'create-http',
  };
  expect((await testApp.request('/certificateRequests/absent')).status).toBe(
    401,
  );
  expect(
    (
      await session.fetch(
        '/certificateRequests',
        write('POST', { ...input, actorId: stranger.userId }),
      )
    ).status,
  ).toBe(400);
  const response = await session.fetch(
    '/certificateRequests',
    write('POST', input),
  );
  expect(response.status).toBe(200);
  const body = (await response.json()) as {
    data: { id: string; applicant: { id: string; name: string } };
  };
  expect(body.data.applicant.id).toBe(owner.userId);
  expect(body.data.applicant.name).toBe('Certificate HTTP owner');
  expect(
    (await other.fetch(`/certificateRequests/${body.data.id}`)).status,
  ).toBe(403);
  const ownList = await session.fetch(
    '/certificateRequests?page=1&pageSize=10',
  );
  expect(ownList.status).toBe(200);
  expect(await ownList.json()).toMatchObject({
    data: { total: 1, items: [{ id: body.data.id }] },
  });
  const otherList = await other.fetch(
    '/certificateRequests?page=1&pageSize=10',
  );
  expect(otherList.status).toBe(200);
  expect(await otherList.json()).toMatchObject({
    data: { total: 0, items: [] },
  });
  expect(
    (await session.fetch('/certificateRequests?pageSize=101')).status,
  ).toBe(400);
  expect(
    await (
      await session.fetch('/certificateRequests?q=no-match&order=asc')
    ).json(),
  ).toMatchObject({ data: { total: 0, items: [] } });
  expect(
    await (
      await session.fetch('/certificateRequests?q=HTTP&status=draft')
    ).json(),
  ).toMatchObject({ data: { total: 1 } });
  const ownDetail = await session.fetch(`/certificateRequests/${body.data.id}`);
  expect(await ownDetail.json()).toMatchObject({
    data: {
      capabilities: {
        canIssue: false,
        canDownload: false,
        transitions: expect.arrayContaining(['edit', 'submit']),
      },
    },
  });
  const replay = await session.fetch(
    '/certificateRequests',
    write('POST', input),
  );
  expect(replay.status).toBe(200);
  await db
    .connection()
    .query.deleteFrom('authorizationPermissionSetAssignments')
    .where('permissionSetKey', '=', 'oa-certificates-employee')
    .execute();
  expect(
    (await session.fetch('/certificateRequests', write('POST', input))).status,
  ).toBe(403);
  await installCertificatePermissions(db.connection().query);
  expect(
    await db
      .connection()
      .query.selectFrom('authorizationPermissionSetAssignments')
      .select('id')
      .where('permissionSetKey', '=', 'oa-certificates-employee')
      .execute(),
  ).toEqual([]);
  // Existing definitions remain administrator-owned, even if their grants were customized.
  await db
    .connection()
    .query.updateTable('authorizationPermissionSets')
    .set({ grants: '[]' })
    .where('key', '=', 'oa-certificates-hr')
    .execute();
  await installCertificatePermissions(db.connection().query);
  expect(
    await db
      .connection()
      .query.selectFrom('authorizationPermissionSets')
      .select('grants')
      .where('key', '=', 'oa-certificates-hr')
      .executeTakeFirst(),
  ).toMatchObject({ grants: '[]' });
  const document = await c.resolve(apiDocsToken).getDocument();
  expect(findApiDocumentSchemaProblems(document)).toEqual([]);
  expect(
    findUndeclaredApiRoutes(testApp.application).filter((r) =>
      JSON.stringify(r).includes('certificate'),
    ),
  ).toEqual([]);
}, 60_000);
