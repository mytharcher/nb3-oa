/* global console, document, innerWidth, DataTransfer, File, ClipboardEvent, DragEvent */
import { Buffer } from 'node:buffer';
import tailwind from '@tailwindcss/vite';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const screenshots = 'storage/ui-workflow/standard-upload/screenshots';
await mkdir(screenshots, { recursive: true });
const server = await createServer({
  configFile: false,
  cacheDir: '/tmp/oa-upload-browser-vite',
  plugins: [
    tailwind(),
    react(),
    {
      name: 'attachment-fixture',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (!req.url?.startsWith('/fixture')) return next();
          res.setHeader('Content-Type', 'text/html');
          res.end(
            await server.transformIndexHtml(
              '/fixture',
              '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/tests/fixtures/browser/upload-standardization.tsx"></script></body></html>',
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
          const panel = page.locator('[data-slot=attachment-panel]');
          await panel.waitFor();
          await page.evaluate(
            ({ dark, preset }) => {
              document.documentElement.classList.toggle('dark', dark);
              document.documentElement.dataset.theme = preset;
            },
            { dark, preset },
          );
          const chooser = page.getByRole('button', {
            name: locale === 'zh-CN' ? '选择文件' : 'Choose file',
            exact: true,
          });
          const pending = page.waitForEvent('filechooser');
          await chooser.click();
          await (
            await pending
          ).setFiles({
            name: 'proof.pdf',
            mimeType: 'application/pdf',
            buffer: Buffer.from('proof'),
          });
          await page.getByText('proof.pdf', { exact: true }).waitFor();
          assert.equal(
            await page.locator('body').getAttribute('data-submitted'),
            null,
          );
          const transfer = async (kind, names) =>
            panel.evaluate(
              (element, { kind, names }) => {
                const transfer = new DataTransfer();
                for (const name of names)
                  transfer.items.add(
                    new File(['proof'], name, { type: 'text/plain' }),
                  );
                const event =
                  kind === 'paste'
                    ? new ClipboardEvent('paste', {
                        clipboardData: transfer,
                        bubbles: true,
                        cancelable: true,
                      })
                    : new DragEvent('drop', {
                        dataTransfer: transfer,
                        bubbles: true,
                        cancelable: true,
                      });
                element.dispatchEvent(event);
              },
              { kind, names },
            );
          await transfer('drop', ['one.txt', 'two.txt']);
          await page.getByRole('alert').waitFor();
          assert.equal(
            await page.getByTestId('selection-count').textContent(),
            '1',
          );
          await transfer('paste', ['pasted.txt']);
          await page.getByText('pasted.txt', { exact: true }).waitFor();
          await page.getByRole('alert').waitFor({ state: 'hidden' });
          await page
            .getByRole('button', { name: 'Focus file', exact: true })
            .click();
          assert(
            await chooser.evaluate(
              (element) => element === document.activeElement,
            ),
          );
          await page.getByRole('button', { name: 'Toggle disabled' }).click();
          assert(await chooser.isDisabled());
          await transfer('drop', ['blocked.txt']);
          await transfer('paste', ['blocked.txt']);
          assert.equal(
            await page.getByTestId('selection-count').textContent(),
            '2',
          );
          await page.getByRole('button', { name: 'Toggle disabled' }).click();
          await transfer('drop', [
            '很长的附件名称-long-filename-'.repeat(8) + '.txt',
          ]);
          assert.equal(
            await page.getByTestId('selection-count').textContent(),
            '3',
          );
          assert(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
            'page overflows',
          );
          const file = `${preset}-${locale}-${width}-${dark ? 'dark' : 'light'}.png`;
          await page.screenshot({
            path: `${screenshots}/${file}`,
            fullPage: true,
            animations: 'disabled',
          });
          await page
            .getByRole('button', { name: 'Submit', exact: true })
            .click();
          assert.equal(
            await page.locator('body').getAttribute('data-submitted'),
            'true',
          );
          await page
            .getByRole('button', { name: 'Reset', exact: true })
            .click();
          assert.equal(
            await page.locator('[data-slot=file-upload-input] p').count(),
            0,
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
      'Isolated upload interaction fixture; no real-role business uploads or production build verified.',
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
