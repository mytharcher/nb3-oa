// @vitest-environment node
import { it } from 'vitest';
import assert from 'node:assert/strict';
import { expect } from '@playwright/test';
import {
  signIn,
  DEFAULT_ADMIN_CREDENTIALS,
} from '@nocobase/app-plugin-authentication/testing';
import { startIsolatedBrowserApp } from '../browser/harness.js';
import { demoDataServiceToken } from '../../../server/providers/demo-data/contract.js';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { themeStorageKeys } from '../../../client/theme/theme-preferences.js';

it.runIf(process.env.OA_BROWSER_ACCEPTANCE === '1')(
  'accepts demo management and role views in an isolated real browser',
  async () => {
    const h = await startIsolatedBrowserApp({
      name: 'demo-data',
      apiPort: 14271,
      vitePort: 14272,
    });
    const errors: string[] = [],
      checks: string[] = [];
    try {
      // Synthetic isolated-fixture session only; no user password or existing business database.
      const admin = await signIn(h.testApp, DEFAULT_ADMIN_CREDENTIALS);
      const page = await h.pageFor(admin);
      page.on('pageerror', (e) => errors.push(e.message));
      const url = `${h.origin}${h.basePath}/`;
      const capture = (name: string) =>
        page.screenshot({
          path: path.join(h.screenshotsDir, `${name}.png`),
          fullPage: true,
        });
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      await expect(page.getByText('Loading page', { exact: true })).toHaveCount(
        0,
        { timeout: 60000 },
      );
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('[data-slot=skeleton]')).toHaveCount(0, {
        timeout: 60000,
      });
      await capture('00-workbench-baseline');
      const baselineErrors = [...errors];
      errors.length = 0;
      await page.goto(`${url}demo-data`);
      await expect(
        page.getByRole('button', { name: 'Import', exact: true }),
      ).toBeVisible();
      await capture('01-absent');
      const importing = page.waitForResponse(
        (r) =>
          r.url().includes('/api/demoData/import') &&
          r.request().method() === 'POST',
      );
      await page.getByRole('button', { name: 'Import', exact: true }).click();
      assert.equal((await importing).status(), 202);
      await expect(
        page.getByText('Importing', { exact: true }).first(),
      ).toBeVisible();
      await capture('02-importing');
      const service =
        h.testApp.application.container.resolve(demoDataServiceToken);
      await service.idle();
      const status = await service.status();
      assert.equal(status.state, 'ready', JSON.stringify(status.safeFailures));
      await expect(
        page.getByText('Imported', { exact: true }).first(),
      ).toBeVisible({
        timeout: 30000,
      });
      await capture('03-ready');
      checks.push('absent → one-click English import → actual ready status');
      const search = page.getByRole('textbox').first();
      await search.pressSequentially('Olivia');
      await expect(
        page.getByText('Olivia Bennett', { exact: true }),
      ).toBeVisible();
      await search.press('Home');
      await search.pressSequentially('x');
      await expect(
        page.getByText('Olivia Bennett', { exact: true }),
      ).toHaveCount(0);
      await search.press('ControlOrMeta+A');
      await search.press('Backspace');
      const cdp = await page.context().newCDPSession(page);
      await search.focus();
      await cdp.send('Input.imeSetComposition', {
        text: 'xiao',
        selectionStart: 4,
        selectionEnd: 4,
      });
      await cdp.send('Input.insertText', { text: '销售' });
      await expect(search).toHaveValue('销售');
      await search.press('ControlOrMeta+A');
      await search.press('Backspace');
      checks.push('character typing, middle edit and Chinese IME composition');
      await page.setViewportSize({ width: 375, height: 812 });
      await capture('04-narrow');
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      for (const preset of ['default', 'compact']) {
        for (const mode of ['light', 'dark']) {
          await page.evaluate(
            ({ keys, mode, preset }) => {
              localStorage.setItem(keys.mode, mode);
              localStorage.setItem(keys.preset, preset);
            },
            { keys: themeStorageKeys(h.basePath), mode, preset },
          );
          await page.reload();
          await expect(
            page.getByText('Imported', { exact: true }).first(),
          ).toBeVisible();
          await expect(page.locator('html')).toHaveClass(new RegExp(mode));
          assert.equal(
            await page.evaluate(
              () => document.documentElement.scrollWidth > innerWidth,
            ),
            false,
          );
          await capture(`narrow-${preset}-${mode}`);
        }
      }
      checks.push('375px, both presets and both color schemes');
      await page.setViewportSize({ width: 1365, height: 900 });
      const credentials = await service.credentials(
        status.datasetId!,
        status.version,
      );
      for (const role of ['employee', 'manager', 'sales'] as const) {
        const account = credentials.accounts.find((a) => a.role === role)!;
        const session = await signIn(h.testApp, {
          email: account.email,
          password: account.password,
        });
        const rolePage = await h.pageFor(session);
        await rolePage.goto(url);
        await rolePage.waitForLoadState('networkidle');
        await expect(
          rolePage.getByText('Loading page', { exact: true }),
        ).toHaveCount(0, { timeout: 60000 });
        await expect(rolePage.locator('main')).toBeVisible();
        await expect(rolePage.locator('[data-slot=skeleton]')).toHaveCount(0, {
          timeout: 60000,
        });
        await rolePage.screenshot({
          path: path.join(h.screenshotsDir, `role-${role}.png`),
          fullPage: true,
        });
        await rolePage.goto(`${url}demo-data`);
        await expect(
          rolePage.getByRole('button', { name: 'Import', exact: true }),
        ).toHaveCount(0);
        await rolePage.close();
      }
      checks.push(
        'employee, manager and sales workbenches; management permission denied',
      );
      const patrol: Array<{
        role: string;
        route: string;
        text: string;
        rows: number;
      }> = [];
      const routes: Record<string, string[]> = {
        employee: [
          'personal-archive',
          'leaveBalances',
          'inbox',
          'vehicle-requests',
          'directory',
          'announcements',
          'knowledge',
          'work-items',
          'loanRequests',
          'reimbursementRequests',

          'assetRequests',
          'paymentRequests',
          'approvals',
          'meeting-rooms',
        ],
        manager: ['personnel-changes'],
        head: ['recruitment-requests', 'headcounts'],
        employee2: ['contractRequests'],
        departing: ['departureRequests'],
        hr: [
          'employees',
          'requisitions',
          'onboardings',
          'probationRequests',

          'certificates',
          'leaveBalanceAdministration',
          'attendance-management',
          'salaryGradeTables',
        ],
        finance: ['budgets', 'contracts', 'purchaseOrders', 'reports'],
        admin: [
          'supplyLedger',

          'vehicle-garage',
          'seal-instances',
          'seal-requests',
        ],
        sealKeeper: ['seal-ledger'],
        purchasing: ['vendors', 'vendorQualifications'],
      };
      for (const route of [
        'departments',
        'positions',
        'grades',
        'duty-roles',
        'processManagement',
        'financeAssignments',
        'approvalDelegations',
        'print-templates',
        'users',
        'audit-logs',
        'approval-rules',
        'dictionaries',
        'work-calendar',
      ]) {
        await page.goto(`${url}${route}`);
        await page.waitForLoadState('networkidle');
        await expect(
          page.getByText('Loading page', { exact: true }),
        ).toHaveCount(0, { timeout: 60000 });
        await expect(page.locator('[data-slot=skeleton]')).toHaveCount(0, {
          timeout: 60000,
        });
        patrol.push({
          role: 'administrator',
          route,
          text: await page.locator('main').innerText(),
          rows: await page.locator('tbody tr').count(),
        });
        await page.screenshot({
          path: path.join(
            h.screenshotsDir,
            `patrol-administrator-${route}.png`,
          ),
          fullPage: true,
        });
      }
      for (const [role, paths] of Object.entries(routes)) {
        const account = credentials.accounts.find((a) => a.role === role)!;
        const session = await signIn(h.testApp, {
          email: account.email,
          password: account.password,
        });
        const p = await h.pageFor(session);
        p.on('pageerror', (e) => errors.push(`${role}: ${e.message}`));
        for (const route of paths) {
          await p.goto(`${url}${route}`);
          await p.waitForLoadState('networkidle');
          await expect(
            p.getByText('Loading page', { exact: true }),
          ).toHaveCount(0, { timeout: 60000 });
          await expect(p.locator('main')).toBeVisible();
          await expect(p.locator('[data-slot=skeleton]')).toHaveCount(0, {
            timeout: 60000,
          });
          const text = await p.locator('main').innerText();
          patrol.push({
            role,
            route,
            text,
            rows: await p.locator('tbody tr').count(),
          });
          await p.screenshot({
            path: path.join(h.screenshotsDir, `patrol-${role}-${route}.png`),
            fullPage: true,
          });
        }
        await p.close();
      }
      const inboxEntry = patrol.find(
        (entry) => entry.role === 'employee' && entry.route === 'inbox',
      );
      assert.ok(
        inboxEntry && !inboxEntry.text.includes('Nothing here'),
        'Demo employee inbox must contain delivered messages',
      );
      await writeFile(
        path.join(h.screenshotsDir, 'business-page-patrol.json'),
        JSON.stringify(patrol, null, 2),
      );
      checks.push(
        `${patrol.length} business page entries visited with their actual roles`,
      );
      for (const entry of patrol) {
        assert.ok(
          !/^Access denied|^Page not found|^Loading page/u.test(entry.text),
          `${entry.role}/${entry.route}: ${entry.text}`,
        );
      }
      await page.goto(`${url}demo-data`);
      await page.getByRole('button', { name: 'Remove', exact: true }).click();
      await expect(page.getByRole('alertdialog')).toBeVisible();
      await capture('05-remove-preview');
      await page
        .getByRole('alertdialog')
        .getByRole('button', { name: 'Remove', exact: true })
        .click();
      await expect(page.getByRole('alertdialog')).toHaveCount(0);
      await service.idle();
      assert.equal((await service.status()).state, 'absent');
      await expect(
        page.getByRole('button', { name: 'Import', exact: true }),
      ).toBeVisible({ timeout: 30000 });
      checks.push('preflight → confirm removal → absent');
      for (const status of [403, 404, 500]) {
        await page.route('**/api/demoData', (route) =>
          route.fulfill({
            status,
            contentType: 'application/json',
            body: JSON.stringify({
              message: 'Synthetic isolated acceptance failure',
            }),
          }),
        );
        await page.reload();
        if (status === 500)
          await expect(
            page.getByRole('button', { name: 'Retry', exact: true }),
          ).toBeVisible();
        else {
          await expect(
            page.getByRole('button', { name: 'Retry', exact: true }),
          ).toHaveCount(0);
          await expect(
            page.getByRole('button', { name: 'Import', exact: true }),
          ).toHaveCount(0);
        }
        await capture(`failure-${status}`);
        await page.unroute('**/api/demoData');
      }
      checks.push('injected 403/404 terminal and 500 retryable states');
      assert.deepEqual(errors, []);
      await writeFile(
        path.join(h.screenshotsDir, 'capture-log.json'),
        JSON.stringify(
          { checks, baselineErrors, errors, isolated: true },
          null,
          2,
        ),
      );
    } finally {
      await h.close();
    }
  },
  900000,
);
