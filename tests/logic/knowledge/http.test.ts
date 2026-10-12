// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect } from 'vitest';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { databaseManagerToken } from '@nocobase/db';
import {
  apiDocsToken,
  findUndeclaredApiRoutes,
  findApiDocumentSchemaProblems,
} from '@nocobase/app-server/router';
import { installKnowledgePermissions } from '../../../database/main/seeds/202610104211_knowledge_permissions.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { test } from './helpers.js';
import { createEmployee } from '../employees/helpers.js';
import { createUser, write } from '../platform/helpers.js';
import { knowledgeServiceToken } from '../../../server/providers/knowledge/contract.js';
async function grant(
  testApp: Parameters<typeof createEmployee>[0],
  id: string,
  actions: string[],
) {
  const a = testApp.application.container.resolve(authorizationToken),
    key = randomUUID();
  await a.permissionSets.create({
    key,
    title: 'Knowledge real role',
    grants: [
      {
        resource: { type: 'composite', id: 'oa.knowledgeDocuments' },
        actions: actions.map((action) => ({
          action,
          policy: {
            type: 'composite' as const,
            scopes: {
              knowledgeDocuments: 'allRecords',
              knowledgeVersions: 'allRecords',
            },
          },
        })),
      },
      {
        resource: { type: 'composite', id: 'oa.knowledgeFolders' },
        actions: actions.map((action) => ({
          action,
          policy: {
            type: 'composite' as const,
            scopes: { knowledgeFolders: 'allRecords' },
          },
        })),
      },
    ],
  });
  await a.permissionSets.assign({
    permissionSet: key,
    subject: { type: 'user', id },
  });
  return key;
}
test('default employee/admin roles, actual admin revocation and seed preserves customization', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    authz = c.resolve(authorizationToken),
    org = c.resolve(organizationServiceToken);
  const admin = await createEmployee(
      testApp,
      'Knowledge default administrator',
    ),
    employee = await createEmployee(testApp, 'Knowledge default employee');
  const session = await admin.session(),
    viewer = await employee.session(),
    input = {
      requestKey: randomUUID(),
      title: 'Default policy',
      folderId: null,
      departmentIds: [],
      dutyRoleCodes: [],
      kind: 'markdown',
      markdown: 'default access',
    };
  await org.addDutyRoleMember('admin', admin.userId, { actorId: admin.userId });
  const options = await session.fetch(
    '/knowledge/formOptions?kind=dutyRole&pageSize=2',
  );
  expect(options.status).toBe(200);
  const optionsBody = (await options.json()) as {
    data: {
      canCreate: boolean;
      canEdit: boolean;
      audience: { items: Record<string, unknown>[]; total: number };
      restrictedSelected: number;
    };
  };
  expect(optionsBody.data).toMatchObject({
    canCreate: true,
    canEdit: false,
    restrictedSelected: 0,
  });
  expect(optionsBody.data.audience.items).toHaveLength(2);
  for (const option of optionsBody.data.audience.items)
    expect(Object.keys(option).sort()).toEqual(['id', 'title']);
  expect((await viewer.fetch('/knowledge/formOptions?pageSize=0')).status).toBe(
    403,
  );

  expect(
    (await session.fetch('/knowledge/documents', write('POST', input))).status,
  ).toBe(200);
  expect((await viewer.fetch('/knowledge/documents')).status).toBe(200);
  expect(
    (
      await viewer.fetch(
        '/knowledge/documents',
        write('POST', { ...input, requestKey: randomUUID() }),
      )
    ).status,
  ).toBe(403);
  await org.removeDutyRoleMember('admin', admin.userId, {
    actorId: admin.userId,
  });
  expect((await session.fetch('/knowledge/formOptions')).status).toBe(403);
  expect(
    (await session.fetch('/knowledge/documents', write('POST', input))).status,
  ).toBe(403);
  const set = await authz.permissionSets.get('oa-knowledge-admin');
  if (!set) throw new Error('missing default knowledge admin permissions');
  await authz.permissionSets.update(set.key, {
    ...set,
    title: 'Preserved knowledge title',
    grants: [],
  });
  for (const assignment of await authz.permissionSets.listAssignments(
    'oa-knowledge-employee',
  ))
    await authz.permissionSets.revoke(assignment.id);
  await db.transaction((tx) => installKnowledgePermissions(tx.query));
  expect((await authz.permissionSets.get(set.key))?.title).toBe(
    'Preserved knowledge title',
  );
  expect((await authz.permissionSets.get(set.key))?.grants).toEqual([]);
  expect(
    await authz.permissionSets.listAssignments('oa-knowledge-employee'),
  ).toHaveLength(0);
});
test('real HTTP session/action/field boundary, immutable upload bytes and API document', async ({
  testApp,
}) => {
  const initialAuthz =
    testApp.application.container.resolve(authorizationToken);
  for (const assignment of await initialAuthz.permissionSets.listAssignments(
    'oa-knowledge-employee',
  ))
    await initialAuthz.permissionSets.revoke(assignment.id);
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    s = c.resolve(knowledgeServiceToken),
    owner = await createEmployee(testApp, 'Knowledge manager'),
    viewer = await createEmployee(testApp, 'Knowledge viewer');
  const managerGrant = await grant(testApp, owner.userId, ['view', 'manage']);
  await grant(testApp, viewer.userId, ['view']);
  const editor = await owner.session(),
    reader = await viewer.session(),
    none = await createUser(testApp, 'No knowledge grant');
  expect((await testApp.request('/knowledge/documents')).status).toBe(401);
  expect((await none.fetch('/knowledge/documents')).status).toBe(403);
  const input = {
    requestKey: randomUUID(),
    title: 'UI 政策',
    folderId: null,
    departmentIds: [],
    dutyRoleCodes: [],
    kind: 'markdown',
    markdown: '第一版',
  };
  expect(
    (await reader.fetch('/knowledge/documents', write('POST', input))).status,
  ).toBe(403);
  expect(
    (
      await editor.fetch(
        '/knowledge/documents',
        write('POST', { ...input, actorId: viewer.userId }),
      )
    ).status,
  ).toBe(400);
  const created = await editor.fetch(
    '/knowledge/documents',
    write('POST', input),
  );
  if (created.status !== 200) throw new Error(await created.text());
  const body = (await created.json()) as {
    data: {
      id: string;
      latestVersionId: string;
      owner: { id: string; name: string };
    };
  };
  expect(body.data.owner.id).toBe(owner.userId);

  const editOptions = await editor.fetch(
    `/knowledge/formOptions?documentId=${body.data.id}`,
  );
  expect(editOptions.status).toBe(200);
  expect(await editOptions.json()).toMatchObject({ data: { canEdit: true } });
  const detail = await reader.fetch(`/knowledge/documents/${body.data.id}`);
  expect(detail.status).toBe(200);
  const result = (await detail.json()) as {
    data: {
      versions: Array<{
        markdown: string;
        author: { id: string; name: string };
      }>;
    };
  };
  expect(result.data.versions[0]?.markdown).toBe('第一版');
  expect(result.data.versions[0]?.author.id).toBe(owner.userId);
  const upload = new FormData();
  upload.set(
    'file',
    new File(['public text'], 'knowledge.txt', { type: 'text/plain' }),
  );
  upload.set('requestKey', randomUUID());
  const response = await editor.fetch('/knowledge/files', {
    method: 'POST',
    headers: {
      origin: new URL(
        testApp.application.config.get<{ publicOrigin: string }>('app')
          .publicOrigin,
      ).origin,
    },
    body: upload,
  });
  if (response.status !== 200) throw new Error(await response.text());
  const uploaded = (await response.json()) as { data: { id: string } };
  const doc = await db.transaction((tx) =>
    s.save(
      {
        actorId: owner.userId,
        requestKey: randomUUID(),
        title: 'UI File',
        folderId: null,
        departmentIds: [],
        dutyRoleCodes: [],
        kind: 'file',
        fileId: uploaded.data.id,
      },
      tx,
      { read: true, create: true, update: true, delete: false },
      { read: true, create: true, update: false, delete: false },
      { read: true, create: false, update: false, delete: false },
    ),
  );
  const url = `/knowledge/documents/${doc.id}/versions/${doc.latestVersionId}/content`;
  expect((await testApp.request(url)).status).toBe(401);
  expect((await none.fetch(url)).status).toBe(403);
  const bytes = await reader.fetch(url);
  expect(bytes.status).toBe(200);
  expect(await bytes.text()).toBe('public text');
  expect(bytes.headers.get('x-content-type-options')).toBe('nosniff');
  const metadataUrl = `/knowledge/documents/${doc.id}/versions/${doc.latestVersionId}/file`;
  expect((await none.fetch(metadataUrl)).status).toBe(403);
  const metadata = await reader.fetch(metadataUrl);
  expect(metadata.status).toBe(200);
  const safeFile = (await metadata.json()) as { data: Record<string, unknown> };
  expect(safeFile.data).toMatchObject({
    id: doc.latestVersionId,
    filename: 'knowledge.txt',
    ext: 'txt',
    mimeType: 'text/plain',
    size: 11,
  });
  expect(safeFile.data.contentUrl).toBe(
    `${testApp.publicBasePath}/api/knowledge/documents/${doc.id}/versions/${doc.latestVersionId}/content`,
  );
  expect(Object.keys(safeFile.data).sort()).toEqual(
    ['id', 'filename', 'ext', 'mimeType', 'size', 'contentUrl'].sort(),
  );
  expect(
    (
      await reader.fetch(
        `/knowledge/documents/${body.data.id}/versions/${doc.latestVersionId}/file`,
      )
    ).status,
  ).toBe(400);
  await expect(
    db.transaction((tx) =>
      s.versionFile(
        doc.id,
        doc.latestVersionId,
        viewer.userId,
        tx,
        { read: true, create: false, update: false, delete: false },
        {
          read: { scope: true, fields: ['id', 'documentId', 'kind'] },
          create: false,
          update: false,
          delete: false,
        },
      ),
    ),
  ).rejects.toMatchObject({ code: 'ACCESS_DENIED' });
  const page = await reader.fetch(
    '/knowledge/documents?q=UI&page=1&pageSize=1&orderBy=title%3Aasc',
  );
  expect(page.status).toBe(200);
  const pageResult = (await page.json()) as {
    data: { title: string }[];
    meta: { total: number; page: number; pageSize: number };
  };
  expect(pageResult.data).toHaveLength(1);
  expect(pageResult.meta).toEqual({ total: 2, page: 1, pageSize: 1 });
  expect(pageResult.data[0].title).toBe('UI File');
  const searched = await reader.fetch(
    '/knowledge/documents?q=UI%20File&folderId=root',
  );
  expect(await searched.json()).toMatchObject({
    data: [{ title: 'UI File' }],
    meta: { total: 1 },
  });
  expect((await reader.fetch('/knowledge/documents?pageSize=101')).status).toBe(
    400,
  );
  expect((await none.fetch('/knowledge/documents?pageSize=0')).status).toBe(
    403,
  );

  const authz = c.resolve(authorizationToken),
    set = await authz.permissionSets.get(managerGrant);
  if (!set) throw new Error('Missing knowledge grant');
  await authz.permissionSets.update(managerGrant, {
    ...set,
    grants: set.grants.map((g) => ({
      ...g,
      actions: g.actions.filter((a) => a.action !== 'manage'),
    })),
  });
  expect(
    (await editor.fetch('/knowledge/documents', write('POST', input))).status,
  ).toBe(403);
  const swagger = await c.resolve(apiDocsToken).getDocument();
  expect(findApiDocumentSchemaProblems(swagger)).toEqual([]);
  expect(
    findUndeclaredApiRoutes(testApp.application).filter((r) =>
      JSON.stringify(r).includes('knowledge'),
    ),
  ).toEqual([]);
  expect(
    swagger.paths?.[
      '/api/knowledge/documents/{id}/versions/{versionId}/content'
    ]?.get?.operationId,
  ).toBe('downloadKnowledgeVersion');
});
