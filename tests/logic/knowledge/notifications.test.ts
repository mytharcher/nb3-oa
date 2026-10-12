// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect, vi } from 'vitest';
import { databaseManagerToken, type RepositoryPolicy } from '@nocobase/db';
import { notificationServiceToken } from '@nocobase/app-plugin-notification';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import {
  createKnowledgeNotifications,
  knowledgeNoticeAccess,
} from '../../../server/providers/knowledge/notifications.js';
import { createKnowledgeService } from '../../../server/providers/knowledge/service.js';
import { knowledgeServiceToken } from '../../../server/providers/knowledge/contract.js';
import { announcementServiceToken } from '../../../server/providers/announcements/contract.js';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { orgServiceToken } from '../../../server/providers/org/contract.js';
import { employeeServiceToken } from '../../../server/providers/employees/contract.js';
import { serverFileRepositoryManagerToken } from '@nocobase/app-plugin-file/server';
import { driveManagerToken } from '@nocobase/app-server/drive';
import { createEmployee } from '../employees/helpers.js';
import { write } from '../platform/helpers.js';
import { notificationTest as test } from './helpers.js';

const full: RepositoryPolicy = {
  read: true,
  create: true,
  update: true,
  delete: false,
};
async function fixture(testApp: Parameters<typeof createEmployee>[0]) {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken);
  const publisher = await createEmployee(testApp, 'Policy publisher');
  const reader = await createEmployee(testApp, 'Policy reader');
  const knowledge = c.resolve(knowledgeServiceToken),
    announcements = c.resolve(announcementServiceToken);
  const input = {
    actorId: publisher.userId,
    requestKey: randomUUID(),
    title: 'Private policy title',
    folderId: null,
    departmentIds: [],
    dutyRoleCodes: [] as string[],
    kind: 'markdown' as const,
    markdown: 'Private policy content',
  };
  const doc = await db.transaction((tx) =>
    knowledge.save(input, tx, full, full, full),
  );
  const publish = async () => {
    const draft = await db.transaction((tx) =>
      announcements.save(
        {
          actorId: publisher.userId,
          requestId: randomUUID(),
          title: 'Policy announcement',
          body: 'Review this policy',
          audience: { all: true, departmentIds: [], dutyRoleCodes: [] },
          requiresConfirmation: false,
          pinned: false,
          attachments: [],
          validFrom: '2020-01-01T00:00:00Z',
          validUntil: '2035-01-01T00:00:00Z',
          knowledgeDocumentId: doc.id,
        },
        tx,
        full,
        full,
      ),
    );
    return db.transaction((tx) =>
      announcements.act(
        {
          actorId: publisher.userId,
          requestId: randomUUID(),
          id: draft.id,
          expectedVersion: draft.version,
          action: 'publish',
        },
        tx,
        full,
        full,
      ),
    );
  };
  const announcement = await publish();
  return {
    c,
    db,
    publisher,
    reader,
    input,
    doc,
    announcement,
    announcements,
    publish,
  };
}

test('main HTTP update submits only safe in-app notice, durable replay creates one outbox', async ({
  testApp,
}) => {
  const f = await fixture(testApp),
    authz = f.c.resolve(authorizationToken);
  await f.c
    .resolve(organizationServiceToken)
    .addDutyRoleMember('admin', f.publisher.userId, {
      actorId: f.publisher.userId,
    });
  const session = await f.publisher.session(),
    notification = f.c.resolve(notificationServiceToken);
  const send = vi.spyOn(notification, 'send');
  try {
    const body = {
      ...f.input,
      actorId: undefined,
      requestKey: randomUUID(),
      id: f.doc.id,
      expectedVersion: 1,
      markdown: 'Version two',
    };
    delete body.actorId;
    const response = await session.fetch(
      '/knowledge/documents',
      write('POST', body),
    );
    expect(response.status).toBe(200);
    const updated = (await response.json()).data;
    await vi.waitFor(
      async () => {
        const row = await f.db
          .repository('knowledgeVersionNotices')
          .findOne({ filter: { id: updated.latestVersionId } });
        expect(row?.status).toBe('notified');
      },
      { timeout: 10000 },
    );
    const calls = send.mock.calls.filter(
      ([request]) => request.source?.referenceId === updated.latestVersionId,
    );
    expect(calls.length).toBeGreaterThanOrEqual(2);
    expect(new Set(calls.map(([request]) => request.idempotencyKey)).size).toBe(
      calls.length,
    );
    for (const [request] of calls) {
      expect(Object.keys(request.messages)).toEqual(['inbox']);
      expect(request.messages.inbox).toMatchObject({
        target: { type: 'route', path: `/knowledge/${f.doc.id}` },
      });
      expect(JSON.stringify(request)).not.toContain('Private policy');
      expect(JSON.stringify(request)).not.toContain('Version two');
    }
    const key = `oa.knowledge.version:${updated.latestVersionId}:${f.reader.userId}`;
    await vi.waitFor(
      async () => {
        const state = await notification.getByIdempotencyKey(key);
        expect(state?.terminal).toBe(true);
        expect(state?.summary.accepted).toBe(1);
      },
      { timeout: 10000 },
    );
    const delivered = await notification.getByIdempotencyKey(key);
    const readerSession = await f.reader.session();
    const inboxResponse = await readerSession.fetch(
      '/notificationInApp/messages?pageSize=100',
    );
    expect(inboxResponse.status).toBe(200);
    const inbox = (await inboxResponse.json()).data;
    const linked = inbox.filter(
      (message: { notificationId: string }) =>
        message.notificationId === delivered?.notificationId,
    );
    expect(linked).toHaveLength(1);
    expect(linked[0]).toMatchObject({
      target: { type: 'route', path: `/knowledge/${f.doc.id}` },
    });
    expect(linked[0].body).not.toContain('Private policy');
    expect(linked[0].body).not.toContain('Version two');
    expect(
      (await session.fetch('/knowledge/documents', write('POST', body))).status,
    ).toBe(200);
    expect(
      await f.db
        .repository('knowledgeVersionNotices')
        .count({ filter: { id: updated.latestVersionId } }),
    ).toBe(1);
    await authz.permissionSets.update('oa-knowledge-admin', {
      key: 'oa-knowledge-admin',
      grants: [],
    });
    expect(
      (await session.fetch('/knowledge/documents', write('POST', body))).status,
    ).toBe(403);
  } finally {
    send.mockRestore();
  }
});

test('durable outbox deduplicates linked announcements, freezes recipients, retries partial send and survives redispatch', async ({
  testApp,
}) => {
  const f = await fixture(testApp);
  await f.publish();
  const accepted = new Set<string>(),
    attempts: string[] = [];
  let failOnce = true;
  let clock = Date.now();
  let genericBody = 'Original generic body';
  const observedBodies: string[] = [];
  const notices = createKnowledgeNotifications({
    db: f.db,
    announcements: () => f.announcements,
    knowledge: () => f.c.resolve(knowledgeServiceToken),
    dispatcher: { dispatch: async () => {} },
    now: () => new Date(clock),
    delivery: async () => ({
      channel: 'inbox',
      locale: 'en-US',
      title: 'Generic title',
      body: genericBody,
    }),
    access: async () => ({ announcement: full, knowledge: full }),
    send: async (userId, _documentId, _versionId, key, delivery) => {
      attempts.push(userId);
      observedBodies.push(delivery.body);
      if (userId === f.reader.userId && failOnce) {
        failOnce = false;
        throw new Error('temporary inbox failure');
      }
      accepted.add(key);
    },
  });
  await f.db.transaction((tx) =>
    notices.enqueue(f.doc.id, 'version-notice-test', f.publisher.userId, tx),
  );
  genericBody = 'Updated deployment copy';
  const later = await createEmployee(testApp, 'Joined after publication');
  const runs = await notices.runtime.listEffectRuns({
    recordId: 'version-notice-test',
  });
  expect(runs).toHaveLength(1);
  await notices.runtime.runEffect(runs[0].id);
  expect(
    (
      await notices.runtime.listEffectRuns({ recordId: 'version-notice-test' })
    )[0].status,
  ).toBe('queued');
  // Advance the injected clock past SDK backoff; the same durable run retries.
  clock += 6000;
  await notices.runtime.runEffect(runs[0].id);
  await notices.runtime.runEffect(runs[0].id);
  const roster = await f.db
    .repository<{ targets: { userIds: string[] }[] }>('knowledgeVersionNotices')
    .findOne({ filter: { id: 'version-notice-test' } });
  const expected = new Set(roster!.targets.flatMap((target) => target.userIds));
  expect(accepted.size).toBe(expected.size);
  expect(attempts).not.toContain(later.userId);
  expect(new Set(observedBodies)).toEqual(new Set(['Original generic body']));
  const row = await f.db
    .repository('knowledgeVersionNotices')
    .findOne({ filter: { id: 'version-notice-test' } });
  expect(row?.status).toBe('notified');
});

test('rollback leaves no outbox/effect and current audience, announcement denial, departed employees and empty targets fail closed', async ({
  testApp,
}) => {
  const f = await fixture(testApp),
    sends: string[] = [];
  let denied = false;
  const notices = createKnowledgeNotifications({
    db: f.db,
    announcements: () => f.announcements,
    knowledge: () => f.c.resolve(knowledgeServiceToken),
    dispatcher: { dispatch: async () => {} },
    access: async () => ({
      announcement: denied ? { ...full, read: false } : full,
      knowledge: full,
    }),
    send: async (userId) => {
      sends.push(userId);
    },
  });
  const service = createKnowledgeService({
    db: f.db,
    audit: f.c.resolve(auditServiceToken),
    org: f.c.resolve(orgServiceToken),
    employees: f.c.resolve(employeeServiceToken),
    files: f.c.resolve(serverFileRepositoryManagerToken),
    drive: f.c.resolve(driveManagerToken),
    notices,
  });
  const beforeEffects = await f.db
    .repository('oaLifecycleEffectRuns')
    .count({ filter: { lifecycle: 'oa.knowledgeVersionNotice' } });
  await expect(
    f.db.transaction(async (tx) => {
      await service.save(
        {
          ...f.input,
          id: f.doc.id,
          expectedVersion: 1,
          requestKey: randomUUID(),
        },
        tx,
        full,
        full,
        full,
      );
      throw new Error('caller rollback');
    }),
  ).rejects.toThrow('caller rollback');
  expect(
    await f.db
      .repository('knowledgeVersionNotices')
      .count({ filter: { documentId: f.doc.id } }),
  ).toBe(0);
  expect(
    await f.db
      .repository('oaLifecycleEffectRuns')
      .count({ filter: { lifecycle: 'oa.knowledgeVersionNotice' } }),
  ).toBe(beforeEffects);
  expect(
    await f.db
      .repository('knowledgeVersions')
      .count({ filter: { documentId: f.doc.id } }),
  ).toBe(1);
  await f.db.transaction((tx) =>
    notices.enqueue(f.doc.id, 'denied-notice', f.publisher.userId, tx),
  );
  denied = true;
  let run = (
    await notices.runtime.listEffectRuns({ recordId: 'denied-notice' })
  )[0];
  await notices.runtime.runEffect(run.id);
  expect(sends).toEqual([]);
  denied = false;
  await f.db.transaction((tx) =>
    service.save(
      {
        ...f.input,
        id: f.doc.id,
        expectedVersion: 1,
        requestKey: randomUUID(),
        dutyRoleCodes: ['hr'],
      },
      tx,
      full,
      full,
      full,
    ),
  );
  run = (
    await notices.runtime.listEffectRuns({
      lifecycle: 'oa.knowledgeVersionNotice',
    })
  ).find((r) => r.recordId !== 'denied-notice')!;
  await notices.runtime.runEffect(run.id);
  expect(sends).toEqual([]);
  // Restore an all-employee document so absence is caused by active status,
  // rather than being masked by the prior restricted audience.
  const restored = await f.db.transaction((tx) =>
    service.save(
      {
        ...f.input,
        id: f.doc.id,
        expectedVersion: 2,
        requestKey: randomUUID(),
      },
      tx,
      full,
      full,
      full,
    ),
  );
  await f.db.repository('employees').updateMany({
    filter: { userId: f.reader.userId },
    values: { active: false },
  });
  run = (
    await notices.runtime.listEffectRuns({ recordId: restored.latestVersionId })
  )[0];
  await notices.runtime.runEffect(run.id);
  expect(sends).toContain(f.publisher.userId);
  expect(sends).not.toContain(f.reader.userId);
  sends.length = 0;
  await f.db.transaction((tx) =>
    notices.enqueue(f.doc.id, 'revoked-announcement', f.publisher.userId, tx),
  );
  await f.db.transaction((tx) =>
    f.announcements.act(
      {
        actorId: f.publisher.userId,
        requestId: randomUUID(),
        id: f.announcement.id,
        expectedVersion: f.announcement.version,
        action: 'revoke',
      },
      tx,
      full,
    ),
  );
  run = (
    await notices.runtime.listEffectRuns({ recordId: 'revoked-announcement' })
  )[0];
  await notices.runtime.runEffect(run.id);
  expect(sends).toEqual([]);
  await f.db.transaction((tx) =>
    notices.enqueue(
      'unlinked-document',
      'empty-notice',
      f.publisher.userId,
      tx,
    ),
  );
  expect(
    await f.db
      .repository('knowledgeVersionNotices')
      .exists({ filter: { id: 'empty-notice' } }),
  ).toBe(false);
});

test('fresh actual main permission-set revocation removes previously frozen recipients', async ({
  testApp,
}) => {
  const f = await fixture(testApp),
    authz = f.c.resolve(authorizationToken),
    sent: string[] = [];
  const notices = createKnowledgeNotifications({
    db: f.db,
    announcements: () => f.announcements,
    knowledge: () => f.c.resolve(knowledgeServiceToken),
    dispatcher: { dispatch: async () => {} },
    access: (userId) => knowledgeNoticeAccess(authz, userId),
    send: async (userId) => {
      sent.push(userId);
    },
  });
  await f.db.transaction((tx) =>
    notices.enqueue(f.doc.id, 'actual-revoked', f.publisher.userId, tx),
  );
  expect(await knowledgeNoticeAccess(authz, f.reader.userId)).toBeDefined();
  const original = await authz.permissionSets.get('oa-knowledge-employee');
  if (!original) throw new Error('Missing main knowledge default permission');
  await authz.permissionSets.update(original.key, { ...original, grants: [] });
  expect(await knowledgeNoticeAccess(authz, f.reader.userId)).toBeUndefined();
  const run = (
    await notices.runtime.listEffectRuns({ recordId: 'actual-revoked' })
  )[0];
  await notices.runtime.runEffect(run.id);
  expect(sent).toEqual([]);
  await authz.permissionSets.update(original.key, original);
  // Already settled runs never retroactively send after a grant is restored.
  await notices.runtime.runEffect(run.id);
  expect(sent).toEqual([]);
  // Ordinary view restored, but the announcement collection scope can independently deny.
  const annOriginal = await authz.permissionSets.get(
    'oa-announcements-employee',
  );
  if (!annOriginal)
    throw new Error('Missing main announcement default permission');
  await f.db.transaction((tx) =>
    notices.enqueue(f.doc.id, 'announcement-revoked', f.publisher.userId, tx),
  );
  await authz.permissionSets.update(annOriginal.key, {
    ...annOriginal,
    grants: [],
  });
  const next = (
    await notices.runtime.listEffectRuns({ recordId: 'announcement-revoked' })
  )[0];
  await notices.runtime.runEffect(next.id);
  expect(sent).toEqual([]);
  await authz.permissionSets.update(annOriginal.key, annOriginal);
});
