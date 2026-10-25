// @vitest-environment node
import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import { it } from 'vitest';
import { expect } from '@playwright/test';
import {
  DEFAULT_ADMIN_CREDENTIALS,
  signIn,
} from '@nocobase/app-plugin-authentication/testing';
import type { DefaultAccessAuthorizationApi } from '@nocobase/authorization/default-access';
import type { DatabaseConnection } from '@nocobase/db';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { startIsolatedBrowserApp } from '../browser/harness.js';

it.runIf(process.env.OA_BROWSER_ACCEPTANCE === '1')(
  'accepts role saves and configured user permissions in both languages without automatic decisions',
  async () => {
    const h = await startIsolatedBrowserApp({
      name: 'permission-sources',
      apiPort: 14301,
      vitePort: 14302,
    });
    try {
      const account = await h.testApp.application.container
        .resolve(userAdministrationServiceToken)
        .create({
          name: 'Permission source fixture',
          email: 'permission-source@example.test',
          password: 'fixture-password-123',
        });
      const session = await signIn(h.testApp, DEFAULT_ADMIN_CREDENTIALS);
      const authz = h.testApp.application.container.resolve(authorizationToken);
      const position = await h.testApp.application.container
        .resolve(organizationServiceToken)
        .createPosition(
          { code: 'matrix-browser', title: 'Matrix browser fixture' },
          { actorId: session.user.id },
        );
      await authz.permissionSets.create({
        key: 'matrix-browser',
        title: 'Matrix fixture',
        grants: [
          {
            resource: { type: 'settings', id: 'oa.org.positions' },
            actions: [{ action: 'read' }],
          },
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
      });
      await authz.permissionSets.assign({
        permissionSet: 'matrix-browser',
        subject: { type: 'org.position', id: position.id },
      });
      await h.testApp.application.container
        .resolve(organizationServiceToken)
        .addDutyRoleMember('hr', account.id, { actorId: session.user.id });

      await authz.permissionSets.create({
        key: 'matrix-browser-review',
        title: 'Matrix fixture',
        grants: [],
      });
      await authz.permissionSets.assign({
        permissionSet: 'matrix-browser-review',
        subject: { type: 'org.position', id: position.id },
      });
      const defaultRules = (
        authz as typeof authz &
          DefaultAccessAuthorizationApi<DatabaseConnection>
      ).defaultAccess;
      if (
        !(await defaultRules.list()).some(
          (rule) =>
            rule.resource.type === 'composite' &&
            rule.resource.id === 'oa.leave',
        )
      )
        await defaultRules.create({
          key: 'matrix-browser-rule',
          resource: { type: 'composite', id: 'oa.leave' },
          actions: [
            {
              action: 'view',
              scopeKey: 'leaveRequests',
              selection: { type: 'all' },
            },
          ],
        });
      const measurements: {
        path: string;
        milliseconds: number;
        bytes: number;
      }[] = [];
      for (const endpoint of [
        '/access/snapshot',
        '/authorization/permissionSets/options',
        '/access/roles',
        '/access/options',
        `/access/subjects/org.position/${position.id}`,
      ]) {
        for (let sample = 0; sample < 3; sample += 1) {
          const start = performance.now();
          const response = await session.fetch(endpoint);
          expect(response.status).toBe(200);
          const body = await response.text();
          measurements.push({
            path: endpoint,
            milliseconds: Math.round((performance.now() - start) * 10) / 10,
            bytes: Buffer.byteLength(body),
          });
        }
      }
      await writeFile(
        path.join(h.screenshotsDir, 'on-demand-timings.json'),
        JSON.stringify(measurements, null, 2),
      );
      for (const locale of ['en-US', 'zh-CN']) {
        await authz.permissionSets.update('matrix-browser-review', {
          key: 'matrix-browser-review',
          title: 'Matrix fixture',
          grants: [
            {
              resource: { type: 'composite', id: 'oa.leave' },
              actions: [
                {
                  action: 'submit',
                  policy: {
                    type: 'composite',
                    scopes: { leaveRequests: 'allRecords' },
                  },
                },
              ],
            },
          ],
        });
        const page = await h.pageFor(session, { locale });
        const errors: string[] = [];
        const consoleErrors: string[] = [];
        const fixedRequests: string[] = [];
        const decisions: string[] = [];
        const reads: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));
        page.on('console', (message) => {
          if (message.type() === 'error') consoleErrors.push(message.text());
        });
        page.on('requestfailed', (request) => {
          errors.push(`Request failed: ${new URL(request.url()).pathname}`);
        });
        page.on('response', (response) => {
          if (response.url().includes('/api/') && response.status() >= 400)
            errors.push(
              `${response.status()} ${new URL(response.url()).pathname}`,
            );
        });
        page.on('request', (request) => {
          if (/inspector\/(batchDecide|decide)/.test(request.url()))
            decisions.push(request.url());
          if (
            /\/api\/access\/(snapshot|directory|roles|options|subjects)/.test(
              request.url(),
            )
          )
            reads.push(new URL(request.url()).pathname);
          if (
            /subjects\/(authenticated|org\.departmentHead|org\.reportingManager)\/resolve/.test(
              request.url(),
            )
          )
            fixedRequests.push(request.url());
        });
        // The isolated HTTP bridge does not implement WebSocket upgrades. Compare
        // console output with the same app's home page rather than hiding it.
        await page.goto(`${h.origin}${h.basePath}/`);
        await page.waitForLoadState('networkidle');
        const baselineConsole = new Set(consoleErrors);
        consoleErrors.length = 0;
        await page.goto(
          `${h.origin}${h.basePath}/users/${encodeURIComponent(account.id)}/permissions`,
        );
        const panel = page.getByRole('dialog');
        await expect(
          panel.getByRole('heading', {
            name:
              locale === 'en-US'
                ? 'Permissions for Permission source fixture'
                : 'Permission source fixture 的权限',
          }),
        )
          .toBeVisible({ timeout: 60000 })
          .catch(async (error) => {
            await writeFile(
              path.join(h.screenshotsDir, `failure-${locale}.json`),
              JSON.stringify(
                {
                  errors,
                  consoleErrors,
                  url: page.url(),
                  body: await page.locator('body').innerText(),
                },
                null,
                2,
              ),
            );
            await page.screenshot({
              path: path.join(h.screenshotsDir, `failure-${locale}.png`),
              fullPage: true,
            });
            throw error;
          });
        await expect(
          panel
            .getByText(
              locale === 'en-US' ? 'All signed-in users' : '所有已登录用户',
              { exact: true },
            )
            .first(),
        ).toBeVisible({ timeout: 60000 });
        await expect(panel.getByRole('alert')).toHaveCount(0);
        await expect(
          panel.getByRole('button', {
            name: locale === 'en-US' ? 'Refresh' : '刷新',
            exact: true,
          }),
        ).toBeEnabled({ timeout: 60000 });
        expect(decisions).toEqual([]);
        await expect(
          panel.getByText('oa.approvals · oa.approvals', { exact: true }),
        ).toHaveCount(0);
        await expect(
          panel.getByText('oa-loan-requests · oa-loan-requests', {
            exact: true,
          }),
        ).toHaveCount(0);
        await page.screenshot({
          path: path.join(h.screenshotsDir, `user-${locale}.png`),
          fullPage: true,
        });
        // Direct deep links must load existing memberships before any editable child is mounted.
        await page.goto(
          `${h.origin}${h.basePath}/users/${account.id}/permissions/assign`,
        );
        const assignmentPanel = page.getByRole('dialog').last();
        const assignmentSearch = assignmentPanel.getByRole('textbox', {
          name:
            locale === 'en-US'
              ? 'Search permissions, actions or record scopes'
              : '搜索权限、操作或数据范围',
        });
        await expect(assignmentSearch).toBeVisible({ timeout: 60000 });
        await assignmentSearch.pressSequentially('Matrix fixture');
        await expect(
          assignmentPanel.getByRole('checkbox', { name: /Matrix fixture/ }),
        ).toHaveCount(2);
        await expect(assignmentPanel.getByRole('status')).toContainText(
          locale === 'en-US' ? 'Showing 2 of' : '显示 2 /',
        );
        await page.screenshot({
          path: path.join(h.screenshotsDir, `assignment-${locale}.png`),
          fullPage: true,
        });
        await page.setViewportSize({ width: 375, height: 812 });
        await page.emulateMedia({ colorScheme: 'dark' });
        await page.screenshot({
          path: path.join(
            h.screenshotsDir,
            `assignment-mobile-dark-${locale}.png`,
          ),
          fullPage: true,
        });
        await page.setViewportSize({ width: 1365, height: 900 });
        await page.emulateMedia({ colorScheme: 'light' });
        await page.goto(
          `${h.origin}${h.basePath}/users/${account.id}/permissions/duty-roles`,
        );
        const membership = page.getByRole('dialog').last();
        const removeLabel = locale === 'en-US' ? 'Remove' : '移除';
        const addLabel = locale === 'en-US' ? 'Add' : '添加';
        const removeRole = membership.getByRole('button', {
          name: new RegExp(`^${removeLabel} · `),
        });
        await expect(removeRole).toHaveCount(1, { timeout: 60000 });
        const roleName = (await removeRole.getAttribute('aria-label'))!
          .split(' · ')
          .slice(1)
          .join(' · ');
        await removeRole.click();
        await page
          .getByRole('alertdialog')
          .getByRole('button', { name: removeLabel, exact: true })
          .click();
        const addRole = membership.getByRole('button', {
          name: `${addLabel} · ${roleName}`,
          exact: true,
        });
        await expect(addRole).toBeVisible({ timeout: 60000 });
        await addRole.click();
        await page
          .getByRole('alertdialog')
          .getByRole('button', { name: addLabel, exact: true })
          .click();
        await expect(removeRole).toHaveCount(1, { timeout: 60000 });
        expect(decisions).toEqual([]);
        reads.length = 0;
        await page.goto(
          `${h.origin}${h.basePath}/access/roles?type=org.position`,
        );
        const roleLink = page.getByRole('link', {
          name: 'Matrix browser fixture',
          exact: true,
        });
        await expect(roleLink).toBeVisible({ timeout: 60000 });
        await page.waitForLoadState('networkidle');
        expect(reads.map((url) => url.split('/api/')[1])).toEqual([
          'access/roles',
        ]);
        await expect(
          page.getByRole('columnheader', {
            name: locale === 'en-US' ? 'Sensitive permissions' : '敏感权限',
            exact: true,
          }),
        ).toHaveCount(0);
        await expect(page.getByRole('columnheader')).toHaveCount(2);
        await page.screenshot({
          path: path.join(h.screenshotsDir, `role-list-${locale}.png`),
          fullPage: true,
        });
        await roleLink.click();
        await expect
          .poll(() =>
            reads.some((url) =>
              url.endsWith(`/subjects/org.position/${position.id}`),
            ),
          )
          .toBe(true);
        await expect
          .poll(() => reads.some((url) => url.endsWith('/access/options')))
          .toBe(true);
        expect(reads.some((url) => url.endsWith('/access/snapshot'))).toBe(
          false,
        );
        const matrix = page.getByRole('dialog');
        await expect(
          matrix.getByRole('heading', {
            name: 'Matrix browser fixture',
            exact: true,
          }),
        ).toBeVisible();
        const updateId = JSON.stringify([
          'settings',
          'oa.org.positions',
          'update',
        ]);
        const toggle = matrix
          .locator('[data-slot=permission-row]')
          .filter({ has: page.locator(`[id='${updateId}']`) })
          .getByRole('switch');
        await expect(toggle).toBeVisible({ timeout: 60000 });
        const initialChecked = await toggle.getAttribute('aria-checked');
        await toggle.click();
        const delegated = matrix
          .locator('[data-slot=permission-row]')
          .filter({
            has: page.locator(
              `[id='${JSON.stringify(['composite', 'oa.leave', 'delegate'])}']`,
            ),
          })
          .getByRole('switch');
        await expect(delegated).toBeEnabled();
        await delegated.click();
        const destination = matrix.getByRole('combobox', {
          name:
            locale === 'en-US' ? /Destination permission set/ : /写入权限集/,
        });
        await expect(destination).toBeVisible();
        const saveName = locale === 'en-US' ? 'Save' : '保存';
        await expect(
          matrix.getByRole('button', { name: saveName, exact: true }),
        ).toBeDisabled();
        await destination.click();
        await page
          .getByRole('option')
          .filter({ hasText: 'matrix-browser-review' })
          .click();
        await page.screenshot({
          path: path.join(h.screenshotsDir, `target-selection-${locale}.png`),
          fullPage: true,
        });
        await matrix
          .getByRole('button', { name: saveName, exact: true })
          .click();
        const confirmation = page.getByRole('alertdialog');
        await expect(confirmation).toBeVisible();
        await confirmation
          .getByRole('button', { name: saveName, exact: true })
          .click();
        await expect(confirmation).not.toBeVisible({ timeout: 60000 });
        await expect(toggle).toHaveAttribute(
          'aria-checked',
          initialChecked === 'true' ? 'false' : 'true',
        );
        expect(decisions).toEqual([]);
        await expect(
          matrix.locator('a[href$="/default-access"]'),
        ).toBeVisible();
        expect(
          (
            await authz.permissionSets.get('matrix-browser-review')
          )?.grants[0].actions.map((entry) => entry.action),
        ).toEqual(['submit', 'delegate']);
        await page.screenshot({
          path: path.join(h.screenshotsDir, `matrix-${locale}.png`),
          fullPage: true,
        });
        await page.setViewportSize({ width: 375, height: 812 });
        await page.screenshot({
          path: path.join(h.screenshotsDir, `matrix-mobile-${locale}.png`),
          fullPage: true,
        });
        await page.emulateMedia({ colorScheme: 'dark' });
        await page.screenshot({
          path: path.join(h.screenshotsDir, `matrix-dark-${locale}.png`),
          fullPage: true,
        });
        await page.setViewportSize({ width: 1365, height: 900 });
        await page.emulateMedia({ colorScheme: 'light' });
        await page.goto(`${h.origin}${h.basePath}/access/roles`);
        await expect(
          page.getByRole('heading', {
            name: locale === 'en-US' ? 'Access management' : '权限管理',
            exact: true,
          }),
        ).toBeVisible({ timeout: 60000 });
        await expect(
          page.getByRole('link', {
            name: locale === 'en-US' ? 'HR specialist' : 'HR 专员',
            exact: true,
          }),
        ).toBeVisible();
        await expect(
          page.getByRole('button', {
            name: locale === 'en-US' ? 'Browse by module' : '按模块查看',
            exact: true,
          }),
        ).toHaveCount(0);
        await expect(page.locator('a[href*="/access/modules"]')).toHaveCount(0);
        await page.screenshot({
          path: path.join(h.screenshotsDir, `roles-only-${locale}.png`),
          fullPage: true,
        });
        expect(fixedRequests).toEqual([]);
        expect(errors).toEqual([]);
        expect(
          consoleErrors.filter((error) => !baselineConsole.has(error)),
        ).toEqual([]);
        await writeFile(
          path.join(h.screenshotsDir, `console-${locale}.json`),
          JSON.stringify(
            {
              baseline: [...baselineConsole],
              permissionPanel: consoleErrors,
              reads,
              decisions,
            },
            null,
            2,
          ),
        );
        await page.screenshot({
          path: path.join(h.screenshotsDir, `sources-${locale}.png`),
          fullPage: true,
        });
        await page.context().close();
      }
      const users = h.testApp.application.container.resolve(
        userAdministrationServiceToken,
      );
      const reader = await users.create({
        name: 'Legacy permission reader',
        email: 'legacy-reader@example.test',
        password: 'fixture-password-123',
      });
      await authz.permissionSets.create({
        key: 'legacy-page-reader',
        grants: [
          {
            resource: { type: 'page', id: 'users' },
            actions: [{ action: 'access' }],
          },
          {
            resource: { type: 'user', id: '*' },
            actions: [{ action: 'read' }],
          },
        ],
      });
      await authz.permissionSets.assign({
        permissionSet: 'legacy-page-reader',
        subject: { type: 'user', id: reader.id },
      });
      const restrictedSession = await signIn(h.testApp, {
        email: 'legacy-reader@example.test',
        password: 'fixture-password-123',
      });
      const restricted = await h.pageFor(restrictedSession);
      await restricted.goto(
        `${h.origin}${h.basePath}/access/people/${account.id}/sources`,
      );
      await expect(restricted).toHaveURL(`${h.origin}${h.basePath}/users`, {
        timeout: 60000,
      });
      await restricted.context().close();
    } finally {
      await h.close();
    }
  },
  180000,
);
