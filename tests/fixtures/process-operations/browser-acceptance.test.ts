// @vitest-environment node
import { it } from 'vitest';
import { expect } from '@playwright/test';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { startIsolatedBrowserApp } from '../browser/harness.js';
import { createEmployee, grantToUser } from '../../logic/employees/helpers.js';
import { leaveServiceToken } from '../../../server/providers/leave/index.js';
it.runIf(process.env.OA_BROWSER_ACCEPTANCE === '1')(
  'actual report readers see owned process facts; employees are denied at 375px',
  async () => {
    const h = await startIsolatedBrowserApp({
      name: 'process-operations',
      apiPort: 14151,
      vitePort: 15151,
    });
    try {
      const manager = await createEmployee(h.testApp, 'Report manager'),
        reader = await createEmployee(h.testApp, 'Report reader', {
          managerId: manager.employeeId,
        }),
        stranger = await createEmployee(h.testApp, 'Report stranger');
      await grantToUser(
        h.testApp,
        randomUUID(),
        [
          {
            resource: { type: 'settings', id: 'oa.processOperations' },
            actions: [{ action: 'read' }],
          },
        ],
        reader.userId,
      );
      const leave = h.testApp.application.container.resolve(leaveServiceToken);
      const draft = await leave.create(
        {
          leaveType: 'personal',
          startDate: '2026-11-02',
          endDate: '2026-11-02',
          startHalf: 'am',
          endHalf: 'pm',
          reason: 'Private synthetic reason',
          attachments: [],
          handoverUserId: null,
          enableDelegation: false,
        },
        reader.userId,
      );
      await leave.transition(
        String(draft.record.id),
        'submit',
        reader.userId,
        Number(draft.record.lifecycleVersion),
        randomUUID(),
      );
      const page = await h.pageFor(await reader.session(), {
          viewport: { width: 375, height: 812 },
          locale: 'en-US',
        }),
        base = `${h.origin}${h.basePath}`;
      await page.goto(`${base}/reports/process-operations`);
      await expect(
        page.getByText('Process summary', { exact: true }),
      ).toBeVisible({ timeout: 30000 });
      await expect(
        page.getByText('Leave', { exact: true }).first(),
      ).toBeVisible();
      expect(await page.locator('body').innerText()).not.toContain(
        'Private synthetic reason',
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: path.join(h.screenshotsDir, 'report-data-en-375.png'),
        fullPage: true,
      });
      await page.goto(
        `${base}/reports/process-operations?from=2000-01-01&to=2000-01-02`,
      );
      await expect(
        page.getByText('No submitted requests', { exact: true }),
      ).toBeVisible();
      const zh = await h.pageFor(await reader.session(), {
        viewport: { width: 375, height: 812 },
        locale: 'zh-CN',
        colorScheme: 'dark',
      });
      await zh.goto(`${base}/reports/process-operations`);
      await expect(zh.getByText('流程汇总', { exact: true })).toBeVisible({
        timeout: 30000,
      });
      await zh.screenshot({
        path: path.join(h.screenshotsDir, 'report-data-zh-375.png'),
        fullPage: true,
      });
      const denied = await h.pageFor(await stranger.session(), {
        viewport: { width: 375, height: 812 },
      });
      await denied.goto(`${base}/reports/process-operations`);
      await expect(
        denied.getByText('Process summary', { exact: true }),
      ).toHaveCount(0);
      await expect(
        denied.getByText(/Back to workbench|返回工作台/, { exact: true }),
      )
        .toBeVisible({ timeout: 30000 })
        .catch(async (error) => {
          await denied.screenshot({
            path: path.join(h.screenshotsDir, 'denied-failure.png'),
            fullPage: true,
          });
          await writeFile(
            path.join(h.screenshotsDir, 'denied-body.txt'),
            await denied.locator('body').innerText(),
          );
          throw error;
        });
      await denied.screenshot({
        path: path.join(h.screenshotsDir, 'report-denied-en-375.png'),
        fullPage: true,
      });
      await writeFile(
        path.join(h.screenshotsDir, 'acceptance.json'),
        JSON.stringify(
          {
            at: new Date().toISOString(),
            checks: [
              'actual PostgreSQL submitted leave renders for granted reader',
              'employee denied independently of business ownership',
              '375px no horizontal page overflow',
              'empty historical cohort',
              'Chinese dark locale',
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
  120000,
);
