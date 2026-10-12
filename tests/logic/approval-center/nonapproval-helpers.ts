// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { databaseManagerToken } from '@nocobase/db';
import { workItemServiceToken } from '../../../server/providers/work-items/index.js';
import { announcementServiceToken } from '../../../server/providers/announcements/index.js';
import {
  createEmployee,
  grantToUser,
  composite,
} from '../employees/helpers.js';
export async function prepareNonApprovalCenter(
  testApp: Parameters<typeof createEmployee>[0],
) {
  const creator = await createEmployee(testApp, 'Center task publisher');
  const reader = await createEmployee(testApp, 'Center task recipient');
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken);
  const work = c.resolve(workItemServiceToken),
    announcements = c.resolve(announcementServiceToken);
  const input = {
    actorId: creator.userId,
    requestId: randomUUID(),
    title: 'Center ordinary duty',
    description: 'Private ordinary result',
    targetUserId: reader.userId,
    dutyRoleCode: null,
    dueAt: new Date(Date.now() + 86400000).toISOString(),
    requiresConfirmation: true,
    attachments: [],
  };
  const draft = await db.transaction((tx) => work.save(input, tx));
  const item = await db.transaction((tx) =>
    work.act(
      {
        actorId: creator.userId,
        requestId: randomUUID(),
        id: draft.id,
        expectedVersion: draft.version,
        action: 'dispatch',
      },
      tx,
    ),
  );
  const notice = await db.transaction((tx) =>
    announcements.save(
      {
        actorId: creator.userId,
        requestId: randomUUID(),
        title: 'Center personal receipt',
        body: 'Private announcement body',
        audience: { all: true, departmentIds: [], dutyRoleCodes: [] },
        requiresConfirmation: true,
        pinned: false,
        attachments: [],
        validFrom: new Date(Date.now() - 60000).toISOString(),
        validUntil: new Date(Date.now() + 86400000).toISOString(),
      },
      tx,
    ),
  );
  const published = await db.transaction((tx) =>
    announcements.act(
      {
        actorId: creator.userId,
        requestId: randomUUID(),
        id: notice.id,
        expectedVersion: notice.version,
        action: 'publish',
      },
      tx,
    ),
  );
  const permissionKey = `center-nonapproval-${reader.userId}`;
  await grantToUser(
    testApp,
    permissionKey,
    [
      composite('oa.workItems', {
        view: { workItems: 'allRecords' },
        complete: { workItems: 'oa.workItemsReadable' },
      }),
      composite('oa.announcements', {
        view: { announcements: 'oa.announcementsReadable' },
        confirm: { announcements: 'oa.announcementsReadable' },
      }),
    ],
    reader.userId,
  );
  return {
    creator,
    reader,
    item,
    published,
    db,
    work,
    announcements,
    permissionKey,
  };
}
