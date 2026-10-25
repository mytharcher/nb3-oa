// @vitest-environment node
import { it } from 'vitest';
import { expect } from '@playwright/test';
import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import { startIsolatedBrowserApp } from '../browser/harness.js';
import { createEmployee } from '../../logic/employees/helpers.js';

it.runIf(process.env.OA_BROWSER_ACCEPTANCE === '1')(
  'searches authorized directory across pages at 375px in the main application',
  async () => {
    const h = await startIsolatedBrowserApp({
      name: 'global-search',
      apiPort: 14161,
      vitePort: 15161,
    });
    const checks: string[] = [],
      screenshots: string[] = [];
    try {
      const viewer = await createEmployee(h.testApp, 'Search viewer');
      for (let i = 1; i <= 12; i++)
        await createEmployee(
          h.testApp,
          `Search colleague ${String(i).padStart(2, '0')}`,
        );
      const page = await h.pageFor(await viewer.session(), {
        viewport: { width: 375, height: 812 },
        locale: 'en-US',
      });
      page.setDefaultTimeout(30000);
      const searchFailures: string[] = [];
      page.on('response', (response) => {
        if (
          new URL(response.url()).pathname.endsWith('/api/requestSearch') &&
          response.status() >= 400
        )
          searchFailures.push(`requestSearch HTTP ${response.status()}`);
      });
      const base = `${h.origin}${h.basePath}`;
      await page.goto(`${base}/search`);
      await expect(
        page.getByRole('heading', { name: 'Search everything', exact: true }),
      ).toBeVisible();
      await page
        .getByRole('textbox', {
          name: 'Search number, title, applicant or name',
        })
        .fill('Search colleague');
      const requestSearchResponse = page.waitForResponse((response) =>
        new URL(response.url()).pathname.endsWith('/api/requestSearch'),
      );
      await page.getByRole('button', { name: 'Search', exact: true }).click();
      expect((await requestSearchResponse).status()).toBe(200);
      await expect(
        page.getByRole('link', { name: /Search colleague/ }),
      ).toHaveCount(10);
      await expect(
        page.getByText('Matches: 12', { exact: true }),
      ).toBeVisible();
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await expect(
        page.getByRole('link', { name: /Search colleague/ }),
      ).toHaveCount(2, { timeout: 30000 });
      await expect(page).toHaveURL(/peoplePage=2/);
      checks.push(
        'actual directory server query and independent pagination reach records beyond first page',
      );
      const first = page
        .getByRole('link', { name: /Search colleague/ })
        .first();
      const title = await first.innerText();
      await first.click();
      await expect(page).toHaveURL(/\/directory\?q=/);
      await page.goBack();
      await expect(
        page.getByRole('link', { name: title, exact: true }),
      ).toBeVisible();
      checks.push(
        'directory navigation and browser back retain keyword and source page',
      );
      for (const variant of [
        { locale: 'en-US', theme: 'light', preset: 'compact' },
        { locale: 'zh-CN', theme: 'dark', preset: 'comfortable' },
      ]) {
        await page.evaluate(({ locale, theme, preset }) => {
          localStorage.setItem('nocobase.locale', locale);
          localStorage.setItem('nocobase:main:theme:color-scheme', theme);
          localStorage.setItem('nocobase:main:theme:preset', preset);
        }, variant);
        const refreshedSearch = page.waitForResponse((response) =>
          new URL(response.url()).pathname.endsWith('/api/requestSearch'),
        );
        await page.reload();
        expect((await refreshedSearch).status()).toBe(200);
        await expect(
          page.getByRole('heading', {
            name: variant.locale === 'zh-CN' ? '全局搜索' : 'Search everything',
            exact: true,
          }),
        ).toBeVisible();
        await expect(
          page.getByRole('link', { name: /Search colleague/ }),
        ).toHaveCount(2, { timeout: 30000 });
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        ).toBe(true);
        const shot = path.join(
          h.screenshotsDir,
          `375-${variant.locale}-${variant.theme}.png`,
        );
        await page.screenshot({ path: shot, fullPage: true });
        screenshots.push(shot);
      }
      checks.push(
        '375px English/light/compact and Chinese/dark/comfortable without horizontal overflow',
      );
      expect(searchFailures).toEqual([]);
      await writeFile(
        path.join(h.screenshotsDir, 'evidence.json'),
        JSON.stringify(
          {
            checks,
            screenshots,
            scope:
              'Isolated main application with synthetic employee and PostgreSQL; not production',
          },
          null,
          2,
        ),
      );
    } finally {
      await h.close();
    }
  },
  240000,
);
