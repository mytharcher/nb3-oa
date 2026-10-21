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
import { sampleDataToken } from '@nocobase/app-server/sample-data';

it.runIf(process.env.OA_BROWSER_ACCEPTANCE === '1')(
  'accepts native samples and role views in an isolated real browser',
  async () => {
    const h = await startIsolatedBrowserApp({
      name: 'demo-data',
      samplePasswords: true,
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
      await expect(page.locator('a[href$="/demo-data"]')).toHaveCount(0);
      const samples = h.testApp.application.container.resolve(sampleDataToken);
      samples.rerunSkipped();
      const generated = await samples.run();
      assert.deepEqual(generated.failed, []);
      assert.ok(generated.executed.includes('oa/demo-data'));
      const service =
        h.testApp.application.container.resolve(demoDataServiceToken);
      const status = await service.status();
      assert.equal(status.state, 'ready');
      checks.push(
        'native sample registry generates complete data; no product entry',
      );
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
