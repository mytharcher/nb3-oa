// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect } from 'vitest';
import { databaseManagerToken, type RepositoryPolicy } from '@nocobase/db';
import { serverFileRepositoryManagerToken } from '@nocobase/app-plugin-file/server';
import { driveManagerToken } from '@nocobase/app-server/drive';
import {
  knowledgeServiceToken,
  KNOWLEDGE_DOCUMENT_FIELDS,
} from '../../../server/providers/knowledge/contract.js';
import { createKnowledgeService } from '../../../server/providers/knowledge/service.js';
import { employeeServiceToken } from '../../../server/providers/employees/contract.js';
import { orgServiceToken } from '../../../server/providers/org/contract.js';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
import { createEmployee } from '../employees/helpers.js';
import { createUser } from '../platform/helpers.js';
import { test } from './helpers.js';
const full: RepositoryPolicy = {
  read: true,
  create: true,
  update: true,
  delete: false,
};
test('immutable revisions, durable commands, concurrent CAS and tree cycle; rollback includes audit', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    s = c.resolve(knowledgeServiceToken),
    e = await createEmployee(testApp, 'Knowledge author');
  const folder = await db.transaction((tx) =>
    s.saveFolder(
      {
        actorId: e.userId,
        requestKey: randomUUID(),
        title: 'Policies',
        parentId: null,
      },
      tx,
      full,
    ),
  );
  const child = await db.transaction((tx) =>
    s.saveFolder(
      {
        actorId: e.userId,
        requestKey: randomUUID(),
        title: 'Child',
        parentId: folder.id,
      },
      tx,
      full,
    ),
  );
  await expect(
    db.transaction((tx) =>
      s.saveFolder(
        {
          actorId: e.userId,
          requestKey: randomUUID(),
          id: folder.id,
          expectedVersion: 1,
          title: folder.title,
          parentId: child.id,
        },
        tx,
        full,
      ),
    ),
  ).rejects.toThrow('FOLDER_CYCLE');
  const input = {
    actorId: e.userId,
    requestKey: randomUUID(),
    title: '制度',
    folderId: folder.id,
    departmentIds: [],
    dutyRoleCodes: [],
    kind: 'markdown' as const,
    markdown: 'Version one',
  };
  const first = await db.transaction((tx) =>
    s.save(input, tx, full, full, full),
  );
  expect(
    (await db.transaction((tx) => s.save(input, tx, full, full, full))).id,
  ).toBe(first.id);
  await expect(
    db.transaction((tx) =>
      s.save({ ...input, markdown: 'different' }, tx, full, full, full),
    ),
  ).rejects.toThrow('COMMAND_CONFLICT');
  const race = await Promise.allSettled(
    ['two', 'three'].map((markdown) =>
      db.transaction((tx) =>
        s.save(
          {
            ...input,
            requestKey: randomUUID(),
            id: first.id,
            expectedVersion: 1,
            markdown,
          },
          tx,
          full,
          full,
          full,
        ),
      ),
    ),
  );
  expect(race.filter((v) => v.status === 'fulfilled')).toHaveLength(1);
  expect(race.filter((v) => v.status === 'rejected')).toHaveLength(1);
  await expect(
    db.transaction((tx) =>
      s.save(
        input,
        tx,
        { read: true, create: false, update: false, delete: false },
        full,
        full,
      ),
    ),
  ).rejects.toThrow('ACCESS_DENIED');
  const countBefore = await db.repository('knowledgeDocuments').count();
  await expect(
    db.transaction((tx) =>
      s.save(
        { ...input, requestKey: randomUUID() },
        tx,
        full,
        { read: true, create: false, update: false, delete: false },
        full,
      ),
    ),
  ).rejects.toThrow();
  expect(await db.repository('knowledgeDocuments').count()).toBe(countBefore);
  await expect(
    db.transaction((tx) =>
      s.save({ ...input, requestKey: randomUUID() }, tx, full, full, {
        read: {
          scope: { id: 'hidden' },
          fields: ['id', 'parentId', 'title', 'version'],
        },
        create: false,
        update: false,
        delete: false,
      }),
    ),
  ).rejects.toThrow('ACCESS_DENIED');
  const noArchive = await createUser(testApp, 'Not yet an employee');
  await expect(
    db.transaction((tx) =>
      s.detail(first.id, noArchive.user.id, tx, full, full),
    ),
  ).rejects.toThrow('ACCESS_DENIED');
  const detail = await db.transaction((tx) =>
    s.detail(first.id, e.userId, tx, full, full),
  );
  expect(detail.document.version).toBe(2);
  expect(detail.versions).toHaveLength(2);
  expect(detail.versions.find((v) => v.version === 1)?.markdown).toBe(
    'Version one',
  );
  const narrow: RepositoryPolicy = {
    create: false,
    update: false,
    delete: false,
    read: {
      scope: true,
      fields: [
        'id',
        'documentId',
        'version',
        'kind',
        'fileId',
        'authorId',
        'createdAt',
      ],
    },
  };
  await expect(
    db.transaction((tx) => s.detail(first.id, e.userId, tx, full, narrow)),
  ).rejects.toThrow('ACCESS_DENIED');
  const docNarrow: RepositoryPolicy = {
    create: false,
    update: false,
    delete: false,
    read: {
      scope: true,
      fields: KNOWLEDGE_DOCUMENT_FIELDS.filter((f) => f !== 'departmentIds'),
    },
  };
  await expect(
    db.transaction((tx) => s.detail(first.id, e.userId, tx, docNarrow, full)),
  ).rejects.toThrow('ACCESS_DENIED');
  const before = await db
    .repository('knowledgeVersions')
    .count({ filter: { documentId: first.id } });
  const broken = createKnowledgeService({
    db,
    files: c.resolve(serverFileRepositoryManagerToken),
    drive: c.resolve(driveManagerToken),
    org: c.resolve(orgServiceToken),
    employees: c.resolve(employeeServiceToken),
    audit: {
      ...c.resolve(auditServiceToken),
      record: async () => {
        throw new Error('audit unavailable');
      },
    },
  });
  await expect(
    db.transaction((tx) =>
      broken.save(
        {
          ...input,
          requestKey: randomUUID(),
          id: first.id,
          expectedVersion: 2,
          markdown: 'must rollback',
        },
        tx,
        full,
        full,
        full,
      ),
    ),
  ).rejects.toThrow('audit unavailable');
  expect(
    await db
      .repository('knowledgeVersions')
      .count({ filter: { documentId: first.id } }),
  ).toBe(before);
  expect(
    (await db.transaction((tx) => s.detail(first.id, e.userId, tx, full, full)))
      .document.version,
  ).toBe(2);
});
test('current audience protects historical bytes and announcement snapshot; upload replay and fields', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    s = c.resolve(knowledgeServiceToken),
    owner = await createEmployee(testApp, 'Knowledge uploader'),
    other = await createEmployee(testApp, 'Knowledge outsider');
  const key = randomUUID(),
    file = new File(['safe text'], 'guide.txt', { type: 'text/plain' }),
    uploaded = await s.upload(owner.userId, file, key);
  expect((await s.upload(owner.userId, file, key)).id).toBe(uploaded.id);
  await expect(
    s.upload(
      owner.userId,
      new File(['changed'], 'guide.txt', { type: 'text/plain' }),
      key,
    ),
  ).rejects.toThrow('COMMAND_CONFLICT');
  await expect(
    s.upload(
      owner.userId,
      new File(['<script>'], 'bad.svg', { type: 'image/svg+xml' }),
      randomUUID(),
    ),
  ).rejects.toThrow('INVALID_FILE');
  const input = {
    actorId: owner.userId,
    requestKey: randomUUID(),
    title: 'Guide',
    folderId: null,
    departmentIds: [],
    dutyRoleCodes: [],
    kind: 'file' as const,
    fileId: uploaded.id,
  };
  const doc = await db.transaction((tx) => s.save(input, tx, full, full, full));
  expect(
    (
      await db.transaction((tx) =>
        s.content(doc.id, doc.latestVersionId, owner.userId, tx, full, full),
      )
    ).bytes.toString(),
  ).toBe('safe text');
  await expect(
    db.transaction((tx) =>
      s.content(doc.id, doc.latestVersionId, owner.userId, tx, full, {
        create: false,
        update: false,
        delete: false,
        read: { scope: true, fields: ['id', 'documentId'] },
      }),
    ),
  ).rejects.toThrow('ACCESS_DENIED');
  const next = await db.transaction((tx) =>
    s.save(
      {
        ...input,
        id: doc.id,
        expectedVersion: 1,
        requestKey: randomUUID(),
        kind: 'markdown',
        fileId: undefined,
        markdown: 'Current private version',
        dutyRoleCodes: ['admin'],
      },
      tx,
      full,
      full,
      full,
    ),
  );
  await expect(
    db.transaction((tx) =>
      s.content(doc.id, doc.latestVersionId, other.userId, tx, full, full),
    ),
  ).rejects.toThrow('ACCESS_DENIED');
  expect(
    await db.transaction((tx) =>
      s.compareAnnouncementVersion(
        {
          documentId: doc.id,
          versionId: doc.latestVersionId,
          actorId: other.userId,
        },
        tx,
        full,
      ),
    ),
  ).toEqual({ visible: false, hasNewVersion: false });
  expect(next.version).toBe(2);
});
