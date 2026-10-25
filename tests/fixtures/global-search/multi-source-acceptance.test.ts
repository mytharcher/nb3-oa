// @vitest-environment node
import { it } from 'vitest';
import { expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { createEmployee, grantToUser } from '../../logic/employees/helpers.js';
import { write } from '../../logic/platform/helpers.js';
import { startIsolatedBrowserApp } from '../browser/harness.js';

it.runIf(process.env.OA_BROWSER_ACCEPTANCE === '1')(
  'opens authorized organization requests, announcements and knowledge from search and rechecks revoked access',
  async () => {
    const h = await startIsolatedBrowserApp({
      name: 'multi-source-search',
      apiPort: 14175,
      vitePort: 15175,
    });
    try {
      const publisher = await createEmployee(h.testApp, 'Search publisher');
      const viewer = await createEmployee(
        h.testApp,
        'Search uninvolved reader',
      );
      const c = h.testApp.application.container;
      await c
        .resolve(organizationServiceToken)
        .addDutyRoleMember('admin', publisher.userId, {
          actorId: publisher.userId,
        });
      await grantToUser(
        h.testApp,
        'browser-search-leave-reader',
        [
          {
            resource: { type: 'composite', id: 'oa.leave' },
            actions: [
              {
                action: 'view',
                policy: {
                  type: 'composite',
                  scopes: { leaveRequests: 'allRecords' },
                },
              },
            ],
          },
        ],
        viewer.userId,
      );
      const author = await publisher.session();
      const session = await viewer.session();
      const data = async <T>(response: Response): Promise<T> => {
        expect(response.status, await response.clone().text()).toBe(200);
        return ((await response.json()) as { data: T }).data;
      };
      const leave = await data<{ record: { id: string } }>(
        await author.fetch(
          '/leaveRequests',
          write('POST', {
            leaveType: 'personal',
            startDate: '2026-11-02',
            endDate: '2026-11-02',
            startHalf: 'am',
            endHalf: 'pm',
            reason: 'SearchEvidence leave reason',
            attachments: [],
            handoverUserId: null,
            enableDelegation: false,
          }),
        ),
      );
      const announcement = await data<{ id: string; version: number }>(
        await author.fetch(
          '/announcements',
          write('POST', {
            requestId: randomUUID(),
            title: 'SearchEvidence company announcement',
            body: 'SearchEvidence announcement contents',
            audience: { all: true, departmentIds: [], dutyRoleCodes: [] },
            requiresConfirmation: false,
            pinned: false,
            attachments: [],
            validFrom: '2026-01-01T00:00:00Z',
            validUntil: '2035-01-01T00:00:00Z',
          }),
        ),
      );
      await data(
        await author.fetch(
          `/announcements/${announcement.id}/publish`,
          write('POST', {
            requestId: randomUUID(),
            expectedVersion: announcement.version,
          }),
        ),
      );
      const knowledge = await data<{ id: string }>(
        await author.fetch(
          '/knowledge/documents',
          write('POST', {
            requestKey: randomUUID(),
            title: 'SearchEvidence knowledge policy',
            folderId: null,
            departmentIds: [],
            dutyRoleCodes: [],
            kind: 'markdown',
            markdown: 'SearchEvidence knowledge contents',
          }),
        ),
      );
      const page = await h.pageFor(session, {
        viewport: { width: 375, height: 812 },
        locale: 'en-US',
      });
      page.setDefaultTimeout(30000);
      const base = `${h.origin}${h.basePath}`;
      const searchUrl = `${base}/search?q=SearchEvidence`;
      const leaveLink = page.locator(
        `a[href*="/approvals/mine/leave/${leave.record.id}"]`,
      );
      const announcementLink = page.getByRole('link', {
        name: announcementTitle(),
        exact: true,
      });
      const knowledgeLink = page.getByRole('link', {
        name: 'SearchEvidence knowledge policy',
        exact: true,
      });
      await page.goto(searchUrl);
      await expect(leaveLink).toBeVisible({ timeout: 30000 });
      await expect(announcementLink).toBeVisible();
      await expect(knowledgeLink).toBeVisible();
      await page.screenshot({
        path: path.join(h.screenshotsDir, 'all-sources-en-375.png'),
        fullPage: true,
      });
      const leaveUrl = await leaveLink.getAttribute('href');
      expect(leaveUrl).toBeTruthy();
      const detail = page.waitForResponse((r) =>
        new URL(r.url()).pathname.endsWith(
          `/api/leaveRequests/${leave.record.id}`,
        ),
      );
      await leaveLink.click();
      expect((await detail).status()).toBe(200);
      await expect(
        page.getByText('SearchEvidence leave reason', { exact: true }),
      ).toBeVisible();
      await page.goto(searchUrl);
      await announcementLink.click();
      await expect(
        page.getByText('SearchEvidence announcement contents', { exact: true }),
      ).toBeVisible();
      await page.goto(searchUrl);
      await knowledgeLink.click();
      await expect(page).toHaveURL(new RegExp(`/knowledge/${knowledge.id}$`));
      await expect(
        page.getByText('SearchEvidence knowledge contents', { exact: true }),
      ).toBeVisible();
      const authz = c.resolve(authorizationToken);
      for (const assignment of await authz.permissionSets.listAssignments(
        'browser-search-leave-reader',
      ))
        await authz.permissionSets.revoke(assignment.id);
      const denied = await session.fetch(`/leaveRequests/${leave.record.id}`);
      expect([403, 404]).toContain(denied.status);
      const refreshed = page.waitForResponse((r) =>
        new URL(r.url()).pathname.endsWith('/api/requestSearch'),
      );
      await page.goto(searchUrl);
      expect((await refreshed).status()).toBe(200);
      await expect(leaveLink).toHaveCount(0);
      await expect(announcementLink).toBeVisible();
      await expect(knowledgeLink).toBeVisible();
      const deniedBrowser = page.waitForResponse((r) =>
        new URL(r.url()).pathname.endsWith(
          `/api/leaveRequests/${leave.record.id}`,
        ),
      );
      await page.goto(new URL(leaveUrl!, page.url()).href);
      expect([403, 404]).toContain((await deniedBrowser).status());
      await expect(
        page.getByText('SearchEvidence leave reason', { exact: true }),
      ).toHaveCount(0);
      await page.goto(searchUrl);
      await page.evaluate(() => {
        localStorage.setItem('nocobase.locale', 'zh-CN');
        localStorage.setItem('nocobase:main:theme:color-scheme', 'dark');
      });
      await page.reload();
      await expect(
        page.getByRole('heading', { name: '全局搜索', exact: true }),
      ).toBeVisible();
      await expect(announcementLink).toBeVisible();
      await expect(knowledgeLink).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: path.join(h.screenshotsDir, 'revoked-zh-375.png'),
        fullPage: true,
      });
      await writeFile(
        path.join(h.screenshotsDir, 'evidence.json'),
        JSON.stringify(
          {
            checks: [
              'uninvolved authorized request search and actual detail',
              'received announcement search and detail',
              'knowledge search and actual markdown',
              'revocation removes request and denies saved direct URL',
              'unaffected sources remain usable',
              '375px Chinese dark no overflow',
            ],
            scope:
              'Main application with isolated PostgreSQL and synthetic records',
          },
          null,
          2,
        ),
      );
    } finally {
      await h.close();
    }
  },
  240000,
);
function announcementTitle() {
  return 'SearchEvidence company announcement';
}
