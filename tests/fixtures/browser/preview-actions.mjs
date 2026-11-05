/* global console */
import tailwind from '@tailwindcss/vite';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const screenshots = 'storage/ui-workflow/preview-actions/screenshots';
await mkdir(screenshots, { recursive: true });
const server = await createServer({
  configFile: false,
  cacheDir: '/tmp/oa-preview-browser-vite',
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
              '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/tests/fixtures/browser/preview-actions.tsx"></script></body></html>',
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
  browser = await chromium.launch({ headless: true });
  for (const width of [1100, 375]) {
    const page = await browser.newPage({ viewport: { width, height: 800 } });
    await page.goto(`${server.resolvedUrls.local[0]}fixture`);
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const actions = dialog.locator('[data-slot=file-preview-actions]');
    const buttons = actions.getByRole('button');
    await expect(buttons).toHaveCount(3);
    const boxes = await buttons.evaluateAll((elements) =>
      elements.map((el) => {
        const r = el.getBoundingClientRect();
        return { y: r.y, height: r.height, right: r.right };
      }),
    );
    assert.ok(
      boxes.every(
        (b) =>
          Math.abs(b.y - boxes[0].y) < 1 &&
          b.height === boxes[0].height &&
          b.right <= width,
      ),
    );
    const title = dialog.getByRole('heading');
    const download = dialog
      .locator('[data-slot=file-preview-title]')
      .getByRole('button');
    const titleBox = await title.boundingBox();
    const downloadBox = await download.boundingBox();
    assert.ok(
      Math.abs(
        titleBox.y +
          titleBox.height / 2 -
          (downloadBox.y + downloadBox.height / 2),
      ) < 1,
    );
    assert.ok(
      downloadBox.x >= titleBox.x + titleBox.width &&
        downloadBox.x - (titleBox.x + titleBox.width) <= 12,
    );
    await page.screenshot({ path: `${screenshots}/${width}.png` });
    await actions.getByRole('button', { name: 'Next file' }).click();
    await expect(dialog).toHaveAccessibleName('Second.png');
    await actions.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await page.close();
  }
  console.log(
    'PASS: desktop/mobile action alignment, navigation, single close control',
  );
} finally {
  await browser?.close();
  await server.close();
}
