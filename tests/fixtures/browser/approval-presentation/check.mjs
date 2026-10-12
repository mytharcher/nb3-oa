/* global document, getComputedStyle, innerWidth -- Executed inside page.evaluate. */
import console from 'node:console';
import { URLSearchParams } from 'node:url';
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const out = 'storage/ui-workflow/approval-presentation/screenshots';
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const theme of ['default', 'compact'])
    for (const mode of ['light', 'dark'])
      for (const width of [1280, 375]) {
        const locale = mode === 'dark' ? 'en' : 'zh';
        const page = await browser.newPage({
          viewport: { width, height: 900 },
        });
        const errors = [];
        page.on('pageerror', (e) => errors.push(e.message));
        await page.goto(
          'http://127.0.0.1:17853/tests/fixtures/browser/approval-presentation/fixture.html?' +
            new URLSearchParams({ theme, mode, locale }),
        );
        await page
          .locator('[data-slot=route-overlay-header] [data-slot=badge]')
          .waitFor();
        await page.waitForTimeout(300);
        const header = page.locator('[data-slot=route-overlay-header]');
        assert.equal(await header.locator('[data-slot=badge]').count(), 1);
        assert.equal(
          await page
            .locator('[data-slot=route-overlay-body] [data-slot=badge]')
            .count(),
          0,
        );
        const metrics = await page.evaluate(() => {
          const badge = document.querySelector(
            '[data-slot=route-overlay-header] [data-slot=badge]',
          );
          const icons = [
            ...document.querySelectorAll(
              '[data-slot=route-overlay-body] ol>li>span.relative',
            ),
          ];
          return {
            badgeColor: getComputedStyle(badge).color,
            iconColors: icons.map((e) => getComputedStyle(e).color),
            overflow: document.documentElement.scrollWidth > innerWidth,
            headerOverflow: [
              ...document.querySelectorAll(
                '[data-slot=route-overlay-header] *',
              ),
            ].some((e) => e.getBoundingClientRect().right > innerWidth),
          };
        });
        console.log(theme, mode, width, metrics);
        assert.equal(metrics.iconColors.length, 7);
        assert.equal(metrics.badgeColor, metrics.iconColors[0]);
        assert.equal(metrics.overflow, false);
        assert.equal(metrics.headerOverflow, false);
        assert.deepEqual(errors, []);
        const file = `${theme}-${mode}-${width}-${locale}.png`;
        await page.screenshot({ path: `${out}/${file}`, fullPage: true });
        results.push({ theme, mode, width, locale, metrics, status: 'pass' });
        await page.close();
        console.log('PASS', file);
      }
} finally {
  await browser.close();
  await fs.writeFile(
    `${out}/capture-log.json`,
    JSON.stringify(results, null, 2),
  );
}
