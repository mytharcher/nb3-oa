// @vitest-environment node
import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import { it } from 'vitest';
import { expect } from '@playwright/test';
import {
  DEFAULT_ADMIN_CREDENTIALS,
  signIn,
} from '@nocobase/app-plugin-authentication/testing';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { startIsolatedBrowserApp } from '../browser/harness.js';

it.runIf(process.env.OA_BROWSER_ACCEPTANCE === '1')(
  'accepts the single user drawer and compact access workspace in both languages',
  async () => {
    const h = await startIsolatedBrowserApp({
      name: 'access-users-ux',
      apiPort: 14311,
      vitePort: 14312,
    });
    try {
      const account = await h.testApp.application.container
        .resolve(userAdministrationServiceToken)
        .create({
          name: 'UX fixture',
          email: 'ux@example.test',
          password: 'fixture-password-123',
        });
      const session = await signIn(h.testApp, DEFAULT_ADMIN_CREDENTIALS);
      for (const locale of ['en-US', 'zh-CN']) {
        const en = locale === 'en-US';
        const page = await h.pageFor(session, { locale });
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));
        try {
          await page.goto(
            `${h.origin}${h.basePath}/users/${account.id}/permissions/duty-roles`,
          );
          const drawer = page.getByRole('dialog');
          await expect(drawer).toHaveCount(1);
          await expect(
            drawer.getByRole('heading', { name: 'UX fixture', exact: true }),
          ).toBeVisible({ timeout: 60000 });
          await expect(page).toHaveURL(/\?tab=information/);
          await expect(drawer.getByRole('tab')).toHaveCount(2);
          await drawer
            .getByRole('button', {
              name: en ? 'Adjust duty roles' : '调整职能角色',
              exact: true,
            })
            .click();
          await expect(
            drawer.getByRole('combobox', {
              name: en ? 'Adjust duty roles' : '调整职能角色',
            }),
          ).toBeEnabled();
          await drawer
            .getByRole('button', { name: en ? 'Cancel' : '取消', exact: true })
            .click();
          await drawer
            .getByRole('tab', {
              name: en ? 'Permissions' : '权限',
              exact: true,
            })
            .click();
          await expect(
            drawer.getByRole('checkbox', {
              name: en ? 'Personal exceptions only' : '仅看个人例外',
            }),
          ).toBeVisible({ timeout: 60000 });
          await expect(drawer).toHaveCount(1);
          await expect(drawer).not.toContainText(/[a-zA-Z]+\.authz\./);
          await page.screenshot({
            path: path.join(h.screenshotsDir, `user-${locale}.png`),
            fullPage: true,
            animations: 'disabled',
          });
          await page.goto(
            `${h.origin}${h.basePath}/access/roles/org.dutyRole/finance/permissions`,
          );
          await expect(
            page.getByRole('checkbox', {
              name: en ? 'Configured only' : '仅显示已开通',
              exact: true,
            }),
          ).toBeVisible({ timeout: 60000 });
          await expect(page.getByRole('dialog')).toHaveCount(0);
          await expect(
            page.getByRole('checkbox', {
              name: en ? 'Configured only' : '仅显示已开通',
              exact: true,
            }),
          ).toBeChecked();
          await expect(
            page.getByRole('navigation', {
              name: en ? 'Business modules' : '业务模块',
            }),
          ).toHaveCount(1);
          await expect(page.locator('body')).not.toContainText(
            /[a-zA-Z]+\.authz\./,
          );
          await expect(
            page.getByRole('button', {
              name: en ? 'Add modules' : '添加模块',
              exact: true,
            }),
          ).toHaveCount(0);
          const scopedRow = page
            .locator('[data-slot=permission-row]')
            .filter({ has: page.getByRole('combobox') })
            .first();
          await expect(scopedRow).toBeVisible();
          const metrics = await scopedRow.evaluate((row) => {
            const label = row.querySelector('label')!;
            const scope = row.querySelector('[role=combobox]')!;
            return {
              labelSize: getComputedStyle(label).fontSize,
              scopeSize: getComputedStyle(scope).fontSize,
              labelRight: label.getBoundingClientRect().right,
              scopeLeft: scope.getBoundingClientRect().left,
            };
          });
          expect(metrics.scopeSize).toBe(metrics.labelSize);
          expect(metrics.scopeLeft).toBeGreaterThanOrEqual(metrics.labelRight);
          await page.screenshot({
            path: path.join(h.screenshotsDir, `matrix-${locale}.png`),
            fullPage: true,
            animations: 'disabled',
          });
          await page.setViewportSize({ width: 375, height: 812 });
          await page.screenshot({
            path: path.join(h.screenshotsDir, `matrix-mobile-${locale}.png`),
            fullPage: true,
            animations: 'disabled',
          });
          expect(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= window.innerWidth,
            ),
          ).toBe(true);
          await page.evaluate(() => {
            document.documentElement.classList.remove('light');
            document.documentElement.classList.add('dark');
            document.documentElement.style.colorScheme = 'dark';
          });
          await page.screenshot({
            path: path.join(h.screenshotsDir, `matrix-dark-${locale}.png`),
            fullPage: true,
            animations: 'disabled',
          });
          const search = page.getByRole('textbox', {
            name: en
              ? 'Search business features or operations…'
              : '搜索业务功能或操作…',
          });
          await search.focus();
          const cdp = await page.context().newCDPSession(page);
          await cdp.send('Input.imeSetComposition', {
            text: 'cai',
            selectionStart: 3,
            selectionEnd: 3,
          });
          await cdp.send('Input.insertText', { text: '财务' });
          await expect(search).toHaveValue('财务');
          await search.fill('');
          expect(errors).toEqual([]);
        } catch (error) {
          await writeFile(
            path.join(h.screenshotsDir, `failure-${locale}.txt`),
            `${errors.join('\n')}\n${await page.locator('body').innerText()}`,
          );
          await page.screenshot({
            path: path.join(h.screenshotsDir, `failure-${locale}.png`),
            fullPage: true,
            animations: 'disabled',
          });
          throw error;
        } finally {
          await page.context().close();
        }
      }
    } finally {
      await h.close();
    }
  },
  240_000,
);
