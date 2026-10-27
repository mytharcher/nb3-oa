/* global console, document, innerWidth */
import { Buffer } from 'node:buffer';
import tailwind from '@tailwindcss/vite';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const screenshots = 'storage/ui-workflow/standard-attachments/screenshots';
await mkdir(screenshots, { recursive: true });
const server = await createServer({
  configFile: false,
  cacheDir: '/tmp/oa-attachment-browser-vite',
  plugins: [
    tailwind(),
    react(),
    {
      name: 'attachment-fixture',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url === '/proof.txt') {
            res.setHeader('Content-Type', 'text/plain');
            res.end('Private attachment preview · 附件预览');
            return;
          }
          if (req.url === '/proof.png') {
            res.setHeader('Content-Type', 'image/png');
            res.end(
              Buffer.from(
                'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
                'base64',
              ),
            );
            return;
          }
          if (!req.url?.startsWith('/fixture')) return next();
          res.setHeader('Content-Type', 'text/html');
          res.end(
            await server.transformIndexHtml(
              '/fixture',
              '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/tests/fixtures/browser/attachment-standardization.tsx"></script></body></html>',
            ),
          );
        });
      },
    },
  ],
  optimizeDeps: {
    include: [
      'react',
      'react-dom/client',
      '@nocobase/i18n/testing',
      '@nocobase/app-plugin-file/client',
    ],
    exclude: ['@silurus/ooxml'],
  },
  server: { host: '127.0.0.1', port: 0 },
});
let browser;
try {
  await server.listen();
  const origin = server.resolvedUrls.local[0];
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const checks = [];
  for (const preset of ['default', 'compact']) {
    for (const locale of ['en-US', 'zh-CN']) {
      for (const width of [375, 1440]) {
        for (const dark of [false, true]) {
          await page.setViewportSize({ width, height: 900 });
          await page.goto(`${origin}fixture?locale=${locale}`);
          await page.locator('[data-slot=attachment-list]').waitFor();
          await page.evaluate(
            (dark) => document.documentElement.classList.toggle('dark', dark),
            dark,
          );
          assert(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
            'page overflows',
          );
          await page.evaluate((preset) => {
            document.documentElement.dataset.theme = preset;
          }, preset);
          const name = `${locale === 'en-US' ? 'Preview' : '预览'} 说明与说明附件-attachment-notes.txt`;
          const trigger = page.getByRole('button', { name, exact: true });
          await trigger.click();
          const dialog = page.getByRole('dialog');
          await dialog
            .getByText('Private attachment preview · 附件预览')
            .waitFor();
          assert.equal(
            await page.locator('body').getAttribute('data-submitted'),
            null,
          );
          const file = `${preset}-${locale}-${width}-${dark ? 'dark' : 'light'}.png`;
          await page.screenshot({
            path: `${screenshots}/${file}`,
            fullPage: true,
            animations: 'disabled',
          });
          await page.keyboard.press('Escape');
          await dialog.waitFor({ state: 'hidden' });
          assert(
            await trigger.evaluate(
              (element) => element === document.activeElement,
            ),
            'focus not restored',
          );
          await page.getByRole('checkbox').click();
          assert.equal(
            await page.getByRole('checkbox').getAttribute('aria-checked'),
            'false',
          );
          checks.push(file);
        }
      }
    }
  }
  assert.deepEqual(errors, []);
  const result = {
    browser: 'Chromium headless',
    checks,
    errors,
    limitations:
      'Isolated presentation fixture; no real roles, PDF/Office fidelity or production build verified.',
  };
  await writeFile(
    `${screenshots}/results.json`,
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result));
} finally {
  await browser?.close();
  await server.close();
}
