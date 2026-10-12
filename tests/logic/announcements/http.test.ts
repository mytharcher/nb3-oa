// @vitest-environment node
import type { AuthorizationCheckRequest } from '@nocobase/authorization/core';
import { randomUUID } from 'node:crypto';
import { expect, vi } from 'vitest';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
import { databaseManagerToken } from '@nocobase/db';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import {
  apiDocsToken,
  findUndeclaredApiRoutes,
  findApiDocumentSchemaProblems,
} from '@nocobase/app-server/router';
import { createPlatformAppTest, write } from '../platform/helpers.js';
import {
  createEmployee,
  grantToUser,
  composite,
} from '../employees/helpers.js';
const test = createPlatformAppTest();
async function grant(
  testApp: Parameters<typeof createEmployee>[0],
  userId: string,
  actions: string[],
  scope = 'oa.announcementsOwned',
) {
  await grantToUser(
    testApp,
    randomUUID(),
    [
      composite(
        'oa.announcements',
        Object.fromEntries(
          actions.map((action) => [
            action,
            {
              announcements: scope,
              ...(action === 'receipts'
                ? { announcementReceipts: 'oa.announcementRosterOwned' }
                : {}),
            },
          ]),
        ),
      ),
    ],
    userId,
  );
}
test('main API refuses anonymous, ungranted and foreign actors; freezes receipt visibility and declares Swagger', async ({
  testApp,
}) => {
  const authz = testApp.application.container.resolve(authorizationToken);
  for (const assignment of await authz.permissionSets.listAssignments(
    'oa-announcements-employee',
  ))
    await authz.permissionSets.revoke(assignment.id);
  const publisher = await createEmployee(testApp, 'Announcement API publisher'),
    reader = await createEmployee(testApp, 'Announcement API reader'),
    foreign = await createEmployee(testApp, 'Announcement API foreign'),
    ps = await publisher.session(),
    rs = await reader.session(),
    fs = await foreign.session();
  expect((await testApp.request('/announcements')).status).toBe(401);
  expect((await rs.fetch('/announcements')).status).toBe(403);
  expect((await rs.fetch('/announcements?page=bad')).status).toBe(403);
  expect((await rs.fetch('/announcements', write('POST', {}))).status).toBe(
    403,
  );
  expect((await rs.fetch('/announcements/context')).status).toBe(403);
  await grant(testApp, publisher.userId, [
    'view',
    'create',
    'edit',
    'publish',
    'revoke',
    'remind',
    'receipts',
  ]);
  await grant(
    testApp,
    reader.userId,
    ['view', 'confirm'],
    'oa.announcementsReadable',
  );
  await grant(
    testApp,
    foreign.userId,
    ['view', 'confirm', 'receipts'],
    'oa.announcementsReadable',
  );
  const context = await rs.fetch('/announcements/context');
  expect(context.status).toBe(200);
  expect((await context.json()).data).toMatchObject({
    timeZone: 'Asia/Shanghai',
    dutyRoles: null,
  });
  const body = {
    requestId: randomUUID(),
    title: 'Public policy',
    body: 'Confirmation requested',
    audience: { all: true, departmentIds: [], dutyRoleCodes: [] },
    requiresConfirmation: true,
    pinned: true,
    attachments: [],
    validFrom: '2026-01-01T00:00:00Z',
    validUntil: '2035-01-01T00:00:00Z',
  };
  expect(
    (
      await ps.fetch(
        '/announcements',
        write('POST', { ...body, actorId: reader.userId }),
      )
    ).status,
  ).toBe(400);
  const created = await ps.fetch('/announcements', write('POST', body));
  expect(created.status).toBe(200);
  const draft = (await created.json()).data;
  expect(draft.publisher).toEqual({
    id: publisher.userId,
    name: 'Announcement API publisher',
  });
  expect((await rs.fetch(`/announcements/${draft.id}`)).status).toBe(404);
  const draftDetail = (
    await (await ps.fetch(`/announcements/${draft.id}`)).json()
  ).data;
  expect(draftDetail.capabilities).toEqual({
    actions: expect.arrayContaining(['edit', 'publish']),
    ownReceipt: null,
  });
  expect(draftDetail.capabilities.actions).not.toContain('confirm');
  const originalFor = authz.for.bind(authz);
  const narrowed = vi.spyOn(authz, 'for').mockImplementation((identity) => {
    const context = originalFor(identity);
    return {
      ...context,
      authorize: (async (check: AuthorizationCheckRequest) => {
        const result = await context.authorize(check);
        if (
          check.resource.type !== 'composite' ||
          check.resource.id !== 'oa.announcements' ||
          check.action !== 'edit' ||
          !result.conditions?.database?.announcements
        )
          return result;
        return {
          ...result,
          conditions: {
            ...result.conditions,
            database: {
              ...result.conditions.database,
              announcements: {
                ...result.conditions.database.announcements,
                update: { scope: true, fields: ['title'] },
              },
            },
          },
        };
      }) as typeof context.authorize,
    };
  });
  const deniedEdit = (
    await (await ps.fetch(`/announcements/${draft.id}`)).json()
  ).data;
  expect(deniedEdit.capabilities.actions).not.toContain('edit');
  expect(deniedEdit.capabilities.actions).toContain('publish');
  expect(
    (
      await ps.fetch(
        `/announcements/${draft.id}`,
        write('PATCH', {
          ...body,
          requestId: randomUUID(),
          expectedVersion: draft.version,
          body: 'Forbidden body',
        }),
      )
    ).status,
  ).toBe(403);
  narrowed.mockRestore();

  const filtered = await ps.fetch(
    '/announcements?mode=mine&q=policy&status=draft&sort=title&direction=asc',
  );
  expect((await filtered.json()).meta.total).toBe(1);
  expect(
    (await (await ps.fetch('/announcements?mode=mine&q=missing')).json()).meta
      .total,
  ).toBe(0);
  const published = await ps.fetch(
    `/announcements/${draft.id}/publish`,
    write('POST', { requestId: randomUUID(), expectedVersion: draft.version }),
  );
  expect(published.status).toBe(200);
  const readerDetail = (
    await (await rs.fetch(`/announcements/${draft.id}`)).json()
  ).data;
  expect(readerDetail.capabilities).toEqual({
    actions: ['confirm'],
    ownReceipt: { status: 'pending', confirmedAt: null },
  });
  expect(
    (
      await (
        await rs.fetch('/announcements?q=policy&sort=validUntil&direction=asc')
      ).json()
    ).meta.total,
  ).toBe(1);
  expect((await rs.fetch('/announcements/pending')).status).toBe(200);
  expect((await rs.fetch(`/announcements/${draft.id}/receipts`)).status).toBe(
    403,
  );
  expect((await fs.fetch(`/announcements/${draft.id}/receipts`)).status).toBe(
    403,
  );
  expect(
    (
      await rs.fetch(
        `/announcements/${draft.id}/confirm`,
        write('POST', { requestId: randomUUID(), actorId: publisher.userId }),
      )
    ).status,
  ).toBe(400);
  const receipt = await rs.fetch(
    `/announcements/${draft.id}/confirm`,
    write('POST', { requestId: randomUUID() }),
  );
  expect(receipt.status).toBe(200);
  const confirmedDetail = (
    await (await rs.fetch(`/announcements/${draft.id}`)).json()
  ).data;
  expect(confirmedDetail.capabilities.ownReceipt.status).toBe('confirmed');
  expect(confirmedDetail.capabilities.actions).not.toContain('confirm');
  expect((await receipt.json()).data.user).toEqual({
    id: reader.userId,
    name: 'Announcement API reader',
  });
  expect((await ps.fetch(`/announcements/${draft.id}/receipts`)).status).toBe(
    200,
  );
  const roster = await ps.fetch(
    `/announcements/${draft.id}/receipts?status=confirmed&q=reader&pageSize=1`,
  );
  expect(roster.status).toBe(200);
  expect(await roster.json()).toMatchObject({
    data: [{ name: 'Announcement API reader', status: 'confirmed' }],
    meta: { total: 1, pageSize: 1, confirmed: 1, pending: 2 },
  });
  expect(
    (await rs.fetch(`/announcements/${draft.id}/receipts?status=pending`))
      .status,
  ).toBe(403);
  const late = await createEmployee(testApp, 'Late notice actor');
  await grant(
    testApp,
    late.userId,
    ['view', 'confirm'],
    'oa.announcementsReadable',
  );
  expect(
    (await (await late.session()).fetch(`/announcements/${draft.id}`)).status,
  ).toBe(404);
  expect(
    (
      await (
        await late.session()
      ).fetch(
        `/announcements/${draft.id}/confirm`,
        write('POST', { requestId: randomUUID() }),
      )
    ).status,
  ).toBe(403);
  expect(
    findUndeclaredApiRoutes(testApp.application).filter((route) =>
      route.path.includes('announcement'),
    ),
  ).toEqual([]);
  const document = await testApp.application.container
    .resolve(apiDocsToken)
    .getDocument();
  expect(findApiDocumentSchemaProblems(document)).toEqual([]);
  expect(
    document.paths?.['/api/announcements/{id}/confirm']?.post?.operationId,
  ).toBe('confirmAnnouncement');
  expect(
    document.paths?.['/api/announcements/{id}/confirm']?.post?.responses?.[
      '400'
    ],
  ).toBeTruthy();
  expect(
    testApp.application.container.resolve(authorizationToken),
  ).toBeTruthy();
});
test('file metadata and byte routes enforce owning draft, selected publication IDs and upload audit rollback', async ({
  testApp,
}) => {
  const { OA_TEST_ORIGIN } = await import('../oa-test-origin.js');
  const publisher = await createEmployee(testApp, 'Notice file owner'),
    reader = await createEmployee(testApp, 'Notice file reader'),
    ps = await publisher.session(),
    rs = await reader.session();
  await grant(testApp, publisher.userId, ['view', 'create', 'edit', 'publish']);
  await grant(testApp, reader.userId, ['view'], 'oa.announcementsReadable');
  const body = {
    requestId: randomUUID(),
    title: 'Attached policy',
    body: 'Read attachment',
    audience: { all: true, departmentIds: [], dutyRoleCodes: [] },
    requiresConfirmation: false,
    pinned: false,
    attachments: [],
    validFrom: '2026-01-01T00:00:00Z',
    validUntil: '2035-01-01T00:00:00Z',
  };
  const response = await ps.fetch('/announcements', write('POST', body));
  expect(response.status).toBe(200);
  const a = (await response.json()).data;
  const upload = async (session: typeof ps, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return session.fetch('/announcementAttachments/uploadOne', {
      method: 'POST',
      headers: { origin: OA_TEST_ORIGIN, 'x-announcement-id': a.id },
      body: form,
    });
  };
  expect(
    (
      await upload(
        rs,
        new File(['%PDF-1.7'], 'foreign.pdf', { type: 'application/pdf' }),
      )
    ).status,
  ).toBe(403);
  expect(
    (
      await upload(
        ps,
        new File(['<script>'], 'bad.pdf', { type: 'application/pdf' }),
      )
    ).status,
  ).toBe(400);
  const first = await upload(
    ps,
    new File(['%PDF-1.7\ncontent'], 'policy.pdf', { type: 'application/pdf' }),
  );
  expect(first.status).toBe(201);
  const file = (await first.json()).data.record,
    url = new URL(file.contentUrl, OA_TEST_ORIGIN).href;
  expect((await testApp.fetch(new Request(url))).status).toBe(401);
  expect((await rs.fetch(url)).status).toBe(403);
  expect((await ps.fetch(url)).status).toBe(200);
  const edit = await ps.fetch(
    `/announcements/${a.id}`,
    write('PATCH', {
      ...body,
      requestId: randomUUID(),
      expectedVersion: a.version,
      attachments: [file.id],
    }),
  );
  expect(edit.status).toBe(200);
  const edited = (await edit.json()).data;
  const audit = testApp.application.container.resolve(auditServiceToken),
    db = testApp.application.container.resolve(databaseManagerToken),
    failed = vi
      .spyOn(audit, 'record')
      .mockRejectedValueOnce(new Error('Audit rollback proof'));
  try {
    const aborted = await upload(
      ps,
      new File(['%PDF-1.7'], 'rollback.pdf', { type: 'application/pdf' }),
    );
    expect(aborted.status).toBe(500);
    expect(
      await db
        .repository('announcementFiles')
        .count({ filter: { announcementId: a.id } }),
    ).toBe(1);
  } finally {
    failed.mockRestore();
  }
  const second = await upload(
    ps,
    new File(['%PDF-1.7\nunselected'], 'unused.pdf', {
      type: 'application/pdf',
    }),
  );
  expect(second.status).toBe(201);
  const unused = (await second.json()).data.record;
  const published = await ps.fetch(
    `/announcements/${a.id}/publish`,
    write('POST', { requestId: randomUUID(), expectedVersion: edited.version }),
  );
  expect(published.status).toBe(200);
  const bytes = await rs.fetch(url);
  expect(bytes.status).toBe(200);
  expect(bytes.headers.get('cache-control')).toBe('private, no-store');
  expect(
    (await rs.fetch(new URL(unused.contentUrl, OA_TEST_ORIGIN).href)).status,
  ).toBe(403);
  expect(
    (
      await upload(
        ps,
        new File(['%PDF-1.7'], 'late.pdf', { type: 'application/pdf' }),
      )
    ).status,
  ).toBe(403);
  const metadata = await rs.fetch('/announcementAttachments/findMany', {
    ...write('POST', { limit: 10 }),
    headers: { ...write('POST').headers, 'x-announcement-id': a.id },
  });
  expect(metadata.status).toBe(200);
  const result = await metadata.json();
  expect(result.data).toHaveLength(1);
  expect(result.data[0]).not.toHaveProperty('key');
  expect(result.data[0]).not.toHaveProperty('disk');
});
test('default admin duty role revocation blocks replay and seed rerun preserves edited grants and revoked assignments', async ({
  testApp,
}) => {
  const { organizationServiceToken } =
    await import('../../../server/providers/org/index.js');
  const { installAnnouncementPermissions } =
    await import('../../../database/main/seeds/202610104111_announcements_permissions.js');
  const c = testApp.application.container,
    org = c.resolve(organizationServiceToken),
    authz = c.resolve(authorizationToken),
    db = c.resolve(databaseManagerToken),
    admin = await createEmployee(testApp, 'Default announcement admin'),
    session = await admin.session();
  await org.addDutyRoleMember('admin', admin.userId, { actorId: admin.userId });
  const body = {
    requestId: randomUUID(),
    title: 'Seed authorized notice',
    body: 'Official information',
    audience: { all: true, departmentIds: [], dutyRoleCodes: [] },
    requiresConfirmation: false,
    pinned: false,
    attachments: [],
    validFrom: '2026-01-01T00:00:00Z',
    validUntil: '2035-01-01T00:00:00Z',
  };
  expect(
    (await session.fetch('/announcements', write('POST', body))).status,
  ).toBe(200);
  await org.removeDutyRoleMember('admin', admin.userId, {
    actorId: admin.userId,
  });
  expect(
    (await session.fetch('/announcements', write('POST', body))).status,
  ).toBe(403);
  const set = (await authz.permissionSets.get('oa-announcements-admin'))!;
  await authz.permissionSets.update('oa-announcements-admin', {
    ...set,
    title: 'Changed administrator title',
    grants: [],
  });
  const employeeAssignments = await authz.permissionSets.listAssignments(
    'oa-announcements-employee',
  );
  for (const a of employeeAssignments) await authz.permissionSets.revoke(a.id);
  await db.transaction((tx) => installAnnouncementPermissions(tx.query));
  expect(
    (await authz.permissionSets.get('oa-announcements-admin'))?.grants,
  ).toEqual([]);
  expect(
    (await authz.permissionSets.get('oa-announcements-admin'))?.title,
  ).toBe('Changed administrator title');
  expect(
    await authz.permissionSets.listAssignments('oa-announcements-employee'),
  ).toHaveLength(0);
});
