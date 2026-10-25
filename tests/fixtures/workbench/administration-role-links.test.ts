// @vitest-environment node
import { it, expect } from 'vitest';
import { expect as browserExpect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import {
  signIn,
  DEFAULT_ADMIN_CREDENTIALS,
} from '@nocobase/app-plugin-authentication/testing';
import { startIsolatedBrowserApp } from '../browser/harness.js';
import { createEmployee } from '../../logic/employees/helpers.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { seedAdministrativeLedgers } from './admin-ledger-data.js';
import ExcelJS from 'exceljs';

it.runIf(process.env.OA_BROWSER_ACCEPTANCE === '1')(
  'default administrator four areas and single-duty ledger/export links are reachable and employees are denied administration URLs',
  async () => {
    const h = await startIsolatedBrowserApp({
      name: 'administration-role-links',
      apiPort: 14185,
      vitePort: 15185,
    });
    const evidence: object[] = [];
    try {
      const root = await signIn(h.testApp, DEFAULT_ADMIN_CREDENTIALS);
      const admin = await h.pageFor(root, {
        locale: 'en-US',
        viewport: { width: 1440, height: 1000 },
      });
      const base = `${h.origin}${h.basePath}`;
      await admin.goto(`${base}/`);
      await admin
        .getByRole('button', { name: 'System administration', exact: true })
        .click();
      for (const name of [
        'Users and organization',
        'Notifications and integrations',
        'Operations',
      ]) {
        await browserExpect(
          admin.getByRole('group', { name, exact: true }),
        ).toBeVisible({ timeout: 30000 });
      }
      const adminRoutes = [
        ['Users and organization', '/users'],
        ['Users and organization', '/access'],
        ['Notifications and integrations', '/notification-logs'],
        ['Operations', '/schedules'],
      ];
      for (const [group, route] of adminRoutes) {
        const link = admin.locator(`a[href$="${route}"]`).first();
        await browserExpect(link).toBeVisible();
        await link.click();
        await browserExpect(admin.locator('main h1')).toBeVisible({
          timeout: 30000,
        });
        await admin.waitForLoadState('networkidle');
        await browserExpect(
          admin.getByText('Access denied', { exact: true }),
        ).toHaveCount(0);
        if (route === '/access') {
          await admin
            .getByText('How roles and permissions work', { exact: true })
            .click();
          await browserExpect(
            admin.getByText(
              'The stored grants behind roles, available for inspection and reuse. Use the role page for everyday changes.',
            ),
          ).toBeVisible();
          await browserExpect(
            admin.getByText(
              'Provides the baseline scope when an operation has no specific scope. It does not grant the operation itself.',
            ),
          ).toBeVisible();
          for (const path of ['/permission-sets', '/default-access']) {
            await admin.locator(`main a[href$="${path}"]`).click();
            await admin.waitForLoadState('networkidle');
            await browserExpect(admin.locator('main h1')).toBeVisible();
            await browserExpect(
              admin.getByText('Access denied', { exact: true }),
            ).toHaveCount(0);
            await admin.goto(`${base}/access/roles`);
            await admin
              .getByText('How roles and permissions work', { exact: true })
              .click();
          }
        }
        await admin.screenshot({
          path: `${h.screenshotsDir}/admin-${group.split(' ')[0].toLowerCase()}.png`,
          fullPage: true,
        });
        evidence.push({
          actor: 'default administrator',
          group,
          route,
          accessible: true,
        });
      }
      await admin.close();
      const employee = await createEmployee(
        h.testApp,
        'Navigation ordinary employee',
      );
      const ordinary = await h.pageFor(await employee.session(), {
        locale: 'en-US',
        viewport: { width: 375, height: 812 },
      });
      for (const route of [
        '/users',
        '/access/roles',
        '/permission-sets',
        '/default-access',
        '/notification-logs',
        '/schedules',
      ]) {
        await ordinary.goto(`${base}${route}`);
        await browserExpect(
          ordinary.getByText('Access denied', { exact: true }),
        ).toBeVisible({ timeout: 30000 });
        evidence.push({ actor: 'ordinary employee', route, denied: true });
      }
      await ordinary.screenshot({
        path: `${h.screenshotsDir}/employee-denied-375.png`,
        fullPage: true,
      });
      await ordinary.close();
      const org = h.testApp.application.container.resolve(
        organizationServiceToken,
      );
      for (const role of ['hr', 'finance', 'admin', 'purchasing']) {
        const actor = await createEmployee(
          h.testApp,
          `Single ${role} colleague`,
        );
        await org.addDutyRoleMember(role, actor.userId, {
          actorId: actor.userId,
        });
        if (role === 'admin') await seedAdministrativeLedgers(h, actor.userId);
        const page = await h.pageFor(await actor.session(), {
          locale: 'en-US',
          viewport: { width: 375, height: 812 },
        });
        const loaded = page.waitForResponse(
          (r) =>
            new URL(r.url()).pathname.endsWith('/workbench/roleContext') &&
            r.status() === 200,
        );
        await page.goto(`${base}/`);
        await loaded;
        const workspace = page
          .getByRole('heading', { name: 'Common links', exact: true })
          .locator('xpath=ancestor::*[@data-slot="card"]');
        await browserExpect(workspace).toBeVisible();
        const routes = await workspace.locator('a[href]').evaluateAll((links) =>
          links
            .map((link) => ({
              href: link.getAttribute('href')!,
              label: link.textContent ?? '',
            }))
            .filter(
              (item) =>
                !item.href.includes('/taskCenter') &&
                !item.href.includes('/approvals') &&
                !item.href.includes('/new'),
            ),
        );
        const reports: Record<string, string[]> = {
          hr: ['headcount-balances', 'leave-monthly'],
          finance: ['budget-balances', 'expense-summary'],
          admin: ['supply-ledger', 'seal-ledger'],
          purchasing: ['contract-ledger'],
        };
        // Report access and exports are checked in their owning pages, away from homepage shortcuts.
        routes.push(
          ...reports[role].map((dataset) => ({
            href: `${h.basePath}/reports/${dataset}`,
            label: dataset,
          })),
        );
        expect(routes.length).toBeGreaterThan(0);
        await workspace.scrollIntoViewIfNeeded();
        await page.screenshot({
          path: `${h.screenshotsDir}/${role}-workspace-375.png`,
          fullPage: true,
        });
        for (const destination of routes) {
          await page.goto(`${h.origin}${destination.href}`);
          await page.waitForLoadState('networkidle');
          await browserExpect(
            page.getByText('Access denied', { exact: true }),
          ).toHaveCount(0);
          await browserExpect(page.locator('main h1')).toBeVisible({
            timeout: 30000,
          });
          let downloaded = false;
          if (
            destination.href.includes('/reports/') &&
            (await page
              .getByRole('button', { name: 'Export Excel', exact: true })
              .count())
          ) {
            if (role === 'admin')
              await page.screenshot({
                path: `${h.screenshotsDir}/${destination.href.split('/').at(-1)}-375.png`,
                fullPage: true,
              });
            const download = page.waitForEvent('download');
            await page
              .getByRole('button', { name: 'Export Excel', exact: true })
              .click();
            const file = await download;
            expect(await file.failure()).toBeNull();
            await file.saveAs(
              `${h.screenshotsDir}/${role}-${file.suggestedFilename()}`,
            );
            if (role === 'admin') {
              const book = new ExcelJS.Workbook();
              await book.xlsx.readFile(
                `${h.screenshotsDir}/${role}-${file.suggestedFilename()}`,
              );
              const sheet = book.worksheets[0];
              expect(sheet.rowCount).toBe(
                destination.href.includes('supply-ledger') ? 106 : 2,
              );
              const contents = JSON.stringify(sheet.getSheetValues());
              expect(contents).not.toContain('PRIVATE-EXPORT');
              if (destination.href.includes('supply-ledger')) {
                expect(contents).toContain('=1+1');
                sheet.eachRow((row) =>
                  row.eachCell((cell) =>
                    expect(cell.type).not.toBe(ExcelJS.ValueType.Formula),
                  ),
                );
              }
            }
            downloaded = true;
          }
          evidence.push({
            actor: role,
            ...destination,
            accessible: true,
            downloaded,
          });
          expect(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
          ).toBe(true);
        }
        await page.close();
      }
      const scoped = await h.pageFor(await employee.session(), {
        locale: 'en-US',
        viewport: { width: 375, height: 812 },
      });
      await scoped.goto(`${base}/`);
      for (const dataset of ['supply-ledger', 'seal-ledger']) {
        const result = await scoped.evaluate(async (path) => {
          const response = await fetch(path);
          return { status: response.status, body: await response.json() };
        }, `${h.basePath}/api/reports/${dataset}`);
        if (result.status === 200) expect(result.body.data).toEqual([]);
        else expect(result.status).toBe(403);
        evidence.push({
          actor: 'ordinary employee',
          dataset,
          outsideRowsHidden: true,
        });
      }
      await scoped.close();
      await writeFile(
        `${h.screenshotsDir}/evidence.json`,
        JSON.stringify(evidence, null, 2),
      );
    } finally {
      await h.close();
    }
  },
  300000,
);
