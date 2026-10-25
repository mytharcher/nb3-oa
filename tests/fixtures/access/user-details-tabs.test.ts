// @vitest-environment node
import path from 'node:path';
import { it } from 'vitest';
import { expect } from '@playwright/test';
import {
  DEFAULT_ADMIN_CREDENTIALS,
  signIn,
} from '@nocobase/app-plugin-authentication/testing';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { startIsolatedBrowserApp } from '../browser/harness.js';
it.runIf(process.env.OA_BROWSER_ACCEPTANCE === '1')(
  'accepts consolidated basic information and two user tabs, URL restoration and explicit role editing',
  async () => {
    const h = await startIsolatedBrowserApp({
      name: 'user-details-tabs',
      apiPort: 14321,
      vitePort: 14322,
    });
    try {
      const account = await h.testApp.application.container
        .resolve(userAdministrationServiceToken)
        .create({
          name: 'Tab fixture',
          email: 'user-tabs@example.test',
          password: 'fixture-password-123',
        });
      const session = await signIn(h.testApp, DEFAULT_ADMIN_CREDENTIALS);
      for (const locale of ['en-US', 'zh-CN']) {
        const en = locale === 'en-US';
        const page = await h.pageFor(session, { locale });
        const requests: string[] = [];
        page.on('request', (request) => requests.push(request.url()));
        await page.goto(
          `${h.origin}${h.basePath}/users/${account.id}?search=Tab&status=enabled&page=2`,
        );
        const drawer = page.getByRole('dialog');
        await expect(
          drawer.getByRole('heading', { name: 'Tab fixture', exact: true }),
        ).toBeVisible({ timeout: 60000 });
        await expect(drawer.getByRole('tab')).toHaveCount(2);
        await expect(page).not.toHaveURL(/page=2/);
        await expect(
          drawer.getByText(
            en ? 'No current primary department' : '未设置当前主部门',
            { exact: true },
          ),
        ).toBeVisible();
        await expect(
          drawer.getByRole('heading', {
            name: en ? 'Functional roles' : '职能角色',
            exact: true,
          }),
        ).toBeVisible();
        await expect(
          drawer.getByText('user-tabs@example.test', { exact: true }),
        ).toHaveCount(1);
        await expect(
          drawer.getByText(en ? 'Active' : '已激活', { exact: true }),
        ).toHaveCount(1);
        expect(
          requests.some((url) => /org\/users\/[^/]+\/organization/.test(url)),
        ).toBe(true);
        for (const width of [1280, 375]) {
          await page.setViewportSize({ width, height: 900 });
          await page.screenshot({
            path: path.join(
              h.screenshotsDir,
              `information-${locale}-${width}.png`,
            ),
            fullPage: true,
            animations: 'disabled',
          });
          expect(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
          ).toBe(true);
        }
        await page.setViewportSize({ width: 1280, height: 900 });
        const adjust = drawer.getByRole('button', {
          name: en ? 'Adjust duty roles' : '调整职能角色',
          exact: true,
        });
        await expect(adjust).toBeVisible();
        await expect(drawer.getByRole('combobox')).toHaveCount(0);
        await adjust.click();
        await expect(page).toHaveURL(/edit=roles/);
        const picker = drawer.getByRole('combobox', {
          name: en ? 'Adjust duty roles' : '调整职能角色',
        });
        await expect(picker).toBeEnabled();
        await picker.click();
        await page.getByRole('option').first().click();
        await page.keyboard.press('Escape');
        await drawer
          .getByRole('tab', {
            name: en ? 'Permissions' : '权限',
            exact: true,
          })
          .click();
        await expect(page.getByRole('alertdialog')).toBeVisible();
        await page
          .getByRole('alertdialog')
          .getByRole('button', {
            name: en ? 'Continue editing' : '继续编辑',
            exact: true,
          })
          .click();
        await expect(page).toHaveURL(/edit=roles/);
        await drawer
          .getByRole('button', { name: en ? 'Save' : '保存', exact: true })
          .click();
        await page
          .getByRole('alertdialog')
          .getByRole('button', { name: en ? 'Save' : '保存', exact: true })
          .click();
        await expect(page).not.toHaveURL(/edit=/, { timeout: 30000 });
        await adjust.click();
        await expect(picker).toBeEnabled();

        await drawer
          .getByRole('button', { name: en ? 'Cancel' : '取消', exact: true })
          .click();
        await expect(page).not.toHaveURL(/edit=/);
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
        ).toBeVisible();
        await expect(
          drawer.getByRole('button', {
            name: en ? 'Check an operation' : '检查某项操作',
          }),
        ).toHaveCount(0);
        await page.screenshot({
          path: path.join(h.screenshotsDir, `overview-${locale}.png`),
          animations: 'disabled',
        });
        await expect(
          drawer.getByRole('columnheader', {
            name: en ? 'Permission' : '权限名称',
            exact: true,
          }),
        ).toBeVisible();
        await expect(
          drawer.getByRole('button', {
            name: en ? 'Save' : '保存',
            exact: true,
          }),
        ).toHaveCount(0);
        await drawer
          .getByRole('checkbox', {
            name: en ? 'Configured permissions only' : '仅看已配置权限',
            exact: true,
          })
          .uncheck();
        const search = drawer.getByRole('textbox', {
          name: en
            ? 'Search business features or operations…'
            : '搜索业务功能或操作…',
        });
        await search.pressSequentially(en ? 'Positions' : '岗位');
        const toggle = drawer.getByRole('switch').first();
        await expect(toggle).toBeVisible();
        const row = toggle.locator('xpath=ancestor::tr');
        await row.evaluate((node) =>
          node.setAttribute('data-retained-row', 'yes'),
        );
        await toggle.click();
        await expect(row.getByRole('status')).toHaveText(
          en ? 'Saved' : '已保存',
        );
        await expect(toggle).toBeChecked();
        await expect(drawer.locator('[data-retained-row=yes]')).toHaveCount(1);
        await toggle.click();
        await expect(toggle).not.toBeChecked();
        await expect(row.getByRole('status')).toHaveText(
          en ? 'Saved' : '已保存',
        );
        await search.fill(en ? 'Seal ledger' : '用印台账');
        const ledgerToggle = drawer.getByRole('switch', {
          name: en
            ? /Personally grant.*Seal ledger · View/
            : /个人授予.*用印台账 · 查看/,
        });
        const ledgerRow = ledgerToggle.locator('xpath=ancestor::tr');
        await ledgerToggle.click();
        await expect(ledgerRow.getByRole('status')).toHaveText(
          en ? 'Saved' : '已保存',
        );
        for (const label of en
          ? ['Seal registrations', 'Seal receipts']
          : ['用印登记', '用印回执']) {
          const scopeRow = drawer
            .getByRole('row')
            .filter({
              has: page.getByRole('cell').filter({ hasText: label }).first(),
            })
            .filter({ has: page.getByRole('combobox') });
          await expect(scopeRow).toHaveCount(1);
          const cells = scopeRow.getByRole('cell');
          await expect(cells.nth(1)).not.toContainText(label);
          await expect(cells.nth(2)).not.toContainText(label);
          await expect(scopeRow.getByRole('switch')).toHaveCount(0);
        }
        for (const width of [1280, 375]) {
          await page.setViewportSize({ width, height: 900 });
          await ledgerRow.scrollIntoViewIfNeeded();
          await page.screenshot({
            path: path.join(
              h.screenshotsDir,
              `seal-scope-rows-${locale}-${width}.png`,
            ),
            animations: 'disabled',
          });
        }
        await page.setViewportSize({ width: 1280, height: 900 });
        await ledgerToggle.click();
        await expect(ledgerRow.getByRole('status')).toHaveText(
          en ? 'Saved' : '已保存',
        );
        await expect(drawer.getByRole('combobox')).toHaveCount(0);
        await search.fill(en ? 'Seal requests' : '用印申请');
        const requestToggle = drawer.getByRole('switch', {
          name: en
            ? /Personally grant.*Seal requests · View/
            : /个人授予.*用印申请 · 查看/,
        });
        const requestRow = requestToggle.locator('xpath=ancestor::tr');
        await requestToggle.click();
        await expect(requestRow.getByRole('status')).toHaveText(
          en ? 'Saved' : '已保存',
        );
        await expect(requestRow.getByRole('combobox')).toHaveCount(1);
        await expect(requestRow.getByRole('cell').nth(1)).not.toContainText(
          en ? 'Seal requests' : '用印申请',
        );
        await expect(requestRow.getByRole('cell').nth(2)).not.toContainText(
          en ? 'Seal requests' : '用印申请',
        );
        await page.screenshot({
          path: path.join(h.screenshotsDir, `seal-single-scope-${locale}.png`),
          animations: 'disabled',
        });
        await requestToggle.click();
        await expect(requestRow.getByRole('status')).toHaveText(
          en ? 'Saved' : '已保存',
        );
        await search.fill(en ? 'Document templates' : '文档模板');
        const printPayment = drawer.getByRole('switch', {
          name: en
            ? /Personally grant.*Print payment requests/
            : /个人授予.*打印付款单/,
        });
        await expect(printPayment).toBeVisible();
        const paymentRow = printPayment.locator('xpath=ancestor::tr');
        const paymentScopes = drawer.getByRole('combobox', {
          name: en ? /^Print payment requests:/ : /^打印付款单：/,
        });
        await expect(paymentScopes).toHaveCount(0);
        const tableViewport = paymentRow.locator(
          'xpath=ancestor::*[@data-slot="table-container"]',
        );
        expect(
          await tableViewport.evaluate((node) => ({
            overflow: getComputedStyle(node).overflowY,
            maxHeight: getComputedStyle(node).maxHeight,
          })),
        ).toEqual({ overflow: 'visible', maxHeight: 'none' });

        await printPayment.click();
        await expect(paymentRow.getByRole('status')).toHaveText(
          en ? 'Saved' : '已保存',
        );
        await expect(paymentScopes).toHaveCount(3);
        await expect(paymentScopes.first()).toBeEnabled();
        await expect(paymentRow).not.toContainText(
          en ? 'Record scope 3' : '记录范围 3',
        );
        const scope = paymentScopes.first();
        await scope.click();
        const option = page.getByRole('option').last();
        const chosenScope = await option.textContent();
        await option.click();
        await expect(paymentRow.getByRole('status')).toHaveText(
          en ? 'Saved' : '已保存',
        );
        await expect(scope).toContainText(chosenScope!.trim());
        if (en) {
          const grantsUrl = '**/api/access/subjects/user/*/grants';
          await page.route(grantsUrl, async (route) => {
            await route.fulfill({
              status: 409,
              contentType: 'application/json',
              body: JSON.stringify({ error: { message: 'Fixture conflict' } }),
            });
          });
          await printPayment.click();
          await expect(paymentRow.getByRole('status')).toContainText(
            'Change not saved',
          );
          await expect(printPayment).toBeChecked();
          await page.unroute(grantsUrl);
        }
        for (const width of [1280, 375]) {
          await page.setViewportSize({ width, height: 900 });
          await paymentRow.scrollIntoViewIfNeeded();
          await drawer
            .locator('[data-slot=route-overlay-body]')
            .evaluate((node) => {
              node.scrollTop += 100;
            });
          await page.evaluate(
            () => new Promise((resolve) => requestAnimationFrame(resolve)),
          );
          const header = drawer.getByRole('columnheader', {
            name: en ? 'Permission' : '权限名称',
            exact: true,
          });
          await expect(header).toBeVisible();
          const stickyGap = await header.evaluate((node) => {
            const body = node.closest('[data-slot="route-overlay-body"]')!;
            return (
              node.getBoundingClientRect().top -
              body.getBoundingClientRect().top
            );
          });
          await page.screenshot({
            path: path.join(h.screenshotsDir, `sticky-${locale}-${width}.png`),
            animations: 'disabled',
          });
          expect(Math.abs(stickyGap)).toBeLessThan(3);

          await page.screenshot({
            path: path.join(
              h.screenshotsDir,
              `autosave-${locale}-${width}.png`,
            ),
            animations: 'disabled',
          });
          expect(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
          ).toBe(true);
        }
        await page.setViewportSize({ width: 1280, height: 900 });
        await printPayment.click();
        await expect(paymentRow.getByRole('status')).toHaveText(
          en ? 'Saved' : '已保存',
        );

        if (en) {
          const grantsUrl = '**/api/access/subjects/user/*/grants';
          await page.route(grantsUrl, (route) =>
            route.fulfill({
              status: 403,
              contentType: 'application/json',
              body: JSON.stringify({
                error: { message: 'Private fixture detail' },
              }),
            }),
          );
          await printPayment.click();
          await expect(drawer.getByRole('switch')).toHaveCount(0);
          await expect(drawer.getByRole('alert')).toBeVisible();
          await expect(drawer).not.toContainText('Private fixture detail');
          await expect(
            drawer.getByRole('button', { name: 'Refresh', exact: true }),
          ).toHaveCount(0);
          await page.unroute(grantsUrl);
        }

        await page.goto(
          `${h.origin}${h.basePath}/users/${account.id}?search=Tab&tab=exceptions`,
        );
        await expect(page).toHaveURL(/tab=permissions/);
        await expect(
          drawer.getByRole('checkbox', {
            name: en ? 'Personal exceptions only' : '仅看个人例外',
          }),
        ).toBeVisible();
        await expect(page).toHaveURL(/search=Tab/);
        for (const width of [1280, 375]) {
          await page.setViewportSize({ width, height: 900 });
          for (const preset of ['default', 'compact'])
            for (const dark of [false, true]) {
              await page.evaluate(
                ({ dark, preset }) => {
                  document.documentElement.classList.toggle('dark', dark);
                  document.documentElement.classList.toggle('light', !dark);
                  document.documentElement.dataset.theme = preset;
                  document.documentElement.style.colorScheme = dark
                    ? 'dark'
                    : 'light';
                },
                { dark, preset },
              );
              await page.waitForFunction(
                ({ dark, preset }) =>
                  document.documentElement.classList.contains('dark') ===
                    dark &&
                  document.documentElement.dataset.theme === preset &&
                  getComputedStyle(document.documentElement).colorScheme ===
                    (dark ? 'dark' : 'light'),
                { dark, preset },
              );
              await page.evaluate(
                () =>
                  new Promise((resolve) =>
                    requestAnimationFrame(() => requestAnimationFrame(resolve)),
                  ),
              );
              await page.screenshot({
                path: path.join(
                  h.screenshotsDir,
                  `tabs-${locale}-${preset}-${width}-${dark ? 'dark' : 'light'}.png`,
                ),
                fullPage: true,
                animations: 'disabled',
              });
              expect(
                await page.evaluate(
                  () => document.documentElement.scrollWidth <= innerWidth,
                ),
              ).toBe(true);
            }
        }
        await page.close();
      }
      const touchPage = await h.pageFor(session, {
        locale: 'zh-CN',
        hasTouch: true,
        isMobile: true,
        viewport: { width: 375, height: 900 },
      });
      await touchPage.goto(
        `${h.origin}${h.basePath}/users/${account.id}?tab=permissions`,
      );
      await expect(
        touchPage.getByRole('columnheader', { name: '个人例外', exact: true }),
      ).toBeVisible({ timeout: 30000 });
      await touchPage.screenshot({
        path: path.join(h.screenshotsDir, 'permissions-touch.png'),
        animations: 'disabled',
      });
      await touchPage.close();
    } finally {
      await h.close();
    }
  },
  240000,
);
