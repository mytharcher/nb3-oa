// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect, vi } from 'vitest';
import { createAppTest } from '@nocobase/app-testing/server';
import { databaseManagerToken } from '@nocobase/db';
import { inAppNotificationStoreToken } from '@nocobase/app-plugin-notification-in-app/server';
import { createStandaloneServer } from '../../../server/standalone.js';
import { announcementServiceToken } from '../../../server/providers/announcements/contract.js';
import { workItemServiceToken } from '../../../server/providers/work-items/contract.js';
import {
  demoContexts,
  registerDemoUser,
} from '../../../server/providers/demo-data/context.js';
import { notificationLocaleGroups } from '../../../server/providers/approval-notifications/locales.js';
import { createEmployee, ALL } from '../employees/helpers.js';
import {
  OA_TEST_ORIGIN,
  OA_TEST_SERVER,
  OA_TEST_DATABASE_ENV,
} from '../oa-test-origin.js';

const test = createAppTest({
  createServer: createStandaloneServer,
  env: OA_TEST_DATABASE_ENV,
  server: OA_TEST_SERVER,
  config: {
    secrets: { keys: [{ version: 1, key: 'b'.repeat(64) }] },
    app: { publicOrigin: OA_TEST_ORIGIN },
    i18n: { defaultLocale: 'en-US' },
    notification: { channels: { inbox: { type: 'in-app' } } },
    oaApprovals: { inbox: 'inbox' },
  },
});

test('persists Chinese sample announcement and work-item notifications with an English app default', async ({
  testApp,
}) => {
  const c = testApp.application.container;
  const db = c.resolve(databaseManagerToken);
  const publisher = await createEmployee(testApp, 'Locale publisher');
  const chinese = await createEmployee(testApp, 'Chinese sample recipient');
  const english = await createEmployee(testApp, 'English sample recipient');
  for (const [person, locale] of [
    [chinese, 'zh-CN'],
    [english, 'en-US'],
  ] as const) {
    registerDemoUser(person.userId, {
      id: `sample-${locale}`,
      locale,
      baseDate: '2026-10-26',
      users: new Set([person.userId]),
    });
  }
  try {
    expect(
      notificationLocaleGroups(
        [chinese.userId, english.userId, publisher.userId, chinese.userId],
        'en-US',
      ),
    ).toEqual(
      new Map([
        ['zh-CN', [chinese.userId]],
        ['en-US', [english.userId, publisher.userId]],
      ]),
    );
    const announcements = c.resolve(announcementServiceToken);
    const draft = await db.transaction((tx) =>
      announcements.save(
        {
          actorId: publisher.userId,
          requestId: randomUUID(),
          title: 'Bilingual announcement fixture',
          body: 'Review the sample guide.',
          audience: { all: true, departmentIds: [], dutyRoleCodes: [] },
          requiresConfirmation: true,
          pinned: false,
          attachments: [],
          validFrom: new Date(Date.now() - 60000).toISOString(),
          validUntil: new Date(Date.now() + 86400000).toISOString(),
        },
        tx,
        ALL,
        ALL,
      ),
    );
    await db.transaction((tx) =>
      announcements.act(
        {
          actorId: publisher.userId,
          requestId: randomUUID(),
          id: draft.id,
          expectedVersion: draft.version,
          action: 'publish',
        },
        tx,
        ALL,
        ALL,
      ),
    );
    const work = c.resolve(workItemServiceToken);
    const item = await db.transaction((tx) =>
      work.save(
        {
          actorId: publisher.userId,
          requestId: randomUUID(),
          title: 'Chinese sample task',
          description: 'Review the task.',
          targetUserId: chinese.userId,
          dutyRoleCode: null,
          requiresConfirmation: true,
          attachments: [],
          dueAt: new Date(Date.now() + 86400000).toISOString(),
        },
        tx,
        ALL,
      ),
    );
    await db.transaction((tx) =>
      work.act(
        {
          actorId: publisher.userId,
          requestId: randomUUID(),
          id: item.id,
          expectedVersion: item.version,
          action: 'dispatch',
        },
        tx,
        ALL,
      ),
    );
    const inbox = c.resolve(inAppNotificationStoreToken);
    await vi.waitFor(
      async () => {
        const messages = await inbox.list({
          userId: chinese.userId,
          limit: 100,
        });
        expect(messages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              title: '公司公告',
              body: '有公告待查看，请进入应用阅读。',
            }),
            expect.objectContaining({
              title: '协同任务更新',
              body: '有协同任务更新，请进入应用查看。',
            }),
          ]),
        );
        for (const userId of [english.userId, publisher.userId]) {
          expect(await inbox.list({ userId, limit: 100 })).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                title: 'Company announcement',
                body: 'An announcement is available. Open the application to read it.',
              }),
            ]),
          );
        }
      },
      { timeout: 15000 },
    );
  } finally {
    demoContexts.delete(chinese.userId);
    demoContexts.delete(english.userId);
  }
}, 120000);
