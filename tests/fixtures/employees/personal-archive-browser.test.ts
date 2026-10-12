// @vitest-environment node
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, type Page } from '@playwright/test';
import { it } from 'vitest';
import { startIsolatedBrowserApp } from '../browser/harness.js';
import {
  ALL,
  createEmployee,
  createPerson,
  employees,
} from '../../logic/employees/helpers.js';

it.runIf(process.env.OA_BROWSER_ACCEPTANCE === '1')(
  'personal archive in an isolated ordinary-employee browser',
  async () => {
    const h = await startIsolatedBrowserApp({
      name: 'personal-archive',
      apiPort: 14149,
      vitePort: 15149,
    });
    const evidence = {
      checks: [] as string[],
      screenshots: [] as string[],
      errors: [] as string[],
    };
    const base = `${h.origin}${h.basePath}`;
    async function shot(page: Page, name: string) {
      const target = path.join(h.screenshotsDir, `${name}.png`);
      await page.screenshot({ path: target, fullPage: true });
      evidence.screenshots.push(target);
    }
    try {
      const owner = await createEmployee(
        h.testApp,
        'Personal Archive Browser Employee',
        { emergencyContact: 'Synthetic contact\nSecond contact line' },
      );
      const stranger = await createEmployee(
        h.testApp,
        'Other Browser Employee',
      );
      const empty = await createPerson(
        h.testApp,
        'Browser Account Without Archive',
      );
      await employees(h.testApp).updateProfile(
        owner.employeeId,
        {
          bankName: 'Synthetic bank',
          bankAccountName: 'Personal Archive Browser Employee',
          bankAccount: '6222000000000000001',
          address: 'Synthetic address\nSecond address line',
        },
        ALL,
        owner.userId,
      );
      const ownerSession = await owner.session();
      expect((await ownerSession.fetch('/employees')).status).toBe(403);
      expect(
        (await ownerSession.fetch(`/employees/${stranger.employeeId}/profile`))
          .status,
      ).toBe(403);
      evidence.checks.push(
        'Ordinary employee has no HR list or other employee profile access',
      );
      let page = await h.pageFor(ownerSession);
      page.on('pageerror', (error) => evidence.errors.push(error.message));
      await page.goto(`${base}/`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const baseline = [...evidence.errors];
      await page.getByRole('button', { name: 'Open account menu' }).click();
      const link = page.getByRole('menuitem', {
        name: 'Personal archive',
        exact: true,
      });
      await expect(link).toHaveAttribute(
        'href',
        `${h.basePath}/personal-archive`,
      );
      await link.click();
      await expect(page.getByText('6222000000000000001')).toBeVisible();
      await expect(
        page.getByText(
          `Personal Archive Browser Employee · ${(await employees(h.testApp).getEmployeeView(owner.employeeId, ALL))!.code}`,
        ),
      ).toBeVisible();
      await shot(page, 'english-light');
      await page.getByText('6222000000000000001').scrollIntoViewIfNeeded();
      await shot(page, 'english-payment-account');
      evidence.checks.push(
        'Account menu opens own full bank details with basename and real ordinary session',
      );
      await page.reload();
      await expect(page.getByText('6222000000000000001')).toBeVisible();
      await page.context().close();
      page = await h.pageFor(ownerSession, {
        locale: 'zh-CN',
        viewport: { width: 375, height: 812 },
      });
      page.on('pageerror', (error) => evidence.errors.push(error.message));
      await page.addInitScript(() => {
        localStorage.setItem('nocobase:main:theme:color-scheme', 'dark');
      });
      await page.goto(`${base}/personal-archive`);
      await expect(
        page.getByRole('heading', { name: '个人档案', exact: true }),
      ).toBeVisible();
      await expect(page.getByText('6222000000000000001')).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      await shot(page, 'chinese-dark-mobile');
      await page.getByText('6222000000000000001').scrollIntoViewIfNeeded();
      await shot(page, 'chinese-dark-mobile-payment-account');
      evidence.checks.push(
        'Chinese dark 375px renders without horizontal document overflow; refresh preserves route',
      );
      await employees(h.testApp).updateProfile(
        owner.employeeId,
        { bankAccount: '6222000000000000002' },
        ALL,
        owner.userId,
      );
      await page.getByRole('button', { name: '刷新', exact: true }).click();
      await expect(page.getByText('6222000000000000002')).toBeVisible();
      evidence.checks.push(
        'Refresh displays actual HR-service profile correction',
      );
      const profilePattern = '**/api/employees/me/profile';
      await page.route(profilePattern, (route) =>
        route.fulfill({
          status: 500,
          json: { error: { status: 'INTERNAL', message: 'Synthetic error' } },
        }),
      );
      await page.getByRole('button', { name: '刷新', exact: true }).click();
      const retry = page.getByRole('button', { name: '重试', exact: true });
      await expect(retry).toBeVisible();
      await expect(page.getByText('6222000000000000002')).toBeVisible();
      await shot(page, 'profile-refresh-error');
      await page.unroute(profilePattern);
      await retry.focus();
      await page.keyboard.press('Enter');
      await expect(retry).toHaveCount(0);
      await expect(
        page.getByRole('heading', { name: '个人资料', exact: true }),
      ).toBeFocused();
      evidence.checks.push(
        'Profile temporary failure preserves bank data; keyboard retry restores focus',
      );
      for (const status of [403, 404, 401]) {
        await page.route(profilePattern, (route) =>
          route.fulfill({
            status,
            json: {
              error: {
                status:
                  status === 401 ? 'UNAUTHENTICATED' : 'PERMISSION_DENIED',
                message: 'Synthetic error',
              },
            },
          }),
        );
        await page.getByRole('button', { name: '刷新', exact: true }).click();
        await expect(page.getByRole('alert')).toBeVisible();
        await expect(page.getByText('6222000000000000002')).toHaveCount(0);
        await expect(
          page.getByRole('button', { name: '重试', exact: true }),
        ).toHaveCount(0);
        await page.unroute(profilePattern);
        evidence.checks.push(
          `Profile ${status} removes old bank data and offers no retry`,
        );
      }
      const noArchivePage = await h.pageFor(await empty.session());
      await noArchivePage.goto(`${base}/personal-archive`);
      await expect(
        noArchivePage.getByText('No employee archive yet'),
      ).toBeVisible();
      await shot(noArchivePage, 'no-archive');
      evidence.checks.push(
        'Account without archive sees HR instruction without a create or retry action',
      );
      evidence.errors = evidence.errors.filter(
        (error) => !baseline.includes(error),
      );
      expect(evidence.errors).toEqual([]);
    } finally {
      await writeFile(
        path.join(h.screenshotsDir, 'evidence.json'),
        JSON.stringify(evidence, null, 2),
      );
      await h.close();
    }
  },
  180_000,
);
