// @vitest-environment node
import { expect } from 'vitest';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import {
  apiDocsToken,
  findApiDocumentSchemaProblems,
  findUndeclaredApiRoutes,
} from '@nocobase/app-server/router';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { databaseManagerToken } from '@nocobase/db';
import { createEmployee, grantToUser } from '../employees/helpers.js';
import { write, ORIGIN } from '../platform/helpers.js';
import { test } from './helpers.js';
test('main HTTP private uploads and read scopes, strict actor input, actual admin revocation and documented DTOs', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    org = c.resolve(organizationServiceToken),
    db = c.resolve(databaseManagerToken),
    authz = c.resolve(authorizationToken),
    owner = await createEmployee(testApp, 'Seal HTTP owner'),
    outsider = await createEmployee(testApp, 'Seal HTTP outsider'),
    admin = await createEmployee(testApp, 'Seal HTTP admin');
  const department = await org.createDepartment(
    { title: 'HTTP seal department' },
    { actorId: owner.userId },
  );
  await org.addMember(
    { departmentId: department.id, userId: owner.userId, primary: true },
    { actorId: owner.userId },
  );
  const session = await owner.session(),
    other = await outsider.session(),
    adminSession = await admin.session();
  const input = {
    contractId: null,
    fileIds: [],
    sealType: 'official',
    copies: 1,
    external: false,
    returnDueAt: null,
    purpose: 'Draft attachment source',
    contact: 'Owner contact',
    requestKey: 'http-create',
  };
  expect((await testApp.request('/sealRequests')).status).toBe(401);
  expect(
    (
      await session.fetch(
        '/sealRequests',
        write('POST', { ...input, actorId: outsider.userId }),
      )
    ).status,
  ).toBe(400);
  const response = await session.fetch('/sealRequests', write('POST', input));
  expect(response.status).toBe(200);
  const body = (await response.json()) as {
    data: {
      id: string;
      applicantId: string;
      applicant: { id: string; name: string };
    };
  };
  expect(body.data.applicant).toEqual({
    id: owner.userId,
    name: 'Seal HTTP owner',
  });
  const id = body.data.id;
  expect([403, 404]).toContain(
    (await other.fetch(`/sealRequests/${id}`)).status,
  );
  const form = () => {
    const f = new FormData();
    f.set('requestKey', 'private-upload');
    f.set(
      'file',
      new File(['%PDF-1.4\nprivate actual source'], 'source.pdf', {
        type: 'application/pdf',
      }),
    );
    return f;
  };
  const uploaded = await session.fetch(`/sealRequests/${id}/files`, {
    method: 'POST',
    headers: { origin: ORIGIN },
    body: form(),
  });
  expect(uploaded.status).toBe(200);
  const file = ((await uploaded.json()) as { data: { id: string } }).data;
  expect(
    await db
      .repository('auditLogs')
      .count({ filter: { targetId: file.id, action: 'seal.file.upload' } }),
  ).toBe(1);
  const before = await session.fetch(`/sealRequests/${id}`);
  const draft = (
    (await before.json()) as { data: { record: { lifecycleVersion: number } } }
  ).data.record;
  const edited = await session.fetch(
    `/sealRequests/${id}`,
    write('PUT', {
      ...input,
      requestKey: 'associate-upload',
      fileIds: [file.id],
      expectedVersion: draft.lifecycleVersion,
    }),
  );
  expect(edited.status).toBe(200);
  const content = await session.fetch(
    `/sealRequests/${id}/files/${file.id}/content`,
  );
  expect(content.status).toBe(200);
  expect(await content.text()).toBe('%PDF-1.4\nprivate actual source');
  expect(content.headers.get('cache-control')).toBe('private, no-store');
  expect([403, 404]).toContain(
    (await other.fetch(`/sealRequests/${id}/files/${file.id}/content`)).status,
  );
  await org.addDutyRoleMember('admin', admin.userId, { actorId: owner.userId });
  const instance = {
    requestKey: 'http-seal-create',
    code: 'HTTP-SEAL',
    name: 'Real seal receipt',
    sealType: 'official',
    active: true,
    reason: 'Physical receipt verified',
  };
  expect(
    (await adminSession.fetch('/seals', write('POST', instance))).status,
  ).toBe(200);
  await grantToUser(
    testApp,
    'seal-retain-manage',
    [
      {
        resource: { type: 'composite', id: 'oa.seals' },
        actions: [
          {
            action: 'manage',
            policy: { type: 'composite', scopes: { seals: 'allRecords' } },
          },
        ],
      },
    ],
    admin.userId,
  );
  await org.removeDutyRoleMember('admin', admin.userId, {
    actorId: owner.userId,
  });
  expect(
    (await adminSession.fetch('/seals', write('POST', instance))).status,
  ).toBe(403);
  const document = await c.resolve(apiDocsToken).getDocument();
  expect(findApiDocumentSchemaProblems(document)).toEqual([]);
  expect(
    findUndeclaredApiRoutes(testApp.application).filter((r) =>
      JSON.stringify(r).includes('seal'),
    ),
  ).toEqual([]);
  expect(
    document.paths?.['/api/sealRequests/{id}/actualReturn']?.post?.operationId,
  ).toBe('confirmExceptionalSealReturn');
  const set = await authz.permissionSets.get('oa-seals-employee');
  expect(set).toBeTruthy();
});
