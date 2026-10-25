// @vitest-environment node
import { it } from 'vitest';
import { expect } from '@playwright/test';
import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import { startIsolatedBrowserApp } from '../browser/harness.js';
import { createEmployee } from '../../logic/employees/helpers.js';
it.runIf(process.env.OA_BROWSER_ACCEPTANCE === '1')(
  'personal schedules employee CRUD and mobile real-role acceptance',
  async () => {
    const h = await startIsolatedBrowserApp({
      name: 'personal-schedules',
      apiPort: 14147,
      vitePort: 15147,
    });
    const checks: string[] = [],
      screenshots: string[] = [];
    try {
      const owner = await createEmployee(h.testApp, 'Calendar owner'),
        stranger = await createEmployee(h.testApp, 'Calendar stranger');
      const page = await h.pageFor(await owner.session(), {
        viewport: { width: 375, height: 812 },
        locale: 'en-US',
        timezoneId: 'Asia/Shanghai',
      });
      const base = `${h.origin}${h.basePath}`;
      page.setDefaultTimeout(25000);
      await page.goto(`${base}/personal-schedules`);
      await expect(page.getByText('No appointments on this day')).toBeVisible();
      await page
        .getByRole('button', { name: 'New appointment', exact: true })
        .click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page
        .locator('#schedule-title')
        .pressSequentially('Mobile appointment');
      const today = await page.evaluate(() =>
        new Date().toLocaleDateString('en-US'),
      );
      for (const id of ['schedule-start', 'schedule-end']) {
        await page.locator(`#${id}`).click();
        await page.locator(`[data-day="${today}"]`).last().click();
      }
      await page
        .getByRole('textbox', { name: 'Start time', exact: true })
        .fill('09:00');
      await page
        .getByRole('textbox', { name: 'End time', exact: true })
        .fill('10:00');
      const formShot = path.join(h.screenshotsDir, 'mobile-form-en.png');
      await page.screenshot({ path: formShot, fullPage: true });
      screenshots.push(formShot);
      await page.getByRole('button', { name: 'Save', exact: true }).click();
      await expect(
        page.getByRole('dialog', { name: 'New appointment', exact: true }),
      )
        .toHaveCount(0)
        .catch(async (error) => {
          await page.screenshot({
            path: path.join(h.screenshotsDir, 'save-failure.png'),
            fullPage: true,
          });
          await writeFile(
            path.join(h.screenshotsDir, 'save-failure.txt'),
            JSON.stringify(
              {
                url: page.url(),
                dialogs: await page.getByRole('dialog').allTextContents(),
                body: await page.locator('body').innerText(),
              },
              null,
              2,
            ),
          );
          throw error;
        });
      await expect(
        page.getByRole('link', { name: 'Mobile appointment', exact: true }),
      ).toBeVisible();
      checks.push('employee creates appointment via mobile drawer');
      await page
        .getByRole('link', { name: 'Mobile appointment', exact: true })
        .click();
      const detailUrl = page.url();
      await page.getByRole('button', { name: 'Edit', exact: true }).click();
      await page.locator('#schedule-title').fill('Updated mobile appointment');
      await page.getByRole('button', { name: 'Save', exact: true }).click();
      await expect(
        page.getByRole('link', {
          name: 'Updated mobile appointment',
          exact: true,
        }),
      ).toBeVisible();
      checks.push('latest-version edit refreshes list immediately');
      const other = await h.pageFor(await stranger.session());
      await other.goto(detailUrl);
      await expect(
        other.getByText(
          'This appointment does not exist or has been deleted. Return to your schedule.',
        ),
      ).toBeVisible();
      checks.push('foreign employee cannot read appointment by URL');
      await page
        .getByRole('link', { name: 'Updated mobile appointment', exact: true })
        .click();
      await page.getByRole('button', { name: 'Delete', exact: true }).click();
      await page
        .getByRole('alertdialog')
        .getByRole('button', { name: 'Delete', exact: true })
        .click();
      await expect(page.getByText('No appointments on this day')).toBeVisible();
      checks.push('confirmed deletion returns to list');
      await page.goto(`${base}/team-calendar`);
      await expect(
        page.getByRole('heading', { name: 'Team calendar', exact: true }),
      ).toBeVisible();
      await expect(
        page.getByText('No visible absences', { exact: true }),
      ).toBeVisible();
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        )
        .toBe(true);
      const shot = path.join(h.screenshotsDir, 'mobile-team-en.png');
      await page.screenshot({ path: shot, fullPage: true });
      screenshots.push(shot);
      checks.push(
        'team calendar is readable without horizontal overflow at 375px',
      );
      const chinese = await h.pageFor(await owner.session(), {
        locale: 'zh-CN',
        colorScheme: 'dark',
        viewport: { width: 375, height: 812 },
      });
      await chinese.goto(`${base}/personal-schedules`);
      await expect(
        chinese.getByRole('heading', { name: '我的日程', exact: true }),
      ).toBeVisible();
      const zh = path.join(h.screenshotsDir, 'mobile-schedule-zh.png');
      await chinese.screenshot({ path: zh, fullPage: true });
      screenshots.push(zh);
      checks.push('Chinese mobile schedule page renders');
      await writeFile(
        path.join(h.screenshotsDir, 'acceptance.json'),
        JSON.stringify({ checks, screenshots }, null, 2),
      );
    } finally {
      await h.close();
    }
  },
  240000,
);
