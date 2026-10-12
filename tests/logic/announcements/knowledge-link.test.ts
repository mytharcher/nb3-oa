// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect } from 'vitest';
import { databaseManagerToken, type RepositoryPolicy } from '@nocobase/db';
import { createPlatformAppTest, write } from '../platform/helpers.js';
import {
  createEmployee,
  composite,
  grantToUser,
} from '../employees/helpers.js';
import { knowledgeServiceToken } from '../../../server/providers/knowledge/contract.js';

const test = createPlatformAppTest();
const full: RepositoryPolicy = {
  read: true,
  create: true,
  update: true,
  delete: false,
};

test('announcement links expose version updates only while current knowledge visibility allows them', async ({
  testApp,
}) => {
  const publisher = await createEmployee(testApp, 'Linked policy publisher');
  const reader = await createEmployee(testApp, 'Linked policy reader');
  await grantToUser(
    testApp,
    randomUUID(),
    [
      composite('oa.announcements', {
        view: { announcements: 'oa.announcementsOwned' },
        create: { announcements: 'oa.announcementsOwned' },
        publish: { announcements: 'oa.announcementsOwned' },
      }),
    ],
    publisher.userId,
  );
  for (const user of [publisher, reader]) {
    await grantToUser(
      testApp,
      randomUUID(),
      [
        composite('oa.knowledgeDocuments', {
          view: {
            knowledgeDocuments: 'allRecords',
            knowledgeVersions: 'allRecords',
          },
        }),
      ],
      user.userId,
    );
  }
  const db = testApp.application.container.resolve(databaseManagerToken);
  const knowledge = testApp.application.container.resolve(
    knowledgeServiceToken,
  );
  const input = {
    actorId: publisher.userId,
    requestKey: randomUUID(),
    title: 'Private policy title',
    folderId: null,
    departmentIds: [],
    dutyRoleCodes: [] as string[],
    kind: 'markdown' as const,
    markdown: 'Private policy body',
  };
  const first = await db.transaction((tx) =>
    knowledge.save(input, tx, full, full, full),
  );
  const ps = await publisher.session();
  const rs = await reader.session();
  const created = await ps.fetch(
    '/announcements',
    write('POST', {
      requestId: randomUUID(),
      title: 'Policy update',
      body: 'Review the linked document',
      audience: { all: true, departmentIds: [], dutyRoleCodes: [] },
      requiresConfirmation: true,
      pinned: false,
      attachments: [],
      validFrom: '2026-01-01T00:00:00Z',
      validUntil: '2035-01-01T00:00:00Z',
      knowledgeDocumentId: first.id,
    }),
  );
  expect(created.status).toBe(200);
  const draft = (await created.json()).data;
  expect(
    (
      await ps.fetch(
        `/announcements/${draft.id}/publish`,
        write('POST', {
          requestId: randomUUID(),
          expectedVersion: draft.version,
        }),
      )
    ).status,
  ).toBe(200);
  const read = async () => {
    const response = await rs.fetch(`/announcements/${draft.id}`);
    expect(response.status).toBe(200);
    return (await response.json()).data;
  };
  expect((await read()).knowledgeLink.versionId).toBe(first.latestVersionId);
  const second = await db.transaction((tx) =>
    knowledge.save(
      {
        ...input,
        requestKey: randomUUID(),
        id: first.id,
        expectedVersion: first.version,
        markdown: 'Second private body',
      },
      tx,
      full,
      full,
      full,
    ),
  );
  const updated = await read();
  expect(updated.hasNewVersion).toBe(true);
  expect(updated.knowledgeLink.versionId).toBe(first.latestVersionId);
  expect(JSON.stringify(updated)).not.toContain('Second private body');
  await db.transaction((tx) =>
    knowledge.save(
      {
        ...input,
        requestKey: randomUUID(),
        id: second.id,
        expectedVersion: second.version,
        dutyRoleCodes: ['admin'],
      },
      tx,
      full,
      full,
      full,
    ),
  );
  const denied = await read();
  expect(denied.knowledgeLink).toBeNull();
  expect(denied.hasNewVersion).toBe(false);
  expect(JSON.stringify(denied)).not.toContain('Private policy title');
});

test('editing ordinary draft fields preserves a redacted knowledge reference when omitted and allows explicit removal', async ({
  testApp,
}) => {
  const publisher = await createEmployee(testApp, 'Draft link publisher');
  const db = testApp.application.container.resolve(databaseManagerToken),
    knowledge = testApp.application.container.resolve(knowledgeServiceToken);
  const source = await db.transaction((tx) =>
    knowledge.save(
      {
        actorId: publisher.userId,
        requestKey: randomUUID(),
        title: 'Restricted policy name',
        folderId: null,
        departmentIds: [],
        dutyRoleCodes: [],
        kind: 'markdown',
        markdown: 'Private source text',
      },
      tx,
      full,
      full,
      full,
    ),
  );
  await grantToUser(
    testApp,
    randomUUID(),
    [
      composite('oa.announcements', {
        view: { announcements: 'oa.announcementsOwned' },
        create: { announcements: 'oa.announcementsOwned' },
        edit: { announcements: 'oa.announcementsOwned' },
      }),
    ],
    publisher.userId,
  );
  const knowledgeGrant = randomUUID();
  await grantToUser(
    testApp,
    knowledgeGrant,
    [
      composite('oa.knowledgeDocuments', {
        view: {
          knowledgeDocuments: 'allRecords',
          knowledgeVersions: 'allRecords',
        },
      }),
    ],
    publisher.userId,
  );
  const ps = await publisher.session(),
    body = {
      title: 'Ordinary notice',
      body: 'Draft body',
      audience: { all: true, departmentIds: [], dutyRoleCodes: [] },
      requiresConfirmation: false,
      pinned: false,
      attachments: [],
      validFrom: '2026-01-01T00:00:00Z',
      validUntil: '2035-01-01T00:00:00Z',
    };
  const created = await ps.fetch(
    '/announcements',
    write('POST', {
      ...body,
      requestId: randomUUID(),
      knowledgeDocumentId: source.id,
    }),
  );
  expect(created.status).toBe(200);
  const draft = (await created.json()).data;
  const authz = testApp.application.container.resolve(
    (await import('@nocobase/app-plugin-authorization/server'))
      .authorizationToken,
  );
  for (const assignment of await authz.permissionSets.listAssignments(
    knowledgeGrant,
  ))
    await authz.permissionSets.revoke(assignment.id);
  // Default employee knowledge scope cannot expose another department/duty document.
  await db.transaction((tx) =>
    knowledge.save(
      {
        actorId: publisher.userId,
        requestKey: randomUUID(),
        id: source.id,
        expectedVersion: source.version,
        title: 'Restricted policy name',
        folderId: null,
        departmentIds: [],
        dutyRoleCodes: ['admin'],
        kind: 'markdown',
        markdown: 'Private source text',
      },
      tx,
      full,
      full,
      full,
    ),
  );
  const detail = await ps.fetch(`/announcements/${draft.id}`);
  expect(detail.status).toBe(200);
  const redacted = (await detail.json()).data;
  expect(redacted.knowledgeLink).toBeNull();
  expect(JSON.stringify(redacted)).not.toContain('Restricted policy name');
  const edited = await ps.fetch(
    `/announcements/${draft.id}`,
    write('PATCH', {
      ...body,
      title: 'Changed ordinary notice',
      expectedVersion: draft.version,
      requestId: randomUUID(),
    }),
  );
  expect(edited.status).toBe(200);
  const dto = (await edited.json()).data;
  expect(dto.knowledgeLink).toBeNull();
  expect(
    (
      await db
        .repository<{
          knowledgeLink: { documentId: string; versionId: string };
        }>('announcements')
        .findOne({ filter: { id: draft.id } })
    )?.knowledgeLink,
  ).toEqual(
    expect.objectContaining({
      documentId: source.id,
      versionId: source.latestVersionId,
    }),
  );
  const removed = await ps.fetch(
    `/announcements/${draft.id}`,
    write('PATCH', {
      ...body,
      expectedVersion: dto.version,
      requestId: randomUUID(),
      knowledgeDocumentId: null,
    }),
  );
  expect(removed.status).toBe(200);
  expect(
    (
      await db
        .repository<{ knowledgeLink: unknown }>('announcements')
        .findOne({ filter: { id: draft.id } })
    )?.knowledgeLink,
  ).toBeNull();
});
