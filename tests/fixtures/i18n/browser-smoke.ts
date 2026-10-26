import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { chromium, expect } from '@playwright/test';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const output = path.join(root, 'storage/verification/twelve-languages');
await fs.mkdir(output, { recursive: true });
const dependencies = await fs.realpath(path.join(root, 'node_modules'));
const server = await createServer({
  configFile: false,
  root,
  plugins: [react(), tailwindcss()],
  cacheDir: path.join(output, 'vite-cache'),
  server: {
    host: '127.0.0.1',
    port: 13980,
    strictPort: true,
    fs: { allow: [root, path.dirname(dependencies)] },
  },
});
let browser;
try {
  await server.listen();
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
  });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://127.0.0.1:13980/tests/fixtures/i18n/browser.html');
  const select = page.locator('#language');
  await expect(select).toBeVisible();
  const tags = await select
    .locator('option')
    .evaluateAll((items) =>
      items.map((item) => (item as HTMLOptionElement).value),
    );
  // Exact supported language membership is checked by multilingual-locales.test.ts.
  expect(tags.length).toBeGreaterThan(1);
  const results = [];
  for (const tag of tags) {
    await select.selectOption(tag);
    await expect(page.locator('main')).toHaveAttribute('data-locale', tag);
    await expect(page.getByRole('heading', { level: 1 })).not.toHaveText(
      'workbench.title',
    );
    const picker = page.locator('button[aria-haspopup="dialog"]');
    await picker.click();
    await expect(page.locator('[data-slot="calendar"]')).toBeVisible();
    await page.screenshot({
      path: path.join(output, `${tag}.png`),
      fullPage: true,
    });
    results.push({
      locale: tag,
      title: await page.getByRole('heading', { level: 1 }).textContent(),
    });
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-slot="calendar"]')).toHaveCount(0);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.screenshot({
      path: path.join(output, `${tag}-mobile.png`),
      fullPage: true,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.setViewportSize({ width: 1280, height: 800 });
  }
  expect(errors).toEqual([]);
  await fs.writeFile(
    path.join(output, 'result.json'),
    JSON.stringify({ results, errors }, null, 2),
  );
  process.stdout.write(
    `Browser language smoke passed for ${results.length} languages.\n`,
  );
} finally {
  await browser?.close();
  await server.close();
}
