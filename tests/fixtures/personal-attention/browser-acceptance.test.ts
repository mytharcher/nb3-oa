// @vitest-environment node
import { it } from 'vitest';
import { expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import { databaseManagerToken } from '@nocobase/db';
import { startIsolatedBrowserApp } from '../browser/harness.js';
import { createEmployee } from '../../logic/employees/helpers.js';
import { announcementServiceToken } from '../../../server/providers/announcements/contract.js';

it.runIf(process.env.OA_BROWSER_ACCEPTANCE === '1')(
  'announcement receipt completion refreshes menu count independently of notification read state',
  async () => {
    const h = await startIsolatedBrowserApp({
      name: 'personal-attention',
      apiPort: 14158,
      vitePort: 15158,
      config: { notification: { channels: { inbox: { provider: 'in-app' } } } },
    });
    try {
      const c = h.testApp.application.container,
        db = c.resolve(databaseManagerToken),
        announcements = c.resolve(announcementServiceToken);
      const publisher = await createEmployee(h.testApp, 'Counter publisher'),
        reader = await createEmployee(h.testApp, 'Counter reader');
      const now = Date.now();
      const draft = await db.transaction((tx) =>
        announcements.save(
          {
            actorId: publisher.userId,
            requestId: randomUUID(),
            title: 'Counter receipt example',
            body: 'Please confirm this synthetic announcement.',
            audience: { all: true, departmentIds: [], dutyRoleCodes: [] },
            requiresConfirmation: true,
            pinned: false,
            attachments: [],
            validFrom: new Date(now - 60000).toISOString(),
            validUntil: new Date(now + 86400000).toISOString(),
          },
          tx,
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
        ),
      );
      const session = await reader.session();
      await expect
        .poll(
          async () => {
            const r = await session.fetch(
              '/notificationInApp/messages/unreadCount',
            );
            return (await r.json()).data.count;
          },
          { timeout: 20000 },
        )
        .toBe(1);
      const page = await h.pageFor(session, {
        viewport: { width: 375, height: 812 },
        locale: 'en-US',
      });
      page.setDefaultTimeout(25000);
      const base = `${h.origin}${h.basePath}`;
      const taskBadge = page.getByRole('status', {
        name: 'Task center, 1 pending',
        exact: true,
      });
      const openMenu = async () => {
        await page
          .getByRole('button', { name: 'Open navigation', exact: true })
          .click();
      };
      await page.goto(`${base}/`);
      await expect(
        page.locator('header a[href$="/taskCenter"],header a[href$="/inbox"]'),
      ).toHaveCount(0);
      await openMenu();
      await expect(taskBadge).toHaveText('1');
      await expect(
        page.getByRole('status', { name: '1 unread', exact: true }),
      ).toHaveText('1');
      await page.screenshot({
        path: path.join(h.screenshotsDir, 'pending-and-unread-en-375.png'),
        fullPage: true,
      });
      await page.getByRole('link', { name: 'Messages', exact: true }).click();
      await page
        .getByRole('button', { name: 'Mark all as read', exact: true })
        .click();
      await openMenu();
      await expect(taskBadge).toHaveText('1');
      await expect(
        page.getByRole('status', { name: '1 unread', exact: true }),
      ).toHaveCount(0);
      await page.screenshot({
        path: path.join(h.screenshotsDir, 'read-not-pending-en-375.png'),
        fullPage: true,
      });
      await page.keyboard.press('Escape');
      await page.goto(`${base}/announcements/${draft.id}/actions/confirm`);
      await page
        .getByRole('alertdialog')
        .getByRole('button', { name: 'Confirm receipt', exact: true })
        .click();
      await expect(page.getByRole('alertdialog')).toHaveCount(0);
      await openMenu();
      await expect(taskBadge).toHaveCount(0);
      await expect(page.getByRole('status')).toHaveCount(0);
      await page.screenshot({
        path: path.join(h.screenshotsDir, 'completed-en-375.png'),
        fullPage: true,
      });
      await writeFile(
        path.join(h.screenshotsDir, 'acceptance.json'),
        JSON.stringify(
          {
            checks: [
              'real published announcement contributes one pending receipt and one independent unread notification',
              'UI mark all read clears notification only',
              'UI confirm receipt clears the task menu badge',
              '375px separate menu badges visible; header task/inbox shortcuts absent',
            ],
          },
          null,
          2,
        ),
      );
    } finally {
      await h.close();
    }
  },
  180000,
);
