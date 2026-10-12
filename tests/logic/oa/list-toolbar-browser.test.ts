// @vitest-environment node
import path from 'node:path';
import { it, expect } from 'vitest';
import { expect as browserExpect } from '@playwright/test';
import { startIsolatedBrowserApp } from '../../fixtures/browser/harness.js';
import {
  createEmployee,
  grantToUser,
  composite,
} from '../employees/helpers.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';

it.skipIf(process.env.OA_BROWSER_ACCEPTANCE !== '1')(
  'keeps work item and personnel filters compact on desktop and inside a phone viewport',
  async () => {
    const app = await startIsolatedBrowserApp({
      name: 'list-toolbar',
      apiPort: 14159,
      vitePort: 15159,
    });
    try {
      const hr = await createEmployee(app.testApp, 'Toolbar HR');
      await app.testApp.application.container
        .resolve(organizationServiceToken)
        .addDutyRoleMember('hr', hr.userId, { actorId: hr.userId });
      await grantToUser(
        app.testApp,
        'toolbar-transfer',
        [
          composite('oa.transfer', {
            view: { transferRequests: 'oa.transferReadable' },
            submit: { transferRequests: 'allRecords' },
          }),
        ],
        hr.userId,
      );
      const session = await hr.session();
      const errors: string[] = [];
      for (const locale of ['en-US', 'zh-CN']) {
        const page = await app.pageFor(session, { locale });
        page.on('pageerror', (error) => errors.push(error.message));
        await page.goto(`${app.origin}${app.basePath}/work-items`, {
          waitUntil: 'domcontentloaded',
        });
        for (const theme of ['light', 'dark']) {
          for (const preset of ['default', 'compact']) {
            await page.evaluate(
              (prefs) => {
                localStorage.setItem('nocobase.locale', prefs.locale);
                localStorage.setItem(
                  'nocobase:main:theme:color-scheme',
                  prefs.theme,
                );
                localStorage.setItem(
                  'nocobase:main:theme:preset',
                  prefs.preset,
                );
              },
              { locale, theme, preset },
            );
            for (const width of [1365, 375]) {
              await page.setViewportSize({ width, height: 900 });
              for (const route of ['work-items', 'personnel-changes']) {
                await page.goto(`${app.origin}${app.basePath}/${route}`, {
                  waitUntil: 'domcontentloaded',
                });
                const toolbar = page.locator(
                  '[data-slot="application-toolbar"]',
                );
                await browserExpect(toolbar).toBeVisible({ timeout: 90000 });
                await browserExpect(page.getByRole('table')).toBeVisible();
                await browserExpect(page.locator('html')).toHaveAttribute(
                  'data-theme',
                  preset,
                );
                await browserExpect(page.locator('html')).toHaveClass(
                  new RegExp(theme),
                );
                await browserExpect(
                  toolbar.getByRole('textbox'),
                ).toHaveAttribute(
                  'placeholder',
                  route === 'work-items'
                    ? locale === 'en-US'
                      ? 'Search title or description'
                      : '搜索标题或描述'
                    : locale === 'en-US'
                      ? 'Search by reason or request ID'
                      : '搜索原因或申请标识',
                );
                const box = (await toolbar.getByRole('textbox').boundingBox())!;
                const filters = toolbar.getByRole('combobox');
                const filter = (await filters.first().boundingBox())!;
                if (width > 1000) {
                  expect(box.width).toBeLessThanOrEqual(321);
                  expect(filter.width).toBeLessThanOrEqual(161);
                  expect(Math.abs(box.y - filter.y)).toBeLessThan(2);
                  const actions = (await toolbar
                    .locator('[data-slot="application-actions"]')
                    .boundingBox())!;
                  expect(Math.abs(actions.y - box.y)).toBeLessThan(2);
                }
                expect(
                  await page.evaluate(
                    () => document.documentElement.scrollWidth <= innerWidth,
                  ),
                ).toBe(true);
                await filters.first().click();
                await browserExpect(
                  page.getByRole('option').first(),
                ).toBeVisible();
                await page.keyboard.press('Escape');
                await page.screenshot({
                  path: path.join(
                    app.screenshotsDir,
                    `${route}-${locale}-${theme}-${preset}-${width}.png`,
                  ),
                });
              }
            }
          }
        }
      }
      expect(errors).toEqual([]);
    } finally {
      await app.close();
    }
  },
  180000,
);
