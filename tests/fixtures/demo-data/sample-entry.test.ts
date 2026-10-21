// @vitest-environment node
import { it } from 'vitest';
import { expect } from '@playwright/test';
import {
  signIn,
  DEFAULT_ADMIN_CREDENTIALS,
} from '@nocobase/app-plugin-authentication/testing';
import { startIsolatedBrowserApp } from '../browser/harness.js';
import path from 'node:path';

it.runIf(process.env.OA_BROWSER_ACCEPTANCE === '1')(
  'removes sample navigation and workbench banners in the browser',
  async () => {
    const h = await startIsolatedBrowserApp({
      name: 'sample-entry',
      apiPort: 14281,
      vitePort: 14282,
    });
    try {
      const admin = await signIn(h.testApp, DEFAULT_ADMIN_CREDENTIALS);
      const page = await h.pageFor(admin);
      await page.goto(`${h.origin}${h.basePath}/`);
      await expect(page.locator('main')).toBeVisible({ timeout: 60000 });
      await expect(page.locator('[data-slot=skeleton]')).toHaveCount(0, {
        timeout: 60000,
      });
      await expect(page.locator('a[href$="/demo-data"]')).toHaveCount(0);
      await expect(
        page.getByRole('region', { name: /Demo data|演示数据/ }),
      ).toHaveCount(0);
      await page.screenshot({
        path: path.join(h.screenshotsDir, 'workbench.png'),
        fullPage: true,
      });
      await page.goto(`${h.origin}${h.basePath}/demo-data`);
      await page.waitForLoadState('networkidle');
      await expect(
        page.getByRole('button', { name: 'Import', exact: true }),
      ).toHaveCount(0);
      await expect(page.locator('a[href$="/demo-data"]')).toHaveCount(0);
      await page.screenshot({
        path: path.join(h.screenshotsDir, 'removed-route.png'),
        fullPage: true,
      });
    } finally {
      await h.close();
    }
  },
  180000,
);
